import { describe, it, expect } from 'vitest';
import { DEFAULT_ANIMATION_STATE, shouldEnableAnimations } from './animation-state';
import type { AnimationStateGetter } from './types';

describe('animation-state', () => {
  describe('DEFAULT_ANIMATION_STATE', () => {
    it('should have animations enabled by default', () => {
      expect(DEFAULT_ANIMATION_STATE.shouldAnimate).toBe(true);
    });

    it('should not prefer reduced motion by default', () => {
      expect(DEFAULT_ANIMATION_STATE.prefersReducedMotion).toBe(false);
    });
  });

  describe('shouldEnableAnimations', () => {
    it.each([
      [true, false, true],
      [false, false, false],
      [true, true, false],
      [false, true, false],
    ])('shouldAnimate=%s, prefersReducedMotion=%s => %s', (shouldAnimate, prefersReducedMotion, expected) => {
      const getter: AnimationStateGetter = () => ({ shouldAnimate, prefersReducedMotion });
      expect(shouldEnableAnimations(getter)).toBe(expected);
    });

    it('should work with default animation state', () => {
      const getter: AnimationStateGetter = () => DEFAULT_ANIMATION_STATE;
      expect(shouldEnableAnimations(getter)).toBe(true);
    });
  });
});
