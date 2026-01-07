import { describe, expect, it } from 'vitest';

import {
  CITY_SILHOUETTE_PATH,
  FIREWORKS_CONFIG,
  INTENSITY_CONFIGS,
  LANDING_PAGE_STAR_COUNT,
  TIME_PAGE_STAR_COUNT,
  UI_CONSTANTS,
} from './index';
import { IntensityLevel, type IntensityConfig } from '../types';

describe('fireworks config', () => {
  it('should expose registry metadata when loaded', () => {
    expect(FIREWORKS_CONFIG).toMatchObject({
      id: 'fireworks',
      name: 'Fireworks Celebration',
      supportsWorldMap: true,
      availableInIssueTemplate: true,
      optionalComponents: { timezoneSelector: true, worldMap: true },
    });
  });

  it('should define star counts for landing and time pages', () => {
    expect(TIME_PAGE_STAR_COUNT).toBeGreaterThan(0);
    expect(LANDING_PAGE_STAR_COUNT).toBeGreaterThan(0);
    expect(TIME_PAGE_STAR_COUNT).toBeGreaterThan(LANDING_PAGE_STAR_COUNT);
  });

  it('should expose UI constants needed for layout sizing', () => {
    expect(UI_CONSTANTS).toMatchObject({
      CITY_HEIGHT_PX: 128,
      COUNTDOWN_FONT_SIZE: expect.stringContaining('clamp'),
      COUNTDOWN_GAP: expect.stringContaining('clamp'),
    });
  });

  it('should provide an SVG silhouette path for the skyline', () => {
    expect(CITY_SILHOUETTE_PATH.trim().startsWith('M0')).toBe(true);
    expect(CITY_SILHOUETTE_PATH).toContain('Z');
  });

  it.each([
    { level: IntensityLevel.STARS_ONLY, expectedNull: true },
    { level: IntensityLevel.OCCASIONAL, expectedNull: false },
    { level: IntensityLevel.MODERATE, expectedNull: false },
    { level: IntensityLevel.FREQUENT, expectedNull: false },
    { level: IntensityLevel.CONTINUOUS, expectedNull: false },
    { level: IntensityLevel.BUILDING, expectedNull: false },
    { level: IntensityLevel.FINALE, expectedNull: false },
    { level: IntensityLevel.MAXIMUM, expectedNull: false },
  ])('should expose intensity config for level $level when retrieved', ({ level, expectedNull }) => {
    const config = INTENSITY_CONFIGS[level];

    if (expectedNull) {
      expect(config).toBeNull();
      return;
    }

    const typedConfig = config as IntensityConfig;
    expect(typedConfig.intensity).toBeGreaterThan(0);
    expect(typedConfig.particles).toBeGreaterThan(0);
    expect(typedConfig.explosion).toBeGreaterThan(0);
    expect(typedConfig.delay.min).toBeLessThan(typedConfig.delay.max);
    expect(typedConfig.hue.min).toBe(0);
    expect(typedConfig.hue.max).toBeGreaterThanOrEqual(typedConfig.hue.min);
    expect(typedConfig.traceSpeed).toBeGreaterThan(0);
    expect(typedConfig.flickering).toBeGreaterThan(0);
  });
});
