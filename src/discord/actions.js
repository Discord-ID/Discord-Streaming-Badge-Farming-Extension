(() => {
  const DS = (window.DiscordStreamer = window.DiscordStreamer || {});

  function selectVoiceChannel(guildId, channelId, startStream = false) {
    if (!channelId || typeof channelId !== 'string') return;
    const resolvedGuildId = guildId || DS.defaultGuildId;

    const voiceActions = typeof DS.getVoiceActions === 'function' ? DS.getVoiceActions() : null;
    if (voiceActions && typeof voiceActions.selectVoiceChannel === 'function') {
      try {
        voiceActions.selectVoiceChannel(channelId, false, Boolean(startStream));
      } catch {}
    }

    DS.safeDispatch(DS.fluxActions.voiceChannelSelect, {
      guildId: resolvedGuildId,
      channelId: String(channelId),
      video: false,
      stream: Boolean(startStream),
      currentVoiceChannelId: null,
    });

    if (typeof DS.navigateToVoiceChannel === 'function') {
      DS.navigateToVoiceChannel(resolvedGuildId, channelId);
    }
  }

  function leaveVoiceChannel() {
    const voiceActions = typeof DS.getVoiceActions === 'function' ? DS.getVoiceActions() : null;
    if (voiceActions && typeof voiceActions.selectVoiceChannel === 'function') {
      try {
        voiceActions.selectVoiceChannel(null);
      } catch {}
    }

    DS.safeDispatch(DS.fluxActions.voiceChannelSelect, {
      channelId: null,
    });
  }

  DS.selectVoiceChannel = selectVoiceChannel;
  DS.leaveVoiceChannel = leaveVoiceChannel;
})();
