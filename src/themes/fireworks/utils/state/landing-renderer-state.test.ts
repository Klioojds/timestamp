/** Tests for landing page renderer state. */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createLandingRendererState,
  isLandingRendererReady,
  getLandingElementCount,
} from './landing-renderer-state';

describe('landing-renderer-state', () => {
  describe('createLandingRendererState', () => {
    it('should initialize with null starfield', () => {
      const state = createLandingRendererState();
      expect(state.starfield).toBeNull();
    });

    it('should initialize with empty stars array', () => {
      const state = createLandingRendererState();
      expect(state.stars).toEqual([]);
    });

    it('should not be destroyed initially', () => {
      const state = createLandingRendererState();
      expect(state.isDestroyed).toBe(false);
    });

    it('should have default animation state', () => {
      const state = createLandingRendererState();
      const animationState = state.getAnimationState();
      expect(animationState.shouldAnimate).toBe(true);
      expect(animationState.prefersReducedMotion).toBe(false);
    });
  });

  describe('isLandingRendererReady', () => {
    it.each([
      {
        scenario: 'destroyed state',
        isDestroyed: true,
        starfield: document.createElement('div'),
        expected: false,
      },
      {
        scenario: 'null starfield',
        isDestroyed: false,
        starfield: null,
        expected: false,
      },
      {
        scenario: 'all conditions met',
        isDestroyed: false,
        starfield: document.createElement('div'),
        expected: true,
      },
    ])('should return $expected when $scenario', ({ isDestroyed, starfield, expected }) => {
      const state = createLandingRendererState();
      state.isDestroyed = isDestroyed;
      state.starfield = starfield;
      expect(isLandingRendererReady(state)).toBe(expected);
    });
  });

  describe('getLandingElementCount', () => {
    let state: ReturnType<typeof createLandingRendererState>;
    let starfield: HTMLElement;

    beforeEach(() => {
      state = createLandingRendererState();
      starfield = document.createElement('div');
      state.starfield = starfield;
    });

    it('should return zero counts when no stars', () => {
      const counts = getLandingElementCount(state);
      expect(counts.total).toBe(0);
      expect(counts.animated).toBe(0);
    });

    it('should return correct total when stars exist', () => {
      state.stars = [
        document.createElement('div'),
        document.createElement('div'),
        document.createElement('div'),
      ];
      const counts = getLandingElementCount(state);
      expect(counts.total).toBe(3);
    });

    it('should return animated count equal to total when not paused', () => {
      state.stars = [
        document.createElement('div'),
        document.createElement('div'),
      ];
      const counts = getLandingElementCount(state);
      expect(counts.animated).toBe(2);
    });

    it('should return zero animated count when starfield is paused', () => {
      starfield.classList.add('is-paused');
      state.stars = [
        document.createElement('div'),
        document.createElement('div'),
      ];
      const counts = getLandingElementCount(state);
      expect(counts.total).toBe(2);
      expect(counts.animated).toBe(0);
    });

    it('should count total stars even when starfield is null', () => {
      state.starfield = null;
      state.stars = [document.createElement('div')];
      const counts = getLandingElementCount(state);
      expect(counts.total).toBe(1);
      // When starfield is null, isPaused defaults to false, so animated = total
      expect(counts.animated).toBe(1);
    });
  });
});
