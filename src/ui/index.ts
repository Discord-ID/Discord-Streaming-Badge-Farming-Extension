import { uiStyles } from './styles';
import { renderWidgetHtml } from './widget';
import { renderModalHtml } from './modal';
import { renderCheckerModalHtml } from './checkerModal';
import { loadConfig, saveConfig } from '../config';
import { isStreamActive, stopGoLiveStream, triggerGoLiveStream } from '../discord/streams';
import { isVoiceActive, waitForVoiceConnected } from '../automation/watcher';
import { isStreamCycleActive, stopStreamCycle, runAutomation, getStreamSessionStats, syncRunnerConfig } from '../automation/runner';
import { getVoiceChannelUserCount, getVoiceChannelName, isVoiceChannelFull } from '../discord/voiceChannels';
import { checkDiscordIdAccess, getCachedAccess } from '../discord/userAccess';
import { selectVoiceChannel, leaveVoiceChannel } from '../discord/actions';
import { icons } from './icons';

let shadowRoot: ShadowRoot | null = null;
let checkerDismissed = false;

export function initUI(): void {
  if (document.getElementById('discord-id-streamer-host')) {
    return;
  }

  const host = document.createElement('div');
  host.id = 'discord-id-streamer-host';
  (document.body || document.documentElement).appendChild(host);

  shadowRoot = host.attachShadow({ mode: 'open' });

  const styleEl = document.createElement('style');
  styleEl.textContent = uiStyles;
  shadowRoot.appendChild(styleEl);

  const container = document.createElement('div');
  container.innerHTML = `${renderWidgetHtml()}${renderModalHtml()}${renderCheckerModalHtml()}`;
  shadowRoot.appendChild(container);

  wireUiEvents(shadowRoot);
  startUiStatusPoller(shadowRoot);
}

