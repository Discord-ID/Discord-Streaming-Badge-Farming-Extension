(() => {
  const DS = (window.DiscordStreamer = window.DiscordStreamer || {});

  let shadowRoot = null;
  let checkerDismissed = false;

  function initUI() {
    if (document.getElementById('discord-id-streamer-host')) {
      return;
    }

    const host = document.createElement('div');
    host.id = 'discord-id-streamer-host';
    (document.body || document.documentElement).appendChild(host);

    shadowRoot = host.attachShadow({ mode: 'open' });

    const styleEl = document.createElement('style');
    styleEl.textContent = DS.uiStyles || '';
    shadowRoot.appendChild(styleEl);

    const widgetHtml = typeof DS.renderWidgetHtml === 'function' ? DS.renderWidgetHtml() : '';
    const modalHtml = typeof DS.renderModalHtml === 'function' ? DS.renderModalHtml() : '';
    const checkerHtml = typeof DS.renderCheckerModalHtml === 'function' ? DS.renderCheckerModalHtml() : '';

    const container = document.createElement('div');
    container.innerHTML = `${widgetHtml}${modalHtml}${checkerHtml}`;
    shadowRoot.appendChild(container);

    wireUiEvents(shadowRoot);
    startUiStatusPoller(shadowRoot);
  }

  function wireUiEvents(root) {
    const trigger = root.getElementById('discordIdTrigger');
    const overlay = root.getElementById('discordIdOverlay');
    const closeBtn = root.getElementById('modalCloseBtn');
    const checkerOverlay = root.getElementById('discordCheckerOverlay');
    const checkerCloseBtn = root.getElementById('discordCheckerCloseBtn');
    const btnCheckerRestart = root.getElementById('btnCheckerRestart');

    const openModal = async () => {
      const config = typeof DS.loadConfig === 'function' ? DS.loadConfig() : {};
      const autoJoinEl = root.getElementById('settingAutoJoin');
      const autoStreamEl = root.getElementById('settingAutoStream');
      const autoReconnectEl = root.getElementById('settingAutoReconnect');
      const durationEl = root.getElementById('settingDuration');
      const cooldownEl = root.getElementById('settingCooldown');
      const reconnectDelayEl = root.getElementById('settingReconnectDelay');

      if (autoJoinEl) autoJoinEl.checked = Boolean(config.autoJoin);
      if (autoStreamEl) autoStreamEl.checked = Boolean(config.autoStream);
      if (autoReconnectEl) autoReconnectEl.checked = Boolean(config.autoReconnect);
      if (durationEl) durationEl.value = String(config.streamDurationHours || 10);
      if (cooldownEl) cooldownEl.value = String(config.cooldownMinutes || 5);
      if (reconnectDelayEl) reconnectDelayEl.value = String(config.reconnectDelayMinutes || 1);

      const channels = config.targetChannelIds || [];
      const access = typeof DS.checkDiscordIdAccess === 'function'
        ? await DS.checkDiscordIdAccess(config.guildId || undefined, channels)
        : { canStream: false };

      if (!access.canStream) {
        checkerDismissed = false;
        checkerOverlay?.classList.add('open');
        overlay?.classList.remove('open');
      } else {
        overlay?.classList.add('open');
        checkerOverlay?.classList.remove('open');
      }
      refreshModalValues(root);
    };

    const closeModal = () => {
      overlay?.classList.remove('open');
    };

    trigger?.addEventListener('click', openModal);
    closeBtn?.addEventListener('click', closeModal);

    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal();
      }
    });

    checkerCloseBtn?.addEventListener('click', () => {
      checkerDismissed = true;
      checkerOverlay?.classList.remove('open');
    });

    checkerOverlay?.addEventListener('click', (e) => {
      if (e.target === checkerOverlay) {
        checkerDismissed = true;
        checkerOverlay?.classList.remove('open');
      }
    });

    const btnCheckerJoin = root.getElementById('btnCheckerJoin');
    btnCheckerJoin?.addEventListener('click', () => {
      checkerOverlay?.classList.remove('open');
    });

    const sidebarJoin = root.getElementById('sidebarJoinCard');
    sidebarJoin?.addEventListener('click', () => {
      overlay?.classList.remove('open');
    });

    btnCheckerRestart?.addEventListener('click', () => {
      console.log('[Discord Indonesia] Reloading Discord page via checker modal...');
      window.location.reload();
    });

    const navItems = root.querySelectorAll('.nav-item');
    navItems.forEach((item) => {
      item.addEventListener('click', () => {
        const tabName = item.getAttribute('data-tab');
        if (!tabName) return;

        navItems.forEach((n) => n.classList.remove('active'));
        item.classList.add('active');

        const pages = root.querySelectorAll('.tab-page');
        pages.forEach((p) => p.classList.remove('active'));

        const targetPage = root.getElementById(`tab-${tabName}`);
        targetPage?.classList.add('active');
      });
    });

    root.addEventListener('click', async (e) => {
      const target = e.target?.closest('.channel-join-btn');
      if (!target || target.disabled || target.classList.contains('active')) return;

      const channelId = target.getAttribute('data-channel-id');
      if (!channelId) return;

      if (typeof DS.setSessionChannelId === 'function') {
        DS.setSessionChannelId(channelId);
      }

      const config = typeof DS.loadConfig === 'function' ? DS.loadConfig() : {};
      const channelName = typeof DS.getVoiceChannelName === 'function' ? DS.getVoiceChannelName(channelId) : channelId;
      console.log(`[Discord Indonesia] User manual join requested for: ${channelName} (${channelId})`);

      target.textContent = 'Joining...';
      target.disabled = true;

      if (typeof DS.selectVoiceChannel === 'function') {
        DS.selectVoiceChannel(config.guildId, channelId);
      }

      const connected = typeof DS.waitForVoiceConnected === 'function'
        ? await DS.waitForVoiceConnected(config.guildId, channelId, 15000)
        : false;

      if (connected && typeof DS.triggerGoLiveStream === 'function') {
        await DS.triggerGoLiveStream(config.guildId, channelId);
      }
      refreshModalValues(root);
    });

    const autoJoinInput = root.getElementById('settingAutoJoin');
    const autoStreamInput = root.getElementById('settingAutoStream');
    const autoReconnectInput = root.getElementById('settingAutoReconnect');
    const durationSelect = root.getElementById('settingDuration');
    const cooldownSelect = root.getElementById('settingCooldown');
    const reconnectDelaySelect = root.getElementById('settingReconnectDelay');

    autoJoinInput?.addEventListener('change', () => {
      if (typeof DS.saveConfig === 'function') DS.saveConfig({ autoJoin: autoJoinInput.checked });
      if (typeof DS.syncRunnerConfig === 'function') DS.syncRunnerConfig();
      refreshModalValues(root);
    });

    autoStreamInput?.addEventListener('change', () => {
      if (typeof DS.saveConfig === 'function') DS.saveConfig({ autoStream: autoStreamInput.checked });
      if (typeof DS.syncRunnerConfig === 'function') DS.syncRunnerConfig();
      refreshModalValues(root);
    });

    autoReconnectInput?.addEventListener('change', () => {
      if (typeof DS.saveConfig === 'function') DS.saveConfig({ autoReconnect: autoReconnectInput.checked });
      if (typeof DS.syncRunnerConfig === 'function') DS.syncRunnerConfig();
      refreshModalValues(root);
    });

    reconnectDelaySelect?.addEventListener('change', () => {
      const val = parseInt(reconnectDelaySelect.value, 10);
      if (!isNaN(val) && val >= 1) {
        if (typeof DS.saveConfig === 'function') DS.saveConfig({ reconnectDelayMinutes: val });
        if (typeof DS.syncRunnerConfig === 'function') DS.syncRunnerConfig();
        refreshModalValues(root);
      }
    });

    durationSelect?.addEventListener('change', () => {
      const val = parseInt(durationSelect.value, 10);
      if (!isNaN(val) && val >= 1) {
        if (typeof DS.saveConfig === 'function') DS.saveConfig({ streamDurationHours: val });
        if (typeof DS.syncRunnerConfig === 'function') DS.syncRunnerConfig();
        refreshModalValues(root);
      }
    });

    cooldownSelect?.addEventListener('change', () => {
      const val = parseInt(cooldownSelect.value, 10);
      if (!isNaN(val) && val >= 1) {
        if (typeof DS.saveConfig === 'function') DS.saveConfig({ cooldownMinutes: val });
        if (typeof DS.syncRunnerConfig === 'function') DS.syncRunnerConfig();
        refreshModalValues(root);
      }
    });

    const btnRestart = root.getElementById('btnRestartStream');
    btnRestart?.addEventListener('click', () => {
      console.log('[Discord Indonesia] Reloading Discord website and restarting extension...');
      window.location.reload();
    });

    const btnToggle = root.getElementById('btnToggleStream');
    btnToggle?.addEventListener('click', async () => {
      const access = typeof DS.getCachedAccess === 'function' ? DS.getCachedAccess() : { canStream: false };
      if (!access.canStream) {
        return;
      }
      const config = typeof DS.loadConfig === 'function' ? DS.loadConfig() : {};
      const channels = config.targetChannelIds || [];
      const isVoiceActive = typeof DS.isVoiceActive === 'function' ? DS.isVoiceActive : () => false;
      const isStreamActive = typeof DS.isStreamActive === 'function' ? DS.isStreamActive : () => false;

      const isAnyActive = channels.some((ch) => isVoiceActive(ch)) || isStreamActive();

      if (isAnyActive) {
        console.log('[Discord Indonesia] Stopping stream and leaving voice channel via UI...');
        if (typeof DS.stopStreamCycle === 'function') DS.stopStreamCycle();
        if (typeof DS.stopGoLiveStream === 'function') DS.stopGoLiveStream(config.guildId, config.channelId);
        if (typeof DS.leaveVoiceChannel === 'function') DS.leaveVoiceChannel();
      } else {
        console.log('[Discord Indonesia] Starting voice connection and stream via UI...');
        if (typeof DS.runAutomation === 'function') {
          DS.runAutomation(config).catch((err) => console.error('[Discord Indonesia] Join stream failed:', err));
        }
      }

      refreshModalValues(root);
    });
  }

  function formatTime(ms) {
    if (ms <= 0 || !Number.isFinite(ms)) return '00:00:00';
    const totalSecs = Math.floor(ms / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  async function refreshModalValues(root) {
    const config = typeof DS.loadConfig === 'function' ? DS.loadConfig() : {};
    const channels = config.targetChannelIds || [];

    const access = typeof DS.checkDiscordIdAccess === 'function'
      ? await DS.checkDiscordIdAccess(config.guildId || undefined, channels)
      : { canStream: false, isMember: false };

    const isVerified = access.canStream;

    const checkerOverlay = root.getElementById('discordCheckerOverlay');
    const trigger = root.getElementById('discordIdTrigger');

    if (!isVerified) {
      if (!checkerDismissed) {
        checkerOverlay?.classList.add('open');
      }
      trigger?.classList.add('gated');
    } else {
      checkerOverlay?.classList.remove('open');
      trigger?.classList.remove('gated');
    }

    const btnRestart = root.getElementById('btnRestartStream');
    const btnToggle = root.getElementById('btnToggleStream');
    const btnToggleIcon = root.getElementById('btnToggleStreamIcon');
    const btnToggleText = root.getElementById('btnToggleStreamText');
    const autoJoinInput = root.getElementById('settingAutoJoin');
    const autoStreamInput = root.getElementById('settingAutoStream');
    const autoReconnectInput = root.getElementById('settingAutoReconnect');
    const durationSelect = root.getElementById('settingDuration');
    const cooldownSelect = root.getElementById('settingCooldown');
    const reconnectDelaySelect = root.getElementById('settingReconnectDelay');

    if (btnRestart) {
      btnRestart.disabled = !isVerified;
      btnRestart.classList.toggle('disabled', !isVerified);
    }
    if (btnToggle) {
      btnToggle.disabled = !isVerified;
      btnToggle.classList.toggle('disabled', !isVerified);
    }
    if (autoJoinInput) {
      autoJoinInput.disabled = !isVerified;
      autoJoinInput.closest('.switch')?.classList.toggle('disabled', !isVerified);
    }
    if (autoStreamInput) {
      autoStreamInput.disabled = !isVerified;
      autoStreamInput.closest('.switch')?.classList.toggle('disabled', !isVerified);
    }
    if (autoReconnectInput) {
      autoReconnectInput.disabled = !isVerified;
      autoReconnectInput.closest('.switch')?.classList.toggle('disabled', !isVerified);
    }
    if (durationSelect) durationSelect.disabled = !isVerified;
    if (cooldownSelect) cooldownSelect.disabled = !isVerified;
    if (reconnectDelaySelect) reconnectDelaySelect.disabled = !isVerified;

    const isVoiceActive = typeof DS.isVoiceActive === 'function' ? DS.isVoiceActive : () => false;
    const isStreamActive = typeof DS.isStreamActive === 'function' ? DS.isStreamActive : () => false;
    const icons = DS.icons || {};

    const isAnyVoiceActive = channels.some((ch) => isVoiceActive(ch)) || isStreamActive();
    if (btnToggleText && btnToggleIcon) {
      if (isAnyVoiceActive) {
        btnToggleIcon.innerHTML = typeof icons.stop === 'function' ? icons.stop(15) : '';
        btnToggleText.textContent = 'Stop Streaming';
      } else {
        btnToggleIcon.innerHTML = typeof icons.broadcast === 'function' ? icons.broadcast(15) : '';
        btnToggleText.textContent = 'Join Streaming';
      }
    }

    const statusValue = root.getElementById('statusLiveValue');
    const streaming = isStreamActive();
    const cycling = typeof DS.isStreamCycleActive === 'function' ? DS.isStreamCycleActive() : false;
    const sessionStats = typeof DS.getStreamSessionStats === 'function' ? DS.getStreamSessionStats() : { phase: 'idle' };

    if (statusValue) {
      if (!isVerified) {
        statusValue.textContent = !access.isMember ? 'Locked (Join Server First)' : 'Locked (Channels Missing)';
      } else if (sessionStats.phase === 'reconnecting') {
        statusValue.textContent = 'Reconnecting Voice...';
        trigger?.classList.remove('idle');
        trigger?.classList.add('cooldown');
      } else if (streaming) {
        statusValue.textContent = 'Live Streaming';
        trigger?.classList.remove('idle', 'cooldown');
      } else if (cycling) {
        statusValue.textContent = 'Standby / Cooldown';
        trigger?.classList.remove('idle');
        trigger?.classList.add('cooldown');
      } else {
        statusValue.textContent = 'Idle';
        trigger?.classList.remove('cooldown');
        trigger?.classList.add('idle');
      }
    }

    const statDuration = root.getElementById('statDurationValue');
    const statTarget = root.getElementById('statSessionTarget');
    const statCooldown = root.getElementById('statCooldownValue');

    if (statTarget) {
      statTarget.textContent = `${config.streamDurationHours || 10}h`;
    }

    if (statDuration) {
      if (streaming && sessionStats.streamStartTime) {
        const elapsed = Math.max(0, Date.now() - sessionStats.streamStartTime);
        statDuration.textContent = formatTime(elapsed);
      } else if (streaming) {
        statDuration.textContent = 'Active';
      } else {
        statDuration.textContent = '00:00:00';
      }
    }

    if (statCooldown) {
      if (sessionStats.phase === 'reconnecting' && sessionStats.reconnectStartTime) {
        const remaining = Math.max(0, sessionStats.reconnectDurationMs - (Date.now() - sessionStats.reconnectStartTime));
        statCooldown.textContent = `Rejoin ${formatTime(remaining)}`;
      } else if (sessionStats.phase === 'streaming' && sessionStats.streamStartTime) {
        const remaining = Math.max(0, sessionStats.streamDurationMs - (Date.now() - sessionStats.streamStartTime));
        statCooldown.textContent = `in ${formatTime(remaining)}`;
      } else if (sessionStats.phase === 'cooldown' && sessionStats.cooldownStartTime) {
        const remaining = Math.max(0, sessionStats.cooldownDurationMs - (Date.now() - sessionStats.cooldownStartTime));
        statCooldown.textContent = `Break ${formatTime(remaining)}`;
      } else {
        statCooldown.textContent = '--:--:--';
      }
    }

    const container = root.getElementById('channelListContainer');
    if (container) {
      const cards = container.querySelectorAll('.channel-item');
      const getVoiceChannelUserCount = typeof DS.getVoiceChannelUserCount === 'function' ? DS.getVoiceChannelUserCount : () => 0;
      const getVoiceChannelName = typeof DS.getVoiceChannelName === 'function' ? DS.getVoiceChannelName : (id) => `Room ${id}`;
      const isVoiceChannelFull = typeof DS.isVoiceChannelFull === 'function' ? DS.isVoiceChannelFull : () => false;

      channels.forEach((channelId, idx) => {
        const cardItem = cards[idx];
        if (cardItem) {
          const count = isVerified ? getVoiceChannelUserCount(channelId) : 0;
          const active = isVerified && isVoiceActive(channelId);
          const name = getVoiceChannelName(channelId);
          const isFull = isVerified && isVoiceChannelFull(channelId, count);

          cardItem.classList.toggle('active', active);

          const nameLabel = cardItem.querySelector('.channel-name-text');
          if (nameLabel) {
            nameLabel.textContent = name;
          }

          const countLabel = cardItem.querySelector('.channel-count-text');
          if (countLabel) {
            countLabel.innerHTML = `${typeof icons.users === 'function' ? icons.users(13) : ''} ${isVerified ? `${count} in room` : 'Locked'}`;
          }

          const dot = cardItem.querySelector('.channel-live-dot');
          if (dot) {
            dot.className = `channel-live-dot ${isFull || !isVerified ? 'dot-red' : 'dot-green'}`;
          }

          const joinBtn = cardItem.querySelector('.channel-join-btn');
          if (joinBtn) {
            joinBtn.textContent = active ? 'Active' : isFull ? 'Full' : 'Join';
            joinBtn.classList.toggle('active', active);
            joinBtn.classList.toggle('disabled', isFull || !isVerified);
            joinBtn.disabled = active || isFull || !isVerified;
          }
        }
      });
    }
  }

  function startUiStatusPoller(root) {
    setInterval(() => {
      refreshModalValues(root).catch(() => {});
    }, 1000);
  }

  DS.initUI = initUI;
})();
