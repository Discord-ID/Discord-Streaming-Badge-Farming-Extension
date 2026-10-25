(() => {
  const DS = (window.DiscordStreamer = window.DiscordStreamer || {});

  function isStreamActive() {
    const streamStore = typeof DS.getApplicationStreamStore === 'function' ? DS.getApplicationStreamStore() : null;
    if (streamStore) {
      try {
        if (typeof streamStore.isSelfStreaming === 'function') {
          const isSelf = streamStore.isSelfStreaming();
          if (typeof isSelf === 'boolean') return isSelf;
        }
        if (typeof streamStore.getCurrentUserActiveStream === 'function') {
          const activeStream = streamStore.getCurrentUserActiveStream();
          if (activeStream) return true;
        }
      } catch {}
    }

    const allButtons = Array.from(document.querySelectorAll('button'));
    const hasStopButton = allButtons.some((btn) => {
      const label = (btn.getAttribute('aria-label') || '').toLowerCase();
      const title = (btn.getAttribute('title') || '').toLowerCase();
      const text = (btn.textContent || '').toLowerCase();
      return (
        label.includes('stop streaming') ||
        title.includes('stop streaming') ||
        text.includes('stop streaming') ||
        label.includes('berhenti streaming')
      );
    });

    return hasStopButton;
  }

  function dismissDownloadModal() {
    const modal = document.querySelector('div[role="dialog"]');
    if (modal) {
      const text = (modal.textContent || '').toLowerCase();
      if (text.includes('download the discord desktop') || text.includes('get the app') || text.includes('unduh')) {
        console.log('[Discord Indonesia] Dismissing download app modal on mobile browser...');
        const closeBtn =
          modal.querySelector('button[aria-label="Close" i]') ||
          modal.querySelector('button');
        closeBtn?.click();
        return true;
      }
    }
    return false;
  }

  function clickShareScreenButton() {
    if (isStreamActive()) {
      return true;
    }

    dismissDownloadModal();

    const allButtons = Array.from(document.querySelectorAll('button'));

    const shareButton =
      document.querySelector('button[aria-label*="Share Your Screen" i]') ||
      document.querySelector('button[aria-label*="Share Screen" i]') ||
      allButtons.find((btn) => {
        const label = (btn.getAttribute('aria-label') || '').toLowerCase().trim();
        const title = (btn.getAttribute('title') || '').toLowerCase().trim();
        const text = (btn.textContent || '').toLowerCase().trim();
        if (label.includes('stop') || title.includes('stop') || text.includes('stop')) return false;
        return (
          label === 'share your screen' ||
          label === 'share screen' ||
          title === 'share your screen' ||
          title === 'share screen' ||
          (label.includes('share') && label.includes('screen')) ||
          (title.includes('share') && title.includes('screen')) ||
          (text.includes('share') && text.includes('screen'))
        );
      });

    if (shareButton) {
      console.log('[Discord Indonesia] Clicking Share Your Screen button');
      shareButton.click();

      const tryConfirmModal = (attemptsLeft) => {
        if (dismissDownloadModal()) return;

        const modal = document.querySelector('div[role="dialog"]') || document.querySelector('[class*="modal"]');
        if (modal) {
          const confirmButton =
            modal.querySelector('button[type="submit"]') ||
            Array.from(modal.querySelectorAll('button')).find((b) =>
              /go live|stream|share/i.test(b.textContent || '') ||
              /go live|stream|share/i.test(b.getAttribute('aria-label') || '')
            );

          if (confirmButton) {
            console.log('[Discord Indonesia] Confirming Go Live dialog button');
            confirmButton.click();
            return;
          }
        }

        if (attemptsLeft > 0) {
          setTimeout(() => tryConfirmModal(attemptsLeft - 1), 300);
        }
      };

      setTimeout(() => tryConfirmModal(12), 300);
      return true;
    }

    return false;
  }

  async function triggerGoLiveStream(guildId, channelId, maxWaitMs = 35000) {
    const resolvedGuildId = guildId || DS.defaultGuildId;
    const start = Date.now();
    console.log('[Discord Indonesia] Waiting for Share Your Screen button to be available...');

    let lastNavTime = 0;

    while (Date.now() - start < maxWaitMs) {
      if (isStreamActive()) {
        console.log('[Discord Indonesia] Screenshare verified active');
        return true;
      }

      dismissDownloadModal();

      const inVoice = typeof DS.isVoiceActive === 'function' ? DS.isVoiceActive(channelId) : false;
      if (!inVoice && !window.location.pathname.includes(channelId) && Date.now() - lastNavTime >= 2000) {
        lastNavTime = Date.now();
        if (typeof DS.navigateToVoiceChannel === 'function') {
          DS.navigateToVoiceChannel(resolvedGuildId, channelId);
        }
      }

      const clicked = clickShareScreenButton();
      if (clicked) {
        for (let i = 0; i < 20; i++) {
          await new Promise((r) => setTimeout(r, 500));
          if (isStreamActive()) {
            console.log('[Discord Indonesia] Screenshare verified active');
            return true;
          }
        }
      }

      await new Promise((r) => setTimeout(r, 600));
    }

    console.warn('[Discord Indonesia] Share Your Screen button wait timeout');
    return false;
  }

  function stopGoLiveStream(guildId, channelId) {
    const allButtons = Array.from(document.querySelectorAll('button'));
    const stopButton = allButtons.find((btn) => {
      const label = (btn.getAttribute('aria-label') || '').toLowerCase().trim();
      const title = (btn.getAttribute('title') || '').toLowerCase().trim();
      const text = (btn.textContent || '').toLowerCase().trim();
      return (
        label.includes('stop streaming') ||
        title.includes('stop streaming') ||
        text.includes('stop streaming')
      );
    });

    if (stopButton) {
      console.log('[Discord Indonesia] Clicking Stop Streaming button');
      stopButton.click();
      return;
    }

    const userStore = typeof DS.getUserStore === 'function' ? DS.getUserStore() : null;
    const authStore = typeof DS.getAuthenticationStore === 'function' ? DS.getAuthenticationStore() : null;
    const userId = userStore?.getCurrentUser()?.id || authStore?.getId() || '';
    const resolvedGuildId = guildId || DS.defaultGuildId;
    const streamKey = `guild:${resolvedGuildId}:${channelId}:${userId}`;

    DS.safeDispatch(DS.fluxActions.streamStop, {
      streamKey,
    });
  }

  DS.isStreamActive = isStreamActive;
  DS.dismissDownloadModal = dismissDownloadModal;
  DS.clickShareScreenButton = clickShareScreenButton;
  DS.triggerGoLiveStream = triggerGoLiveStream;
  DS.stopGoLiveStream = stopGoLiveStream;
})();
