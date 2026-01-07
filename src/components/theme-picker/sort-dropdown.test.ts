import { cleanupDOM } from '@/test-utils/dom-helpers';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildSortDropdown } from './sort-dropdown';
import { getSortLabel } from './sort-themes';
import type { ThemeSortConfig } from './types';

const defaultSort: ThemeSortConfig = { field: 'name', direction: 'asc' };

const createDropdown = (
  sort: ThemeSortConfig = defaultSort,
  onSortChange: (config: ThemeSortConfig) => void = vi.fn()
) => {
  const dropdown = buildSortDropdown(sort, onSortChange);
  document.body.appendChild(dropdown.container);

  const button = dropdown.container.querySelector<HTMLButtonElement>('[data-testid="theme-sort-button"]');
  const menu = dropdown.container.querySelector<HTMLElement>('[data-testid="theme-sort-menu"]');
  const options = Array.from(
    dropdown.container.querySelectorAll<HTMLButtonElement>('.theme-selector-sort-option')
  );

  if (!button || !menu || options.length === 0) {
    throw new Error('Dropdown did not render expected elements');
  }

  return { dropdown, button, menu, options, onSortChange };
};

const pressKey = (target: Element | Document | Window, key: string): void => {
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
};

describe('buildSortDropdown accessibility', () => {
  afterEach(() => {
    cleanupDOM();
  });

  it('should keep sort options out of the tab order when closed', () => {
    const { dropdown, options } = createDropdown();

    options.forEach((option) => {
      expect(option.tabIndex).toBe(-1);
    });

    dropdown.destroy();
  });

  it('should open with Space key and focus the selected option', () => {
    const { dropdown, button, menu, options } = createDropdown();

    button.focus();
    pressKey(button, ' ');

    expect(menu.getAttribute('aria-hidden')).toBe('false');
    expect(document.activeElement).toBe(options[0]);
    expect(options[0].getAttribute('data-field')).toBe(defaultSort.field);
    expect(options[0].getAttribute('data-direction')).toBe(defaultSort.direction);

    dropdown.destroy();
  });
});

describe('buildSortDropdown keyboard navigation', () => {
  afterEach(() => {
    cleanupDOM();
  });

  it('should open menu with ArrowDown from closed state', () => {
    const { dropdown, button, menu, options } = createDropdown();

    button.focus();
    pressKey(button, 'ArrowDown');

    expect(menu.getAttribute('aria-hidden')).toBe('false');
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement).toBe(options[0]);
    expect(options[0].tabIndex).toBe(0);

    dropdown.destroy();
  });

  it('should move focus to next option with ArrowDown when open', () => {
    const { dropdown, button, options } = createDropdown();

    button.focus();
    pressKey(button, 'ArrowDown'); // open and focus first option
    pressKey(document.activeElement ?? options[0], 'ArrowDown');

    expect(document.activeElement).toBe(options[1]);
    expect(options[1].tabIndex).toBe(0);
    expect(options[0].tabIndex).toBe(-1);

    dropdown.destroy();
  });

  it('should open menu with ArrowUp from closed state and focus last option', () => {
    const { dropdown, button, menu, options } = createDropdown();

    button.focus();
    pressKey(button, 'ArrowUp');

    expect(menu.getAttribute('aria-hidden')).toBe('false');
    expect(document.activeElement).toBe(options[options.length - 1]);
    expect(options[options.length - 1].tabIndex).toBe(0);

    dropdown.destroy();
  });

  it('should move focus to previous option with ArrowUp when open', () => {
    const { dropdown, button, options } = createDropdown();

    button.focus();
    pressKey(button, 'ArrowDown');
    pressKey(document.activeElement ?? options[0], 'ArrowDown'); // now on second option
    pressKey(document.activeElement ?? options[1], 'ArrowUp');

    expect(document.activeElement).toBe(options[0]);
    expect(options[0].tabIndex).toBe(0);

    dropdown.destroy();
  });

  it('should focus first option with Home key', () => {
    const { dropdown, button, options } = createDropdown();

    button.focus();
    pressKey(button, 'ArrowDown');
    pressKey(document.activeElement ?? options[0], 'ArrowDown');
    pressKey(document.activeElement ?? options[1], 'Home');

    expect(document.activeElement).toBe(options[0]);

    dropdown.destroy();
  });

  it('should focus last option with End key', () => {
    const { dropdown, button, options } = createDropdown();

    button.focus();
    pressKey(button, 'ArrowDown');
    pressKey(document.activeElement ?? options[0], 'End');

    expect(document.activeElement).toBe(options[options.length - 1]);

    dropdown.destroy();
  });

  it('should close menu with Escape and return focus to button', () => {
    const { dropdown, button, menu, options } = createDropdown();

    button.focus();
    pressKey(button, 'ArrowDown');
    pressKey(document.activeElement ?? options[0], 'Escape');

    expect(menu.getAttribute('aria-hidden')).toBe('true');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(button);

    dropdown.destroy();
  });

  it('should close menu with Tab without returning focus to button', () => {
    const { dropdown, button, menu, options } = createDropdown();

    button.focus();
    pressKey(button, 'ArrowDown');
    pressKey(document.activeElement ?? options[0], 'Tab');

    expect(menu.getAttribute('aria-hidden')).toBe('true');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).not.toBe(button);

    dropdown.destroy();
  });

  it('should select focused option with Enter and close the menu', () => {
    const { dropdown, button, menu, options, onSortChange } = createDropdown();

    button.focus();
    pressKey(button, 'ArrowDown');
    pressKey(document.activeElement ?? options[0], 'ArrowDown'); // focus second option
    pressKey(document.activeElement ?? options[1], 'Enter');

    expect(menu.getAttribute('aria-hidden')).toBe('true');
    expect(onSortChange).toHaveBeenCalledWith({ field: 'name', direction: 'desc' });
    expect(button.getAttribute('aria-expanded')).toBe('false');

    dropdown.destroy();
  });
});

