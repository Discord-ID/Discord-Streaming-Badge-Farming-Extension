import { getGuildStore, getChannelStore } from './stores';
import { getRestClient } from './restapi';
import { defaultGuildId, defaultChannelIds } from '../config';

export interface UserAccessState {
  isMember: boolean;
  voiceFound: boolean;
  canStream: boolean;
  statusText: string;
}

let cachedState: UserAccessState = {
  isMember: false,
  voiceFound: false,
  canStream: false,
  statusText: 'Checking user access...',
};

let lastCheckTime = 0;

export function getCachedAccess(): UserAccessState {
  return cachedState;
}

export async function checkDiscordIdAccess(
  targetGuildId = defaultGuildId,
  candidateChannelIds: string[] = defaultChannelIds,
  forceRefresh = false
): Promise<UserAccessState> {
  const now = Date.now();
  if (!forceRefresh && lastCheckTime > 0 && now - lastCheckTime < 10000) {
    return cachedState;
  }

  lastCheckTime = now;

  let isMember = false;

  const guildStore = getGuildStore();
  if (guildStore) {
    try {
      if (guildStore.getGuild(targetGuildId)) {
        isMember = true;
      } else {
        const guilds = guildStore.getGuilds();
        if (guilds && typeof guilds === 'object' && targetGuildId in guilds) {
          isMember = true;
        }
      }
    } catch {}
  }

  if (!isMember) {
    const domIcon = document.querySelector(`nav a[href*="${targetGuildId}"]`);
    if (domIcon) {
      isMember = true;
    }
  }

  if (!isMember) {
    const rest = getRestClient();
    if (rest) {
      try {
        const res = await rest.get<{ user?: unknown; joined_at?: string }>({
          url: `/users/@me/guilds/${targetGuildId}/member`,
        });
        if (res && (res.status === 200 || res.ok || res.body?.joined_at || res.body?.user)) {
          isMember = true;
        }
      } catch (err: unknown) {
        const status = (err as { status?: number })?.status;
        if (status === 404) {
          isMember = false;
        }
      }
    }
  }

  let voiceFound = false;
  const channelStore = getChannelStore();

  if (isMember) {
    for (const channelId of candidateChannelIds) {
      if (channelStore?.getChannel(channelId)) {
        voiceFound = true;
        break;
      }
      if (document.querySelector(`a[href*="${channelId}"]`)) {
        voiceFound = true;
        break;
      }
    }
    if (!voiceFound && isMember) {
      voiceFound = true;
    }
  }

  const canStream = isMember && voiceFound;
  let statusText = 'User Verified';
  if (!isMember) {
    statusText = 'Join Discord ID First';
  } else if (!voiceFound) {
    statusText = 'Voice Channels Not Found';
  }

  cachedState = {
    isMember,
    voiceFound,
    canStream,
    statusText,
  };

  return cachedState;
}
