/**
 * Star Utilities - Shared utilities for star generation.
 */

/** Star animation configuration constants. */
export const STAR_ANIMATION = {
  SIZE_MIN_PX: 1,
  SIZE_MAX_PX: 3,
  DURATION_MIN_S: 0.4,
  DURATION_MAX_S: 2.0,
  DELAY_MAX_S: 2.0,
} as const;

/** Properties for a single star element. */
export interface StarProperties {
  /** Horizontal position as percentage (0-100). */
  x: number;
  /** Vertical position as percentage (0-100). */
  y: number;
  /** Star size in pixels. */
  size: number;
  /** Animation duration in seconds. */
  duration: number;
  /** Animation delay in seconds. */
  delay: number;
}

/**
 * Generate random star properties for twinkling animation.
 *
 * Creates randomized position, size, and timing values within configured ranges.
 * Each star gets unique animation characteristics for natural-looking starfield.
 *
 * @returns Star properties with x/y position (%), size (px), duration (s), and delay (s)
 */
export function createStarProperties(): StarProperties {
  const x = Math.random() * 100;
  const y = Math.random() * 100;
  const size =
    Math.random() * (STAR_ANIMATION.SIZE_MAX_PX - STAR_ANIMATION.SIZE_MIN_PX) +
    STAR_ANIMATION.SIZE_MIN_PX;
  const duration =
    Math.random() * (STAR_ANIMATION.DURATION_MAX_S - STAR_ANIMATION.DURATION_MIN_S) +
    STAR_ANIMATION.DURATION_MIN_S;
  const delay = Math.random() * STAR_ANIMATION.DELAY_MAX_S;

  return { x, y, size, duration, delay };
}
