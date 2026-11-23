(() => {
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
  };

  (async function init() {
    if (!window.location.pathname.startsWith('/channels/')) {
      return;
    }

    try {
      if (typeof DS.initUI === 'function') {
        DS.initUI();
      }
    } catch (err) {
      console.warn('[Discord Indonesia] UI initialization error:', err);
    }

    if (typeof DS.waitForClientReady === 'function') {
      await DS.waitForClientReady();
    }

    const config = typeof DS.loadConfig === 'function' ? DS.loadConfig() : {};

    if (typeof DS.runAutomation === 'function') {
      DS.runAutomation(config).catch((err) => {
        console.error('[Discord Indonesia] Extension init failed:', err);
      });
    }
  })();
})();
