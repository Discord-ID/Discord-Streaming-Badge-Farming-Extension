(() => {
  const DS = (window.DiscordStreamer = window.DiscordStreamer || {});

  function getBadgeUrl() {
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

  function renderCheckerModalHtml() {
    const badgeUrl = getBadgeUrl();
    const icons = DS.icons || {};
    const inviteUrl = DS.discordIdInviteUrl || 'https://discord.gg/idn';

    return `
      <div class="discord-checker-overlay" id="discordCheckerOverlay">
        <div class="discord-checker-dialog" role="dialog" aria-modal="true" aria-labelledby="discord-checker-title">
          <button class="discord-checker-close-btn" id="discordCheckerCloseBtn" aria-label="Close">
            ${typeof icons.close === 'function' ? icons.close(18) : ''}
          </button>

          <div class="discord-checker-header">
            <div class="discord-checker-badge-wrapper">
              <img class="discord-checker-badge-img" src="${badgeUrl}" alt="Discord Badge" draggable="false" />
            </div>
            <h1 class="discord-checker-title" id="discord-checker-title">Discord Streaming Badge Extension</h1>
            <p class="discord-checker-subtitle">Badge Streaming Farming</p>
          </div>

          <div class="discord-checker-content">
            <p>
              Preparing your environment for automated badge farming.
            </p>

            <div class="checker-verify-card">
              <div class="verify-item pass" id="verifyItemAuth">
                <span class="verify-item-bullet">•</span>
                <span class="verify-item-text">Discord Client Connection</span>
                <span class="verify-item-state">Ready</span>
              </div>
              <div class="verify-item fail" id="verifyItemMember">
                <span class="verify-item-bullet">•</span>
                <span class="verify-item-text">Discord Indonesia</span>
                <span class="verify-item-state">Required</span>
              </div>
              <div class="verify-item fail" id="verifyItemVoice">
                <span class="verify-item-bullet">•</span>
                <span class="verify-item-text">Voice Streaming Channels</span>
                <span class="verify-item-state">Pending</span>
              </div>
              <div class="verify-item fail" id="verifyItemPerm">
                <span class="verify-item-bullet">•</span>
                <span class="verify-item-text">Go Live Video Stream</span>
                <span class="verify-item-state">Pending</span>
              </div>
            </div>

            <p class="discord-checker-hint">
              Join Discord Indonesia to unlock the farming panel automatically.
            </p>
          </div>

          <footer class="discord-checker-footer">
            <button class="btn btn-checker-secondary" id="btnCheckerRestart" type="button" title="Reload Discord Tab">
              <span>${typeof icons.refresh === 'function' ? icons.refresh(14) : ''}</span>
              <span>Restart</span>
            </button>
            <a href="${inviteUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-checker-primary" id="btnCheckerJoin">
              <span>${typeof icons.discord === 'function' ? icons.discord(16, '#ffffff') : ''}</span>
              <span>Join Server</span>
            </a>
          </footer>
        </div>
      </div>
    `;
  }

  DS.renderCheckerModalHtml = renderCheckerModalHtml;
})();
