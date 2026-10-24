import { getWebpackRequire } from './webpack';
import type { RestClient } from '../types/restapi';

let cachedClient: RestClient | null = null;

export function getRestClient(): RestClient | null {
  if (cachedClient) return cachedClient;

  const wp = getWebpackRequire();
  if (!wp) return null;

  try {
    if (wp.m) {
      const httpEntry = Object.entries(wp.m).find(([_, fn]) =>
        typeof fn === 'function' && fn.toString().includes('HTTPUtils')
      );
      if (httpEntry) {
        const exp = wp(httpEntry[0]) as Record<string, unknown>;
        const match = Object.values(exp).find(
          (e) =>
            e &&
            typeof (e as Record<string, unknown>).get === 'function' &&
            typeof (e as Record<string, unknown>).post === 'function' &&
            typeof (e as Record<string, unknown>).del === 'function'
        ) || exp;

        if (match && typeof (match as RestClient).get === 'function') {
          cachedClient = match as RestClient;
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
        (mod.exports as { default?: unknown })?.default,
        (mod.exports as { Bo?: unknown })?.Bo,
        (mod.exports as { tn?: unknown })?.tn,
        ...(typeof mod.exports === 'object' ? Object.values(mod.exports) : []),
      ];

      for (const candidate of candidates) {
        if (
          candidate &&
          typeof (candidate as RestClient).get === 'function' &&
          typeof (candidate as RestClient).post === 'function' &&
          typeof (candidate as RestClient).del === 'function'
        ) {
          cachedClient = candidate as RestClient;
          return cachedClient;
        }
      }
    }
  }

  return null;
}
