(() => {
  const DS = (window.DiscordStreamer = window.DiscordStreamer || {});

  function selectVoiceChannel(guildId, channelId) {
    if (!channelId || typeof channelId !== 'string') return;
    const resolvedGuildId = guildId || DS.defaultGuildId;

    const channelLink = document.querySelector(`a[href*="${channelId}"]`);
    if (channelLink) {
      channelLink.click();
    }

    DS.safeDispatch(DS.fluxActions.voiceChannelSelect, {
      guildId: resolvedGuildId,
      channelId: String(channelId),
      video: false,
      currentVoiceChannelId: null,
    });

    if (typeof DS.navigateToVoiceChannel === 'function') {
      DS.navigateToVoiceChannel(resolvedGuildId, channelId);
    }
  }

  function leaveVoiceChannel() {
    const disconnectBtn = document.querySelector('button[aria-label*="Disconnect" i]');
    if (disconnectBtn) {
      disconnectBtn.click();
      return;
    }

    DS.safeDispatch(DS.fluxActions.voiceChannelSelect, {
      channelId: null,
    });
  }

  DS.selectVoiceChannel = selectVoiceChannel;
  DS.leaveVoiceChannel = leaveVoiceChannel;
})();
