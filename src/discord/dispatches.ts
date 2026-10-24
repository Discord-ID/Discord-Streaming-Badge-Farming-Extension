import { findModule } from './webpack';

export interface FluxDispatcher {
  dispatch(payload: { type: string; [key: string]: unknown }): void;
  isDispatching(): boolean;
  subscribe(event: string, handler: (data: unknown) => void): void;
  unsubscribe(event: string, handler: (data: unknown) => void): void;
}

let cachedDispatcher: FluxDispatcher | null = null;

export function getDispatcher(): FluxDispatcher | null {
  if (cachedDispatcher) return cachedDispatcher;

  const candidate = findModule<FluxDispatcher>((mod) => {
    if (!mod || typeof mod !== 'object') return false;
    const m = mod as Record<string, unknown>;
    const proto = (m as { __proto__?: Record<string, unknown> })?.__proto__;

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

export function safeDispatch(type: string, data: Record<string, unknown> = {}): void {
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
