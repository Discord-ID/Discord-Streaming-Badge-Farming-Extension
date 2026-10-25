(() => {
  const DS = (window.DiscordStreamer = window.DiscordStreamer || {});

  let cachedReq = null;

  function isI18nProxy(target) {
    if (!target || typeof target !== 'object') return false;
    try {
      return target.__discord_anti_i18n_probe__ !== undefined;
    } catch {
      return false;
    }
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
        if (!mod?.exports) continue;
        const exports = mod.exports;

        if (!isI18nProxy(exports) && filter(exports)) return exports;

        const def = exports?.default;
        if (def && !isI18nProxy(def) && filter(def)) return def;

        if (typeof exports === 'object') {
          if (exports.Z && !isI18nProxy(exports.Z) && filter(exports.Z)) return exports.Z;
          if (exports.ZP && !isI18nProxy(exports.ZP) && filter(exports.ZP)) return exports.ZP;
          if (exports.Ay && !isI18nProxy(exports.Ay) && filter(exports.Ay)) return exports.Ay;
          if (exports.A && !isI18nProxy(exports.A) && filter(exports.A)) return exports.A;

          for (const sub of Object.values(exports)) {
            if (
              sub &&
              (typeof sub === 'object' || typeof sub === 'function') &&
              !isI18nProxy(sub) &&
              filter(sub)
            ) {
              return sub;
            }
          }
        }
      }
    }

    if (req.m) {
      for (const [id, fn] of Object.entries(req.m)) {
        try {
          if (filter(fn)) {
            const res = req(id);
            if (res && !isI18nProxy(res)) {
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
      if (!mod || typeof mod !== 'object' || isI18nProxy(mod)) return false;
      return props.every((p) => p in mod);
    });
  }

  DS.isI18nProxy = isI18nProxy;
  DS.getWebpackRequire = getWebpackRequire;
  DS.findModule = findModule;
  DS.findModuleByProps = findModuleByProps;
})();
