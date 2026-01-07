/** Tests for time page renderer state. */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DEFAULT_ANIMATION_STATE } from '@themes/shared';
import { IntensityLevel } from '../../types';
import {
  createRendererState,
  isRendererReady,
  isCanvasReady,
  resetRendererState,
} from './time-renderer-state';

// Mock ResizeObserver
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

global.ResizeObserver = MockResizeObserver as any;

describe('time-renderer-state', () => {
  describe('createRendererState', () => {
    it('should initialize with null container', () => {
      const state = createRendererState();
      expect(state.container).toBeNull();
    });

    it('should initialize with empty completion message', () => {
      const state = createRendererState();
      expect(state.completionMessage).toBe('');
    });

    it('should initialize fireworks state', () => {
      const state = createRendererState();
      expect(state.fireworksState).toBeDefined();
      expect(state.fireworksState.currentLevel).toBe(IntensityLevel.STARS_ONLY);
      expect(state.fireworksState.isRunning).toBe(false);
    });

    it('should initialize with null resize observer', () => {
      const state = createRendererState();
      expect(state.resizeObserver).toBeNull();
      expect(state.resizeRafId).toBeNull();
    });

    it('should initialize with zero canvas dimensions', () => {
      const state = createRendererState();
      expect(state.lastCanvasWidth).toBe(0);
      expect(state.lastCanvasHeight).toBe(0);
    });

    it('should initialize with null theme root', () => {
      const state = createRendererState();
      expect(state.themeRoot).toBeNull();
    });

    it('should initialize with empty cleanup handles', () => {
      const state = createRendererState();
      expect(state.resourceTracker.intervals).toEqual([]);
      expect(state.resourceTracker.timeouts).toEqual([]);
      expect(state.resourceTracker.rafs).toEqual([]);
      expect(state.resourceTracker.observers).toEqual([]);
      expect(state.resourceTracker.listeners).toEqual([]);
    });

    it('should not be destroyed initially', () => {
      const state = createRendererState();
      expect(state.isDestroyed).toBe(false);
    });

    it('should have default animation state', () => {
      const state = createRendererState();
      expect(state.getAnimationState()).toEqual(DEFAULT_ANIMATION_STATE);
    });
  });

  describe('isRendererReady', () => {
    it.each([
      {
        scenario: 'destroyed state',
        isDestroyed: true,
        container: document.createElement('div'),
        themeRoot: document.createElement('div'),
        expected: false,
      },
      {
        scenario: 'null container',
        isDestroyed: false,
        container: null,
        themeRoot: document.createElement('div'),
        expected: false,
      },
      {
        scenario: 'null theme root',
        isDestroyed: false,
        container: document.createElement('div'),
        themeRoot: null,
        expected: false,
      },
      {
        scenario: 'all conditions met',
        isDestroyed: false,
        container: document.createElement('div'),
        themeRoot: document.createElement('div'),
        expected: true,
      },
    ])(
      'should return $expected when $scenario',
      ({ isDestroyed, container, themeRoot, expected }) => {
        const state = createRendererState();
        state.isDestroyed = isDestroyed;
        state.container = container;
        state.themeRoot = themeRoot;
        expect(isRendererReady(state)).toBe(expected);
      }
    );
  });

  describe('isCanvasReady', () => {
    let state: ReturnType<typeof createRendererState>;

    beforeEach(() => {
      state = createRendererState();
      state.container = document.createElement('div');
      state.themeRoot = document.createElement('div');
    });

    it('should return false when renderer not ready', () => {
      state.container = null;
      expect(isCanvasReady(state)).toBe(false);
    });

    it('should return false when canvas is null', () => {
      state.fireworksState.canvas = null;
      expect(isCanvasReady(state)).toBe(false);
    });

    it('should return true when renderer ready and canvas exists', () => {
      state.fireworksState.canvas = document.createElement('canvas');
      expect(isCanvasReady(state)).toBe(true);
    });
  });

  describe('resetRendererState', () => {
    it('should reset container to null', () => {
      const state = createRendererState();
      state.container = document.createElement('div');
      resetRendererState(state);
      expect(state.container).toBeNull();
    });

    it('should reset completion message', () => {
      const state = createRendererState();
      state.completionMessage = 'Test message';
      resetRendererState(state);
      expect(state.completionMessage).toBe('');
    });

    it('should reset animation state getter', () => {
      const state = createRendererState();
      state.getAnimationState = () => ({ shouldAnimate: false, prefersReducedMotion: true });
      resetRendererState(state);
      expect(state.getAnimationState()).toEqual(DEFAULT_ANIMATION_STATE);
    });

    it('should reset destroyed flag', () => {
      const state = createRendererState();
      state.isDestroyed = true;
      resetRendererState(state);
      expect(state.isDestroyed).toBe(false);
    });

    it('should reset resize observer', () => {
      const state = createRendererState();
      state.resizeObserver = new ResizeObserver(() => {});
      state.resizeRafId = 123;
      resetRendererState(state);
      expect(state.resizeObserver).toBeNull();
      expect(state.resizeRafId).toBeNull();
    });

    it('should reset canvas dimensions', () => {
      const state = createRendererState();
      state.lastCanvasWidth = 1920;
      state.lastCanvasHeight = 1080;
      resetRendererState(state);
      expect(state.lastCanvasWidth).toBe(0);
      expect(state.lastCanvasHeight).toBe(0);
    });

    it('should reset theme root', () => {
      const state = createRendererState();
      state.themeRoot = document.createElement('div');
      resetRendererState(state);
      expect(state.themeRoot).toBeNull();
    });

    it('should reset fireworks intensity level', () => {
      const state = createRendererState();
      state.fireworksState.currentLevel = IntensityLevel.MAXIMUM;
      resetRendererState(state);
      expect(state.fireworksState.currentLevel).toBe(IntensityLevel.STARS_ONLY);
    });

    it('should reset fireworks running state', () => {
      const state = createRendererState();
      state.fireworksState.isRunning = true;
      resetRendererState(state);
      expect(state.fireworksState.isRunning).toBe(false);
    });
  });
});
