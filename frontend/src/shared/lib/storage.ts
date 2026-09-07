export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function createMemoryStorage(): StorageAdapter {
  const entries = new Map<string, string>();

  return {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, value),
    removeItem: (key) => entries.delete(key),
  };
}

export function getDefaultStorage(): StorageAdapter {
  if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  return createMemoryStorage();
}
