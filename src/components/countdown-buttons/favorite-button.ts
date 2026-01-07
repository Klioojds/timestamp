/**
 * Favorite Button Component
 * Allows users to favorite the currently active theme from the countdown view.
 */

import '../../styles/components/countdown-ui.css';

import { isFavorite, toggleFavorite } from '@core/preferences';
import type { ThemeId } from '@core/types';
import { createIcon, createIconButton, ICON_SIZES } from '@core/utils/dom';

/** Options for creating a favorite button. */
export interface FavoriteButtonOptions {
  /** Current theme identifier */
  themeId: ThemeId;
  /** Callback invoked when favorite status changes */
  onChange?: (isFavorite: boolean) => void;
}

/** Favorite button controller interface. */
export interface FavoriteButtonController {
  /** Get the button element */
  getElement(): HTMLButtonElement;
  /** Update the button for a new theme */
  setTheme(themeId: ThemeId): void;
  /** Remove the button and clean up */
  destroy(): void;
}

function createHeartIcon(filled: boolean): SVGSVGElement {
  return createIcon({
    name: filled ? 'heart-fill' : 'heart',
    size: ICON_SIZES.LG,
  });
}

function updateButtonState(button: HTMLButtonElement, favorited: boolean): void {
  button.setAttribute('aria-pressed', favorited.toString());
  button.setAttribute('aria-label', favorited ? 'Remove from favorites' : 'Add to favorites');
  
  const oldIcon = button.querySelector('svg');
  const newIcon = createHeartIcon(favorited);
  
  if (oldIcon) {
    button.replaceChild(newIcon, oldIcon);
  } else {
    button.appendChild(newIcon);
  }
}

/** Create favorite button for current theme. @returns Controller with getElement, setTheme, and destroy methods */
export function createFavoriteButton(
  options: FavoriteButtonOptions
): FavoriteButtonController {
  let currentThemeId = options.themeId;
  
  const initialFavoriteState = isFavorite(currentThemeId);
  const initialIcon = createHeartIcon(initialFavoriteState);

  const button = createIconButton({
    testId: 'favorite-button',
    label: initialFavoriteState ? 'Remove from favorites' : 'Add to favorites',
    icon: initialIcon,
    className: 'countdown-button favorite-button',
  });

  updateButtonState(button, initialFavoriteState);

  function handleClick(): void {
    const result = toggleFavorite(currentThemeId);
    updateButtonState(button, result.isFavorite);
    options.onChange?.(result.isFavorite);
  }

  button.addEventListener('click', handleClick);

  return {
    getElement(): HTMLButtonElement {
      return button;
    },

    setTheme(themeId: ThemeId): void {
      currentThemeId = themeId;
      const favorited = isFavorite(themeId);
      updateButtonState(button, favorited);
    },

    destroy(): void {
      button.removeEventListener('click', handleClick);
      button.remove();
    },
  };
}
