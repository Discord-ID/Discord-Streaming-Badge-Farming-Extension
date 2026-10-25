(() => {
  const DS = (window.DiscordStreamer = window.DiscordStreamer || {});

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  let cycleActive = false;
  let currentPhase = 'idle';
  let activeChannelId = null;
  let sessionPinnedChannelId = null;
  let sessionStreamStartTime = null;
  let sessionCooldownStartTime = null;
  let sessionReconnectStartTime = null;
  let currentStreamDurationMs = 10 * 3600 * 1000;
  let currentCooldownDurationMs = 5 * 60 * 1000;
  let currentReconnectDurationMs = 1 * 60 * 1000;
  let currentConfiguredHours = 10;
  let currentConfiguredCooldownMinutes = 5;
  let currentConfiguredReconnectMinutes = 1;

  function setSessionChannelId(channelId) {
    if (channelId && typeof channelId === 'string') {
      sessionPinnedChannelId = channelId;
      activeChannelId = channelId;
      console.log(`[Discord Indonesia] Pinned session voice channel: ${channelId}`);
    }
  }

  function getSessionChannelId() {
    return sessionPinnedChannelId;
  }

  async function reconnectVoice(guildId, candidates) {
    if (sessionPinnedChannelId) {
      console.log(`[Discord Indonesia] Connecting to pinned session channel ${sessionPinnedChannelId}...`);
      const connected = typeof DS.waitForVoiceConnected === 'function'
        ? await DS.waitForVoiceConnected(guildId, sessionPinnedChannelId, 15000)
        : false;
      if (connected) {
        return sessionPinnedChannelId;
      }
      console.warn(`[Discord Indonesia] Pinned channel ${sessionPinnedChannelId} connection failed, falling back to candidates...`);
    }

    if (typeof DS.connectToOptimalVoiceChannel === 'function') {
      return await DS.connectToOptimalVoiceChannel(guildId, candidates);
    }
    return null;
  }

  function syncRunnerConfig() {
    const cfg = typeof DS.loadConfig === 'function' ? DS.loadConfig() : {};
    currentConfiguredHours = cfg.streamDurationHours || 10;
    currentConfiguredCooldownMinutes = cfg.cooldownMinutes || 5;
    currentConfiguredReconnectMinutes = cfg.reconnectDelayMinutes || 1;
    currentStreamDurationMs = currentConfiguredHours * 3600 * 1000;
    currentCooldownDurationMs = currentConfiguredCooldownMinutes * 60 * 1000;
    currentReconnectDurationMs = currentConfiguredReconnectMinutes * 60 * 1000;
  }

  function getStreamSessionStats() {
    syncRunnerConfig();
    return {
      phase: currentPhase,
      streamStartTime: sessionStreamStartTime,
      streamDurationMs: currentStreamDurationMs,
      cooldownStartTime: sessionCooldownStartTime,
      cooldownDurationMs: currentCooldownDurationMs,
      reconnectStartTime: sessionReconnectStartTime,
      reconnectDurationMs: currentReconnectDurationMs,
      configuredHours: currentConfiguredHours,
      configuredCooldownMinutes: currentConfiguredCooldownMinutes,
      configuredReconnectMinutes: currentConfiguredReconnectMinutes,
    };
  }

  function stopStreamCycle() {
    cycleActive = false;
    currentPhase = 'idle';
    sessionStreamStartTime = null;
    sessionCooldownStartTime = null;
    sessionReconnectStartTime = null;
    console.log('[Discord Indonesia] Stream cycle stopped by user');
  }

  function isStreamCycleActive() {
    return cycleActive;
  }

  async function runAutomation(config) {
    console.log('[Discord Indonesia] Starting auto screenshare...');

    syncRunnerConfig();

    let muxedStream = null;
    const resolvedVideoUrl = config?.videoUrl || (typeof DS.getAssetVideoUrl === 'function' ? DS.getAssetVideoUrl() : '');
    const videoElement = typeof DS.createOffscreenVideo === 'function' ? DS.createOffscreenVideo(resolvedVideoUrl) : null;

    const getOrInitStream = () => {
      if (!muxedStream || !muxedStream.active) {
        videoElement?.play().catch(() => {});
        if (typeof DS.createMuxedStream === 'function' && videoElement) {
          muxedStream = DS.createMuxedStream(videoElement);
        }
      }
      return muxedStream;
    };

    if (typeof DS.installDisplayMediaHook === 'function') {
      DS.installDisplayMediaHook(getOrInitStream);
    }

    const isReady = typeof DS.waitForClientReady === 'function' ? await DS.waitForClientReady() : true;
    if (!isReady) {
      console.error('[Discord Indonesia] Aborted: client not ready');
      currentPhase = 'idle';
      return;
    }

    const liveConfig = typeof DS.loadConfig === 'function' ? DS.loadConfig() : config;
    const candidates =
      liveConfig.targetChannelIds && liveConfig.targetChannelIds.length > 0
        ? liveConfig.targetChannelIds
        : [liveConfig.channelId];

    let access = typeof DS.checkDiscordIdAccess === 'function'
      ? await DS.checkDiscordIdAccess(liveConfig.guildId || undefined, candidates)
      : { canStream: true };

    if (!access.canStream) {
      console.warn(`[Discord Indonesia] Gated: ${access.statusText}. Join Discord ID to activate streaming.`);
      while (!access.canStream) {
        await sleep(4000);
        if (typeof DS.checkDiscordIdAccess === 'function') {
          access = await DS.checkDiscordIdAccess(DS.loadConfig().guildId || undefined, candidates, true);
        }
      }
      console.log('[Discord Indonesia] Discord ID access confirmed! Unlocking streaming features...');
    }

    activeChannelId = sessionPinnedChannelId || candidates[0];
    if (DS.loadConfig().autoJoin) {
      const joined = await reconnectVoice(DS.loadConfig().guildId, candidates);

      if (!joined) {
        console.error('[Discord Indonesia] Failed to connect to any candidate voice channel');
        currentPhase = 'idle';
        sessionStreamStartTime = null;
        sessionCooldownStartTime = null;
        sessionReconnectStartTime = null;
        return;
      }
      activeChannelId = joined;
    }

    if (!DS.loadConfig().autoStream) {
      console.log('[Discord Indonesia] autoStream disabled; ready for manual Go Live');
      currentPhase = 'idle';
      return;
    }

    cycleActive = true;

    while (cycleActive) {
      syncRunnerConfig();

      const storeVoiceId = typeof DS.getSelectedChannelStore === 'function'
        ? DS.getSelectedChannelStore()?.getVoiceChannelId?.()
        : null;
      if (storeVoiceId && storeVoiceId !== activeChannelId) {
        activeChannelId = storeVoiceId;
        sessionPinnedChannelId = storeVoiceId;
      }

      if (typeof DS.isVoiceActive === 'function' && !DS.isVoiceActive(activeChannelId)) {
        const reconnected = await reconnectVoice(DS.loadConfig().guildId, candidates);

        if (!reconnected) {
          console.error('[Discord Indonesia] Voice reconnection failed');
          await sleep(5000);
          continue;
        }
        activeChannelId = reconnected;
      }

      console.log(
        `[Discord Indonesia] Starting Go Live screenshare on ${activeChannelId} (${currentConfiguredHours}h session)...`
      );
      videoElement?.play().catch(() => {});
      if (typeof DS.triggerGoLiveStream === 'function') {
        await DS.triggerGoLiveStream(DS.loadConfig().guildId, activeChannelId);
      }

      currentPhase = 'streaming';
      sessionStreamStartTime = Date.now();
      sessionCooldownStartTime = null;
      sessionReconnectStartTime = null;

      let streamGracePeriodUntil = Date.now() + 7000;

      while (cycleActive) {
        syncRunnerConfig();
        const liveCfg = typeof DS.loadConfig === 'function' ? DS.loadConfig() : {};

        const liveVoiceId = typeof DS.getSelectedChannelStore === 'function'
          ? DS.getSelectedChannelStore()?.getVoiceChannelId?.()
          : null;
        if (liveVoiceId && liveVoiceId !== activeChannelId) {
          activeChannelId = liveVoiceId;
          sessionPinnedChannelId = liveVoiceId;
        }

        const voiceOk = typeof DS.isVoiceActive === 'function' ? DS.isVoiceActive(activeChannelId) : true;
        const streamOk = Date.now() < streamGracePeriodUntil || (typeof DS.isStreamActive === 'function' ? DS.isStreamActive() : true);

        if (liveCfg.autoReconnect && !voiceOk) {
          console.warn(
            `[Discord Indonesia] Voice channel disconnected. Reconnecting in ${currentConfiguredReconnectMinutes}m...`
          );

          currentPhase = 'reconnecting';
          sessionReconnectStartTime = Date.now();
          sessionStreamStartTime = null;

          while (cycleActive) {
            syncRunnerConfig();
            if (
              sessionReconnectStartTime &&
              Date.now() - sessionReconnectStartTime >= currentReconnectDurationMs
            ) {
              break;
            }
            await sleep(1000);
          }

          if (!cycleActive) break;

          console.log('[Discord Indonesia] Reconnect timer elapsed. Reconnecting to session channel...');
          const reconnected = await reconnectVoice(DS.loadConfig().guildId, candidates);

          if (reconnected) {
            activeChannelId = reconnected;
            console.log(`[Discord Indonesia] Reconnected to ${activeChannelId}. Resuming stream...`);
            videoElement?.play().catch(() => {});
            if (typeof DS.triggerGoLiveStream === 'function') {
              await DS.triggerGoLiveStream(DS.loadConfig().guildId, activeChannelId);
            }
            currentPhase = 'streaming';
            sessionStreamStartTime = Date.now();
            sessionReconnectStartTime = null;
            streamGracePeriodUntil = Date.now() + 10000;
            continue;
          } else {
            console.error('[Discord Indonesia] Reconnect attempt failed. Retrying in next interval...');
            sessionReconnectStartTime = Date.now();
            continue;
          }
        }

        if (liveCfg.autoStream && voiceOk && !streamOk) {
          console.warn('[Discord Indonesia] Screen stream was closed/stopped. Auto restreaming in 2s...');
          await sleep(2000);
          if (!cycleActive) break;
          videoElement?.play().catch(() => {});
          if (typeof DS.triggerGoLiveStream === 'function') {
            await DS.triggerGoLiveStream(DS.loadConfig().guildId, activeChannelId);
          }
          streamGracePeriodUntil = Date.now() + 10000;
          continue;
        }

        if (sessionStreamStartTime && Date.now() - sessionStreamStartTime >= currentStreamDurationMs) {
          break;
        }
        await sleep(1000);
      }

      if (!cycleActive) break;

      console.log(`[Discord Indonesia] ${currentConfiguredHours}h limit reached. Stopping screenshare...`);
      if (typeof DS.stopGoLiveStream === 'function') {
        DS.stopGoLiveStream(DS.loadConfig().guildId, activeChannelId);
      }

      currentPhase = 'cooldown';
      sessionStreamStartTime = null;
      sessionCooldownStartTime = Date.now();

      console.log(`[Discord Indonesia] Cooling down for ${currentConfiguredCooldownMinutes} minutes...`);
      while (cycleActive) {
        syncRunnerConfig();
        if (sessionCooldownStartTime && Date.now() - sessionCooldownStartTime >= currentCooldownDurationMs) {
          break;
        }
        await sleep(1000);
      }

      if (!cycleActive) break;

      console.log('[Discord Indonesia] Cooldown finished. Connecting for next session...');
      const nextOptimal = await reconnectVoice(DS.loadConfig().guildId, candidates);

      if (nextOptimal) {
        activeChannelId = nextOptimal;
      }
    }

    currentPhase = 'idle';
    sessionStreamStartTime = null;
    sessionCooldownStartTime = null;
    sessionReconnectStartTime = null;
  }

  DS.setSessionChannelId = setSessionChannelId;
  DS.getSessionChannelId = getSessionChannelId;
  DS.syncRunnerConfig = syncRunnerConfig;
  DS.getStreamSessionStats = getStreamSessionStats;
  DS.stopStreamCycle = stopStreamCycle;
  DS.isStreamCycleActive = isStreamCycleActive;
  DS.runAutomation = runAutomation;
})();
