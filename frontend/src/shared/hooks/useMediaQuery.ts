import { useCallback, useSyncExternalStore } from 'react';

/** Tablet breakpoint. Below this the shells use bottom navigation and sheets. */
export const COMPACT_QUERY = '(max-width: 767px)';

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onStoreChange);
      return () => list.removeEventListener('change', onStoreChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** True on phone-sized viewports. Drives which navigation shell renders. */
export const useIsCompact = () => useMediaQuery(COMPACT_QUERY);