describe('buildSortDropdown click behavior', () => {
  afterEach(() => {
    cleanupDOM();
  });

  it('should toggle menu open and closed on button click', () => {
    const { dropdown, button, menu } = createDropdown();

    button.click();
    expect(menu.getAttribute('aria-hidden')).toBe('false');

    button.click();
    expect(menu.getAttribute('aria-hidden')).toBe('true');

    dropdown.destroy();
  });

  it('should select an option on click and close the menu', () => {
    const { dropdown, button, menu, options, onSortChange } = createDropdown();

    button.click();
    options[1].click();

    expect(onSortChange).toHaveBeenCalledWith({ field: 'name', direction: 'desc' });
    expect(menu.getAttribute('aria-hidden')).toBe('true');
    expect(button.getAttribute('aria-expanded')).toBe('false');

    dropdown.destroy();
  });

  it('should close the menu when clicking outside', () => {
    const { dropdown, button, menu } = createDropdown();

    button.click();
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(menu.getAttribute('aria-hidden')).toBe('true');
    expect(button.getAttribute('aria-expanded')).toBe('false');

    dropdown.destroy();
  });
});

describe('buildSortDropdown selection state', () => {
  afterEach(() => {
    cleanupDOM();
  });

  it('should call onSortChange when an option is selected', () => {
    const { dropdown, button, options, onSortChange } = createDropdown();

    button.click();
    options[2].click();

    expect(onSortChange).toHaveBeenCalledWith({ field: 'author', direction: 'asc' });

    dropdown.destroy();
  });

  it('should update aria-checked and aria-selected on selection', () => {
    const { dropdown, button, options } = createDropdown();

    button.click();
    options[3].click();

    expect(options[3].getAttribute('aria-checked')).toBe('true');
    expect(options[3].getAttribute('aria-selected')).toBe('true');
    expect(options[0].getAttribute('aria-checked')).toBe('false');
    expect(options[0].getAttribute('aria-selected')).toBe('false');

    dropdown.destroy();
  });

  it('should update the button label when a new option is selected', () => {
    const { dropdown, button, options } = createDropdown();

    button.click();
    options[4].click();

    const label = button.querySelector('.theme-selector-sort-label');
    expect(label?.textContent).toBe(getSortLabel({ field: 'date', direction: 'desc' }));

    dropdown.destroy();
  });
});

