/**
 * Shared helpers for timezone selector tests.
 */
import { vi } from 'vitest';

import { cleanupDOM, createAttachedContainer } from '@/test-utils/dom-helpers';

import { DROPDOWN_OPTION_SELECTOR } from './constants';
import { createTimezoneSelector } from './index';

export interface RenderOptions {
  initialTimezone?: string;
  onSelect?: (timezone: string) => void;
}

export interface RenderedSelector {
  container: HTMLElement;
  trigger: HTMLButtonElement;
  dropdown: HTMLElement;
  searchInput: HTMLInputElement;
  controller: ReturnType<typeof createTimezoneSelector>;
  onSelect: ReturnType<typeof vi.fn>;
  cleanup: () => void;
}

/**
 * Render the timezone selector with common test wiring.
 * @param options - Optional overrides for initial timezone and onSelect handler
 * @returns Rendered selector handles plus cleanup callback
 */
export function renderTimezoneSelector(options: RenderOptions = {}): RenderedSelector {
  const container = createAttachedContainer('timezone-selector-test');
  const onSelect = options.onSelect ?? (vi.fn() as unknown as (timezone: string) => void);

  const controller = createTimezoneSelector(container, {
    onSelect,
    initialTimezone: options.initialTimezone,
  });

  const trigger = container.querySelector('.timezone-selector-trigger') as HTMLButtonElement;
  const dropdown = container.querySelector('.timezone-dropdown') as HTMLElement;
  const searchInput = container.querySelector('.search-input') as HTMLInputElement;

  const cleanup = (): void => {
    controller.destroy();
    cleanupDOM();
    vi.clearAllMocks();
  };

  return { container, trigger, dropdown, searchInput, controller, onSelect: onSelect as ReturnType<typeof vi.fn>, cleanup };
}

/** Opens the dropdown via the trigger and returns rendered options. */
export function openDropdown(selector: RenderedSelector): HTMLButtonElement[] {
  selector.trigger.click();
  return getOptions(selector.container);
}

/** Dispatches a keyboard event with the provided key. */
export function pressKey(target: Element, key: string): void {
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

/** Types into the search input and emits the input event. @returns Updated options after filtering */
export function typeSearch(selector: RenderedSelector, value: string): HTMLButtonElement[] {
  selector.searchInput.value = value;
  selector.searchInput.dispatchEvent(new Event('input', { bubbles: true }));
  return getOptions(selector.container);
}

/** Returns all dropdown option elements. */
export function getOptions(container: HTMLElement): HTMLButtonElement[] {
  return Array.from(container.querySelectorAll(DROPDOWN_OPTION_SELECTOR)) as HTMLButtonElement[];
}
