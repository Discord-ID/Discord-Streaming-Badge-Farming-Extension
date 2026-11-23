(() => {
  const DS = (window.DiscordStreamer = window.DiscordStreamer || {});

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

  const defaultGuildId = '1419245943999692854';
  const defaultChannelIds = [
    '1562514091589898250',
    '1562379518864269382',
    '1532531180229103626',
  ];

  const defaultConfig = {
    guildId: defaultGuildId,
    channelId: defaultChannelIds[0],
    targetChannelIds: defaultChannelIds,
    streamQuality: '480p',
    streamFps: 30,
    videoUrl: '',
    autoJoin: true,
    autoStream: true,
    autoReconnect: true,
    reconnectDelayMinutes: 1,
    streamDurationHours: 6,
    cooldownMinutes: 5,
  };

  const storageKey = 'discordScreenshareConfig';
  let inMemoryConfig = null;

  function getIframeStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage?.getItem) {
        return window.localStorage;
      }
    } catch {}

    try {
      if (typeof document !== 'undefined') {
        let frame = document.getElementById('ds-storage-frame');
        if (!frame) {
          frame = document.createElement('iframe');
          frame.id = 'ds-storage-frame';
          frame.style.display = 'none';
          (document.body || document.documentElement).appendChild(frame);
        }
        if (frame.contentWindow?.localStorage?.getItem) {
          return frame.contentWindow.localStorage;
        }
      }
    } catch {}

    return null;
  }

  function getCookie(name) {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/+^])/g, '\\$1') + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  }

  function setCookie(name, value, days = 365) {
    if (typeof document === 'undefined') return;
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  }

  function loadConfig() {
    const assetUrl = getAssetVideoUrl();

    try {
      const storage = getIframeStorage();
      const raw =
        storage?.getItem?.(storageKey) ||
        getCookie(storageKey) ||
        document.documentElement.dataset.discordConfig;

      if (raw) {
        const parsed = JSON.parse(raw);
        const resolvedGuildId = parsed.guildId || defaultGuildId;
        const validTargets = Array.isArray(parsed.targetChannelIds) && parsed.targetChannelIds.length > 0
          ? parsed.targetChannelIds.filter((id) => /^\d{17,20}$/.test(id))
          : [];
        const resolvedTargetChannels = validTargets.length > 0 ? validTargets : defaultChannelIds;
        const resolvedChannelId = resolvedTargetChannels.includes(parsed.channelId)
          ? parsed.channelId
          : resolvedTargetChannels[0];

        const loaded = {
          ...defaultConfig,
          ...parsed,
          guildId: resolvedGuildId,
          channelId: resolvedChannelId,
          targetChannelIds: resolvedTargetChannels,
          videoUrl: parsed.videoUrl || assetUrl,
          autoJoin: parsed.autoJoin !== undefined ? Boolean(parsed.autoJoin) : true,
          autoStream: parsed.autoStream !== undefined ? Boolean(parsed.autoStream) : true,
          autoReconnect: parsed.autoReconnect !== undefined ? Boolean(parsed.autoReconnect) : true,
          reconnectDelayMinutes:
            !isNaN(Number(parsed.reconnectDelayMinutes)) && Number(parsed.reconnectDelayMinutes) >= 1
              ? Number(parsed.reconnectDelayMinutes)
              : 1,
          streamFps:
            !isNaN(Number(parsed.streamFps)) && Number(parsed.streamFps) >= 15
              ? Number(parsed.streamFps)
              : 30,
          streamDurationHours:
            !isNaN(Number(parsed.streamDurationHours)) && Number(parsed.streamDurationHours) >= 1
              ? Number(parsed.streamDurationHours)
              : 6,
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
      guildId: defaultGuildId,
      channelId: defaultChannelIds[0],
      targetChannelIds: defaultChannelIds,
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
        autoJoin:
          patch.autoJoin !== undefined
            ? Boolean(patch.autoJoin)
            : current.autoJoin,
        autoStream:
          patch.autoStream !== undefined
            ? Boolean(patch.autoStream)
            : current.autoStream,
        autoReconnect:
          patch.autoReconnect !== undefined
            ? Boolean(patch.autoReconnect)
            : current.autoReconnect,
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
        streamFps:
          patch.streamFps !== undefined
            ? Number(patch.streamFps)
            : current.streamFps,
      };

      inMemoryConfig = merged;
      const jsonStr = JSON.stringify(merged);
      const storage = getIframeStorage();
      if (storage) {
        try { storage.setItem(storageKey, jsonStr); } catch {}
      }
      setCookie(storageKey, jsonStr);
      document.documentElement.dataset.discordConfig = jsonStr;
    } catch {}
  }

  DS.defaultGuildId = defaultGuildId;
  DS.discordIdInviteUrl = 'https://discord.gg/idn';
  DS.defaultChannelIds = defaultChannelIds;
  DS.getAssetVideoUrl = getAssetVideoUrl;
  DS.defaultConfig = defaultConfig;
  DS.loadConfig = loadConfig;
  DS.saveConfig = saveConfig;
})();
