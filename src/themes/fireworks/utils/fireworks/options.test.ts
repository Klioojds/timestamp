import { describe, expect, it } from 'vitest';
import { INTENSITY_CONFIGS } from '../../config';
import { IntensityLevel } from '../../types';
import { getFireworksOptions } from './options';

describe('getFireworksOptions', () => {
  it.each([
    { level: IntensityLevel.OCCASIONAL, configKey: IntensityLevel.OCCASIONAL },
    { level: IntensityLevel.CONTINUOUS, configKey: IntensityLevel.CONTINUOUS },
    { level: IntensityLevel.MAXIMUM, configKey: IntensityLevel.MAXIMUM },
  ])('should map intensity config into fireworks-js options for $level', ({ level, configKey }) => {
    const config = INTENSITY_CONFIGS[configKey]!;

    const options = getFireworksOptions(level, config);

    expect(options.autoresize).toBe(false);
    expect(options.particles).toBe(config.particles);
    expect(options.explosion).toBe(config.explosion);
    expect(options.intensity).toBe(config.intensity);
    expect(options.traceSpeed).toBe(config.traceSpeed);
    expect(options.delay).toEqual(config.delay);
    expect(options.hue).toEqual(config.hue);
    expect(options.flickering).toBe(config.flickering);
    expect(options.rocketsPoint).toEqual({ min: 25, max: 75 });
    expect(options.mouse).toEqual({ click: false, move: false, max: 1 });
  });

  it('should cache options per intensity level', () => {
    const config = INTENSITY_CONFIGS[IntensityLevel.FREQUENT]!;

    const first = getFireworksOptions(IntensityLevel.FREQUENT, config);
    const second = getFireworksOptions(IntensityLevel.FREQUENT, config);

    expect(second).toBe(first);
  });

  it('should create distinct options objects for different intensity levels', () => {
    const frequent = getFireworksOptions(
      IntensityLevel.FREQUENT,
      INTENSITY_CONFIGS[IntensityLevel.FREQUENT]!
    );
    const maximum = getFireworksOptions(
      IntensityLevel.MAXIMUM,
      INTENSITY_CONFIGS[IntensityLevel.MAXIMUM]!
    );

    expect(frequent).not.toBe(maximum);
  });
});
