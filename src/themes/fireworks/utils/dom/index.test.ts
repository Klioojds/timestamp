import { describe, expect, it } from 'vitest';
import * as barrel from './index';
import { buildThemeDOM } from './theme-builder';
import { updateCountdown, showCelebration, showCountdown } from './countdown-updates';
import { buildStarfield, pauseStarAnimations, resumeStarAnimations } from './starfield-builder';

describe('fireworks dom barrel', () => {
  it.each([
    { exportName: 'buildThemeDOM', expected: buildThemeDOM },
    { exportName: 'updateCountdown', expected: updateCountdown },
    { exportName: 'showCelebration', expected: showCelebration },
    { exportName: 'showCountdown', expected: showCountdown },
    { exportName: 'buildStarfield', expected: buildStarfield },
    { exportName: 'pauseStarAnimations', expected: pauseStarAnimations },
    { exportName: 'resumeStarAnimations', expected: resumeStarAnimations },
  ])('should re-export $exportName from index', ({ exportName, expected }) => {
    expect(barrel[exportName as keyof typeof barrel]).toBe(expected);
  });
});
