(() => {
  const DS = (window.DiscordStreamer = window.DiscordStreamer || {});

  let cachedState = {
    isMember: false,
    voiceFound: false,
    canStream: false,
    statusText: 'Checking user access...',
  };

  let lastCheckTime = 0;

  function getCachedAccess() {
    return cachedState;
  }

  async function checkDiscordIdAccess(
    targetGuildId = DS.defaultGuildId,
    candidateChannelIds = DS.defaultChannelIds,
    forceRefresh = false
  ) {
    const now = Date.now();
    if (!forceRefresh && lastCheckTime > 0 && now - lastCheckTime < 10000) {
      return cachedState;
    }

    lastCheckTime = now;

    let isMember = false;

    const guildStore = typeof DS.getGuildStore === 'function' ? DS.getGuildStore() : null;
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
      const rest = typeof DS.getRestClient === 'function' ? DS.getRestClient() : null;
      if (rest) {
        try {
          const res = await rest.get({
            url: `/users/@me/guilds/${targetGuildId}/member`,
          });
          if (res && (res.status === 200 || res.ok || res.body?.joined_at || res.body?.user)) {
            isMember = true;
          }
        } catch (err) {
          const status = err?.status;
          if (status === 404) {
            isMember = false;
          }
        }
      }
    }

    let voiceFound = false;
    const channelStore = typeof DS.getChannelStore === 'function' ? DS.getChannelStore() : null;

    if (isMember) {
      const channels = candidateChannelIds || [];
      for (const channelId of channels) {
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

  DS.getCachedAccess = getCachedAccess;
  DS.checkDiscordIdAccess = checkDiscordIdAccess;
})();
