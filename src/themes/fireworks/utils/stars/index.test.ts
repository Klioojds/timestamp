import { describe, expect, it } from 'vitest';
import * as starsExports from './index';

const expectedExports = ['STAR_ANIMATION', 'createStarProperties'];

describe('stars utils barrel', () => {
  it('should expose star utilities from the index', () => {
    for (const key of expectedExports) {
      expect(starsExports[key as keyof typeof starsExports]).toBeDefined();
    }
  });
});
