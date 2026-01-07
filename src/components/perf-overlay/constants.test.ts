import { describe, it, expect } from 'vitest';
import { METRIC_DEFINITIONS, STAT_DEFINITIONS, OVERLAY_ACTIONS, INP_BUDGET_MS } from './constants';

describe('perf-overlay constants', () => {
  it('lists all metric definitions with unique keys', () => {
    const keys = METRIC_DEFINITIONS.map((m) => m.key);
    expect(keys).toEqual(['fps', 'frame', 'dom', 'inp']);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('includes expected stat definitions', () => {
    const statKeys = STAT_DEFINITIONS.map((s) => s.key);
    expect(statKeys).toEqual(['p50', 'p95', 'min', 'max']);
  });

  it('exposes overlay actions', () => {
    expect(OVERLAY_ACTIONS).toMatchObject({
      close: 'close',
      clear: 'clear',
      toggleDetails: 'toggle-details',
    });
  });

  it('sets INP budget to 200ms', () => {
    expect(INP_BUDGET_MS).toBe(200);
  });
});
