/**
 * Timezone Options Builder
 * Extracted from timezone-selector.ts for organization and testing.
 * Handles building timezone options with celebration detection.
 */

import { FEATURED_CITIES, findCityByTimezone } from '@app/data/cities';
import { formatOffsetLabel, getAllTimezones } from '@core/time/timezone';
import { hasWallClockTimeReached } from '@core/time/wall-clock-conversion';
import type { WallClockTime } from '@core/types';

/**
 * Represents a timezone option in the dropdown
 */
export interface TimezoneOption {
  /** IANA timezone identifier */
  value: string;
  /** Formatted display label with offset */
  label: string;
  /** City name if timezone matches a featured city */
  city?: string;
  /** Whether this is a featured timezone */
  isFeatured: boolean;
  /** Whether this is the user's current timezone */
  isUserZone: boolean;
  /** Whether this timezone has already reached the target time */
  isCelebrating: boolean;
}

/**
 * Format a timezone for display.
 * @param timezone - IANA timezone identifier
 * @returns Formatted string like "New York (UTC-5)"
 * @remarks Shows city name extracted from timezone ID with UTC offset
 */
export function formatTimezoneLabel(timezone: string): string {
  const city = timezone.split('/').pop()?.replace(/_/g, ' ') ?? timezone;
  const offset = formatOffsetLabel(timezone, 'UTC');
  // NOTE: formatOffsetLabel returns "Your timezone" when tz === reference,
  // but we always want "UTC" in labels for consistency across selector options
  return `${city} (${offset.replace('Your timezone', 'UTC')})`;
}

/**
 * Build the list of timezone options.
 * @param userTimezone - User's local timezone
 * @param wallClockTarget - Target wall-clock time (optional)
 * @returns Array of timezone options with celebration status
 * @remarks Uses wall-clock time model for celebration detection when target provided
 */
export function buildTimezoneOptions(
  userTimezone: string,
  wallClockTarget?: WallClockTime
): TimezoneOption[] {
  const allTimezones = getAllTimezones();
  const featuredSet = new Set(FEATURED_CITIES.map((c) => c.timezone));

  return allTimezones.map((timezoneId) => {
    const featuredCity = findCityByTimezone(timezoneId);
    return {
      value: timezoneId,
      label: formatTimezoneLabel(timezoneId),
      city: featuredCity?.name,
      isFeatured: featuredSet.has(timezoneId),
      isUserZone: timezoneId === userTimezone,
      // NOTE: Skip celebration detection when no target (e.g., landing page form)
      // to avoid unnecessary computation and highlight-only behavior
      isCelebrating: wallClockTarget
        ? hasWallClockTimeReached(wallClockTarget, timezoneId)
        : false,
    };
  });
}

/**
 * Group options by category (celebrating, user zone, featured, others).
 * @param options - Array of timezone options
 * @returns Object with categorized option arrays
 */
export function groupOptions(options: TimezoneOption[]): {
  celebrating: TimezoneOption[];
  userZone: TimezoneOption[];
  featured: TimezoneOption[];
  others: TimezoneOption[];
} {
  return {
    // NOTE: Only featured timezones shown in celebrating group to keep list manageable
    celebrating: options.filter((option) => option.isCelebrating && option.isFeatured),
    userZone: options.filter((option) => option.isUserZone),
    featured: options.filter(
      (option) => option.isFeatured && !option.isCelebrating && !option.isUserZone
    ),
    others: options.filter((option) => !option.isFeatured && !option.isUserZone),
  };
}

/**
 * Get display text for an option.
 * @param option - Timezone option
 * @returns City name if available, otherwise label
 */
export function getOptionDisplayText(option: TimezoneOption): string {
  return option.city ?? option.label;
}