describe('buildSortDropdown external updateSort', () => {
  afterEach(() => {
    cleanupDOM();
  });

  it('should sync internal state when updateSort is called externally', () => {
    const { dropdown, button, options, menu } = createDropdown();

    dropdown.updateSort({ field: 'date', direction: 'asc' });

    expect(options[5].getAttribute('aria-checked')).toBe('true');
    expect(options[5].getAttribute('aria-selected')).toBe('true');
    expect(menu.getAttribute('aria-hidden')).toBe('true');

    const label = button.querySelector('.theme-selector-sort-label');
    expect(label?.textContent).toBe(getSortLabel({ field: 'date', direction: 'asc' }));

    dropdown.destroy();
  });
});

describe('buildSortDropdown destroy', () => {
  afterEach(() => {
    cleanupDOM();
  });

  it('should remove event listeners to keep menu state unchanged after destroy', () => {
    const { dropdown, button, menu } = createDropdown();

    button.click(); // open menu
    dropdown.destroy();

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    button.click();

    expect(menu.getAttribute('aria-hidden')).toBe('false');
    expect(button.getAttribute('aria-expanded')).toBe('true');
  });
});

describe('buildSortDropdown DOM structure and attributes', () => {
  afterEach(() => {
    cleanupDOM();
  });

  it('should render button with correct className and testid', () => {
    const { dropdown, button } = createDropdown();

    expect(button.className).toBe('theme-selector-sort-button');
    expect(button.getAttribute('data-testid')).toBe('theme-sort-button');
    expect(button.type).toBe('button');

    dropdown.destroy();
  });

  it('should render menu with correct className and role', () => {
    const { dropdown, menu } = createDropdown();

    expect(menu.className).toBe('theme-selector-sort-menu');
    expect(menu.getAttribute('role')).toBe('listbox');
    expect(menu.getAttribute('data-testid')).toBe('theme-sort-menu');
    expect(menu.getAttribute('aria-label')).toBe('Sort options');

    dropdown.destroy();
  });

  it('should generate unique menu ID for aria-controls', () => {
    const { dropdown: dropdown1, button: button1, menu: menu1 } = createDropdown();
    const { dropdown: dropdown2, button: button2, menu: menu2 } = createDropdown();

    const menuId1 = menu1.id;
    const menuId2 = menu2.id;

    expect(menuId1).toMatch(/^theme-sort-menu-[a-z0-9]+$/);
    expect(menuId2).toMatch(/^theme-sort-menu-[a-z0-9]+$/);
    expect(menuId1).not.toBe(menuId2);
    expect(button1.getAttribute('aria-controls')).toBe(menuId1);
    expect(button2.getAttribute('aria-controls')).toBe(menuId2);

    dropdown1.destroy();
    dropdown2.destroy();
  });

  it('should render button content with icons and label', () => {
    const { dropdown, button } = createDropdown();

    const content = button.querySelector('.theme-selector-sort-button-content');
    const icon = button.querySelector('.theme-selector-sort-icon');
    const label = button.querySelector('.theme-selector-sort-label');
    const chevron = button.querySelector('.theme-selector-sort-chevron');

    expect(content).toBeTruthy();
    expect(icon).toBeTruthy();
    expect(label).toBeTruthy();
    expect(chevron).toBeTruthy();
    expect(label?.textContent).toBe(getSortLabel(defaultSort));

    dropdown.destroy();
  });

  it('should render all sort options with correct data attributes', () => {
    const { dropdown, options } = createDropdown();

    expect(options).toHaveLength(6);

    const expectedOptions = [
      { field: 'name', direction: 'asc', testid: 'theme-sort-option-name-asc' },
      { field: 'name', direction: 'desc', testid: 'theme-sort-option-name-desc' },
      { field: 'author', direction: 'asc', testid: 'theme-sort-option-author-asc' },
      { field: 'author', direction: 'desc', testid: 'theme-sort-option-author-desc' },
      { field: 'date', direction: 'desc', testid: 'theme-sort-option-date-desc' },
      { field: 'date', direction: 'asc', testid: 'theme-sort-option-date-asc' },
    ];

    options.forEach((option, index) => {
      const expected = expectedOptions[index];
      expect(option.className).toBe('theme-selector-sort-option');
      expect(option.getAttribute('role')).toBe('option');
      expect(option.getAttribute('data-testid')).toBe(expected.testid);
      expect(option.getAttribute('data-field')).toBe(expected.field);
      expect(option.getAttribute('data-direction')).toBe(expected.direction);
      expect(option.type).toBe('button');
    });

    dropdown.destroy();
  });

  it('should set correct initial aria-checked and aria-selected for selected option', () => {
    const { dropdown, options } = createDropdown({ field: 'date', direction: 'desc' });

    const selectedOption = options.find(
      (opt) => opt.getAttribute('data-field') === 'date' && opt.getAttribute('data-direction') === 'desc'
    );

    expect(selectedOption?.getAttribute('aria-checked')).toBe('true');
    expect(selectedOption?.getAttribute('aria-selected')).toBe('true');

    const unselectedOption = options.find(
      (opt) => opt.getAttribute('data-field') === 'name' && opt.getAttribute('data-direction') === 'asc'
    );

    expect(unselectedOption?.getAttribute('aria-checked')).toBe('false');
    expect(unselectedOption?.getAttribute('aria-selected')).toBe('false');

    dropdown.destroy();
  });

  it('should set button aria attributes correctly', () => {
    const { dropdown, button } = createDropdown();

    expect(button.getAttribute('aria-haspopup')).toBe('listbox');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(button.getAttribute('aria-label')).toBe('Sort themes');

    dropdown.destroy();
  });

  it('should add open class to container when menu opens', () => {
    const { dropdown, button } = createDropdown();

    expect(dropdown.container.classList.contains('theme-selector-sort--open')).toBe(false);

    button.click();
    expect(dropdown.container.classList.contains('theme-selector-sort--open')).toBe(true);

    button.click();
    expect(dropdown.container.classList.contains('theme-selector-sort--open')).toBe(false);

    dropdown.destroy();
  });
});

