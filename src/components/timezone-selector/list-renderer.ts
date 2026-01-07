/**
 * Timezone Selector List Renderer
 * Extracted from timezone-selector.ts for organization and testing.
 * Handles list rendering, grouping, and empty states.
 */

import {
  EMPTY_STATE_MESSAGE,
  GROUP_LABELS,
  GROUP_RENDER_ORDER,
  type GroupKey,
} from './constants';
import { buildOptionHTML } from './dom-builders';
import { groupOptions, type TimezoneOption } from './options';

/**
 * Render a group of options with a label.
 * @param options - Array of timezone options
 * @param label - Group label text
 * @param startIndex - Starting index for option IDs
 * @param currentSelection - Currently selected timezone
 * @param userTimezone - User's local timezone
 * @returns HTML string and updated index after this group
 * @internal
 */
function renderGroup(
  options: TimezoneOption[],
  label: string,
  startIndex: number,
  currentSelection: string,
  userTimezone: string
): { html: string; nextIndex: number } {
  if (options.length === 0) {
    return { html: '', nextIndex: startIndex };
  }

  let currentIndex = startIndex;
  const optionsHtml = options
    .map((option) => {
      const html = buildOptionHTML(option, currentIndex, currentSelection, userTimezone);
      currentIndex++;
      return html;
    })
    .join('');

  // NOTE: Label from GROUP_LABELS constant is safe (no user input)
  // CRITICAL: If this changes to accept user input, add HTML escaping
  const html = `<div class="dropdown-group">
    <div class="group-label">${label}</div>
    ${optionsHtml}
  </div>`;

  return { html, nextIndex: currentIndex };
}

/** Render the empty state when no options match the search. @returns HTML string @internal */
function renderEmptyState(): string {
  return `<div class="dropdown-empty">${EMPTY_STATE_MESSAGE}</div>`;
}

/**
 * Render the complete dropdown list with grouped options.
 * @param filteredOptions - Filtered array of timezone options
 * @param currentSelection - Currently selected timezone
 * @param userTimezone - User's local timezone
 * @returns HTML string for the complete list
 */
export function renderList(
  filteredOptions: TimezoneOption[],
  currentSelection: string,
  userTimezone: string
): string {
  if (filteredOptions.length === 0) {
    return renderEmptyState();
  }

  const groups = groupOptions(filteredOptions);
  let html = '';
  let globalIndex = 0;

  GROUP_RENDER_ORDER.forEach((groupKey: GroupKey) => {
    const groupResult = renderGroup(
      groups[groupKey],
      GROUP_LABELS[groupKey],
      globalIndex,
      currentSelection,
      userTimezone
    );
    html += groupResult.html;
    globalIndex = groupResult.nextIndex;
  });

  return html;
}
