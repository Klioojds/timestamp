/** Favorites utility module for managing user's favorite themes. */

import type { ThemeId } from '@themes/registry';
import { isValidThemeId } from '@themes/registry';

/** Maximum number of favorite themes allowed. @public */
export const MAX_FAVORITES = 10;

const FAVORITES_KEY = 'countdown:favorites';

/** Result of attempting to add a favorite. @public */
export interface AddFavoriteResult {
  added: boolean;
  limitReached?: boolean;
}

/** Safe localStorage read with JSON parsing and validation. @internal */
function readFavorites(): ThemeId[] {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as unknown[];
    // NOTE: Filter out invalid theme IDs to handle registry changes
    return parsed.filter((item): item is ThemeId => isValidThemeId(item));
  } catch (error) {
    console.warn('Failed to read favorites from localStorage:', error);
    return [];
  }
}

/** Safe localStorage write. Returns true on success. @internal */
function writeFavorites(favorites: ThemeId[]): boolean {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    return true;
  } catch (error) {
    console.warn('Failed to save favorites to localStorage:', error);
    return false;
  }
}

/** Get all favorite theme IDs. @public */
export function getFavorites(): ThemeId[] {
  return readFavorites();
}

/** Check if a theme is a favorite. @public */
export function isFavorite(themeId: ThemeId): boolean {
  return readFavorites().includes(themeId);
}

/** Toggle favorite status for a theme. @public */
export function toggleFavorite(themeId: ThemeId): AddFavoriteResult & { isFavorite: boolean } {
  const favorites = readFavorites();
  const index = favorites.indexOf(themeId);

  if (index >= 0) {
    // Remove existing favorite
    favorites.splice(index, 1);
    const success = writeFavorites(favorites);
    return { added: false, isFavorite: !success };
  }

  // Add new favorite (check limit)
  if (favorites.length >= MAX_FAVORITES) {
    return { added: false, limitReached: true, isFavorite: false };
  }

  favorites.push(themeId);
  const success = writeFavorites(favorites);
  return { added: success, isFavorite: success };
}
