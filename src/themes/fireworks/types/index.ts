/**
 * Fireworks Theme Types
 * Type definitions for intensity levels and fireworks configuration.
 */

/**
 * Intensity levels that control fireworks behavior based on time remaining.
 *
 * @remarks
 * Levels range from STARS_ONLY (no fireworks) to MAXIMUM (continuous finale).
 * Controller automatically transitions between levels as countdown progresses.
 *
 * @example
 * ```typescript
 * // 10+ hours remaining: OCCASIONAL fireworks
 * // 1 hour: MODERATE
 * // 10 minutes: FREQUENT
 * // 1 minute: BUILDING
 * // 10 seconds: FINALE
 * // 0 seconds: MAXIMUM
 * ```
 *
 * @public
 */
export const IntensityLevel = {
  STARS_ONLY: 'STARS_ONLY',
  OCCASIONAL: 'OCCASIONAL',
  MODERATE: 'MODERATE',
  FREQUENT: 'FREQUENT',
  CONTINUOUS: 'CONTINUOUS',
  BUILDING: 'BUILDING',
  FINALE: 'FINALE',
  MAXIMUM: 'MAXIMUM',
} as const;

export type IntensityLevelType = (typeof IntensityLevel)[keyof typeof IntensityLevel];

/**
 * Fireworks canvas configuration for a specific intensity level.
 *
 * @remarks
 * All numeric ranges are calibrated for smooth visual progression from occasional to maximum intensity.
 *
 * @public
 */
export interface IntensityConfig {
  /** Overall intensity multiplier (range: 1-50) */
  intensity: number;
  /** Particles per explosion (range: 50-150) */
  particles: number;
  /** Explosion size multiplier (range: 3-10) */
  explosion: number;
  /** Delay between fireworks launches (range: 50-35000ms) */
  delay: {
    min: number;
    max: number;
  };
  /** Hue range for firework colors (0=red, 360=red via spectrum) */
  hue: {
    min: number;
    max: number;
  };
  /** Firework trace speed (range: 3-15) */
  traceSpeed: number;
  /** Particle flickering intensity (range: 30-100) */
  flickering: number;
}
