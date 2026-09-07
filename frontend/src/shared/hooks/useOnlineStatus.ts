import { useCallback, useSyncExternalStore } from 'react';

/**
 * Browser connectivity, used to disable transactional actions offline. The
 * prototype never queues a mutation, so it must not imply an unsent action
 * succeeded.
 */
export function useOnlineStatus(): boolean {
  const subscribe = useCallback((onStoreChange: () => void) => {
    window.addEventListener('online', onStoreChange);
    window.addEventListener('offline', onStoreChange);

    return () => {
      window.removeEventListener('online', onStoreChange);
      window.removeEventListener('offline', onStoreChange);
    };
  }, []);

  return useSyncExternalStore(
    subscribe,
    () => window.navigator.onLine,
    () => true,
  );
}

export const OFFLINE_ACTION_MESSAGE = 'You are offline, so this action cannot be saved yet.';
