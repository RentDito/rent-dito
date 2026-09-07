import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

import { rentDitoRepository } from '@/app/repositories';

// Vitest runs without injected globals, so Testing Library's automatic cleanup
// is not registered. Unmount explicitly to keep portalled dialogs, drawers, and
// toasts from leaking into the next test.
afterEach(() => {
  cleanup();
  window.localStorage.clear();
  setNavigatorOnline(true);
  // The repository is a module singleton with in-memory state, so clearing
  // storage alone would leave one test's mutations visible to the next.
  rentDitoRepository.resetDemoData();
});

// jsdom implements no layout engine and no matchMedia. This evaluates the
// width features the shells rely on against `window.innerWidth`, so responsive
// components can be tested at a chosen viewport.
const widthFeature = /\((min|max)-width:\s*(\d+(?:\.\d+)?)(px|rem)\)/g;

const evaluateQuery = (query: string): boolean => {
  const conditions = Array.from(query.matchAll(widthFeature));
  if (conditions.length === 0) return false;

  return conditions.every(([, direction, rawValue, unit]) => {
    const value = Number(rawValue) * (unit === 'rem' ? 16 : 1);
    return direction === 'min' ? window.innerWidth >= value : window.innerWidth <= value;
  });
};

const listeners = new Set<() => void>();

window.matchMedia = (query: string): MediaQueryList => {
  const list: MediaQueryList = {
    media: query,
    get matches() {
      return evaluateQuery(query);
    },
    onchange: null,
    addEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => {
      listeners.add(listener as () => void);
    },
    removeEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => {
      listeners.delete(listener as () => void);
    },
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => true,
  };

  return list;
};

/** Test helper: simulate losing or regaining the network connection. */
export function setNavigatorOnline(online: boolean): void {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    get: () => online,
  });
  window.dispatchEvent(new Event(online ? 'online' : 'offline'));
}

/** Test helper: resize the simulated viewport and notify media-query subscribers. */
export function setViewportWidth(width: number): void {
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: width });
  listeners.forEach((listener) => listener());
}

// jsdom supplies its own `AbortSignal`, but `Request` comes from Node's undici,
// which brand-checks the signal against Node's class. React Router creates a
// `Request` for every client-side navigation, so the mismatch makes navigation
// throw and silently no-op. Tests never abort a navigation, so drop the signal.
const UndiciRequest = globalThis.Request;

class JsdomCompatibleRequest extends UndiciRequest {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    if (init && 'signal' in init) {
      const withoutSignal = { ...init };
      delete withoutSignal.signal;
      super(input, withoutSignal);
      return;
    }

    super(input, init);
  }
}

globalThis.Request = JsdomCompatibleRequest as unknown as typeof Request;
