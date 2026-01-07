/**
 * Test fixtures for install prompt-related storage interactions.
 */
import { vi } from 'vitest';

export interface LocalStorageStub {
  /**
   * Mutable backing store for the mocked localStorage implementation.
   */
  store: Record<string, string>;
  /**
   * Restore the original global localStorage implementation.
   */
  restore(): void;
}

/**
 * Replace global localStorage with in-memory stub for install prompt tests.
 * @param initialStore - Optional key/value pairs to seed storage
 * @returns Local storage stub with restore handle
 */
export function createLocalStorageStub(initialStore: Record<string, string> = {}): LocalStorageStub {
  const originalLocalStorage = globalThis.localStorage;
  let store: Record<string, string> = { ...initialStore };

  const mock = {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  } satisfies Storage;

  vi.stubGlobal('localStorage', mock);

  return {
    store,
    restore: () => {
      vi.unstubAllGlobals();
      if (originalLocalStorage) {
        vi.stubGlobal('localStorage', originalLocalStorage);
      }
    },
  };
}
