import { vi } from 'vitest';
import {
  cleanupTestSelector,
  createStorageMock,
  createTestSelector,
  type TestSelectorOptions,
  type TestSelectorResult,
} from '@/components/theme-picker/test-utils';
import { cleanupDOM } from '@/test-utils/dom-helpers';

/**
 * Helper contract for managing theme selector test lifecycle.
 * @remarks Returned by {@link withSelectorSetup} to coordinate setup and teardown.
 */
export interface SelectorSetup {
  setup: (options?: TestSelectorOptions) => TestSelectorResult;
  cleanup: () => void;
  getResult: () => TestSelectorResult | null;
}

/**
 * Provide standardized setup/teardown for theme-selector tests.
 * @remarks Restores all Vitest mocks after cleanup to keep tests isolated.
 * @returns Selector setup helpers
 */
export function withSelectorSetup(): SelectorSetup {
  let result: TestSelectorResult | null = null;

  const setup = (options: TestSelectorOptions = {}): TestSelectorResult => {
    createStorageMock();
    result = createTestSelector(options);
    return result;
  };

  const cleanup = (): void => {
    if (result) {
      cleanupTestSelector(result);
      result = null;
    }
    vi.restoreAllMocks();
  };

  const getResult = (): TestSelectorResult | null => result;

  return { setup, cleanup, getResult };
}

/**
 * Open the sort dropdown and return trigger and menu elements.
 * @remarks Caller should assert aria-hidden/expanded states after invocation.
 */
export function openSortDropdown(
  container: HTMLElement
): { button: HTMLButtonElement; menu: HTMLElement | null } {
  const sortButton = container.querySelector('[data-testid="theme-sort-button"]') as HTMLButtonElement;
  sortButton.click();

  const sortMenu = container.querySelector('[data-testid="theme-sort-menu"]') as HTMLElement | null;
  return { button: sortButton, menu: sortMenu };
}

/**
 * Type into theme selector search input and dispatch input event.
 * @remarks Mirrors user typing by dispatching bubbling input event.
 */
export function typeInSearch(container: HTMLElement, searchText: string): void {
  const searchInput = container.querySelector('[data-testid="theme-search-input"]') as HTMLInputElement;
  searchInput.value = searchText;
  searchInput.dispatchEvent(new Event('input', { bubbles: true }));
}

// ============================================================================
// Theme Picker Button/Modal Test Helpers
// ============================================================================

/**
 * Context for theme picker button/modal tests.
 */
export interface ThemePickerTestContext {
  container: HTMLElement;
  restore: () => void;
}

/**
 * Sets up a clean DOM container and mocks localStorage interactions used by the theme picker.
 *
 * @returns Test context containing the attached container and a restore function for cleanup.
 */
export function setupThemePickerTestDom(): ThemePickerTestContext {
  cleanupDOM();

  const container = document.createElement('div');
  document.body.appendChild(container);

  const storage: Record<string, string> = {};
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => storage[key] ?? null);
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
    storage[key] = value;
  });

  const restore = () => {
    cleanupDOM();
    vi.restoreAllMocks();
  };

  return { container, restore };
}
