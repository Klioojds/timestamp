import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  attachOptionClickHandlers,
  setupEventListeners,
  type EventHandlerController,
} from './event-listeners';

let lastOnFocusChange: ((index: number, element: HTMLElement) => void) | null = null;

vi.mock('@core/utils/accessibility/roving-tabindex', () => ({
  createRovingTabindex: (config: any) => {
    lastOnFocusChange = config.onFocusChange ?? null;

    const focusIndex = vi.fn((index: number) => {
      const option = config.container.querySelectorAll(config.selector)[index] as HTMLElement | undefined;
      if (option && lastOnFocusChange) {
        lastOnFocusChange(index, option);
      }
    });

    return {
      focusIndex,
      destroy: vi.fn(),
    };
  },
}));

const buildElements = () => {
  const wrapper = document.createElement('div');
  document.body.appendChild(wrapper);

  const trigger = document.createElement('button');
  const dropdown = document.createElement('div');
  const searchInput = document.createElement('input');
  const listContainer = document.createElement('div');

  dropdown.appendChild(listContainer);
  wrapper.appendChild(trigger);
  wrapper.appendChild(dropdown);
  wrapper.appendChild(searchInput);

  return { wrapper, trigger, dropdown, searchInput, listContainer };
};

describe('timezone-selector/event-listeners', () => {
  let controller: EventHandlerController | null = null;
  let elements: ReturnType<typeof buildElements>;

  beforeEach(() => {
    elements = buildElements();
  });

  afterEach(() => {
    controller?.destroy();
    controller = null;
    elements.wrapper.remove();
    lastOnFocusChange = null;
    vi.clearAllMocks();
  });

  it('attachOptionClickHandlers should forward selected timezone', () => {
    const { listContainer } = elements;
    listContainer.innerHTML = `
      <button class="dropdown-option" data-value="tz-1">One</button>
      <button class="dropdown-option" data-value="tz-2">Two</button>
    `;

    const onSelect = vi.fn();
    attachOptionClickHandlers(listContainer, onSelect);

    (listContainer.querySelector('[data-value="tz-2"]') as HTMLButtonElement).click();

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('tz-2');
  });

  it('initRovingTabindex should wire aria-activedescendant via onFocusChange', () => {
    const { listContainer, dropdown, searchInput, wrapper, trigger } = elements;
    listContainer.innerHTML = `
      <button class="dropdown-option" id="option-0" data-value="a">A</button>
      <button class="dropdown-option" id="option-1" data-value="b">B</button>
    `;

    controller = setupEventListeners(
      { wrapper, trigger: trigger as HTMLButtonElement, dropdown, searchInput, listContainer },
      {
        onTriggerClick: vi.fn(),
        onTriggerKeydown: vi.fn(),
        onSearchInput: vi.fn(),
        onSearchKeydown: vi.fn(),
        onOptionClick: vi.fn(),
        onOutsideClick: vi.fn(),
        onEscape: vi.fn(),
        onFocusChange: vi.fn(),
      }
    );

    controller.initRovingTabindex();

    controller.focusIndex(1);
    expect(dropdown.getAttribute('aria-activedescendant')).toBe('option-1');
  });

  it('list keydown handler should trigger select, close, and focus restoration', () => {
    const onOptionClick = vi.fn();
    const onOutsideClick = vi.fn();
    const { listContainer, dropdown, searchInput, wrapper, trigger } = elements;
    listContainer.innerHTML = `
      <button class="dropdown-option" id="option-0" data-value="first">First</button>
      <button class="dropdown-option" id="option-1" data-value="second">Second</button>
    `;

    controller = setupEventListeners(
      { wrapper, trigger: trigger as HTMLButtonElement, dropdown, searchInput, listContainer },
      {
        onTriggerClick: vi.fn(),
        onTriggerKeydown: vi.fn(),
        onSearchInput: vi.fn(),
        onSearchKeydown: vi.fn(),
        onOptionClick,
        onOutsideClick,
        onEscape: vi.fn(),
        onFocusChange: vi.fn(),
      }
    );

    controller.initRovingTabindex();

    const firstOption = listContainer.querySelector('#option-0') as HTMLButtonElement;

    // Enter selects value
    firstOption.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(onOptionClick).toHaveBeenCalledWith('first');

    // Tab should invoke outside click handler
    firstOption.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    expect(onOutsideClick).toHaveBeenCalled();

    // ArrowUp from first option should move focus back to search input
    firstOption.focus();
    firstOption.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(document.activeElement).toBe(searchInput);
  });
});
