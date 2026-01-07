import { describe, expect, it } from 'vitest';
import * as fireworksExports from './index';

const expectedExports = [
  'createFireworksState',
  'startFireworks',
  'stopFireworks',
  'updateFireworksIntensity',
  'destroyFireworks',
  'recreateFireworksAfterContainerUpdate',
  'getIntensityLevel',
  'getIntensityConfig',
  'getFireworksOptions',
];

describe('fireworks utils barrel', () => {
  it('should expose the public fireworks API when importing the index', () => {
    for (const key of expectedExports) {
      expect(fireworksExports[key as keyof typeof fireworksExports]).toBeDefined();
    }
  });
});
