import { getIconSvg } from '@core/utils/dom';

import { getSortLabel } from './sort-themes';
import type { ThemeSortConfig, ThemeSortDirection, ThemeSortField } from './types';

const SORT_OPTIONS: Array<{ field: ThemeSortField; direction: ThemeSortDirection }> = [
  { field: 'name', direction: 'asc' },
  { field: 'name', direction: 'desc' },
  { field: 'author', direction: 'asc' },
  { field: 'author', direction: 'desc' },
  { field: 'date', direction: 'desc' },
  { field: 'date', direction: 'asc' },
];

/**
 * Build sort dropdown component.
 * @param currentSort - Initial sort configuration
 * @param onSortChange - Callback when sort changes
 * @returns Object with container, trigger, update function, and destroy
 */
export function buildSortDropdown(
  currentSort: ThemeSortConfig,
  onSortChange: (config: ThemeSortConfig) => void
): {
  container: HTMLElement;
  trigger: HTMLButtonElement;
  updateSort: (config: ThemeSortConfig) => void;
  destroy: () => void;
} {
  let isOpen = false;
  let currentConfig = { ...currentSort };
  let focusedOptionIndex = 0;
  const menuId = `theme-sort-menu-${Math.random().toString(36).slice(2)}`;

  const container = document.createElement('div');
  container.className = 'theme-selector-sort';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'theme-selector-sort-button';
  button.setAttribute('data-testid', 'theme-sort-button');
  button.setAttribute('aria-haspopup', 'listbox');
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-label', 'Sort themes');
  button.setAttribute('aria-controls', menuId);

  const buttonContent = document.createElement('span');
  buttonContent.className = 'theme-selector-sort-button-content';
  buttonContent.innerHTML = `
    <span class="theme-selector-sort-icon">${getIconSvg('sort-asc', 16)}</span>
    <span class="theme-selector-sort-label">${getSortLabel(currentConfig)}</span>
    <span class="theme-selector-sort-chevron">${getIconSvg('chevron-down', 16)}</span>
  `;
  button.appendChild(buttonContent);

  const menu = document.createElement('div');
  menu.className = 'theme-selector-sort-menu';
  menu.setAttribute('role', 'listbox');
  menu.setAttribute('data-testid', 'theme-sort-menu');
  menu.setAttribute('aria-hidden', 'true');
  menu.setAttribute('aria-label', 'Sort options');
  menu.id = menuId;

  const options: HTMLButtonElement[] = [];

  SORT_OPTIONS.forEach(({ field, direction }) => {
    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'theme-selector-sort-option';
    option.setAttribute('role', 'option');
    option.setAttribute('data-testid', `theme-sort-option-${field}-${direction}`);
    option.setAttribute('data-field', field);
    option.setAttribute('data-direction', direction);
    const isSelected = field === currentConfig.field && direction === currentConfig.direction;
    option.setAttribute('aria-checked', isSelected ? 'true' : 'false');
    option.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    option.tabIndex = -1;
    option.textContent = getSortLabel({ field, direction });

    option.addEventListener('click', () => {
      selectOption(field, direction);
      closeMenu(true);
    });

    options.push(option);
    menu.appendChild(option);
  });

  container.append(button, menu);

  const handleButtonClick = (): void => {
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  };

  const handleButtonKeydown = (e: KeyboardEvent): void => {
    switch (e.key) {
      case ' ':
      case 'Enter':
        e.preventDefault();
        e.stopPropagation();
        if (isOpen) {
          closeMenu(true);
        } else {
          openMenu(true);
        }
        break;
      case 'Escape':
        if (isOpen) {
          e.preventDefault();
          e.stopPropagation();
          closeMenu(true);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        e.stopPropagation();
        if (!isOpen) {
          openMenu(true);
        } else {
          focusOption(focusedOptionIndex + 1);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        e.stopPropagation();
        if (!isOpen) {
          openMenu(true);
          focusOption(options.length - 1);
        } else {
          focusOption(focusedOptionIndex - 1);
        }
        break;
      default:
        break;
    }
  };

  const handleMenuKeydown = (e: KeyboardEvent): void => {
    const target = e.target as HTMLButtonElement | null;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        e.stopPropagation();
        focusOption(focusedOptionIndex + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        e.stopPropagation();
        focusOption(focusedOptionIndex - 1);
        break;
      case 'Home':
        e.preventDefault();
        e.stopPropagation();
        focusOption(0);
        break;
      case 'End':
        e.preventDefault();
        e.stopPropagation();
        focusOption(options.length - 1);
        break;
      case ' ':
      case 'Enter':
        if (target) {
          e.preventDefault();
          e.stopPropagation();
          const field = target.getAttribute('data-field') as ThemeSortField;
          const direction = target.getAttribute('data-direction') as ThemeSortDirection;
          selectOption(field, direction);
          closeMenu(true);
        }
        break;
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        closeMenu(true);
        break;
      case 'Tab':
        closeMenu();
        break;
      default:
        break;
    }
  };

  button.addEventListener('click', handleButtonClick);
  button.addEventListener('keydown', handleButtonKeydown);
  menu.addEventListener('keydown', handleMenuKeydown);

  function handleClickOutside(e: MouseEvent): void {
    if (!container.contains(e.target as Node)) {
      closeMenu();
    }
  }

  document.addEventListener('click', handleClickOutside);

  function getSelectedOptionIndex(): number {
    return SORT_OPTIONS.findIndex(
      (option) => option.field === currentConfig.field && option.direction === currentConfig.direction
    );
  }

  function syncOptionTabIndexes(enable: boolean): void {
    if (!options.length) return;

    const targetIndex = enable
      ? focusedOptionIndex ?? getSelectedOptionIndex() ?? 0
      : -1;

    options.forEach((opt, index) => {
      opt.tabIndex = enable && index === targetIndex ? 0 : -1;
    });
  }

  function focusOption(index: number): void {
    if (!options.length) return;

    focusedOptionIndex = Math.max(0, Math.min(index, options.length - 1));
    options.forEach((opt, optionIndex) => {
      opt.tabIndex = optionIndex === focusedOptionIndex ? 0 : -1;
    });
    options[focusedOptionIndex].focus();
  }

  function selectOption(field: ThemeSortField, direction: ThemeSortDirection): void {
    currentConfig = { field, direction };
    updateSelectedState();
    updateButtonLabel();
    syncOptionTabIndexes(isOpen);
    onSortChange(currentConfig);
  }

  function openMenu(shouldFocusOption = false): void {
    isOpen = true;
    menu.setAttribute('aria-hidden', 'false');
    button.setAttribute('aria-expanded', 'true');
    container.classList.add('theme-selector-sort--open');

    const selectedIndex = getSelectedOptionIndex();
    if (selectedIndex >= 0) {
      focusedOptionIndex = selectedIndex;
    }

    syncOptionTabIndexes(true);

    if (shouldFocusOption) {
      focusOption(focusedOptionIndex);
    }
  }

  function closeMenu(returnFocusToButton = false): void {
    isOpen = false;
    menu.setAttribute('aria-hidden', 'true');
    button.setAttribute('aria-expanded', 'false');
    container.classList.remove('theme-selector-sort--open');
    syncOptionTabIndexes(false);

    if (returnFocusToButton) {
      button.focus();
    }
  }

  function updateSelectedState(): void {
    options.forEach((opt, index) => {
      const field = opt.getAttribute('data-field');
      const direction = opt.getAttribute('data-direction');
      const isSelected = field === currentConfig.field && direction === currentConfig.direction;
      opt.setAttribute('aria-checked', isSelected ? 'true' : 'false');
      opt.setAttribute('aria-selected', isSelected ? 'true' : 'false');

      if (isSelected) {
        focusedOptionIndex = index;
      }
    });

    syncOptionTabIndexes(isOpen);
  }

  function updateButtonLabel(): void {
    const label = button.querySelector('.theme-selector-sort-label');
    if (label) {
      label.textContent = getSortLabel(currentConfig);
    }
  }

  function updateSort(config: ThemeSortConfig): void {
    currentConfig = { ...config };
    updateSelectedState();
    updateButtonLabel();
  }

  function destroy(): void {
    button.removeEventListener('click', handleButtonClick);
    button.removeEventListener('keydown', handleButtonKeydown);
    menu.removeEventListener('keydown', handleMenuKeydown);
    document.removeEventListener('click', handleClickOutside);
  }

  return { container, trigger: button, updateSort, destroy };
}
