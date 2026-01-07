/**
 * Timezone Selector Component
 *
 * Searchable dropdown for selecting timezones with grouping by celebration status.
 * Follows the same pattern as theme-switcher for app-level components.
 *
 * This is the slim coordinator that delegates to extracted modules:
 * - options.ts: Timezone option building and celebration detection
 * - state.ts: Component state management and filtering
 * - dom-builders.ts: DOM element construction
 * - list-renderer.ts: List rendering and grouping
 * - event-handlers.ts: Keyboard navigation and user interactions
 *
 * Public API:
 * - createTimezoneSelector(): Creates and mounts the selector component
 * - TimezoneSelectorController: Interface for updates and cleanup
 */

import type { ThemeStyles, WallClockTime } from '@core/types';

import {
    applyThemeStyles,
    buildSelectorDOM,
} from './dom-builders';
import {
    attachOptionClickHandlers,
    type EventHandlerController,
    setupEventListeners,
} from './event-handlers';
import { renderList } from './list-renderer';
import {
    buildTimezoneOptions,
    getOptionDisplayText,
    type TimezoneOption,
} from './options';
import {
    createInitialState,
    filterOptions,
    type TimezoneSelectorState,
} from './state';

/**
 * Options for creating a timezone selector
 */
export interface TimezoneSelectorOptions {
  /** Callback when timezone is selected */
  onSelect: (timezone: string) => void;
  /** Initially selected timezone */
  initialTimezone?: string;
  /**
   * Wall-clock target for celebration detection.
   * When undefined (e.g., landing page), celebration highlighting is disabled.
   */
  wallClockTarget?: WallClockTime;
  /** CSS variable overrides for theme-specific styling */
  themeStyles?: ThemeStyles;
  /**
   * If true, renders inline (for forms) instead of fixed position (for overlays).
   * Defaults to false (fixed positioning).
   */
  inline?: boolean;
}

/**
 * Controller interface for the timezone selector
 */
export interface TimezoneSelectorController {
  /** Update which timezone is selected */
  setTimezone: (timezone: string) => void;
  /** Update theme-specific styles */
  setThemeStyles: (styles: ThemeStyles) => void;
  /** Set visibility of the timezone selector (for responsive layout) */
  setVisible: (visible: boolean) => void;
  /** Get the wrapper element (for mobile menu integration) */
  getElement: () => HTMLElement;
  /** Clean up and remove the component */
  destroy: () => void;
}

// Re-export TimezoneOption type for external use
export type { TimezoneOption };

/**
 * Create and render the timezone selector.
 * @param container - Container element to mount the selector
 * @param options - Configuration options for the selector
 * @returns Controller interface for managing the selector
 * @example
 * ```typescript
 * const controller = createTimezoneSelector(document.body, {
 *   onSelect: (tz) => handleTimezoneSelect(tz),
 *   initialTimezone: 'America/New_York',
 *   wallClockTarget: { month: 1, day: 1, hour: 0, minute: 0 },
 * });
 * ```
 */
export function createTimezoneSelector(
  container: HTMLElement,
  options: TimezoneSelectorOptions
): TimezoneSelectorController {
  const { onSelect, initialTimezone, wallClockTarget, themeStyles, inline = false } = options;

  // NOTE: State is mutable for performance - avoids re-creating options on every update
  const state: TimezoneSelectorState = createInitialState(initialTimezone, wallClockTarget);

  // Create wrapper element
  const wrapper = document.createElement('div');
  wrapper.className = ['timezone-selector-wrapper', inline && 'timezone-selector-wrapper--inline']
    .filter(Boolean)
    .join(' ');
  wrapper.setAttribute('data-testid', 'timezone-selector');

  // NOTE: Theme styles applied via CSS custom properties for runtime switching
  if (themeStyles) {
    applyThemeStyles(wrapper, themeStyles);
  }

  // Render the selector structure
  const {
    trigger,
    dropdown,
    searchInput,
    listContainer,
    valueDisplay,
  } = buildSelectorDOM(wrapper, inline);
  container.appendChild(wrapper);

  // Event handler controller reference
  let eventController: EventHandlerController | null = null;

  function updateValueDisplay(): void {
    const selectedOption = state.allOptions.find(
      (option) => option.value === state.currentSelection
    );
    if (selectedOption) {
      valueDisplay.textContent = getOptionDisplayText(selectedOption);
    }
  }

  function renderDropdownList(): void {
    listContainer.innerHTML = renderList(
      state.filteredOptions,
      state.currentSelection,
      state.userTimezone
    );

    // NOTE: Click handlers attached first so options are interactive before focus management
    attachOptionClickHandlers(listContainer, selectTimezone);

    // NOTE: Roving tabindex enables keyboard navigation (Arrow keys, Home, End)
    eventController?.initRovingTabindex();
  }

  function selectTimezone(timezone: string): void {
    state.currentSelection = timezone;
    updateValueDisplay();
    closeDropdown();
    onSelect(timezone);
  }

  function openDropdown(): void {
    state.isOpen = true;
    dropdown.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    searchInput.focus();
    renderDropdownList();
  }

  function closeDropdown(): void {
    state.isOpen = false;
    dropdown.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    dropdown.removeAttribute('aria-activedescendant');
    searchInput.value = '';
    state.filteredOptions = state.allOptions;

    // NOTE: Destroy roving tabindex to prevent focus capture on closed dropdown
    eventController?.destroyRovingTabindex();
  }

  function handleSearch(query: string): void {
    state.filteredOptions = filterOptions(state.allOptions, query);
    renderDropdownList();
  }

  // Set up event listeners
  eventController = setupEventListeners(
    {
      wrapper,
      trigger,
      dropdown,
      searchInput,
      listContainer,
    },
    {
      onTriggerClick: () => {
        if (state.isOpen) {
          closeDropdown();
        } else {
          openDropdown();
        }
      },
      onTriggerKeydown: (event: KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
          event.preventDefault();
          if (!state.isOpen) {
            openDropdown();
          } else {
            searchInput.focus();
          }
        }
      },
      onSearchInput: handleSearch,
      onSearchKeydown: (event: KeyboardEvent) => {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          eventController?.focusIndex(0);
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          closeDropdown();
          trigger.focus();
        } else if (event.key === 'Home') {
          event.preventDefault();
          eventController?.focusIndex(0);
        } else if (event.key === 'End') {
          event.preventDefault();
          const lastIndex = state.filteredOptions.length - 1;
          eventController?.focusIndex(lastIndex);
        } else if (event.key === 'Tab') {
          closeDropdown();
        }
      },
      onOptionClick: selectTimezone,
      onOutsideClick: () => {
        if (state.isOpen) {
          closeDropdown();
        }
      },
      onEscape: () => {
        if (state.isOpen) {
          closeDropdown();
          trigger.focus();
        }
      },
      onFocusChange: () => {
        // Focus change handling is done internally by event-handlers module
      },
    }
  );

  // Initial render
  updateValueDisplay();

  return {
    setTimezone(timezone: string): void {
      state.currentSelection = timezone;
      updateValueDisplay();
      // NOTE: Rebuild options because celebration status changes with time progression
      state.allOptions = buildTimezoneOptions(state.userTimezone, state.wallClockTarget);
      state.filteredOptions = state.allOptions;
    },

    setThemeStyles(styles: ThemeStyles): void {
      applyThemeStyles(wrapper, styles);
    },

    setVisible(visible: boolean): void {
      wrapper.hidden = !visible;
    },

    getElement(): HTMLElement {
      return wrapper;
    },

    destroy(): void {
      eventController?.destroy();
      eventController = null;
      wrapper.remove();
    },
  };
}
