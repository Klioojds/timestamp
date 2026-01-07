import { vi } from 'vitest';

/** Default error message used when mocking storage failures. */
const DEFAULT_STORAGE_ERROR = 'Storage error';

/** Serialize value to JSON and store under the given key. */
export function setLocalStorageJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

/**
 * Mock localStorage method to throw consistent error.
 * @returns Vitest spy that can be restored with mockRestore()
 */
export function mockStorageError(
  method: 'getItem' | 'setItem' | 'removeItem',
  message: string = DEFAULT_STORAGE_ERROR
): ReturnType<typeof vi.spyOn> {
  return vi.spyOn(Storage.prototype, method).mockImplementation(() => {
    throw new Error(message);
  });
}
