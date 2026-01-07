/**
 * Shared time formatting utilities.
 */

/** Time units extracted from a duration. */
export interface TimeUnits {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/** Extract time units from seconds. @public */
export function extractTimeUnitsFromSeconds(totalSeconds: number): TimeUnits {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  return {
    days: Math.floor(clamped / 86400),
    hours: Math.floor((clamped % 86400) / 3600),
    minutes: Math.floor((clamped % 3600) / 60),
    seconds: clamped % 60,
  };
}

/** Extract time units from milliseconds. @public */
export function extractTimeUnitsFromMs(ms: number): TimeUnits {
  return extractTimeUnitsFromSeconds(ms / 1000);
}

/** Pluralize a time unit label. @public */
export function pluralize(value: number, singular: string): string {
  return `${value} ${singular}${value === 1 ? '' : 's'}`;
}
