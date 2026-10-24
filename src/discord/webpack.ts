type ModuleFilter = (mod: unknown) => boolean;

export interface WebpackReq {
  (id: string | number): unknown;
  m: Record<string, Function>;
  c: Record<string, { exports: unknown }>;
}

let cachedReq: WebpackReq | null = null;

export function isI18nProxy(target: unknown): boolean {
  if (!target || typeof target !== 'object') return false;
  try {
    return (target as Record<string, unknown>).__discord_anti_i18n_probe__ !== undefined;
  } catch {
    return false;
  }
}

export function getWebpackRequire(): WebpackReq | null {
  if (cachedReq) return cachedReq;

  const w = window as unknown as { webpackChunkdiscord_app?: { push: Function; pop?: Function } };
  if (!w.webpackChunkdiscord_app || typeof w.webpackChunkdiscord_app.push !== 'function') {
    return null;
  }

  try {
    let reqInstance: WebpackReq | null = null;
    const pushResult = w.webpackChunkdiscord_app.push([
      [Symbol('extractor')],
      {},
      (r: WebpackReq) => {
        reqInstance = r;
        return r;
      },
    ]);

    if (typeof w.webpackChunkdiscord_app.pop === 'function') {
      try {
        w.webpackChunkdiscord_app.pop();
      } catch {}
    }

    const req = (pushResult as WebpackReq) || reqInstance;
    if (!req || (!req.c && !req.m)) {
      return null;
    }

    cachedReq = req;
    return cachedReq;
  } catch {
    return null;
  }
}

export function findModule<T = unknown>(filter: ModuleFilter): T | null {
  const req = getWebpackRequire();
  if (!req) return null;

  if (req.c) {
    for (const mod of Object.values(req.c)) {
      if (!mod?.exports) continue;
      const exports = mod.exports;

      if (!isI18nProxy(exports) && filter(exports)) return exports as T;

      const def = (exports as { default?: unknown })?.default;
      if (def && !isI18nProxy(def) && filter(def)) return def as T;

      if (typeof exports === 'object') {
        const exp = exports as Record<string, unknown>;
        if (exp.Z && !isI18nProxy(exp.Z) && filter(exp.Z)) return exp.Z as T;
        if (exp.ZP && !isI18nProxy(exp.ZP) && filter(exp.ZP)) return exp.ZP as T;
        if (exp.Ay && !isI18nProxy(exp.Ay) && filter(exp.Ay)) return exp.Ay as T;
        if (exp.A && !isI18nProxy(exp.A) && filter(exp.A)) return exp.A as T;

        for (const sub of Object.values(exports)) {
          if (
            sub &&
            (typeof sub === 'object' || typeof sub === 'function') &&
            !isI18nProxy(sub) &&
            filter(sub)
          ) {
            return sub as T;
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
            return res as T;
          }
        }
      } catch {}
    }
  }

  return null;
}

export function findModuleByProps<T = unknown>(...props: string[]): T | null {
  return findModule<T>((mod) => {
    if (!mod || typeof mod !== 'object' || isI18nProxy(mod)) return false;
    return props.every((p) => p in (mod as Record<string, unknown>));
  });
}
