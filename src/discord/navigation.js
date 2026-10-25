(() => {
  const DS = (window.DiscordStreamer = window.DiscordStreamer || {});

  function navigateToVoiceChannel(guildId, channelId) {
    if (!channelId || typeof channelId !== 'string') return;
    const targetPath = `/channels/${guildId}/${channelId}`;

    if (window.location.pathname !== targetPath) {
      DS.safeDispatch('CHANNEL_SELECT', {
        guildId: String(guildId),
        channelId: String(channelId),
      });

      try {
        const router = DS.findModuleByProps('transitionTo');
        if (router?.transitionTo) {
          router.transitionTo(targetPath);
        }
      } catch {}
    }

    const channelLink = document.querySelector(`a[href*="${channelId}"]`);
    if (channelLink) {
      channelLink.click();
    }
  }

  DS.navigateToVoiceChannel = navigateToVoiceChannel;
})();
