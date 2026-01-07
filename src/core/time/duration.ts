/**
 * Duration parsing, formatting, and coercion utilities.
 */

import { MAX_DURATION_SECONDS } from '@/core/config/constants';

import { extractTimeUnitsFromSeconds, pluralize } from './format';

/** Format style: "short" (1d 12h 13m 0s) or "long" (1 day 12 hours...) */
export type DurationFormatStyle = 'short' | 'long';

/** Result of duration coercion from form fields. */
export interface CoercionResult {
  totalSeconds: number;
  exceedsMax: boolean;
}

/** Coerce a single field value to a non-negative integer. */
function coerceValue(value: string | number): number {
  if (typeof value === 'number') {
    return Math.max(0, Math.floor(value));
  }
  const trimmed = value.trim();
  const parsed = parseInt(trimmed, 10);
  return isNaN(parsed) || trimmed === '' ? 0 : Math.max(0, Math.floor(parsed));
}

/**
 * Coerce form field inputs to total seconds.
 * @remarks Handles strings/numbers, floors floats, treats negatives or NaN as 0, clamps to max.
 * @public
 */
export function coerceFieldsToSeconds(
  hours: string | number,
  minutes: string | number,
  seconds: string | number
): CoercionResult {
  // CRITICAL: Guard against overflow (MAX_SAFE_INTEGER / 3600)
  const MAX_UNIT = 2501999792983;
  const h = Math.min(coerceValue(hours), MAX_UNIT);
  const m = Math.min(coerceValue(minutes), MAX_UNIT);
  const s = Math.min(coerceValue(seconds), MAX_UNIT);

  let totalSeconds = h * 3600 + m * 60 + s;
  const exceedsMax = totalSeconds > MAX_DURATION_SECONDS;
  totalSeconds = Math.min(totalSeconds, MAX_DURATION_SECONDS);

  return { totalSeconds, exceedsMax };
}

/**
 * Parse duration parameter from URL query string.
 * @returns Total seconds if valid (0 \< value ≤ max), null otherwise
 * @public
 */
export function parseDurationParam(durationParam: string): number | null {
  const trimmed = durationParam.trim();
  const parsed = Number(trimmed);
  if (isNaN(parsed) || trimmed === '') return null;

  const floored = Math.floor(parsed);
  return floored > 0 && floored <= MAX_DURATION_SECONDS ? floored : null;
}

/** Format seconds to human-readable duration (short: "1d 12h" | long: "1 day 12 hours"). @public */
export function formatDuration(
  totalSeconds: number,
  style: DurationFormatStyle = 'short'
): string {
  if (totalSeconds <= 0) {
    return style === 'short' ? '0s' : '0 seconds';
  }

  const { days, hours, minutes, seconds } = extractTimeUnitsFromSeconds(totalSeconds);

  if (style === 'short') {
    if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  }

  // Long format: skip zero units
  const parts: string[] = [];
  if (days > 0) parts.push(pluralize(days, 'day'));
  if (hours > 0) parts.push(pluralize(hours, 'hour'));
  if (minutes > 0) parts.push(pluralize(minutes, 'minute'));
  if (seconds > 0 || parts.length === 0) parts.push(pluralize(seconds, 'second'));

  return parts.join(' ');
}
