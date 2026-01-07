import { describe, it, expect } from 'vitest';

import { DEFAULT_COMPLETION_MESSAGE, FOCUSABLE_SELECTOR, MAX_DURATION_SECONDS } from './constants';

describe('config/constants', () => {
  it('defines max duration and default completion message', () => {
    expect(MAX_DURATION_SECONDS).toBe(31_536_000);
    expect(DEFAULT_COMPLETION_MESSAGE).toBe("Time's up!");
  });

  it('includes expected focusable selector targets', () => {
    expect(FOCUSABLE_SELECTOR).toContain('button');
    expect(FOCUSABLE_SELECTOR).toContain('[href]');
    expect(FOCUSABLE_SELECTOR).toContain('input');
  });
});