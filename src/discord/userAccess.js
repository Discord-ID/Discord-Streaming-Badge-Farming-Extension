(() => {
  const DS = (window.DiscordStreamer = window.DiscordStreamer || {});

  let cachedState = {
    isMember: true,
    voiceFound: true,
    canStream: true,
    statusText: 'Ready',
  };

  let lastCheckTime = 0;

  function getCachedAccess() {
    return cachedState;
  }

  async function checkDiscordIdAccess(
    targetGuildId,
    candidateChannelIds,
    forceRefresh = false
  ) {
    const config = typeof DS.loadConfig === 'function' ? DS.loadConfig() : {};
    const guildId = targetGuildId || config.guildId;
    const channels = candidateChannelIds || config.targetChannelIds || [];

    const now = Date.now();
    if (!forceRefresh && lastCheckTime > 0 && now - lastCheckTime < 10000) {
      return cachedState;
    }

    lastCheckTime = now;

    const userStore = typeof DS.getUserStore === 'function' ? DS.getUserStore() : null;
    const currentUser = userStore?.getCurrentUser?.();
    const authStore = typeof DS.getAuthenticationStore === 'function' ? DS.getAuthenticationStore() : null;
    const isAuthenticated = Boolean(currentUser?.id || authStore?.getId?.());

    let isMember = true;
    if (guildId && guildId !== '@me') {
      const guildStore = typeof DS.getGuildStore === 'function' ? DS.getGuildStore() : null;
      if (guildStore) {
        try {
          if (guildStore.getGuild(guildId)) {
            isMember = true;
          } else {
            const guilds = guildStore.getGuilds();
            isMember = guilds && typeof guilds === 'object' && guildId in guilds;
          }
        } catch {}
      }
    }

    let voiceFound = true;
    let hasPermissions = true;
    const channelStore = typeof DS.getChannelStore === 'function' ? DS.getChannelStore() : null;
    const permStore = typeof DS.getPermissionStore === 'function' ? DS.getPermissionStore() : null;
    const CONNECT_FLAG = 1048576n;
    const STREAM_FLAG = 512n;

    if (channels.length > 0 && channelStore) {
      voiceFound = channels.some((chId) => Boolean(channelStore.getChannel(chId)));

      if (permStore && typeof permStore.can === 'function') {
        for (const chId of channels) {
          const channel = channelStore.getChannel(chId);
          if (channel) {
            try {
              const canConnect = permStore.can(CONNECT_FLAG, channel);
              const canStreamPerm = permStore.can(STREAM_FLAG, channel);
              if (canConnect === false || canStreamPerm === false) {
                hasPermissions = false;
              }
            } catch {}
          }
        }
      }
    }

    const canStream = isAuthenticated && isMember && hasPermissions;
    let statusText = 'Ready';
    if (!isAuthenticated) {
      statusText = 'Please Login to Discord';
    } else if (!isMember) {
      statusText = 'Guild Not Joined';
    } else if (!hasPermissions) {
      statusText = 'Missing Voice/Stream Permission';
    } else if (!voiceFound) {
      statusText = 'Voice Channel Not Found';
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