function wireUiEvents(root: ShadowRoot): void {
  const trigger = root.getElementById('discordIdTrigger');
  const overlay = root.getElementById('discordIdOverlay');
  const closeBtn = root.getElementById('modalCloseBtn');
  const checkerOverlay = root.getElementById('discordCheckerOverlay');
  const checkerCloseBtn = root.getElementById('discordCheckerCloseBtn');
  const btnCheckerRestart = root.getElementById('btnCheckerRestart');

  const openModal = async () => {
    const config = loadConfig();
    const autoJoinEl = root.getElementById('settingAutoJoin') as HTMLInputElement | null;
    const autoStreamEl = root.getElementById('settingAutoStream') as HTMLInputElement | null;
    const durationEl = root.getElementById('settingDuration') as HTMLSelectElement | null;
    const cooldownEl = root.getElementById('settingCooldown') as HTMLSelectElement | null;

    if (autoJoinEl) autoJoinEl.checked = Boolean(config.autoJoin);
    if (autoStreamEl) autoStreamEl.checked = Boolean(config.autoStream);
    if (durationEl) durationEl.value = String(config.streamDurationHours || 10);
    if (cooldownEl) cooldownEl.value = String(config.cooldownMinutes || 5);

    const channels = config.targetChannelIds || [];
    const access = await checkDiscordIdAccess(config.guildId || undefined, channels);

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

  const navItems = root.querySelectorAll<HTMLElement>('.nav-item');
  navItems.forEach((item) => {
    item.addEventListener('click', () => {
      const tabName = item.getAttribute('data-tab');
      if (!tabName) return;

      navItems.forEach((n) => n.classList.remove('active'));
      item.classList.add('active');

      const pages = root.querySelectorAll<HTMLElement>('.tab-page');
      pages.forEach((p) => p.classList.remove('active'));

      const targetPage = root.getElementById(`tab-${tabName}`);
      targetPage?.classList.add('active');
    });
  });

  root.addEventListener('click', async (e) => {
    const target = (e.target as HTMLElement)?.closest('.channel-join-btn') as HTMLButtonElement | null;
    if (!target || target.disabled || target.classList.contains('active')) return;

    const channelId = target.getAttribute('data-channel-id');
    if (!channelId) return;

    const config = loadConfig();
    const channelName = getVoiceChannelName(channelId);
    console.log(`[Discord Indonesia] User manual join requested for: ${channelName} (${channelId})`);

    target.textContent = 'Joining...';
    target.disabled = true;

    selectVoiceChannel(config.guildId, channelId);
    const connected = await waitForVoiceConnected(config.guildId, channelId, 15000);
    if (connected) {
      await triggerGoLiveStream(config.guildId, channelId);
    }
    refreshModalValues(root);
  });

  const autoJoinInput = root.getElementById('settingAutoJoin') as HTMLInputElement | null;
  const autoStreamInput = root.getElementById('settingAutoStream') as HTMLInputElement | null;
  const durationSelect = root.getElementById('settingDuration') as HTMLSelectElement | null;
  const cooldownSelect = root.getElementById('settingCooldown') as HTMLSelectElement | null;

  autoJoinInput?.addEventListener('change', () => {
    saveConfig({ autoJoin: autoJoinInput.checked });
    syncRunnerConfig();
    refreshModalValues(root);
  });

  autoStreamInput?.addEventListener('change', () => {
    saveConfig({ autoStream: autoStreamInput.checked });
    syncRunnerConfig();
    refreshModalValues(root);
  });

  durationSelect?.addEventListener('change', () => {
    const val = parseInt(durationSelect.value, 10);
    if (!isNaN(val) && val >= 1) {
      saveConfig({ streamDurationHours: val });
      syncRunnerConfig();
      refreshModalValues(root);
    }
  });

  cooldownSelect?.addEventListener('change', () => {
    const val = parseInt(cooldownSelect.value, 10);
    if (!isNaN(val) && val >= 1) {
      saveConfig({ cooldownMinutes: val });
      syncRunnerConfig();
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
    if (!getCachedAccess().canStream) {
      return;
    }
    const config = loadConfig();
    const channels = config.targetChannelIds || [];
    const isAnyActive = channels.some((ch) => isVoiceActive(ch)) || isStreamActive();

    if (isAnyActive) {
      console.log('[Discord Indonesia] Stopping stream and leaving voice channel via UI...');
      stopStreamCycle();
      stopGoLiveStream(config.guildId, config.channelId);
      leaveVoiceChannel();
    } else {
      console.log('[Discord Indonesia] Starting voice connection and stream via UI...');
      runAutomation(config).catch((err) => console.error('[Discord Indonesia] Join stream failed:', err));
    }

    refreshModalValues(root);
  });
}

function formatTime(ms: number): string {
  if (ms <= 0 || !Number.isFinite(ms)) return '00:00:00';
  const totalSecs = Math.floor(ms / 1000);
  const hours = Math.floor(totalSecs / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

async function refreshModalValues(root: ShadowRoot): Promise<void> {
  const config = loadConfig();
  const channels = config.targetChannelIds || [];

  const access = await checkDiscordIdAccess(config.guildId || undefined, channels);
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

  const btnRestart = root.getElementById('btnRestartStream') as HTMLButtonElement | null;
  const btnToggle = root.getElementById('btnToggleStream') as HTMLButtonElement | null;
  const btnToggleIcon = root.getElementById('btnToggleStreamIcon');
  const btnToggleText = root.getElementById('btnToggleStreamText');
  const autoJoinInput = root.getElementById('settingAutoJoin') as HTMLInputElement | null;
  const autoStreamInput = root.getElementById('settingAutoStream') as HTMLInputElement | null;
  const durationSelect = root.getElementById('settingDuration') as HTMLSelectElement | null;
  const cooldownSelect = root.getElementById('settingCooldown') as HTMLSelectElement | null;

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
  if (durationSelect) durationSelect.disabled = !isVerified;
  if (cooldownSelect) cooldownSelect.disabled = !isVerified;

  const isAnyVoiceActive = channels.some((ch) => isVoiceActive(ch)) || isStreamActive();
  if (btnToggleText && btnToggleIcon) {
    if (isAnyVoiceActive) {
      btnToggleIcon.innerHTML = icons.stop(15);
      btnToggleText.textContent = 'Stop Streaming';
    } else {
      btnToggleIcon.innerHTML = icons.broadcast(15);
      btnToggleText.textContent = 'Join Streaming';
    }
  }

  const statusValue = root.getElementById('statusLiveValue');
  const streaming = isStreamActive();
  const cycling = isStreamCycleActive();
  const sessionStats = getStreamSessionStats();

  if (statusValue) {
    if (!isVerified) {
      statusValue.textContent = !access.isMember ? 'Locked (Join Server First)' : 'Locked (Channels Missing)';
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
    if (sessionStats.phase === 'streaming' && sessionStats.streamStartTime) {
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
          countLabel.innerHTML = `${icons.users(13)} ${isVerified ? `${count} in room` : 'Locked'}`;
        }

        const dot = cardItem.querySelector('.channel-live-dot');
        if (dot) {
          dot.className = `channel-live-dot ${isFull || !isVerified ? 'dot-red' : 'dot-green'}`;
        }

        const joinBtn = cardItem.querySelector('.channel-join-btn') as HTMLButtonElement | null;
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

function startUiStatusPoller(root: ShadowRoot): void {
  setInterval(() => {
    refreshModalValues(root).catch(() => {});
  }, 1000);
}
