import { describe, expect, it } from 'vitest';

import * as entry from './index';
import { FIREWORKS_CONFIG } from './config';
import { fireworksLandingPageRenderer } from './renderers/landing-page-renderer';
import { fireworksTimePageRenderer } from './renderers/time-page-renderer';

describe('fireworks theme entry point', () => {
  it('should export theme config for registry integration', () => {
    expect(entry.FIREWORKS_CONFIG).toBe(FIREWORKS_CONFIG);
  });

  it('should export renderer factories for registry integration', () => {
    expect(entry.fireworksTimePageRenderer).toBe(fireworksTimePageRenderer);
    expect(entry.fireworksLandingPageRenderer).toBe(fireworksLandingPageRenderer);
  });
});
