(() => {
  const DS = (window.DiscordStreamer = window.DiscordStreamer || {});

  let cachedDispatcher = null;

  function getDispatcher() {
    if (cachedDispatcher) return cachedDispatcher;

    const candidate = DS.findModule((mod) => {
      if (!mod || typeof mod !== 'object') return false;
      const m = mod;
      const proto = m?.__proto__;

      const hasDispatch = typeof m.dispatch === 'function';
      const hasFlush =
        typeof m.flushWaitQueue === 'function' ||
        typeof proto?.flushWaitQueue === 'function';
      const hasInternalState =
        m._actionHandlers !== undefined ||
        m._subscriptions !== undefined ||
        m._currentDispatchActionType !== undefined;

      return hasDispatch && (hasFlush || hasInternalState);
    });

    if (candidate) {
      cachedDispatcher = candidate;
      return cachedDispatcher;
    }

    return null;
  }

  function safeDispatch(type, data = {}) {
    const dispatcher = getDispatcher();
    if (!dispatcher) {
      console.warn('[Discord Indonesia] Dispatcher not found');
      return;
    }

    const payload = { type, ...data };
    const isDisp = typeof dispatcher.isDispatching === 'function' ? dispatcher.isDispatching() : false;

    if (isDisp) {
      setTimeout(() => {
        try {
          dispatcher.dispatch(payload);
        } catch (err) {
          console.error('[Discord Indonesia] Deferred dispatch failed:', err);
        }
      }, 10);
    } else {
      try {
        dispatcher.dispatch(payload);
      } catch (err) {
        console.error('[Discord Indonesia] Dispatch failed:', err);
      }
    }
  }

  DS.getDispatcher = getDispatcher;
  DS.safeDispatch = safeDispatch;
})();
