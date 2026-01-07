/**
 * Shared constants for the timezone selector component.
 */

/**
 * CSS selector matching all timezone option buttons in the dropdown.
 */
export const DROPDOWN_OPTION_SELECTOR = '.dropdown-option';

/**
 * Data attribute storing the selected timezone value on option buttons.
 */
export const DATA_VALUE_ATTRIBUTE = 'data-value';

/**
 * Labels shown for each grouped section within the dropdown list.
 */
export const GROUP_LABELS = {
  celebrating: '🎉 Celebrating',
  userZone: '📍 Your Timezone',
  featured: 'Featured',
  others: 'All Timezones',
} as const;

/**
 * Message displayed when no timezone options match the current search.
 */
export const EMPTY_STATE_MESSAGE = 'No timezones found';

/**
 * Ordered sequence of group keys used to render the dropdown list deterministically.
 */
export const GROUP_RENDER_ORDER = [
  'celebrating',
  'userZone',
  'featured',
  'others',
] as const;

/**
 * Union type for the available option group keys.
 */
export type GroupKey = (typeof GROUP_RENDER_ORDER)[number];