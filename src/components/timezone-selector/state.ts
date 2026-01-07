/**
 * Timezone Selector State Management
 * Extracted from timezone-selector.ts for organization and testing.
 * Handles component state and filtering logic.
 */

import { getUserTimezone } from '@core/time/timezone';
import type { WallClockTime } from '@core/types';

import { buildTimezoneOptions, type TimezoneOption } from './options';

/**
 * State for the timezone selector component
 */
export interface TimezoneSelectorState {
  /** Currently selected timezone */
  currentSelection: string;
  /** Whether the dropdown is open */
  isOpen: boolean;
  /** All available timezone options */
  allOptions: TimezoneOption[];
  /** Filtered timezone options (based on search) */
  filteredOptions: TimezoneOption[];
  /** User's local timezone */
  userTimezone: string;
  /** Wall-clock target for celebration detection (optional - undefined disables celebration) */
  wallClockTarget?: WallClockTime;
}

/**
 * Create initial state for the timezone selector.
 * @param initialTimezone - Initially selected timezone (defaults to user timezone)
 * @param wallClockTarget - Wall-clock target for celebration detection (optional)
 * @returns Initial state object
 * @remarks When wallClockTarget omitted (landing page), celebration grouping is disabled
 */
export function createInitialState(
  initialTimezone?: string,
  wallClockTarget?: WallClockTime
): TimezoneSelectorState {
  const userTimezone = getUserTimezone();
  
  // NOTE: wallClockTarget optional - landing page omits it to disable celebration highlighting
  const allOptions = buildTimezoneOptions(userTimezone, wallClockTarget);

  return {
    currentSelection: initialTimezone ?? userTimezone,
    isOpen: false,
    allOptions,
    filteredOptions: allOptions,
    userTimezone,
    // NOTE: Preserve wallClockTarget for refreshOptions to maintain celebration status
    wallClockTarget,
  };
}

/**
 * Filter timezone options based on search query.
 * @param allOptions - All available timezone options
 * @param query - Search query string
 * @returns Filtered array of timezone options
 */
export function filterOptions(
  allOptions: TimezoneOption[],
  query: string
): TimezoneOption[] {
  const normalizedQuery = query.toLowerCase().trim();
  
  if (!normalizedQuery) {
    return allOptions;
  }

  return allOptions.filter(
    (option) =>
      option.value.toLowerCase().includes(normalizedQuery) ||
      option.label.toLowerCase().includes(normalizedQuery) ||
      (option.city && option.city.toLowerCase().includes(normalizedQuery))
  );
}

/**
 * Refresh options with new celebration status.
 * @param state - Current state
 * @returns New state with refreshed options
 * @remarks Called when timezone selection changes
 */
export function refreshOptions(state: TimezoneSelectorState): TimezoneSelectorState {
  const allOptions = buildTimezoneOptions(
    state.userTimezone,
    state.wallClockTarget
  );

  return {
    ...state,
    allOptions,
    filteredOptions: allOptions,
  };
}

/** Update selection. @internal */
export function updateSelection(
  state: TimezoneSelectorState,
  timezone: string
): TimezoneSelectorState {
  return {
    ...state,
    currentSelection: timezone,
  };
}

/** Open dropdown. @internal */
export function openDropdown(state: TimezoneSelectorState): TimezoneSelectorState {
  return {
    ...state,
    isOpen: true,
  };
}

/** Close dropdown and reset filter. @internal */
export function closeDropdown(state: TimezoneSelectorState): TimezoneSelectorState {
  return {
    ...state,
    isOpen: false,
    filteredOptions: state.allOptions,
  };
}

/** Apply search filter. @internal */
export function applyFilter(
  state: TimezoneSelectorState,
  query: string
): TimezoneSelectorState {
  return {
    ...state,
    filteredOptions: filterOptions(state.allOptions, query),
  };
}
