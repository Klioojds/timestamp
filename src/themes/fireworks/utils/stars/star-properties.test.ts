import { afterEach, describe, expect, it, vi } from 'vitest';
import { STAR_ANIMATION, createStarProperties } from './star-properties';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('createStarProperties', () => {
  it.each([
    {
      description: 'minimum values when Math.random returns 0',
      randomValues: [0, 0, 0, 0, 0],
      expected: {
        x: 0,
        y: 0,
        size: STAR_ANIMATION.SIZE_MIN_PX,
        duration: STAR_ANIMATION.DURATION_MIN_S,
        delay: 0,
      },
    },
    {
      description: 'mid-range values when Math.random returns 0.5',
      randomValues: [0.5, 0.5, 0.5, 0.5, 0.5],
      expected: {
        x: 50,
        y: 50,
        size: (STAR_ANIMATION.SIZE_MAX_PX - STAR_ANIMATION.SIZE_MIN_PX) * 0.5 + STAR_ANIMATION.SIZE_MIN_PX,
        duration:
          (STAR_ANIMATION.DURATION_MAX_S - STAR_ANIMATION.DURATION_MIN_S) * 0.5 +
          STAR_ANIMATION.DURATION_MIN_S,
        delay: STAR_ANIMATION.DELAY_MAX_S * 0.5,
      },
    },
    {
      description: 'upper-boundary values when Math.random approaches 1',
      randomValues: [0.99, 0.98, 0.97, 0.96, 0.95],
      expected: {
        x: 99,
        y: 98,
        size:
          0.97 * (STAR_ANIMATION.SIZE_MAX_PX - STAR_ANIMATION.SIZE_MIN_PX) +
          STAR_ANIMATION.SIZE_MIN_PX,
        duration:
          0.96 * (STAR_ANIMATION.DURATION_MAX_S - STAR_ANIMATION.DURATION_MIN_S) +
          STAR_ANIMATION.DURATION_MIN_S,
        delay: 0.95 * STAR_ANIMATION.DELAY_MAX_S,
      },
    },
  ])('should generate $description', ({ randomValues, expected }) => {
    const randomSpy = vi.spyOn(Math, 'random');
    randomValues.forEach(value => randomSpy.mockReturnValueOnce(value));

    const properties = createStarProperties();

    expect(properties.x).toBeCloseTo(expected.x);
    expect(properties.y).toBeCloseTo(expected.y);
    expect(properties.size).toBeCloseTo(expected.size);
    expect(properties.duration).toBeCloseTo(expected.duration);
    expect(properties.delay).toBeCloseTo(expected.delay);
  });

  it('should keep generated properties within configured ranges across multiple samples', () => {
    const samples = Array.from({ length: 20 }, createStarProperties);

    for (const properties of samples) {
      expect(properties.x).toBeGreaterThanOrEqual(0);
      expect(properties.x).toBeLessThanOrEqual(100);
      expect(properties.y).toBeGreaterThanOrEqual(0);
      expect(properties.y).toBeLessThanOrEqual(100);
      expect(properties.size).toBeGreaterThanOrEqual(STAR_ANIMATION.SIZE_MIN_PX);
      expect(properties.size).toBeLessThan(STAR_ANIMATION.SIZE_MAX_PX + Number.EPSILON);
      expect(properties.duration).toBeGreaterThanOrEqual(STAR_ANIMATION.DURATION_MIN_S);
      expect(properties.duration).toBeLessThan(STAR_ANIMATION.DURATION_MAX_S + Number.EPSILON);
      expect(properties.delay).toBeGreaterThanOrEqual(0);
      expect(properties.delay).toBeLessThan(STAR_ANIMATION.DELAY_MAX_S + Number.EPSILON);
    }
  });

  it('should produce different star properties when random values differ', () => {
    const randomSpy = vi.spyOn(Math, 'random');
    randomSpy
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.2)
      .mockReturnValueOnce(0.3)
      .mockReturnValueOnce(0.4)
      .mockReturnValueOnce(0.5)
      .mockReturnValueOnce(0.9)
      .mockReturnValueOnce(0.8)
      .mockReturnValueOnce(0.7)
      .mockReturnValueOnce(0.6)
      .mockReturnValueOnce(0.5);

    const first = createStarProperties();
    const second = createStarProperties();

    expect(first).not.toEqual(second);
  });
});
