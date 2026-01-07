/**
 * Target Date Initialization - mode-based target date computation.
 */

import { getModeConfig } from '@core/config/mode-config';
import {
    convertWallClockToAbsolute,
    createNextOccurrence,
} from '@core/time/wall-clock-conversion';
import type { CountdownConfig, WallClockTime } from '@core/types';

/** Target date initialization result. */
export interface TargetDateResult {
  targetDate: Date;
  /** Null for timer/absolute modes. */
  wallClockTarget: WallClockTime | null;
}

/**
 * Initializes target date based on mode and timezone.
 * Handles timer (absolute), wall-clock (preserves time across zones), absolute (fixed UTC), and default (New Year).
 */
export function initializeTargetDate(
  config: CountdownConfig | undefined,
  initialTimezone: string,
  isTimerMode: boolean
): TargetDateResult {
  let targetDate: Date;
  let wallClockTarget: WallClockTime | null = null;

  if (isTimerMode) {
    // Timer mode: targetDate is absolute, no wall-clock concept
    targetDate = config?.targetDate
      ? new Date(config.targetDate)
      : new Date(Date.now() + (config?.durationSeconds ?? 0) * 1000);
    // wallClockTarget stays null for timer mode
  } else if (config?.wallClockTarget) {
    // Wall-clock mode: use the preserved WallClockTime
    wallClockTarget = config.wallClockTarget;
    targetDate = convertWallClockToAbsolute(wallClockTarget, initialTimezone);
  } else if (config?.mode) {
    const modeConfig = getModeConfig(config.mode);
    if (modeConfig.isAbsolute && config.targetDate) {
      // Absolute mode: targetDate is the fixed UTC instant, no wall-clock conversion
      targetDate = new Date(config.targetDate);
      // wallClockTarget stays null for absolute mode
    } else if (config.targetDate) {
      // Wall-clock mode with only targetDate: extract local components as wall-clock
      // This supports legacy configs that don't have explicit wallClockTarget
      const d = new Date(config.targetDate);
      wallClockTarget = {
        year: d.getFullYear(),
        month: d.getMonth(),
        day: d.getDate(),
        hours: d.getHours(),
        minutes: d.getMinutes(),
        seconds: d.getSeconds(),
      };
      targetDate = convertWallClockToAbsolute(wallClockTarget, initialTimezone);
    } else {
      // Default: New Year countdown (wall-clock mode)
      wallClockTarget = createNextOccurrence(0, 1); // Jan 1 midnight
      targetDate = convertWallClockToAbsolute(wallClockTarget, initialTimezone);
    }
  } else {
    // Default: New Year countdown (wall-clock mode)
    wallClockTarget = createNextOccurrence(0, 1); // Jan 1 midnight
    targetDate = convertWallClockToAbsolute(wallClockTarget, initialTimezone);
  }

  return { targetDate, wallClockTarget };
}
