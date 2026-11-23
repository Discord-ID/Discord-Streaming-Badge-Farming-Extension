(() => {
  const DS = (window.DiscordStreamer = window.DiscordStreamer || {});

  let cachedReq = null;

  function isValidModule(target) {
    if (!target || typeof target !== 'object') return false;
    if ('$$baseObject' in target || '$$loader' in target) return false;
    return true;
  }

  function getWebpackRequire() {
    if (cachedReq) return cachedReq;

    const w = window;
    if (!w.webpackChunkdiscord_app || typeof w.webpackChunkdiscord_app.push !== 'function') {
      return null;
    }

    try {
      let reqInstance = null;
      const pushResult = w.webpackChunkdiscord_app.push([
        [Symbol('extractor')],
        {},
        (r) => {
          reqInstance = r;
          return r;
        },
      ]);

      if (typeof w.webpackChunkdiscord_app.pop === 'function') {
        try {
          w.webpackChunkdiscord_app.pop();
        } catch {}
      }

      const req = pushResult || reqInstance;
      if (!req || (!req.c && !req.m)) {
        return null;
      }

      cachedReq = req;
      return cachedReq;
    } catch {
      return null;
    }
  }

  function findModule(filter) {
    const req = getWebpackRequire();
    if (!req) return null;

    if (req.c) {
      for (const mod of Object.values(req.c)) {
        try {
          if (!mod?.exports) continue;
          const exports = mod.exports;

          if (isValidModule(exports) && filter(exports)) return exports;

          const def = exports?.default;
          if (isValidModule(def) && filter(def)) return def;

          if (typeof exports === 'object') {
            const namedCandidates = [exports.Z, exports.ZP, exports.Ay, exports.A];
            for (const cand of namedCandidates) {
              if (isValidModule(cand) && filter(cand)) return cand;
            }

            for (const sub of Object.values(exports)) {
              if (isValidModule(sub) && filter(sub)) {
                return sub;
              }
            }
          }
        } catch {}
      }
    }

    if (req.m) {
      for (const [id, fn] of Object.entries(req.m)) {
        try {
          if (filter(fn)) {
            const res = req(id);
            if (isValidModule(res)) {
              return res;
            }
          }
        } catch {}
      }
    }

    return null;
  }

  function findModuleByProps(...props) {
    return findModule((mod) => {
      if (!isValidModule(mod)) return false;
      return props.every((p) => p in mod);
    });
  }

  DS.getWebpackRequire = getWebpackRequire;
  DS.findModule = findModule;
  DS.findModuleByProps = findModuleByProps;
})();