describe('buildSortDropdown boundary conditions', () => {
  afterEach(() => {
    cleanupDOM();
  });

  it('should clamp focus to last option when navigating down from last option', () => {
    const { dropdown, button, options } = createDropdown();

    button.focus();
    pressKey(button, 'ArrowDown'); // open
    pressKey(options[0], 'End'); // focus last
    pressKey(options[options.length - 1], 'ArrowDown'); // should stay on last

    expect(document.activeElement).toBe(options[options.length - 1]);
    expect(options[options.length - 1].tabIndex).toBe(0);

    dropdown.destroy();
  });

  it('should clamp focus to first option when navigating up from first option', () => {
    const { dropdown, button, options } = createDropdown();

    button.focus();
    pressKey(button, 'ArrowDown'); // open, focus first
    pressKey(options[0], 'ArrowUp'); // should stay on first

    expect(document.activeElement).toBe(options[0]);
    expect(options[0].tabIndex).toBe(0);

    dropdown.destroy();
  });

  it('should handle Enter key on button when closed', () => {
    const { dropdown, button, menu } = createDropdown();

    button.focus();
    pressKey(button, 'Enter');

    expect(menu.getAttribute('aria-hidden')).toBe('false');
    expect(button.getAttribute('aria-expanded')).toBe('true');

    dropdown.destroy();
  });

  it('should handle Enter key on button when open', () => {
    const { dropdown, button, menu } = createDropdown();

    button.focus();
    pressKey(button, 'Enter'); // open
    pressKey(button, 'Enter'); // close

    expect(menu.getAttribute('aria-hidden')).toBe('true');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(button);

    dropdown.destroy();
  });

  it('should not close menu when clicking inside container', () => {
    const { dropdown, button, menu } = createDropdown();

    button.click();
    dropdown.container.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(menu.getAttribute('aria-hidden')).toBe('false');

    dropdown.destroy();
  });
});
