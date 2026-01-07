/** Theme sorting - handles sorting themes by name, author, or publish date. */

import type { ThemeId } from '@core/types';
import {
  getThemeAuthor,
  getThemeDisplayName,
  getThemePublishedDate,
} from '@themes/registry';

import type { ThemeSortConfig, ThemeSortField } from './types';

/**
 * Sort themes based on configuration.
 * @param themes - Array of theme IDs to sort
 * @param config - Sort field and direction
 * @returns New array of sorted theme IDs (does not mutate original)
 */
export function sortThemes(
  themes: ThemeId[],
  config: ThemeSortConfig
): ThemeId[] {
  if (themes.length <= 1) {
    return [...themes];
  }

  const sorted = [...themes].sort((a, b) => {
    const comparison = compareThemes(a, b, config.field);
    return config.direction === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

/**
 * Compare two themes based on specified field.
 * @param a - First theme ID
 * @param b - Second theme ID
 * @param field - Field to compare by
 * @returns Sort order (-1, 0, 1)
 */
function compareThemes(a: ThemeId, b: ThemeId, field: ThemeSortField): number {
  switch (field) {
    case 'name':
      return compareByName(a, b);
    case 'author':
      return compareByAuthor(a, b);
    case 'date':
      return compareByDate(a, b);
    default:
      return 0;
  }
}

/**
 * Compare themes by display name (case-insensitive).
 * @param a - First theme ID
 * @param b - Second theme ID
 * @returns Sort order (-1, 0, 1)
 */
function compareByName(a: ThemeId, b: ThemeId): number {
  const nameA = getThemeDisplayName(a).toLowerCase();
  const nameB = getThemeDisplayName(b).toLowerCase();
  return nameA.localeCompare(nameB);
}

/**
 * Compare themes by author name.
 * @param a - First theme ID
 * @param b - Second theme ID
 * @returns Sort order (null authors sorted last in ascending order)
 */
function compareByAuthor(a: ThemeId, b: ThemeId): number {
  const authorA = getThemeAuthor(a);
  const authorB = getThemeAuthor(b);

  if (authorA === null && authorB === null) return 0;
  if (authorA === null) return 1;
  if (authorB === null) return -1;

  return authorA.toLowerCase().localeCompare(authorB.toLowerCase());
}

/**
 * Compare themes by publish date.
 * @param a - First theme ID
 * @param b - Second theme ID
 * @returns Sort order by timestamp
 */
function compareByDate(a: ThemeId, b: ThemeId): number {
  const dateA = new Date(getThemePublishedDate(a));
  const dateB = new Date(getThemePublishedDate(b));
  return dateA.getTime() - dateB.getTime();
}

/**
 * Get default sort configuration (name, ascending).
 * @returns Default sort config
 */
export function getDefaultSortConfig(): ThemeSortConfig {
  return {
    field: 'name',
    direction: 'asc',
  };
}

/**
 * Get human-readable label for sort configuration.
 * @param config - Sort configuration
 * @returns Label like "Name (A-Z)" or "Date (Newest)"
 */
export function getSortLabel(config: ThemeSortConfig): string {
  const { field, direction } = config;

  switch (field) {
    case 'name':
      return direction === 'asc' ? 'Name (A-Z)' : 'Name (Z-A)';
    case 'author':
      return direction === 'asc' ? 'Author (A-Z)' : 'Author (Z-A)';
    case 'date':
      return direction === 'asc' ? 'Date (Oldest)' : 'Date (Newest)';
    default:
      return 'Sort';
  }
}
