/**
 * Mock Clipboard API for unit tests.
 * @remarks Use with afterEach hooks to guarantee cleanup.
 */
import { vi } from 'vitest';

export function mockClipboard(writeImpl: ReturnType<typeof vi.fn> = vi.fn().mockResolvedValue(undefined)) {
  const originalClipboard = navigator.clipboard;
  const writeText = writeImpl;

  Object.assign(navigator, {
    clipboard: { writeText },
  });

  return {
    writeText,
    restore: () => {
      Object.assign(navigator, { clipboard: originalClipboard });
    },
  };
}
