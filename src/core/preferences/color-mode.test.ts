/** Unit tests for color mode preference utilities. */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mockMatchMedia } from '@/test-utils/accessibility';
import {
  getColorModePreference,
  setColorModePreference,
  getResolvedColorMode,
  subscribeToSystemMode,
} from './color-mode';

const STORAGE_KEY = 'countdown:color-mode';

const createMediaQueryMock = (options: { matches?: boolean; useLegacyApi?: boolean } = {}) => {
  const { matches = false, useLegacyApi = false } = options;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const originalMatchMedia = window.matchMedia;

  const mock = {
    matches,
    media: '(prefers-color-scheme: dark)',
    addEventListener: useLegacyApi ? undefined : vi.fn((_event: string, listener: (event: MediaQueryListEvent) => void) => listeners.add(listener)),
    removeEventListener: useLegacyApi ? undefined : vi.fn((_event: string, listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener)),
    addListener: useLegacyApi ? vi.fn((listener: (event: MediaQueryListEvent) => void) => listeners.add(listener)) : undefined,
    removeListener: useLegacyApi ? vi.fn((listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener)) : undefined,
    dispatchEvent: (event: MediaQueryListEvent) => listeners.forEach(l => l(event)),
    onchange: null,
  };

  window.matchMedia = vi.fn(() => mock) as unknown as typeof window.matchMedia;
  return { mock, listeners, restore: () => { window.matchMedia = originalMatchMedia; } };
};

describe('color-mode utilities', () => {
  beforeEach(() => localStorage.clear());

  describe('getColorModePreference', () => {
    it('returns "system" as default when no preference is stored', () => {
      expect(getColorModePreference()).toBe('system');
    });

    it.each(['dark', 'light', 'system'] as const)('returns stored preference "%s"', stored => {
      localStorage.setItem(STORAGE_KEY, stored);
      expect(getColorModePreference()).toBe(stored);
    });

    it('returns "system" when stored value is invalid', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid-mode');
      expect(getColorModePreference()).toBe('system');
    });

    it('handles localStorage access errors gracefully', () => {
      const originalGetItem = Storage.prototype.getItem;
      Storage.prototype.getItem = vi.fn(() => { throw new Error('blocked'); });
      expect(getColorModePreference()).toBe('system');
      Storage.prototype.getItem = originalGetItem;
    });
  });

  describe('setColorModePreference', () => {
    it.each(['dark', 'light', 'system'] as const)('saves preference "%s" to localStorage', preference => {
      setColorModePreference(preference);
      expect(localStorage.getItem(STORAGE_KEY)).toBe(preference);
    });

    it('handles localStorage access errors gracefully', () => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = vi.fn(() => { throw new Error('blocked'); });
      expect(() => setColorModePreference('dark')).not.toThrow();
      Storage.prototype.setItem = originalSetItem;
    });
  });

  describe('getResolvedColorMode', () => {
    it.each([
      { mode: 'dark', expected: 'dark' },
      { mode: 'light', expected: 'light' },
    ] as const)('returns "$expected" when mode is "$mode"', ({ mode, expected }) => {
      expect(getResolvedColorMode(mode)).toBe(expected);
    });

    it.each([
      { osPrefersDark: true, expected: 'dark' },
      { osPrefersDark: false, expected: 'light' },
    ])('resolves "system" to OS preference (dark=$osPrefersDark)', ({ osPrefersDark, expected }) => {
      const media = mockMatchMedia(osPrefersDark);
      expect(getResolvedColorMode('system')).toBe(expected);
      media.restore();
    });

    it('uses stored preference when no argument provided', () => {
      localStorage.setItem(STORAGE_KEY, 'dark');
      expect(getResolvedColorMode()).toBe('dark');
    });

    it('resolves stored "system" preference to OS preference', () => {
      localStorage.setItem(STORAGE_KEY, 'system');
      const media = mockMatchMedia(true);
      expect(getResolvedColorMode()).toBe('dark');
      media.restore();
    });
  });

  describe('subscribeToSystemMode', () => {
    afterEach(() => vi.restoreAllMocks());

    it.each([
      { description: 'modern API', useLegacyApi: false },
      { description: 'legacy API', useLegacyApi: true },
    ])('fires callback when system preference changes using $description', ({ useLegacyApi }) => {
      const { mock, listeners, restore } = createMediaQueryMock({ useLegacyApi });
      const callback = vi.fn();

      const unsubscribe = subscribeToSystemMode(callback);
      expect(useLegacyApi ? mock.addListener : mock.addEventListener).toHaveBeenCalled();

      listeners.forEach(l => l({ matches: true } as MediaQueryListEvent));
      expect(callback).toHaveBeenCalledWith('dark');

      listeners.forEach(l => l({ matches: false } as MediaQueryListEvent));
      expect(callback).toHaveBeenCalledWith('light');

      unsubscribe();
      expect(useLegacyApi ? mock.removeListener : mock.removeEventListener).toHaveBeenCalled();
      restore();
    });
  });
});
