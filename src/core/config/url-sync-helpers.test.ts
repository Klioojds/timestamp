import { describe, it, expect } from 'vitest';

import { buildConfigForUrlSync } from './url-sync-helpers';
import type { CountdownConfig } from '@core/types';

const baseConfig: CountdownConfig = {
  mode: 'wall-clock',
  targetDate: new Date('2026-01-01T00:00:00Z'),
  completionMessage: 'Ready',
  theme: 'contribution-graph',
  timezone: 'UTC',
};

describe('url-sync-helpers', () => {
  it('throws when base config is missing', () => {
    expect(() => buildConfigForUrlSync(undefined, { theme: 'contribution-graph', timezone: 'UTC' })).toThrow(
      'Countdown config is required before syncing to URL'
    );
  });

  it('applies overrides and defaults showWorldMap to true when unspecified', () => {
    const result = buildConfigForUrlSync(baseConfig, { theme: 'fireworks', timezone: 'America/New_York' });

    expect(result.theme).toBe('fireworks');
    expect(result.timezone).toBe('America/New_York');
    expect(result.showWorldMap).toBe(true);
  });

  it('respects base and override showWorldMap values', () => {
    const withBaseFalse = buildConfigForUrlSync({ ...baseConfig, showWorldMap: false }, {
      theme: 'contribution-graph',
      timezone: 'UTC',
    });

    const withOverrideFalse = buildConfigForUrlSync(baseConfig, {
      theme: 'contribution-graph',
      timezone: 'UTC',
      showWorldMap: false,
    });

    expect(withBaseFalse.showWorldMap).toBe(false);
    expect(withOverrideFalse.showWorldMap).toBe(false);
  });
});