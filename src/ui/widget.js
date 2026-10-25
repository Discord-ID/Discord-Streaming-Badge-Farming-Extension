(() => {
  const DS = (window.DiscordStreamer = window.DiscordStreamer || {});

  function renderWidgetHtml() {
    const broadcastIcon = typeof DS.icons?.broadcast === 'function' ? DS.icons.broadcast(22, '#ffffff') : '';
    return `
      <div class="discord-id-trigger" id="discordIdTrigger" title="Discord ID Streamer Panel">
        <div class="status-dot"></div>
        <div class="trigger-icon">
          ${broadcastIcon}
        </div>
      </div>
    `;
  }

  DS.renderWidgetHtml = renderWidgetHtml;
})();
