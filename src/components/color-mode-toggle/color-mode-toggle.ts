/**
 * Color mode toggle component for light/dark/system mode selection.
 * Provides a three-state toggle with keyboard navigation and ARIA radio group pattern.
 */

import {
    getColorModePreference,
    setColorModePreference,
    subscribeToSystemMode,
} from '@core/preferences/color-mode';
import type { ColorMode } from '@core/types';
import { createIcon, ICON_SIZES } from '@core/utils/dom';
import { cloneTemplate } from '@core/utils/dom/template-utils';
import type { IconName } from '@core/utils/icons';

/** Event dispatched when user changes color mode preference. */
export const COLOR_MODE_CHANGE_EVENT = 'color-mode-change';

const SELECTED_CLASS = 'color-mode-toggle-option--selected';

/** WeakMap to store cleanup functions for toggle elements. */
const cleanupRegistry = new WeakMap<HTMLElement, () => void>();

/** Detail payload for color mode change events. */
export interface ColorModeChangeDetail {
  mode: ColorMode;
}

/** Arrow key navigation direction map: key -\> index delta (with wrapping handled separately) */
const ARROW_KEY_DELTA: Record<string, number> = {
  ArrowLeft: -1,
  ArrowUp: -1,
  ArrowRight: 1,
  ArrowDown: 1,
};

/** Mode option configuration for icons. */
const MODE_ICONS: Record<ColorMode, IconName> = {
  light: 'sun',
  dark: 'moon',
  system: 'device-desktop',
};

/** Create color mode toggle component with three-state radio group (light/dark/system). @returns Toggle element */
export function createColorModeToggle(): HTMLElement {
  const currentMode = getColorModePreference();

  const container = cloneTemplate<HTMLElement>('color-mode-toggle-template');
  const radioGroup = container.querySelector('.color-mode-toggle-group') as HTMLElement;
  const buttons = container.querySelectorAll('.color-mode-toggle-option') as NodeListOf<HTMLButtonElement>;

  const radioButtons: Array<{ button: HTMLButtonElement; mode: ColorMode }> = [];

  buttons.forEach((button) => {
    const mode = button.dataset.mode as ColorMode;
    const iconName = MODE_ICONS[mode];
    const isSelected = mode === currentMode;

    // Inject icon (must be done via JS as SVGs are dynamic)
    const icon = createIcon({
      name: iconName,
      size: ICON_SIZES.MD as 16,
      className: 'color-mode-toggle-icon',
    });
    const label = button.querySelector('.color-mode-toggle-label') as HTMLSpanElement;
    button.insertBefore(icon, label);

    // Set aria-label for accessibility
    button.setAttribute('aria-label', `${label.textContent} mode`);
    button.setAttribute('aria-checked', isSelected ? 'true' : 'false');
    // Roving tabindex: only checked button is focusable
    button.setAttribute('tabindex', isSelected ? '0' : '-1');

    if (isSelected) {
      button.classList.add(SELECTED_CLASS);
    }

    radioButtons.push({ button, mode });
  });

  const dispatchColorModeChange = (mode: ColorMode): void => {
    container.dispatchEvent(
      new CustomEvent<ColorModeChangeDetail>(COLOR_MODE_CHANGE_EVENT, {
        detail: { mode },
        bubbles: true,
      })
    );
  };

  /** Update the selected mode in the UI. */
  const updateSelectedMode = (newMode: ColorMode): void => {
    for (const { button, mode } of radioButtons) {
      const isSelected = mode === newMode;
      button.setAttribute('aria-checked', String(isSelected));
      button.classList.toggle(SELECTED_CLASS, isSelected);
      // Update roving tabindex: only selected button is focusable
      button.setAttribute('tabindex', isSelected ? '0' : '-1');
    }
  };

  /** Handle mode change (click or keyboard selection). */
  const handleModeChange = (newMode: ColorMode): void => {
    setColorModePreference(newMode);
    updateSelectedMode(newMode);
    dispatchColorModeChange(newMode);
  };

  /** Handle keyboard navigation within the radio group. */
  const handleKeyDown = (event: KeyboardEvent): void => {
    const target = event.target as HTMLElement;
    if (!target.classList.contains('color-mode-toggle-option')) return;

    // Handle selection keys
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleModeChange(target.dataset.mode as ColorMode);
      return;
    }

    // Handle arrow key navigation with wrapping
    const delta = ARROW_KEY_DELTA[event.key];
    if (delta === undefined) return;

    event.preventDefault();
    const currentIndex = radioButtons.findIndex(({ button }) => button === target);
    const nextIndex = (currentIndex + delta + radioButtons.length) % radioButtons.length;
    radioButtons[nextIndex].button.focus();
  };

  /** Handle click on a mode option. */
  const handleClick = (event: Event): void => {
    const button = (event.target as HTMLElement).closest(
      '.color-mode-toggle-option'
    ) as HTMLButtonElement | null;
    if (button) {
      handleModeChange(button.dataset.mode as ColorMode);
    }
  };

  radioGroup.addEventListener('click', handleClick);
  radioGroup.addEventListener('keydown', handleKeyDown);

  // Re-dispatch event when system preference changes (only affects 'system' mode)
  const unsubscribe = subscribeToSystemMode(() => {
    if (getColorModePreference() === 'system') {
      dispatchColorModeChange('system');
    }
  });

  // Store cleanup function in WeakMap for type-safe retrieval
  cleanupRegistry.set(container, () => {
    unsubscribe();
    radioGroup.removeEventListener('click', handleClick);
    radioGroup.removeEventListener('keydown', handleKeyDown);
  });

  return container;
}

/** Destroy a color mode toggle and clean up event listeners. */
export function destroyColorModeToggle(toggle: HTMLElement): void {
  const cleanup = cleanupRegistry.get(toggle);
  if (cleanup) {
    cleanup();
    cleanupRegistry.delete(toggle);
  }
  toggle.remove();
}
