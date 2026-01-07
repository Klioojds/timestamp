/**
 * Event listener setup and roving tabindex management for timezone selector
 */

import {
    createRovingTabindex,
    type RovingTabindexController,
} from '@core/utils/accessibility/roving-tabindex';

import { DATA_VALUE_ATTRIBUTE, DROPDOWN_OPTION_SELECTOR } from './constants';

/**
 * DOM element references needed by event handlers
 */
export interface TimezoneSelectorElements {
  wrapper: HTMLElement;
  trigger: HTMLButtonElement;
  dropdown: HTMLElement;
  searchInput: HTMLInputElement;
  listContainer: HTMLElement;
}

/**
 * Callbacks for event handling
 */
export interface EventHandlerCallbacks {
  onTriggerClick: () => void;
  onTriggerKeydown: (event: KeyboardEvent) => void;
  onSearchInput: (value: string) => void;
  onSearchKeydown: (event: KeyboardEvent) => void;
  onOptionClick: (timezone: string) => void;
  onOutsideClick: () => void;
  onEscape: () => void;
  onFocusChange: (index: number, element: HTMLElement | null) => void;
}

/**
 * Controller for event handlers cleanup
 */
export interface EventHandlerController {
  /** Initialize roving tabindex on the option list */
  initRovingTabindex: () => void;
  /** Destroy roving tabindex controller */
  destroyRovingTabindex: () => void;
  /** Focus option at specific index */
  focusIndex: (index: number) => void;
  /** Clean up all event listeners */
  destroy: () => void;
}

/**
 * Attach click handlers to all option elements in the list.
 * @param listContainer - Container element with option buttons
 * @param onSelect - Callback with selected timezone
 */
export function attachOptionClickHandlers(
  listContainer: HTMLElement,
  onSelect: (timezone: string) => void
): void {
  const handleOptionClick = (option: HTMLElement): void => {
    const timezone = option.getAttribute(DATA_VALUE_ATTRIBUTE);
    if (timezone) {
      onSelect(timezone);
    }
  };
  listContainer.querySelectorAll(DROPDOWN_OPTION_SELECTOR).forEach((option) => {
    option.addEventListener('click', () => handleOptionClick(option as HTMLElement));
  });
}

/**
 * Create and manage roving tabindex controller for the option list.
 */
function createOptionsRovingController(
  listContainer: HTMLElement,
  dropdown: HTMLElement,
  onFocusChange?: (index: number, element: HTMLElement) => void
): RovingTabindexController | null {
  const options = listContainer.querySelectorAll(DROPDOWN_OPTION_SELECTOR);
  if (options.length === 0) return null;

  return createRovingTabindex({
    container: listContainer,
    selector: '.dropdown-option',
    initialIndex: 0,
    // NOTE: wrap:false allows ArrowUp from first option to focus search input,
    // creating natural keyboard flow (search → options → search)
    wrap: false,
    orientation: 'vertical',
    useActivedescendant: false, // We handle aria-activedescendant on dropdown
    onFocusChange: (index, element) => {
      // NOTE: Manual aria-activedescendant allows dropdown to announce focused option
      if (element?.id) {
        dropdown.setAttribute('aria-activedescendant', element.id);
      }
      onFocusChange?.(index, element);
    },
  });
}

/**
 * Set up all event listeners for the timezone selector.
 * @param elements - DOM element references
 * @param callbacks - Event callbacks
 * @returns Controller for cleanup
 */
