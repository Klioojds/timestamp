/**
 * Fireworks Options - Factory functions for fireworks-js configuration.
 */

import type { FireworksOptions } from 'fireworks-js';

import type { IntensityConfig, IntensityLevelType } from '../../types';

// Cache to avoid recreating identical options objects
const OPTIONS_CACHE: Partial<Record<IntensityLevelType, FireworksOptions>> = {};

/** Convert IntensityConfig to FireworksOptions for fireworks-js library. */
function createOptions(config: IntensityConfig): FireworksOptions {
  return {
    // NOTE: autoresize disabled - we handle canvas sizing via ResizeObserver
    autoresize: false,
    opacity: 0.5,
    acceleration: 1.05,
    friction: 0.97,
    gravity: 1.5,
    particles: config.particles,
    explosion: config.explosion,
    intensity: config.intensity,
    traceSpeed: config.traceSpeed,
    flickering: config.flickering,
    delay: config.delay,
    hue: config.hue,
    rocketsPoint: { min: 25, max: 75 },
    lineWidth: {
      explosion: { min: 1, max: 3 },
      trace: { min: 1, max: 2 },
    },
    lineStyle: 'round',
    brightness: { min: 50, max: 80 },
    decay: { min: 0.015, max: 0.03 },
    mouse: { click: false, move: false, max: 1 },
  };
}

/**
 * Gets cached fireworks-js options for an intensity level.
 *
 * @param level - Intensity level enum value
 * @param config - Intensity configuration object
 * @returns FireworksOptions object for fireworks-js library
 *
 * @remarks
 * Options are cached per level to avoid recreating identical objects.
 * Converts internal IntensityConfig to fireworks-js library format.
 * Autoresize is disabled — canvas sizing handled via ResizeObserver.
 *
 * @see {@link https://fireworks-js.org/options/} - Upstream options API
 */
export function getFireworksOptions(
  level: IntensityLevelType,
  config: IntensityConfig
): FireworksOptions {
  const cached = OPTIONS_CACHE[level];
  if (cached) return cached;

  const options = createOptions(config);
  OPTIONS_CACHE[level] = options;
  return options;
}
