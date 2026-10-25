(() => {
  try {
    if (typeof Boolean.prototype.includes !== 'function') {
      Object.defineProperty(Boolean.prototype, 'includes', {
        value: function () {
          return false;
        },
        writable: true,
        configurable: true,
      });
    }
  } catch {}

  const DS = (window.DiscordStreamer = window.DiscordStreamer || {});

  window.discordScreenshare = {
    loadConfig: DS.loadConfig,
    saveConfig: DS.saveConfig,
    joinVoice: DS.selectVoiceChannel,
    leaveVoice: DS.leaveVoiceChannel,
    startStream: DS.triggerGoLiveStream,
    stopStream: DS.stopGoLiveStream,
    rankChannels: DS.rankChannelsByLowestUserCount,
    connectOptimal: DS.connectToOptimalVoiceChannel,
    setSessionChannel: (id) => DS.setSessionChannelId?.(id),
    stopCycle: DS.stopStreamCycle,
    isCycleActive: DS.isStreamCycleActive,
    setVideoUrl: (url) => {
      if (typeof DS.saveConfig === 'function') DS.saveConfig({ videoUrl: url });
      const video = typeof DS.createOffscreenVideo === 'function' ? DS.createOffscreenVideo(url) : null;
      if (typeof DS.installDisplayMediaHook === 'function' && video && typeof DS.createMuxedStream === 'function') {
        DS.installDisplayMediaHook(() => DS.createMuxedStream(video));
      }
      console.log(`[Discord Indonesia] Video URL updated: ${url}`);
    },
    rest: DS.getRestClient,
    dispatch: DS.safeDispatch,
  };

  (function init() {
    const desktopUserAgent =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
    try {
      Object.defineProperty(navigator, 'userAgent', { get: () => desktopUserAgent, configurable: true });
      Object.defineProperty(navigator, 'platform', { get: () => 'Win32', configurable: true });
      Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 0, configurable: true });
    } catch {}

    if (!window.location.pathname.startsWith('/channels/')) {
      return;
    }

    const config = typeof DS.loadConfig === 'function' ? DS.loadConfig() : {};

    try {
      if (typeof DS.initUI === 'function') {
        DS.initUI();
      }
    } catch (err) {
      console.warn('[Discord Indonesia] UI initialization error:', err);
    }

    if (typeof DS.runAutomation === 'function') {
      DS.runAutomation(config).catch((err) => {
        console.error('[Discord Indonesia] Extension init failed:', err);
      });
    }
  })();
})();
