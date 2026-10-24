import { getVoiceStateStore, getChannelStore } from './stores';
import { waitForVoiceConnected } from '../automation/watcher';
import { leaveVoiceChannel } from './actions';

export interface ChannelRank {
  channelId: string;
  name: string;
  userCount: number;
  isFull: boolean;
}

const defaultChannelNames: Record<string, string> = {
  '1532531180229103626': '🐝・Badge Farming I',
  '1562379518864269382': '🐝・Badge Farming II',
  '1562514091589898250': '🐝・Badge Farming III',
};

export function getVoiceChannelName(channelId: string): string {
  if (defaultChannelNames[channelId]) {
    return defaultChannelNames[channelId];
  }

  const channelStore = getChannelStore();
  const channel = channelStore?.getChannel(channelId);
  if (channel?.name) {
    return channel.name.split('/')[0].split('|')[0].trim();
  }

  const channelAnchor = document.querySelector<HTMLAnchorElement>(`a[href*="${channelId}"]`);
  if (channelAnchor) {
    const nameEl = channelAnchor.querySelector('[class*="name_"], [class*="channelName"]');
    if (nameEl && nameEl.textContent) {
      return nameEl.textContent.split('/')[0].split('|')[0].trim();
    }
  }

  return `Voice Channel (${channelId.slice(-4)})`;
}

export function isVoiceChannelFull(channelId: string, currentCount: number): boolean {
  const channelStore = getChannelStore();
  const channel = channelStore?.getChannel(channelId);
  const limit = channel?.userLimit ?? channel?.user_limit ?? 0;
  if (limit > 0 && currentCount >= limit) {
    return true;
  }
  return false;
}

export function getVoiceChannelUserCount(channelId: string): number {
  const voiceStateStore = getVoiceStateStore();
  if (voiceStateStore) {
    try {
      if (typeof voiceStateStore.countVoiceStatesForChannel === 'function') {
        const count = voiceStateStore.countVoiceStatesForChannel(channelId);
        if (typeof count === 'number') return count;
      }

      const states = voiceStateStore.getVoiceStatesForChannel(channelId);
      if (states && typeof states === 'object') {
        return Object.keys(states).length;
      }
    } catch {}
  }

  try {
    const channelAnchor = document.querySelector<HTMLAnchorElement>(`a[href*="${channelId}"]`);
    if (channelAnchor) {
      const channelItem =
        channelAnchor.closest('[class*="wrapper__"], [class*="containerDefault"]') ||
        channelAnchor.parentElement;
      const userList = channelItem?.parentElement?.querySelectorAll(
        '[class*="voiceUser__"], [class*="userAvatar__"], [class*="avatarContainer__"]'
      );
      if (userList && userList.length > 0) {
        return userList.length;
      }
    }
  } catch {}

  return 0;
}

export function rankChannelsByLowestUserCount(channelIds: string[]): ChannelRank[] {
  const ranked = channelIds.map((channelId) => {
    const userCount = getVoiceChannelUserCount(channelId);
    return {
      channelId,
      name: getVoiceChannelName(channelId),
      userCount,
      isFull: isVoiceChannelFull(channelId, userCount),
    };
  });

  ranked.sort((a, b) => {
    if (a.isFull && !b.isFull) return 1;
    if (!a.isFull && b.isFull) return -1;
    return a.userCount - b.userCount;
  });

  return ranked;
}

export async function connectToOptimalVoiceChannel(
  guildId: string | null,
  channelIds: string[]
): Promise<string | null> {
  if (!channelIds || channelIds.length === 0) {
    return null;
  }

  const ranked = rankChannelsByLowestUserCount(channelIds);
  const summary = ranked.map((r) => `${r.name} (${r.userCount} users)`).join(', ');
  console.log(`[Discord Indonesia] Channel candidate ranking: ${summary}`);

  for (const candidate of ranked) {
    if (candidate.isFull) {
      console.warn(`[Discord Indonesia] Channel ${candidate.name} is full (${candidate.userCount} users), skipping...`);
      continue;
    }

    console.log(
      `[Discord Indonesia] Attempting connection to optimal channel ${candidate.name} (${candidate.userCount} users)...`
    );

    const connected = await waitForVoiceConnected(guildId, candidate.channelId, 12000);
    if (connected) {
      console.log(`[Discord Indonesia] Successfully joined optimal voice channel: ${candidate.name}`);
      return candidate.channelId;
    }

    console.warn(`[Discord Indonesia] Unable to join channel ${candidate.name}, failing over to next...`);
    leaveVoiceChannel();
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.error('[Discord Indonesia] All candidate voice channels failed to connect');
  return null;
}
