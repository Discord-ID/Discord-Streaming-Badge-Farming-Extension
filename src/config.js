(() => {
  const DS = (window.DiscordStreamer = window.DiscordStreamer || {});

  const defaultGuildId = '1419245943999692854';
  const discordIdInviteUrl = 'https://discord.gg/idn';

  const defaultChannelIds = [
    '1562514091589898250',
    '1562379518864269382',
    '1532531180229103626',
  ];

  function getAssetVideoUrl() {
    const bridgedUrl = document.documentElement.dataset.discordVideoUrl;
    if (bridgedUrl) {
      return bridgedUrl;
    }

    if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
      try {
        return chrome.runtime.getURL('assets/videostream.mp4');
      } catch {}
    }

    return '';
  }

  const defaultConfig = {
    guildId: defaultGuildId,
    channelId: defaultChannelIds[0],
    targetChannelIds: defaultChannelIds,
    videoUrl: '',
    autoJoin: true,
    autoStream: true,
    autoReconnect: true,
    reconnectDelayMinutes: 1,
    streamDurationHours: 10,
    cooldownMinutes: 5,
    resolution: {
      width: 854,
      height: 480,
      fps: 60,
    },
  };

  const storageKey = 'discordScreenshareConfig';
  let inMemoryConfig = null;

  function loadConfig() {
    const assetUrl = getAssetVideoUrl();

    try {
      const raw =
        window.localStorage.getItem(storageKey) ||
        document.documentElement.dataset.discordConfig;

      if (raw) {
        const parsed = JSON.parse(raw);
        const loaded = {
          ...defaultConfig,
          ...parsed,
          guildId: parsed.guildId || defaultConfig.guildId,
          channelId: parsed.channelId || defaultConfig.channelId,
          targetChannelIds:
            Array.isArray(parsed.targetChannelIds) && parsed.targetChannelIds.length > 0
              ? parsed.targetChannelIds
              : defaultChannelIds,
          videoUrl: parsed.videoUrl || assetUrl,
          autoJoin: parsed.autoJoin !== undefined ? Boolean(parsed.autoJoin) : true,
          autoStream: parsed.autoStream !== undefined ? Boolean(parsed.autoStream) : true,
          autoReconnect: parsed.autoReconnect !== undefined ? Boolean(parsed.autoReconnect) : true,
          reconnectDelayMinutes:
            !isNaN(Number(parsed.reconnectDelayMinutes)) && Number(parsed.reconnectDelayMinutes) >= 1
              ? Number(parsed.reconnectDelayMinutes)
              : 1,
          streamDurationHours:
            !isNaN(Number(parsed.streamDurationHours)) && Number(parsed.streamDurationHours) >= 1
              ? Number(parsed.streamDurationHours)
              : 10,
          cooldownMinutes:
            !isNaN(Number(parsed.cooldownMinutes)) && Number(parsed.cooldownMinutes) >= 1
              ? Number(parsed.cooldownMinutes)
              : 5,
        };

        inMemoryConfig = loaded;
        return loaded;
      }
    } catch {}

    if (inMemoryConfig) {
      return inMemoryConfig;
    }

    const initial = {
      ...defaultConfig,
      videoUrl: assetUrl,
    };
    inMemoryConfig = initial;
    return initial;
  }

  function saveConfig(patch) {
    try {
      const current = loadConfig();
      const merged = {
        ...current,
        ...patch,
        streamDurationHours:
          patch.streamDurationHours !== undefined
            ? Number(patch.streamDurationHours)
            : current.streamDurationHours,
        cooldownMinutes:
          patch.cooldownMinutes !== undefined
            ? Number(patch.cooldownMinutes)
            : current.cooldownMinutes,
        reconnectDelayMinutes:
          patch.reconnectDelayMinutes !== undefined
            ? Number(patch.reconnectDelayMinutes)
            : current.reconnectDelayMinutes,
        autoReconnect:
          patch.autoReconnect !== undefined
            ? Boolean(patch.autoReconnect)
            : current.autoReconnect,
      };

      inMemoryConfig = merged;
      const jsonStr = JSON.stringify(merged);
      window.localStorage.setItem(storageKey, jsonStr);
      document.documentElement.dataset.discordConfig = jsonStr;
    } catch {}
  }

  DS.defaultGuildId = defaultGuildId;
  DS.discordIdInviteUrl = discordIdInviteUrl;
  DS.defaultChannelIds = defaultChannelIds;
  DS.getAssetVideoUrl = getAssetVideoUrl;
  DS.defaultConfig = defaultConfig;
  DS.loadConfig = loadConfig;
  DS.saveConfig = saveConfig;
})();
