/**
 * Unified time utilities for countdown calculations.
 * Single source of truth for time formatting.
 */

import type { TimeRemaining } from '@core/types';

import { extractTimeUnitsFromMs, pluralize } from './format';

/**
 * Calculate time remaining until the target date.
 * @param target - The countdown target date
 * @returns TimeRemaining object with all time components
 * @public
 */
export function getTimeRemaining(target: Date): TimeRemaining {
  const now = Date.now();
  const total = target.getTime() - now;

  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  const { days, hours, minutes, seconds } = extractTimeUnitsFromMs(total);
  return { days, hours, minutes, seconds, total };
}

/**
 * Pad time unit to 2 digits with leading zero.
 * @param value - Time unit value (negatives clamped to 0)
 * @returns 2-character string
 * @public
 */
export function padTimeUnit(value: number): string {
  const clamped = Math.max(0, value);
  return clamped.toString().padStart(2, '0');
}

/**
 * Format time difference as DD:HH:MM:SS string.
 * @param ms - Milliseconds remaining
 * @returns Formatted string like "02:05:30:15"
 * @public
 */
export function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00:00';

  const { days, hours, minutes, seconds } = extractTimeUnitsFromMs(ms);
  return `${padTimeUnit(days)}:${padTimeUnit(hours)}:${padTimeUnit(minutes)}:${padTimeUnit(seconds)}`;
}

/**
 * Format TimeRemaining as a compact string, hiding leading zero segments.
 * @param time - TimeRemaining object
 * @returns Formatted string like "02:30:45" or "05:03"
 * @public
 */
export function formatTimeRemainingCompact(time: TimeRemaining): string {
  if (time.days === 0 && time.hours === 0) {
    return `${padTimeUnit(time.minutes)}:${padTimeUnit(time.seconds)}`;
  }
  if (time.days === 0) {
    return `${padTimeUnit(time.hours)}:${padTimeUnit(time.minutes)}:${padTimeUnit(time.seconds)}`;
  }
  return `${padTimeUnit(time.days)}:${padTimeUnit(time.hours)}:${padTimeUnit(time.minutes)}:${padTimeUnit(time.seconds)}`;
}

/**
 * Format TimeRemaining as human-readable string for accessibility.
 * @param time - TimeRemaining object
 * @returns Human-readable string like "2 days, 5 hours, 30 minutes, 15 seconds"
 * @public
 */
export function formatTimeRemainingHuman(time: TimeRemaining): string {
  const parts: string[] = [];

  if (time.days > 0) parts.push(pluralize(time.days, 'day'));
  if (time.hours > 0) parts.push(pluralize(time.hours, 'hour'));
  if (time.minutes > 0) parts.push(pluralize(time.minutes, 'minute'));
  if (time.seconds >= 0 || parts.length === 0) parts.push(pluralize(time.seconds, 'second'));

  return parts.join(', ');
}

/**
 * Format TimeRemaining as human-readable string without seconds.
 * Used for aria-label to reduce DOM churn while maintaining accuracy.
 * @param time - TimeRemaining object
 * @returns Human-readable string like "2 days, 5 hours, 30 minutes"
 * @public
 */
export function formatTimeRemainingHumanWithoutSeconds(time: TimeRemaining): string {
  const parts: string[] = [];

  if (time.days > 0) parts.push(pluralize(time.days, 'day'));
  if (time.hours > 0) parts.push(pluralize(time.hours, 'hour'));
  if (time.minutes > 0) parts.push(pluralize(time.minutes, 'minute'));
  
  if (parts.length === 0) {
    return 'less than 1 minute';
  }

  return parts.join(', ');
}

/**
 * Create target date for the next New Year (January 1st at midnight).
 * @returns Date object for next New Year
 * @public
 */
export function createNewYearTargetDate(): Date {
  const now = new Date();
  const nextYear = now.getFullYear() + 1;
  return new Date(nextYear, 0, 1, 0, 0, 0, 0);
}

/**
 * Get the year from the target date for celebration display.
 * @param targetDate - The countdown target date
 * @returns The year from the target date
 * @public
 */
export function getCelebrationYear(targetDate: Date): number {
  return targetDate.getFullYear();
}

/**
 * Determine if target date represents a New Year's midnight.
 * @param targetDate - The countdown target date
 * @returns true if this is a New Year's midnight countdown
 * @public
 */
export function isNewYearMidnight(targetDate: Date): boolean {
  return (
    targetDate.getMonth() === 0 &&
    targetDate.getDate() === 1 &&
    targetDate.getHours() === 0 &&
    targetDate.getMinutes() === 0 &&
    targetDate.getSeconds() === 0
  );
}
