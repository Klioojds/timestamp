/** Tests for base fireworks renderer state. */

import { describe, it, expect } from 'vitest';
import { DEFAULT_ANIMATION_STATE, shouldEnableAnimations } from '@themes/shared';
import {
  createBaseRendererState,
} from './base-renderer-state';

describe('base-renderer-state', () => {
  describe('createBaseRendererState', () => {
    it('should initialize with default values', () => {
      const state = createBaseRendererState();
      expect(state.isDestroyed).toBe(false);
      expect(state.getAnimationState()).toEqual(DEFAULT_ANIMATION_STATE);
    });

    it('should provide animation state getter', () => {
      const state = createBaseRendererState();
      const animationState = state.getAnimationState();
      expect(animationState.shouldAnimate).toBe(true);
      expect(animationState.prefersReducedMotion).toBe(false);
    });
  });

  describe('DEFAULT_ANIMATION_STATE', () => {
    it('should enable animations by default', () => {
      expect(DEFAULT_ANIMATION_STATE.shouldAnimate).toBe(true);
    });

    it('should not prefer reduced motion by default', () => {
      expect(DEFAULT_ANIMATION_STATE.prefersReducedMotion).toBe(false);
    });
  });

  describe('shouldEnableAnimations', () => {
    it.each([
      {
        scenario: 'shouldAnimate true, reduced motion false',
        shouldAnimate: true,
        prefersReducedMotion: false,
        expected: true,
      },
      {
        scenario: 'shouldAnimate false, reduced motion false',
        shouldAnimate: false,
        prefersReducedMotion: false,
        expected: false,
      },
      {
        scenario: 'shouldAnimate true, reduced motion true',
        shouldAnimate: true,
        prefersReducedMotion: true,
        expected: false,
      },
      {
        scenario: 'shouldAnimate false, reduced motion true',
        shouldAnimate: false,
        prefersReducedMotion: true,
        expected: false,
      },
    ])(
      'should return $expected when $scenario',
      ({ shouldAnimate, prefersReducedMotion, expected }) => {
        const getAnimationState = () => ({ shouldAnimate, prefersReducedMotion });
        expect(shouldEnableAnimations(getAnimationState)).toBe(expected);
      }
    );
  });
});
