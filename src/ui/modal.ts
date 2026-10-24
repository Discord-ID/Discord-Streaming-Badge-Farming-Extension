import { icons } from './icons';
import { loadConfig, discordIdInviteUrl } from '../config';
import { getVoiceChannelUserCount, getVoiceChannelName, isVoiceChannelFull } from '../discord/voiceChannels';
import { isVoiceActive } from '../automation/watcher';
import { getCachedAccess } from '../discord/userAccess';
import { isStreamActive } from '../discord/streams';

export function getIconUrl(): string {
  const datasetUrl = document.documentElement.dataset.discordIconUrl;
  if (datasetUrl) {
    return datasetUrl;
  }
  if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
    try {
      return chrome.runtime.getURL('assets/icon.png');
    } catch {}
  }
  return 'assets/icon.png';
}

export function renderModalHtml(): string {
  const config = loadConfig();
  const channels = config.targetChannelIds || [];
  const access = getCachedAccess();
  const iconUrl = getIconUrl();

  const isVerified = access.canStream;

  return `
    <div class="discord-id-overlay" id="discordIdOverlay">
      <div class="discord-id-modal" role="dialog" aria-modal="true">
        <button class="modal-close-btn" id="modalCloseBtn" aria-label="Close Settings">
          ${icons.close(16)}
        </button>

        <div class="modal-sidebar">
          <div>
            <div class="sidebar-header">
              <div class="sidebar-logo">
                <img class="sidebar-logo-img" src="${iconUrl}" alt="Discord ID" draggable="false" />
              </div>
              <div class="sidebar-title-group">
                <span class="sidebar-title-main">Discord ID</span>
                <span class="sidebar-title-sub">Badge Streaming Farming</span>
              </div>
            </div>

            <div class="sidebar-nav">
              <div class="nav-item active" data-tab="dashboard">
                <span class="nav-icon">${icons.dashboard(16)}</span>
                <span>Dashboard</span>
              </div>

              <div class="nav-item" data-tab="settings">
                <span class="nav-icon">${icons.gear(16)}</span>
                <span>Settings</span>
              </div>
            </div>
          </div>

          <div class="sidebar-footer">
            <a href="${discordIdInviteUrl}" target="_blank" rel="noopener noreferrer" class="join-discord-card" id="sidebarJoinCard">
              <div class="join-discord-icon">
                ${icons.discord(16, '#ffffff')}
              </div>
              <div class="join-discord-text">
                <span class="join-discord-title">Join Discord ID</span>
                <span class="join-discord-url">discord.gg/idn</span>
              </div>
              <span style="margin-left:auto;color:#949ba4;">${icons.externalLink(13)}</span>
            </a>
          </div>
        </div>

        <div class="modal-content-area">
          <div class="tab-page active" id="tab-dashboard">
            <div>
              <h2 class="page-title">Dashboard</h2>
              <p class="page-subtitle">Live stream status and voice rooms</p>
            </div>

            <div class="status-row">
              <div class="status-mini-box highlight">
                <div class="mini-icon">${icons.broadcast(18, '#ffffff')}</div>
                <div class="mini-details">
                  <span class="mini-label">Live Status</span>
                  <span class="mini-value" id="statusLiveValue">${isVerified ? 'Checking...' : 'Locked (Join Server First)'}</span>
                </div>
              </div>

              <div class="status-mini-box">
                <div class="mini-icon">${icons.desktop(18, '#ffffff')}</div>
                <div class="mini-details">
                  <span class="mini-label">Stream Quality</span>
                  <span class="mini-value">480p • 60 FPS</span>
                </div>
              </div>
            </div>

            <div class="stats-grid">
              <div class="stats-card">
                <div class="stats-icon">${icons.clock(16, '#ffffff')}</div>
                <div class="stats-details">
                  <span class="stats-label">Stream Duration</span>
                  <span class="stats-value" id="statDurationValue">00:00:00</span>
                </div>
              </div>

              <div class="stats-card">
                <div class="stats-icon">${icons.desktop(16, '#ffffff')}</div>
                <div class="stats-details">
                  <span class="stats-label">Session Target</span>
                  <span class="stats-value" id="statSessionTarget">${config.streamDurationHours || 10}h</span>
                </div>
              </div>

              <div class="stats-card">
                <div class="stats-icon">${icons.refresh(15, '#ffffff')}</div>
                <div class="stats-details">
                  <span class="stats-label">Next Cooldown</span>
                  <span class="stats-value" id="statCooldownValue">--:--:--</span>
                </div>
              </div>
            </div>

            <div class="content-card">
              <div style="font-size:12px;font-weight:700;color:#949ba4;text-transform:uppercase;letter-spacing:0.04em;">
                Voice Channel Available
              </div>

              <div class="channel-list" id="channelListContainer">
                ${channels
                  .map((channelId) => {
                    const count = isVerified ? getVoiceChannelUserCount(channelId) : 0;
                    const active = isVerified && isVoiceActive(channelId);
                    const name = getVoiceChannelName(channelId);
                    const isFull = isVerified && isVoiceChannelFull(channelId, count);
                    return `
                      <div class="channel-item ${active ? 'active' : ''}">
                        <div class="channel-item-left">
                          <span style="color:${active ? '#ff858d' : '#949ba4'};">${icons.headphones(16)}</span>
                          <span class="channel-name-text">${name}</span>
                          <span class="channel-count-text">${icons.users(13)} ${isVerified ? `${count} in room` : 'Locked'}</span>
                        </div>
                        <div class="channel-item-right">
                          <span class="channel-live-dot ${isFull || !isVerified ? 'dot-red' : 'dot-green'}"></span>
                          <button class="channel-join-btn ${active ? 'active' : isFull || !isVerified ? 'disabled' : ''}" data-channel-id="${channelId}" ${active || isFull || !isVerified ? 'disabled' : ''}>
                            ${active ? 'Active' : isFull ? 'Full' : 'Join'}
                          </button>
                        </div>
                      </div>
                    `;
                  })
                  .join('')}
              </div>
            </div>

            <div class="action-buttons-row">
              <button class="btn btn-primary-red ${!isVerified ? 'disabled' : ''}" id="btnRestartStream" ${!isVerified ? 'disabled' : ''} title="Restart Discord & reload extension">
                <span>${icons.refresh(15)}</span>
                <span>Restart</span>
              </button>

              <button class="btn btn-primary-red ${!isVerified ? 'disabled' : ''}" id="btnToggleStream" ${!isVerified ? 'disabled' : ''}>
                <span id="btnToggleStreamIcon">${isStreamActive() ? icons.stop(15) : icons.broadcast(15)}</span>
                <span id="btnToggleStreamText">${isStreamActive() ? 'Stop Streaming' : 'Join Streaming'}</span>
              </button>
            </div>
          </div>

          <div class="tab-page" id="tab-settings">
            <div>
              <h2 class="page-title">Streaming Settings</h2>
              <p class="page-subtitle">Stream settings & cooldown interval</p>
            </div>

            <div class="content-card">
              <div class="setting-item">
                <div class="setting-texts">
                  <span class="setting-title">Auto Join Voice Channel</span>
                  <span class="setting-desc">Auto connect to the quietest voice room</span>
                </div>
                <label class="switch ${!isVerified ? 'disabled' : ''}">
                  <input type="checkbox" id="settingAutoJoin" ${config.autoJoin ? 'checked' : ''} ${!isVerified ? 'disabled' : ''} />
                  <span class="slider"></span>
                </label>
              </div>

              <div class="setting-item" style="border-top:1px solid rgba(255,255,255,0.05);padding-top:12px;">
                <div class="setting-texts">
                  <span class="setting-title">Auto Screenshare (Go Live)</span>
                  <span class="setting-desc">Auto start screenshare after joining voice</span>
                </div>
                <label class="switch ${!isVerified ? 'disabled' : ''}">
                  <input type="checkbox" id="settingAutoStream" ${config.autoStream ? 'checked' : ''} ${!isVerified ? 'disabled' : ''} />
                  <span class="slider"></span>
                </label>
              </div>

              <div class="setting-item" style="border-top:1px solid rgba(255,255,255,0.05);padding-top:12px;">
                <div class="setting-texts">
                  <span class="setting-title">Session Duration (Hours)</span>
                  <span class="setting-desc">How long to stream before taking a break</span>
                </div>
                <select class="setting-select-menu" id="settingDuration" ${!isVerified ? 'disabled' : ''}>
                  ${[1, 2, 4, 6, 8, 10, 12, 16, 24]
                    .map(
                      (h) =>
                        `<option value="${h}" ${(Number(config.streamDurationHours) || 10) === h ? 'selected' : ''}>${h} Hour${h > 1 ? 's' : ''}</option>`
                    )
                    .join('')}
                </select>
              </div>

              <div class="setting-item" style="border-top:1px solid rgba(255,255,255,0.05);padding-top:12px;">
                <div class="setting-texts">
                  <span class="setting-title">Cooldown Interval (Minutes)</span>
                  <span class="setting-desc">Rest time before starting the next stream</span>
                </div>
                <select class="setting-select-menu" id="settingCooldown" ${!isVerified ? 'disabled' : ''}>
                  ${[1, 2, 3, 5, 10, 15, 30]
                    .map(
                      (m) =>
                        `<option value="${m}" ${(Number(config.cooldownMinutes) || 5) === m ? 'selected' : ''}>${m} Minute${m > 1 ? 's' : ''}</option>`
                    )
                    .join('')}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
