import { icons } from './icons';
import { discordIdInviteUrl } from '../config';

export function getBadgeUrl(): string {
  const datasetUrl = document.documentElement.dataset.discordBadgeUrl;
  if (datasetUrl) {
    return datasetUrl;
  }
  if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
    try {
      return chrome.runtime.getURL('assets/stream-badge.png');
    } catch {}
  }
  return 'assets/stream-badge.png';
}

export function renderCheckerModalHtml(): string {
  const badgeUrl = getBadgeUrl();

  return `
    <div class="discord-checker-overlay" id="discordCheckerOverlay">
      <div class="discord-checker-dialog" role="dialog" aria-modal="true" aria-labelledby="discord-checker-title">
        <button class="discord-checker-close-btn" id="discordCheckerCloseBtn" aria-label="Close">
          ${icons.close(18)}
        </button>

        <div class="discord-checker-header">
          <div class="discord-checker-badge-wrapper">
            <img class="discord-checker-badge-img" src="${badgeUrl}" alt="Discord ID Badge" draggable="false" />
          </div>
          <h1 class="discord-checker-title" id="discord-checker-title">Join Discord Indonesia First</h1>
          <p class="discord-checker-subtitle">Badge Streaming Farming</p>
        </div>

        <div class="discord-checker-content">
          <p>
            You must join the official <strong>Discord Indonesia</strong> server to activate voice streaming and badge farming.
          </p>
          <p class="discord-checker-hint">
            If you have already joined or encounter connection issues, click <strong>Restart</strong> to reload your Discord session.
          </p>
        </div>

        <footer class="discord-checker-footer">
          <button class="btn btn-checker-secondary" id="btnCheckerRestart" type="button">
            <span>${icons.refresh(14)}</span>
            <span>Restart</span>
          </button>
          <a href="${discordIdInviteUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-checker-primary" id="btnCheckerJoin">
            <span>${icons.discord(16, '#ffffff')}</span>
            <span>Join Discord ID</span>
            <span>${icons.externalLink(12)}</span>
          </a>
        </footer>
      </div>
    </div>
  `;
}
