import { describe, it, expect } from 'vitest';
import {
  ANNOUNCEMENT_CLEAR_DELAY_MS,
  CELEBRATION_POLL_INTERVAL_MS,
  DEFAULT_TERMINATOR_UPDATE_MS,
  VISIBILITY_THRESHOLD,
} from './constants';

describe('world-map/constants', () => {
  it('should define visibility threshold for intersection observer', () => {
    expect(VISIBILITY_THRESHOLD).toBeCloseTo(0.01);
  });

  it('should set fast celebration polling interval', () => {
    expect(CELEBRATION_POLL_INTERVAL_MS).toBe(1000);
  });

  it('should set default terminator update interval to one minute', () => {
    expect(DEFAULT_TERMINATOR_UPDATE_MS).toBe(60000);
  });

  it('should define announcement clear delay', () => {
    expect(ANNOUNCEMENT_CLEAR_DELAY_MS).toBe(5000);
  });
});
