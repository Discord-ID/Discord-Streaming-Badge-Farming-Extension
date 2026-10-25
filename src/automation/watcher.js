(() => {
  const DS = (window.DiscordStreamer = window.DiscordStreamer || {});

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function isVoiceActive(channelId) {
    const selectedChannelStore = typeof DS.getSelectedChannelStore === 'function' ? DS.getSelectedChannelStore() : null;
    const currentVoiceId = selectedChannelStore?.getVoiceChannelId?.();
    if (currentVoiceId) {
      return channelId ? currentVoiceId === channelId : true;
    }

    const rtcStore = typeof DS.getRTCConnectionStore === 'function' ? DS.getRTCConnectionStore() : null;
    const isRtcConnected = rtcStore?.getState?.() === 'RTC_CONNECTED' || rtcStore?.isConnected?.() === true;
    if (isRtcConnected) {
      return true;
    }

    const disconnectBtn = document.querySelector('button[aria-label*="Disconnect" i]');
    return Boolean(disconnectBtn);
  }

  async function waitForClientReady(timeoutMs = 60000) {
    const start = Date.now();
    console.log('[Discord Indonesia] Waiting for client ready & gateway connection...');

    let userId = null;
    let username = 'user';

    while (Date.now() - start < timeoutMs) {
      if (!userId) {
        const userStore = typeof DS.getUserStore === 'function' ? DS.getUserStore() : null;
        const currentUser = userStore?.getCurrentUser();
        if (currentUser?.id) {
          userId = currentUser.id;
          username = currentUser.username;
        }

        if (!userId) {
          const authStore = typeof DS.getAuthenticationStore === 'function' ? DS.getAuthenticationStore() : null;
          const authId = authStore?.getId();
          if (authId) {
            userId = authId;
          }
        }

        if (!userId && Date.now() - start > 5000) {
          const rest = typeof DS.getRestClient === 'function' ? DS.getRestClient() : null;
          if (rest) {
            try {
              const res = await rest.get({ url: '/users/@me' });
              const data = res?.body || res;
              if (data?.id) {
                userId = data.id;
                username = data.username || 'user';
              }
            } catch {}
          }
        }
      }

      const authStore = typeof DS.getAuthenticationStore === 'function' ? DS.getAuthenticationStore() : null;
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

  async function waitForVoiceConnected(guildId, channelId, timeoutMs = 45000) {
    const start = Date.now();
    console.log('[Discord Indonesia] Connecting to voice channel...');

    console.log(`[Discord Indonesia] Joining voice channel ${channelId}...`);
    if (typeof DS.selectVoiceChannel === 'function') {
      DS.selectVoiceChannel(guildId, channelId);
    }

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
        if (typeof DS.selectVoiceChannel === 'function') {
          DS.selectVoiceChannel(guildId, channelId);
        }
      }

      await sleep(500);
    }

    console.warn('[Discord Indonesia] Voice connection wait timeout');
    return false;
  }

  DS.isVoiceActive = isVoiceActive;
  DS.waitForClientReady = waitForClientReady;
  DS.waitForVoiceConnected = waitForVoiceConnected;
})();
