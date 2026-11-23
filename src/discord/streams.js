(() => {
  const DS = (window.DiscordStreamer = window.DiscordStreamer || {});

  function isStreamActive() {
    const streamStore = typeof DS.getApplicationStreamStore === 'function' ? DS.getApplicationStreamStore() : null;
    if (streamStore && typeof streamStore.getCurrentUserActiveStream === 'function') {
      try {
        const active = streamStore.getCurrentUserActiveStream();
        return Boolean(active);
      } catch {}
    }
    return false;
  }

  async function triggerGoLiveStream(guildId, channelId, maxWaitMs = 15000) {
    const config = typeof DS.loadConfig === 'function' ? DS.loadConfig() : {};
    const resolvedGuildId = guildId || config.guildId;
    if (!channelId) return false;

    if (isStreamActive()) {
      console.log('[Discord Indonesia] Screenshare already active');
      return true;
    }

    const voiceActions = typeof DS.getVoiceActions === 'function' ? DS.getVoiceActions() : null;
    if (voiceActions && typeof voiceActions.selectVoiceChannel === 'function') {
      try {
        console.log(`[Discord Indonesia] Selecting voice channel ${channelId}...`);
        voiceActions.selectVoiceChannel(channelId, false, true);
      } catch (err) {
        console.warn('[Discord Indonesia] VoiceActions selectVoiceChannel note:', err);
      }
    }

    let sourceId = null;
    const meStore = typeof DS.getMediaEngineStore === 'function' ? DS.getMediaEngineStore() : null;
    const mediaEngine = meStore?.getMediaEngine?.();

    if (mediaEngine && typeof mediaEngine.getDesktopSource === 'function') {
      try {
        const quality = config.streamQuality || '480p';
        const fps = Number(config.streamFps) || 30;
        const targetWidth = quality === '480p' ? 854 : quality === '720p' ? 1280 : 1920;
        const targetHeight = quality === '480p' ? 480 : quality === '720p' ? 720 : 1080;
        sourceId = await mediaEngine.getDesktopSource({ width: targetWidth, height: targetHeight, frameRate: fps }, true);
        console.log(`[Discord Indonesia] Acquired desktop source ID: ${sourceId} (${targetWidth}x${targetHeight}@${fps}fps)`);
      } catch (err) {
        console.warn('[Discord Indonesia] mediaEngine getDesktopSource note:', err);
      }
    }

    const streamActions = typeof DS.getStreamActionCreators === 'function' ? DS.getStreamActionCreators() : null;
    if (streamActions && typeof streamActions.XI === 'function') {
      console.log(`[Discord Indonesia] Launching stream via StreamActionCreators with source ${sourceId}...`);
      streamActions.XI(resolvedGuildId, String(channelId), {
        pid: null,
        sourceId: sourceId,
        sourceName: null,
        analyticsLocations: [],
      });
    } else {
      DS.safeDispatch('STREAM_START', {
        type: 'STREAM_START',
        streamType: resolvedGuildId ? 'guild' : 'call',
        guildId: resolvedGuildId,
        channelId: String(channelId),
        pid: null,
        sourceId: sourceId,
        sourceName: null,
        appContext: 'APP',
      });
    }

    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
      if (isStreamActive()) {
        console.log('[Discord Indonesia] Screenshare verified active');
        return true;
      }
      await new Promise((r) => setTimeout(r, 600));
    }

    return isStreamActive();
  }

  function stopGoLiveStream(guildId, channelId) {
    const config = typeof DS.loadConfig === 'function' ? DS.loadConfig() : {};
    const userStore = typeof DS.getUserStore === 'function' ? DS.getUserStore() : null;
    const authStore = typeof DS.getAuthenticationStore === 'function' ? DS.getAuthenticationStore() : null;
    const userId = userStore?.getCurrentUser?.()?.id || authStore?.getId?.() || '';
    const resolvedGuildId = guildId || config.guildId;
    const streamKey = `guild:${resolvedGuildId}:${channelId}:${userId}`;

    const meStore = typeof DS.getMediaEngineStore === 'function' ? DS.getMediaEngineStore() : null;
    const mediaEngine = meStore?.getMediaEngine?.();
    if (mediaEngine && typeof mediaEngine.setGoLiveSource === 'function') {
      try {
        mediaEngine.setGoLiveSource(null, 'stream');
      } catch {}
    }

    DS.safeDispatch('STREAM_CLOSE', { streamKey });
    DS.safeDispatch(DS.fluxActions.streamStop, { streamKey });

    const streamActions = typeof DS.getStreamActions === 'function' ? DS.getStreamActions() : null;
    if (streamActions && typeof streamActions.stopStream === 'function') {
      try {
        streamActions.stopStream(streamKey);
      } catch {}
    }

    console.log(`[Discord Indonesia] Stopped stream: ${streamKey}`);
  }

  DS.isStreamActive = isStreamActive;
  DS.triggerGoLiveStream = triggerGoLiveStream;
  DS.stopGoLiveStream = stopGoLiveStream;
})();