export function setupEventListeners(
  elements: TimezoneSelectorElements,
  callbacks: EventHandlerCallbacks
): EventHandlerController {
  const { wrapper, trigger, dropdown, searchInput, listContainer } = elements;
  let rovingController: RovingTabindexController | null = null;
  let listKeydownHandler: ((event: KeyboardEvent) => void) | null = null;

  // Trigger handlers
  const handleTriggerClick = callbacks.onTriggerClick;
  const handleTriggerKeydown = callbacks.onTriggerKeydown;

  // Search handlers
  const handleSearchInput = (event: Event) => {
    callbacks.onSearchInput((event.target as HTMLInputElement).value);
  };
  const handleSearchKeydown = callbacks.onSearchKeydown;

  // Document handlers
  const handleDocumentClick = (event: MouseEvent) => {
    if (!wrapper.contains(event.target as Node)) {
      callbacks.onOutsideClick();
    }
  };
  const handleDocumentKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      callbacks.onEscape();
    }
  };

  // Attach listeners
  trigger.addEventListener('click', handleTriggerClick);
  trigger.addEventListener('keydown', handleTriggerKeydown);
  searchInput.addEventListener('input', handleSearchInput);
  searchInput.addEventListener('keydown', handleSearchKeydown);
  document.addEventListener('click', handleDocumentClick);
  document.addEventListener('keydown', handleDocumentKeydown);

  return {
    initRovingTabindex(): void {
      // Destroy existing controller
      if (rovingController) {
        rovingController.destroy();
        rovingController = null;
      }
      if (listKeydownHandler) {
        listContainer.removeEventListener('keydown', listKeydownHandler, true);
        listKeydownHandler = null;
      }

      rovingController = createOptionsRovingController(
        listContainer,
        dropdown,
        callbacks.onFocusChange
      );

      if (rovingController) {
        // Add supplementary keydown handler for Enter/Space/Tab and ArrowUp escape
        listKeydownHandler = createListKeydownHandler(
          searchInput,
          listContainer,
          callbacks.onOptionClick,
          callbacks.onOutsideClick
        );
        listContainer.addEventListener('keydown', listKeydownHandler, true);
      }
    },

    destroyRovingTabindex(): void {
      if (rovingController) {
        rovingController.destroy();
        rovingController = null;
      }
      if (listKeydownHandler) {
        listContainer.removeEventListener('keydown', listKeydownHandler, true);
        listKeydownHandler = null;
      }
    },

    focusIndex(index: number): void {
      rovingController?.focusIndex(index);
    },

    destroy(): void {
      // NOTE: Remove listeners in reverse order of attachment for consistency
      trigger.removeEventListener('click', handleTriggerClick);
      trigger.removeEventListener('keydown', handleTriggerKeydown);
      searchInput.removeEventListener('input', handleSearchInput);
      searchInput.removeEventListener('keydown', handleSearchKeydown);
      document.removeEventListener('click', handleDocumentClick);
      document.removeEventListener('keydown', handleDocumentKeydown);

      if (rovingController) {
        rovingController.destroy();
        rovingController = null;
      }
      if (listKeydownHandler) {
        listContainer.removeEventListener('keydown', listKeydownHandler, true);
        listKeydownHandler = null;
      }
    },
  };
}

/**
 * Create keyboard handler for option list interactions.
 * @internal
 */
function createListKeydownHandler(
  searchInput: HTMLInputElement,
  listContainer: HTMLElement,
  onSelect: (timezone: string) => void,
  onClose: () => void
): (event: KeyboardEvent) => void {
  return (event: KeyboardEvent) => {
    const { key, target } = event;

    switch (key) {
      case 'Enter':
      case ' ': // Space key
        event.preventDefault();
        const timezone = (target as HTMLElement)?.getAttribute(DATA_VALUE_ATTRIBUTE);
        if (timezone) {
          onSelect(timezone);
        }
        break;
      case 'Tab':
        // Allow natural tab behavior to exit the component
        onClose();
        break;
      case 'ArrowUp': {
        // NOTE: ArrowUp from first option returns focus to search input,
        // creating bidirectional keyboard flow between search and list
        const firstOption = listContainer.querySelector(DROPDOWN_OPTION_SELECTOR);
        if (target === firstOption) {
          event.preventDefault();
          event.stopPropagation(); // Prevent roving tabindex from handling this
          searchInput.focus();
        }
        break;
      }
    }
  };
}
