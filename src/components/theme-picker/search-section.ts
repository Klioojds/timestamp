/**
 * Search Section Builder - builds search input and results count elements.
 * @remarks Templates defined in index.html for consistent DOM structure
 */

import { cloneTemplate } from '@core/utils/dom';

/**
 * Build search section element.
 * @param onInput - Search input change callback
 * @param onKeydown - Keyboard navigation callback
 * @returns Section element and search input reference
 */
export function buildSearchSection(
  onInput: () => void,
  onKeydown: (e: KeyboardEvent) => void
): { section: HTMLElement; searchInput: HTMLInputElement } {
  const section = cloneTemplate<HTMLElement>('search-section-template');
  const searchInput = section.querySelector<HTMLInputElement>('#theme-search');

  if (!searchInput) {
    throw new Error('Search input not found in template');
  }

  searchInput.addEventListener('input', onInput);
  searchInput.addEventListener('keydown', onKeydown);

  return { section, searchInput };
}

/**
 * Build results count element (aria-live region).
 * @returns Live region element cloned from template
 */
export function buildResultsCount(): HTMLElement {
  return cloneTemplate<HTMLElement>('results-count-template');
}
