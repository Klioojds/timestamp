/**
 * Fireworks Intensity Utilities
 *
 * Determines fireworks intensity based on countdown time remaining.
 */

import { INTENSITY_CONFIGS } from '../../config';
import {
  type IntensityConfig,
  IntensityLevel,
  type IntensityLevelType,
} from '../../types';

const MAXIMUM_THRESHOLD_SECONDS = 5;
const FINALE_THRESHOLD_SECONDS = 15;
const BUILDING_THRESHOLD_SECONDS = 30;
const SECONDS_PER_MINUTE = 60;
const FREQUENT_THRESHOLD_MINUTES = 10;
const SECONDS_PER_HOUR = 3600;
const OCCASIONAL_THRESHOLD_HOURS = 12;

/**
 * Determines intensity level based on seconds remaining.
 *
 * @param secondsRemaining - Seconds until countdown target
 * @returns Intensity level enum value (STARS_ONLY to MAXIMUM)
 *
 * @remarks
 * Thresholds:
 * - ≤5s: MAXIMUM (finale peak)
 * - ≤15s: FINALE (building to peak)
 * - ≤30s: BUILDING (increasing intensity)
 * - \<1m: CONTINUOUS
 * - \<10m: FREQUENT
 * - \<1h: MODERATE
 * - \<12h: OCCASIONAL
 * - ≥12h: STARS_ONLY (no fireworks)
 */
export function getIntensityLevel(secondsRemaining: number): IntensityLevelType {
  const hours = secondsRemaining / SECONDS_PER_HOUR;
  const minutes = secondsRemaining / SECONDS_PER_MINUTE;

  // MAXIMUM starts 5s before zero so fireworks peak as countdown hits 00:00
  if (secondsRemaining <= MAXIMUM_THRESHOLD_SECONDS) return IntensityLevel.MAXIMUM;
  if (secondsRemaining <= FINALE_THRESHOLD_SECONDS) return IntensityLevel.FINALE;
  if (secondsRemaining <= BUILDING_THRESHOLD_SECONDS) return IntensityLevel.BUILDING;
  if (minutes < 1) return IntensityLevel.CONTINUOUS;
  if (minutes < FREQUENT_THRESHOLD_MINUTES) return IntensityLevel.FREQUENT;
  if (hours < 1) return IntensityLevel.MODERATE;
  if (hours < OCCASIONAL_THRESHOLD_HOURS) return IntensityLevel.OCCASIONAL;
  return IntensityLevel.STARS_ONLY;
}

/**
 * Gets fireworks configuration for the given seconds remaining.
 *
 * @param secondsRemaining - Seconds until countdown target
 * @returns IntensityConfig object, or null for STARS_ONLY level
 *
 * @remarks
 * Config includes particles, explosion radius, trace speed, and delay.
 * Returns null when \>12 hours remain (STARS_ONLY — no fireworks).
 */
export function getIntensityConfig(secondsRemaining: number): IntensityConfig | null {
  const level = getIntensityLevel(secondsRemaining);
  return INTENSITY_CONFIGS[level];
}
