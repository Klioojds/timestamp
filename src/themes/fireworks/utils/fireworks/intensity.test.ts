import { describe, expect, it } from 'vitest';
import { INTENSITY_CONFIGS } from '../../config';
import { IntensityLevel } from '../../types';
import { getIntensityConfig, getIntensityLevel } from './intensity';

describe('getIntensityLevel', () => {
  it.each([
    { secondsRemaining: -10, expectedLevel: IntensityLevel.MAXIMUM },
    { secondsRemaining: 0, expectedLevel: IntensityLevel.MAXIMUM },
    { secondsRemaining: 5, expectedLevel: IntensityLevel.MAXIMUM },
    { secondsRemaining: 6, expectedLevel: IntensityLevel.FINALE },
    { secondsRemaining: 15, expectedLevel: IntensityLevel.FINALE },
    { secondsRemaining: 16, expectedLevel: IntensityLevel.BUILDING },
    { secondsRemaining: 30, expectedLevel: IntensityLevel.BUILDING },
    { secondsRemaining: 31, expectedLevel: IntensityLevel.CONTINUOUS },
    { secondsRemaining: 59, expectedLevel: IntensityLevel.CONTINUOUS },
    { secondsRemaining: 60, expectedLevel: IntensityLevel.FREQUENT },
    { secondsRemaining: 599, expectedLevel: IntensityLevel.FREQUENT },
    { secondsRemaining: 600, expectedLevel: IntensityLevel.MODERATE },
    { secondsRemaining: 3599, expectedLevel: IntensityLevel.MODERATE },
    { secondsRemaining: 3600, expectedLevel: IntensityLevel.OCCASIONAL },
    { secondsRemaining: 43199, expectedLevel: IntensityLevel.OCCASIONAL },
    { secondsRemaining: 43200, expectedLevel: IntensityLevel.STARS_ONLY },
    { secondsRemaining: 200000, expectedLevel: IntensityLevel.STARS_ONLY },
  ])('should return $expectedLevel when $secondsRemaining seconds remain', ({
    secondsRemaining,
    expectedLevel,
  }) => {
    expect(getIntensityLevel(secondsRemaining)).toBe(expectedLevel);
  });
});

describe('getIntensityConfig', () => {
  it.each([
    { secondsRemaining: 43199, expectedConfig: INTENSITY_CONFIGS[IntensityLevel.OCCASIONAL] },
    { secondsRemaining: 1200, expectedConfig: INTENSITY_CONFIGS[IntensityLevel.MODERATE] },
    { secondsRemaining: 120, expectedConfig: INTENSITY_CONFIGS[IntensityLevel.FREQUENT] },
    { secondsRemaining: 20, expectedConfig: INTENSITY_CONFIGS[IntensityLevel.BUILDING] },
    { secondsRemaining: 8, expectedConfig: INTENSITY_CONFIGS[IntensityLevel.FINALE] },
    { secondsRemaining: 2, expectedConfig: INTENSITY_CONFIGS[IntensityLevel.MAXIMUM] },
  ])('should return matching config when $secondsRemaining seconds remain', ({
    secondsRemaining,
    expectedConfig,
  }) => {
    expect(getIntensityConfig(secondsRemaining)).toBe(expectedConfig);
  });

  it('should return null when intensity level is stars only', () => {
    expect(getIntensityConfig(43200)).toBeNull();
  });
});
