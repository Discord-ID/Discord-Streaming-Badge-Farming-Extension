(() => {
  const DS = (window.DiscordStreamer = window.DiscordStreamer || {});

  let cachedClient = null;

  function getRestClient() {
    if (cachedClient) return cachedClient;

    const wp = DS.getWebpackRequire();
    if (!wp) return null;

    try {
      if (wp.m) {
        const httpEntry = Object.entries(wp.m).find(([_, fn]) =>
          typeof fn === 'function' && fn.toString().includes('HTTPUtils')
        );
        if (httpEntry) {
          const exp = wp(httpEntry[0]);
          const match =
            Object.values(exp).find(
              (e) =>
                e &&
                typeof e.get === 'function' &&
                typeof e.post === 'function' &&
                typeof e.del === 'function'
            ) || exp;

          if (match && typeof match.get === 'function') {
            cachedClient = match;
            return cachedClient;
          }
        }
      }
    } catch {}

    if (wp.c) {
      for (const mod of Object.values(wp.c)) {
        if (!mod?.exports) continue;
        const candidates = [
          mod.exports,
          mod.exports?.default,
          mod.exports?.Bo,
          mod.exports?.tn,
          ...(typeof mod.exports === 'object' ? Object.values(mod.exports) : []),
        ];

        for (const candidate of candidates) {
          if (
            candidate &&
            typeof candidate.get === 'function' &&
            typeof candidate.post === 'function' &&
            typeof candidate.del === 'function'
          ) {
            cachedClient = candidate;
            return cachedClient;
          }
        }
      }
    }

    return null;
  }

  DS.getRestClient = getRestClient;
})();
