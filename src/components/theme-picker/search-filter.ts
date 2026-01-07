/** Search filter - handles search filtering and results count announcements. */

import {
    getThemeAuthor,
    getThemeDisplayName,
    getThemeIds,
} from '@themes/registry';

import type { ThemeSelectorState } from './types';

/**
 * Filter themes based on search query.
 * @param state - Theme selector state (mutates filteredThemes property)
 * @remarks Searches name and author (accepts with or without \@ prefix)
 */
export function filterThemes(state: ThemeSelectorState): void {
  const allThemes = getThemeIds();

  if (state.searchQuery === '') {
    state.filteredThemes = allThemes;
  } else {
    const normalizedQuery = state.searchQuery.replace(/^@/, '');

    state.filteredThemes = allThemes.filter((themeId) => {
      const name = getThemeDisplayName(themeId).toLowerCase();
      const author = getThemeAuthor(themeId)?.toLowerCase() ?? '';
      return name.includes(normalizedQuery) || author.includes(normalizedQuery);
    });
  }
}

/**
 * Get results count announcement text for screen readers.
 * @param state - Theme selector state
 * @returns Formatted count text (e.g., "5 themes found")
 */
export function getResultsCountText(state: ThemeSelectorState): string {
  const count = state.filteredThemes.length;
  const totalCount = getThemeIds().length;

  if (state.searchQuery === '') {
    return `${totalCount} themes available`;
  } else {
    return `${count} ${count === 1 ? 'theme' : 'themes'} found`;
  }
}

/**
 * Handle search input change.
 * @param searchInput - Search input element
 * @param state - Theme selector state (mutates searchQuery and focusedIndex)
 */
export function handleSearchInput(
  searchInput: HTMLInputElement | null,
  state: ThemeSelectorState
): void {
  if (!searchInput) return;
  state.searchQuery = searchInput.value.trim().toLowerCase();
  state.focusedIndex = -1;
}
