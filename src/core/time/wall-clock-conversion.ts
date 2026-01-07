/**
 * Wall-Clock Conversion Utilities
 * Single source of truth for wall-clock → Date conversions.
 */

import type { WallClockTime } from '@core/types';

import { getTimezoneOffsetMinutes } from './timezone';

/**
 * Convert a wall-clock time to an absolute Date for a specific timezone.
 * @param wallClock - Abstract wall-clock time components
 * @param timezone - IANA timezone identifier
 * @returns Date representing when that wall-clock time occurs in the timezone
 * @public
 */
export function convertWallClockToAbsolute(
  wallClock: WallClockTime,
  timezone: string
): Date {
  const { year, month, day, hours, minutes, seconds } = wallClock;
  const utcGuess = Date.UTC(year, month, day, hours, minutes, seconds, 0);
  const offsetMinutes = getTimezoneOffsetMinutes(timezone, new Date(utcGuess));
  const targetUtcMs = utcGuess - offsetMinutes * 60 * 1000;
  return new Date(targetUtcMs);
}

/**
 * Check if a timezone has already reached a target wall-clock time.
 * @param wallClock - Wall-clock time to check
 * @param timezone - IANA timezone identifier
 * @param referenceDate - Optional reference date (defaults to now)
 * @returns true if the timezone's local clock has passed the target time
 * @public
 */
export function hasWallClockTimeReached(
  wallClock: WallClockTime,
  timezone: string,
  referenceDate?: Date
): boolean {
  const targetInTimezone = convertWallClockToAbsolute(wallClock, timezone);
  const now = referenceDate ?? new Date();
  return now.getTime() >= targetInTimezone.getTime();
}

/**
 * Create a WallClockTime from Date using LOCAL browser timezone components.
 * @param date - Date with LOCAL time components representing wall-clock
 * @returns WallClockTime object with local time components
 * @public
 */
export function extractWallClockFromLocalDate(date: Date): WallClockTime {
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate(),
    hours: date.getHours(),
    minutes: date.getMinutes(),
    seconds: date.getSeconds(),
  };
}

/**
 * Format a WallClockTime as an ISO-like string WITHOUT Z suffix.
 * @param wallClock - Wall-clock time to format
 * @returns String like "2026-01-01T00:00:00" (no Z suffix)
 * @public
 */
export function formatWallClockForUrl(wallClock: WallClockTime): string {
  const { year, month, day, hours, minutes, seconds } = wallClock;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${year}-${pad(month + 1)}-${pad(day)}T${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/** Create WallClockTime from components. @internal */
export function createWallClock(
  year: number,
  month: number,
  day: number,
  hours: number = 0,
  minutes: number = 0,
  seconds: number = 0
): WallClockTime {
  return { year, month, day, hours, minutes, seconds };
}

/**
 * Create a WallClockTime for the next occurrence of a specific month/day/time.
 * @param month - Target month (0-11)
 * @param day - Target day (1-31)
 * @param hours - Target hours (0-23)
 * @param minutes - Target minutes (0-59)
 * @param seconds - Target seconds (0-59)
 * @param referenceDate - Reference date
 * @returns WallClockTime for next occurrence
 * @public
 */
export function createNextOccurrence(
  month: number,
  day: number,
  hours: number = 0,
  minutes: number = 0,
  seconds: number = 0,
  referenceDate: Date = new Date()
): WallClockTime {
  const currentYear = referenceDate.getFullYear();
  const thisYearDate = new Date(currentYear, month, day, hours, minutes, seconds);
  // NOTE: Use next year if target has already passed this year
  const targetYear = thisYearDate.getTime() > referenceDate.getTime() 
    ? currentYear 
    : currentYear + 1;
  
  return createWallClock(targetYear, month, day, hours, minutes, seconds);
}

/**
 * Validate that a WallClockTime has reasonable values.
 * @param wallClock - Wall-clock time to validate
 * @returns true if all components are within valid ranges
 * @public
 */
export function isValidWallClockTime(wallClock: WallClockTime): boolean {
  const { year, month, day, hours, minutes, seconds } = wallClock;
  return (
    year >= 1970 &&
    year <= 9999 &&
    month >= 0 &&
    month <= 11 &&
    day >= 1 &&
    day <= 31 &&
    hours >= 0 &&
    hours <= 23 &&
    minutes >= 0 &&
    minutes <= 59 &&
    seconds >= 0 &&
    seconds <= 59
  );
}

/**
 * Compare two WallClockTime objects for equality.
 * @param a - First wall-clock time
 * @param b - Second wall-clock time
 * @returns true if all components match
 * @public
 */
export function wallClockEquals(a: WallClockTime, b: WallClockTime): boolean {
  return (
    a.year === b.year &&
    a.month === b.month &&
    a.day === b.day &&
    a.hours === b.hours &&
    a.minutes === b.minutes &&
    a.seconds === b.seconds
  );
}

/**
 * Validate that a timezone string is a valid IANA identifier.
 * @param timezone - Timezone string to validate
 * @returns Valid IANA timezone identifier (falls back to 'UTC')
 * @public
 */
export function ensureValidTimezone(
  timezone: string | undefined | null
): string {
  if (!timezone) return 'UTC';

  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return timezone;
  } catch {
    if (import.meta.env?.DEV) {
      console.warn(`Invalid timezone "${timezone}", falling back to UTC`);
    }
    return 'UTC';
  }
}
