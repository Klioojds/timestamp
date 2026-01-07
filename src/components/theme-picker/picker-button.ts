/**
 * Theme Switcher - accessible button that opens modal for runtime theme switching.
 * Modal is lazy-loaded on first click.
 */

import '../../styles/components/countdown-ui.css';

import type { ThemeId } from '@core/types';
import { createIcon, createIconButton } from '@core/utils/dom';
import { ICON_SIZES } from '@core/utils/dom';
import { getThemeDisplayName as getThemeDisplayNameFromRegistry } from '@themes/registry';

import type { ModalController } from './picker-modal';

const THEME_SWITCHER_ICON_SIZE = ICON_SIZES.LG;
const THEME_SWITCHER_BUTTON_TEXT = 'Switch Theme';
const THEME_SWITCHER_ICON_LABEL = 'Theme palette';

/**
 * Options for creating a theme switcher.
 */
export interface ThemeSwitcherOptions {
  initialTheme: ThemeId;
  onSwitch: (newTheme: ThemeId) => void | Promise<void>;
}

/**
 * Theme switcher controller interface.
 */
export interface ThemeSwitcherController {
  /** Remove the switcher and clean up */
  destroy: () => void;
  /** Update the displayed theme state */
  setTheme: (theme: ThemeId) => void;
}

/**
 * Build accessible label with current theme name.
 * @param themeId - Theme identifier
 * @returns Label string with current theme
 */
const buildThemeSwitchLabel = (themeId: ThemeId): string =>
  `${THEME_SWITCHER_BUTTON_TEXT}. Current: ${getThemeDisplayNameFromRegistry(themeId)}`;

/**
 * Create theme picker button that opens modal.
 * @param container - Element to append button to
 * @param options - Initial theme and switch callback
 * @returns Controller for button lifecycle
 * @remarks Modal lazy-loaded on first click for performance
 */
export function createThemePicker(
  container: HTMLElement,
  options: ThemeSwitcherOptions
): ThemeSwitcherController {
  let currentTheme = options.initialTheme;
  let modalController: ModalController | null = null;

  const buttonLabel = document.createElement('span');
  buttonLabel.textContent = THEME_SWITCHER_BUTTON_TEXT;
  buttonLabel.className = 'theme-switcher__label';

  const buttonIcon = createIcon({
    name: 'paintbrush',
    size: THEME_SWITCHER_ICON_SIZE as 16,
    label: THEME_SWITCHER_ICON_LABEL,
  });

  function updateButtonState(): void {
    button.setAttribute('aria-label', buildThemeSwitchLabel(currentTheme));
  }

  async function handleClick(): Promise<void> {
    const { createThemePickerModal } = await import('./picker-modal');
    
    modalController = createThemePickerModal({
      currentTheme,
      onSelect: async (newTheme) => {
        currentTheme = newTheme;
        updateButtonState();
        await options.onSwitch(newTheme);
        modalController?.close();
      },
      onClose: () => {
        modalController = null;
      },
    });

    modalController.open();
  }

  const button = createIconButton({
    testId: 'theme-switcher',
    label: buildThemeSwitchLabel(currentTheme),
    icon: buttonIcon,
    className: 'countdown-button theme-switcher',
    onClick: handleClick,
  });

  button.appendChild(buttonLabel);

  updateButtonState();
  container.appendChild(button);

  return {
    destroy(): void {
      if (modalController) {
        modalController.destroy();
        modalController = null;
      }
      button.removeEventListener('click', handleClick);
      button.remove();
    },

    setTheme(theme: ThemeId): void {
      currentTheme = theme;
      updateButtonState();
    },
  };
}
