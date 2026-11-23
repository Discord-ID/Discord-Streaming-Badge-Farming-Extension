(() => {
  const DS = (window.DiscordStreamer = window.DiscordStreamer || {});

  let originalGetDisplayMedia = null;
  let activeStreamProvider = null;

  function installDisplayMediaHook(streamProvider) {
    activeStreamProvider = streamProvider;

    if (typeof navigator.mediaDevices === 'undefined') {
      try {
        navigator.mediaDevices = {};
      } catch {}
    }

    if (!navigator.mediaDevices) {
      console.error('[Discord Indonesia] navigator.mediaDevices unavailable');
      return;
    }

    if (!originalGetDisplayMedia && typeof navigator.mediaDevices.getDisplayMedia === 'function') {
      originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);
    }

    const hookFunction = async function (constraints) {
      if (activeStreamProvider) {
        console.log('[Discord Indonesia] getDisplayMedia intercepted: injecting virtual stream (480p 60fps)');
        try {
          const stream = await activeStreamProvider();
          return stream;
        } catch (err) {
          console.error('[Discord Indonesia] Virtual stream error, falling back to native:', err);
        }
      }

      if (originalGetDisplayMedia) {
        return originalGetDisplayMedia(constraints);
      }

      throw new Error('No native getDisplayMedia implementation');
    };

    try {
      Object.defineProperty(navigator.mediaDevices, 'getDisplayMedia', {
        value: hookFunction,
        writable: true,
        configurable: true,
      });
    } catch {
      navigator.mediaDevices.getDisplayMedia = hookFunction;
    }

    console.log('[Discord Indonesia] Universal display media polyfill active');
  }

  DS.installDisplayMediaHook = installDisplayMediaHook;
})();
