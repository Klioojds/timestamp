/** Shared test utilities for theme-selector tests. */

import type { ThemeId } from '@core/types';
import { vi } from 'vitest';

import { createThemeSelector } from './index';

/** Storage mock for localStorage */
export interface StorageMock {
  storage: Record<string, string>;
  getItem: ReturnType<typeof vi.fn>;
  setItem: ReturnType<typeof vi.fn>;
  removeItem: ReturnType<typeof vi.fn>;
}

/**
 * Create mock localStorage for testing favorites.
 * @returns Storage mock with spied methods
 * @internal
 */
export function createStorageMock(): StorageMock {
  const storage: Record<string, string> = {};
  return {
    storage,
    getItem: vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => storage[key] || null),
    setItem: vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      storage[key] = value;
    }),
    removeItem: vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((key) => {
      delete storage[key];
    }),
  };
}

/** Options for creating a theme selector in tests */
export interface TestSelectorOptions {
  currentTheme?: ThemeId;
  onSelect?: (themeId: ThemeId) => void;
  appendToContainer?: boolean;
}

/** Result of creating a test theme selector */
export interface TestSelectorResult {
  selector: ReturnType<typeof createThemeSelector>;
  container: HTMLElement;
  onSelect: ReturnType<typeof vi.fn>;
}

/**
 * Create theme selector with common test setup.
 * @param options - Optional overrides for theme and callbacks
 * @returns Selector, container, and mocked onSelect
 * @internal
 */
export function createTestSelector(options: TestSelectorOptions = {}): TestSelectorResult {
  const {
    currentTheme = 'contribution-graph',
    onSelect = vi.fn() as unknown as (themeId: ThemeId) => void,
    appendToContainer = true,
  } = options;

  const container = document.createElement('div');
  document.body.appendChild(container);

  const selector = createThemeSelector({
    currentTheme,
    onSelect,
  });

  if (appendToContainer) {
    container.appendChild(selector.getElement());
  }

  return { selector, container, onSelect: onSelect as ReturnType<typeof vi.fn> };
}

/**
 * Clean up test selector and container.
 * @param result - Test selector result to clean up
 * @internal
 */
export function cleanupTestSelector(result: TestSelectorResult): void {
  result.selector.destroy();
  result.container.remove();
}
