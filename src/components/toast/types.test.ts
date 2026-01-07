import { describe, it, expect } from 'vitest';
import { TOAST_DEFAULTS } from './types';

describe('toast types', () => {
  it('provides stable numeric defaults', () => {
    expect(TOAST_DEFAULTS.duration).toBe(0);
    expect(TOAST_DEFAULTS.stackGap).toBe(12);
    expect(TOAST_DEFAULTS.maxVisible).toBe(3);
    expect(TOAST_DEFAULTS.animationDuration).toBe(300);
  });

  it('is dismissible by default', () => {
    expect(TOAST_DEFAULTS.dismissible).toBe(true);
  });

  it.each([
    ['duration', TOAST_DEFAULTS.duration],
    ['stackGap', TOAST_DEFAULTS.stackGap],
    ['maxVisible', TOAST_DEFAULTS.maxVisible],
    ['animationDuration', TOAST_DEFAULTS.animationDuration],
  ])('keeps %s non-negative', (_field, value) => {
    expect(value).toBeGreaterThanOrEqual(0);
  });
});
