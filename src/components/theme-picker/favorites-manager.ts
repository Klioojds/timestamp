/** Favorites manager - handles favorite toggle operations and limit announcements. */

import {
  getFavorites,
  isFavorite,
  MAX_FAVORITES,
  toggleFavorite,
} from '@core/preferences';
import type { ThemeId } from '@core/types';
import { getIconSvg } from '@core/utils/dom';

export interface FavoriteToggleResult {
  isFavorite: boolean;
  limitReached: boolean;
  announcement: string | null;
}

/**
 * Get current list of favorite theme IDs.
 * @returns Array of favorited theme IDs
 */
export function getCurrentFavorites(): ThemeId[] {
  return getFavorites();
}

/**
 * Check if theme is favorited.
 * @param themeId - Theme identifier
 * @returns True if theme is in favorites list
 */
export function isThemeFavorite(themeId: ThemeId): boolean {
  return isFavorite(themeId);
}

/**
 * Toggle favorite status for a theme.
 * @param themeId - Theme identifier
 * @returns Result with isFavorite, limitReached, and announcement
 */
export function toggleThemeFavorite(themeId: ThemeId): FavoriteToggleResult {
  const result = toggleFavorite(themeId);

  return {
    isFavorite: result.isFavorite,
    limitReached: result.limitReached ?? false,
    announcement: result.limitReached
      ? `Maximum ${MAX_FAVORITES} favorites reached. Remove a favorite to add more.`
      : null,
  };
}

/**
 * Get SVG markup for favorite heart icon.
 * @param filled - Whether to show filled or outline heart
 * @returns SVG string
 */
export function getFavoriteHeartSVG(filled: boolean): string {
  return getIconSvg(filled ? 'heart-fill' : 'heart', 16);
}
