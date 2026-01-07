/**
 * Timezone Selector DOM Builders
 * Extracted from timezone-selector.ts for organization and testing.
 * Handles DOM element construction for the dropdown.
 */

import '../../styles/components/timezone-selector.css';

import { formatOffsetLabel } from '@core/time/timezone';
import type { ThemeStyles } from '@core/types';
import { createIcon, ICON_SIZES } from '@core/utils/dom';
import { cloneTemplate } from '@core/utils/dom/template-utils';

import type { TimezoneOption } from './options';

const CHEVRON_ICON_SIZE = ICON_SIZES.MD;

interface SelectorDomRefs {
  trigger: HTMLButtonElement;
  dropdown: HTMLElement;
  searchInput: HTMLInputElement;
  listContainer: HTMLElement;
  valueDisplay: HTMLElement;
}

/**
 * Build and append the DOM structure for timezone selector from template.
 * @param wrapper - Component wrapper element
 * @param inline - Whether to render inline (forms) instead of fixed (overlays)
 * @returns References to key DOM nodes
 * @remarks Position variant determines dropdown placement
 */
export function buildSelectorDOM(
  wrapper: HTMLElement,
  inline: boolean
): SelectorDomRefs {
  // NOTE: Position variant determines dropdown placement - inline for forms, fixed for overlays
  wrapper.classList.add(inline ? 'timezone-selector-wrapper--inline' : 'timezone-selector-wrapper--fixed');

  const selectorContainer = cloneTemplate<HTMLElement>('timezone-selector-template');

  const trigger = selectorContainer.querySelector('.timezone-selector-trigger') as HTMLButtonElement;
  const dropdown = selectorContainer.querySelector('.timezone-dropdown') as HTMLElement;
  const searchInput = selectorContainer.querySelector('.search-input') as HTMLInputElement;
  const listContainer = selectorContainer.querySelector('.dropdown-list') as HTMLElement;
  const valueDisplay = selectorContainer.querySelector('.selector-value') as HTMLElement;

  // NOTE: Chevron SVG must be injected via JS (not available in HTML template)
  const chevronIcon = createIcon({
    name: 'chevron-down',
    size: CHEVRON_ICON_SIZE as 16,
    className: 'selector-chevron',
  });
  trigger.appendChild(chevronIcon);

  // Set aria-label for accessibility
  trigger.setAttribute('aria-label', 'Toggle timezone selector');

  wrapper.appendChild(selectorContainer);

  return {
    trigger,
    dropdown,
    searchInput,
    listContainer,
    valueDisplay,
  };
}

/**
 * Build HTML for a single timezone option.
 * @param option - Timezone option data
 * @param index - Index for generating unique ID
 * @param currentSelection - Currently selected timezone value
 * @param userTimezone - User's local timezone for offset calculation
 * @returns HTML string for the option button
 */
export function buildOptionHTML(
  option: TimezoneOption,
  index: number,
  currentSelection: string,
  userTimezone: string
): string {
  const isSelected = option.value === currentSelection;
  const optionId = `tz-option-${index}`;
  const displayText = option.city ?? option.label;
  const offset = formatOffsetLabel(option.value, userTimezone);

  return `
    <button 
      class="dropdown-option ${isSelected ? 'selected' : ''}"
      data-value="${option.value}"
      id="${optionId}"
      role="option"
      aria-selected="${isSelected}"
    >
      <span class="option-indicator ${option.isCelebrating ? 'celebrating' : ''}"></span>
      <span class="option-label">${displayText}</span>
      <span class="option-offset">${offset}</span>
    </button>
  `;
}

/**
 * Apply theme styles to wrapper element.
 * @param wrapper - Wrapper element
 * @param styles - Theme style overrides (CSS custom properties)
 */
export function applyThemeStyles(
  wrapper: HTMLElement,
  styles: ThemeStyles
): void {
  Object.entries(styles).forEach(([key, value]) => {
    wrapper.style.setProperty(key, value);
  });
}
