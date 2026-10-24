import { getUserStore, getAuthenticationStore, getRTCConnectionStore, getSelectedChannelStore } from '../discord/stores';
import { getRestClient } from '../discord/restapi';
import { selectVoiceChannel } from '../discord/actions';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function isVoiceActive(channelId: string): boolean {
  const disconnectBtn = document.querySelector('button[aria-label*="Disconnect" i]');
  if (disconnectBtn) {
    return true;
  }

  const selectedChannelStore = getSelectedChannelStore();
  if (selectedChannelStore?.getVoiceChannelId?.() === channelId) {
    return true;
  }

  const rtcStore = getRTCConnectionStore();
  if (rtcStore?.getState?.() === 'RTC_CONNECTED' || rtcStore?.isConnected?.() === true) {
    return true;
  }

  return false;
}

export async function waitForClientReady(timeoutMs = 60000): Promise<boolean> {
  const start = Date.now();
  console.log('[Discord Indonesia] Waiting for client ready & gateway connection...');

  let userId: string | null = null;
  let username = 'user';

  while (Date.now() - start < timeoutMs) {
    if (!userId) {
      const rest = getRestClient();
      if (rest) {
        try {
          const res = await rest.get<{ id?: string; username?: string }>({ url: '/users/@me' });
          const data = res?.body || (res as unknown as { id?: string; username?: string });
          if (data?.id) {
            userId = data.id;
            username = data.username || 'user';
          }
        } catch {}
      }

      if (!userId) {
        const userStore = getUserStore();
        const currentUser = userStore?.getCurrentUser();
        if (currentUser?.id) {
          userId = currentUser.id;
          username = currentUser.username;
        }
      }

      if (!userId) {
        const authStore = getAuthenticationStore();
        const authId = authStore?.getId();
        if (authId) {
          userId = authId;
        }
      }
    }

    const authStore = getAuthenticationStore();
    const sessionId = authStore?.getSessionId();

    if (userId && sessionId) {
      console.log(`[Discord Indonesia] Client and Gateway ready: ${username} (${userId}) | Session: ${sessionId}`);
      return true;
    }

    if (userId && Date.now() - start > 8000) {
      console.log(`[Discord Indonesia] Client ready: ${username} (${userId})`);
      return true;
    }

    await sleep(1000);
  }

  console.warn('[Discord Indonesia] Client ready wait timeout');
  return false;
}

export async function waitForVoiceConnected(
  guildId: string | null,
  channelId: string,
  timeoutMs = 45000
): Promise<boolean> {
  const start = Date.now();
  console.log('[Discord Indonesia] Connecting to voice channel...');

  console.log(`[Discord Indonesia] Joining voice channel ${channelId}...`);
  selectVoiceChannel(guildId, channelId);

  let retried = false;

  while (Date.now() - start < timeoutMs) {
    if (isVoiceActive(channelId)) {
      console.log(`[Discord Indonesia] Voice connected: ${channelId}`);
      console.log('[Discord Indonesia] Stabilizing voice session before streaming (3.5s)...');
      await sleep(3500);
      return true;
    }

    if (!retried && Date.now() - start > 8000) {
      retried = true;
      console.log(`[Discord Indonesia] Retrying join voice channel ${channelId}...`);
      selectVoiceChannel(guildId, channelId);
    }

    await sleep(500);
  }

  console.warn('[Discord Indonesia] Voice connection wait timeout');
  return false;
}
