/** Tests for fireworks lifecycle transitions. */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createRendererState } from '../state';
import * as domUtils from '../dom';
import * as fireworksUtils from '../fireworks';
import * as sharedUtils from '@themes/shared';
import {
  setupFireworksCanvas,
  reconnectFireworksCanvas,
  destroyFireworksCanvas,
  handleFireworksAnimationStateChange,
} from './lifecycle';

// Mock ResizeObserver
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

// Make it globally available
global.ResizeObserver = MockResizeObserver as any;

describe('lifecycle transitions', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('setupFireworksCanvas', () => {
    it('should set container on state', () => {
      const state = createRendererState();
      const container = document.createElement('div');
      vi.spyOn(domUtils, 'buildThemeDOM').mockReturnValue({
        root: document.createElement('div'),
        canvas: document.createElement('canvas'),
        starfield: document.createElement('div'),
        countdown: document.createElement('div'),
        celebration: document.createElement('div'),
        daysUnit: document.createElement('div'),
        hoursUnit: document.createElement('div'),
        minutesUnit: document.createElement('div'),
        secondsUnit: document.createElement('div'),
      });

      setupFireworksCanvas(state, container);

      expect(state.container).toBe(container);
    });

    it('should use context animation state when provided', () => {
      const state = createRendererState();
      const container = document.createElement('div');
      const mockAnimationState = { shouldAnimate: false, prefersReducedMotion: true };
      vi.spyOn(domUtils, 'buildThemeDOM').mockReturnValue({
        root: document.createElement('div'),
        canvas: document.createElement('canvas'),
        starfield: document.createElement('div'),
        countdown: document.createElement('div'),
        celebration: document.createElement('div'),
        daysUnit: document.createElement('div'),
        hoursUnit: document.createElement('div'),
        minutesUnit: document.createElement('div'),
        secondsUnit: document.createElement('div'),
      });

      setupFireworksCanvas(state, container, {
        getAnimationState: () => mockAnimationState,
      });

      expect(state.getAnimationState()).toEqual(mockAnimationState);
    });

    it('should build theme DOM', () => {
      const state = createRendererState();
      const container = document.createElement('div');
      const buildSpy = vi.spyOn(domUtils, 'buildThemeDOM').mockReturnValue({
        root: document.createElement('div'),
        canvas: document.createElement('canvas'),
        starfield: document.createElement('div'),
        countdown: document.createElement('div'),
        celebration: document.createElement('div'),
        daysUnit: document.createElement('div'),
        hoursUnit: document.createElement('div'),
        minutesUnit: document.createElement('div'),
        secondsUnit: document.createElement('div'),
      });

      setupFireworksCanvas(state, container);

      expect(buildSpy).toHaveBeenCalledWith(container);
    });

    it('should set theme root from built elements', () => {
      const state = createRendererState();
      const container = document.createElement('div');
      const mockRoot = document.createElement('div');
      vi.spyOn(domUtils, 'buildThemeDOM').mockReturnValue({
        root: mockRoot,
        canvas: document.createElement('canvas'),
        starfield: document.createElement('div'),
        countdown: document.createElement('div'),
        celebration: document.createElement('div'),
        daysUnit: document.createElement('div'),
        hoursUnit: document.createElement('div'),
        minutesUnit: document.createElement('div'),
        secondsUnit: document.createElement('div'),
      });

      setupFireworksCanvas(state, container);

      expect(state.themeRoot).toBe(mockRoot);
    });

    it('should set canvas from built elements', () => {
      const state = createRendererState();
      const container = document.createElement('div');
      const mockCanvas = document.createElement('canvas');
      vi.spyOn(domUtils, 'buildThemeDOM').mockReturnValue({
        root: document.createElement('div'),
        canvas: mockCanvas,
        starfield: document.createElement('div'),
        countdown: document.createElement('div'),
        celebration: document.createElement('div'),
        daysUnit: document.createElement('div'),
        hoursUnit: document.createElement('div'),
        minutesUnit: document.createElement('div'),
        secondsUnit: document.createElement('div'),
      });

      setupFireworksCanvas(state, container);

      expect(state.fireworksState.canvas).toBe(mockCanvas);
    });

    it('should destroy fireworks when animations disabled', () => {
      const state = createRendererState();
      const container = document.createElement('div');
      vi.spyOn(domUtils, 'buildThemeDOM').mockReturnValue({
        root: document.createElement('div'),
        canvas: document.createElement('canvas'),
        starfield: document.createElement('div'),
        countdown: document.createElement('div'),
        celebration: document.createElement('div'),
        daysUnit: document.createElement('div'),
        hoursUnit: document.createElement('div'),
        minutesUnit: document.createElement('div'),
        secondsUnit: document.createElement('div'),
      });
      const destroySpy = vi.spyOn(fireworksUtils, 'destroyFireworks').mockImplementation(() => {});

      setupFireworksCanvas(state, container, {
        getAnimationState: () => ({ shouldAnimate: false, prefersReducedMotion: false }),
      });

      expect(destroySpy).toHaveBeenCalledWith(state.fireworksState);
    });
  });

  describe('reconnectFireworksCanvas', () => {
    it('should update container', () => {
      const state = createRendererState();
      const oldContainer = document.createElement('div');
      const newContainer = document.createElement('div');
      const canvas = document.createElement('canvas');
      canvas.className = 'fireworks-canvas';
      newContainer.appendChild(canvas);
      state.container = oldContainer;
      vi.spyOn(fireworksUtils, 'recreateFireworksAfterContainerUpdate').mockImplementation(
        () => {}
      );

      reconnectFireworksCanvas(state, newContainer);

      expect(state.container).toBe(newContainer);
    });

    it('should recreate fireworks with new canvas', () => {
      const state = createRendererState();
      const newContainer = document.createElement('div');
      const canvas = document.createElement('canvas');
      canvas.className = 'fireworks-canvas';
      newContainer.appendChild(canvas);
      const recreateSpy = vi
        .spyOn(fireworksUtils, 'recreateFireworksAfterContainerUpdate')
        .mockImplementation(() => {});

      reconnectFireworksCanvas(state, newContainer);

      expect(recreateSpy).toHaveBeenCalledWith(state.fireworksState, canvas);
    });
  });

  describe('destroyFireworksCanvas', () => {
    it('should destroy fireworks', () => {
      const state = createRendererState();
      const destroySpy = vi.spyOn(fireworksUtils, 'destroyFireworks').mockImplementation(() => {});

      destroyFireworksCanvas(state);

      expect(destroySpy).toHaveBeenCalledWith(state.fireworksState);
    });

    it('should reset cleanup handles', () => {
      const state = createRendererState();
      const resetSpy = vi.spyOn(sharedUtils, 'cancelAll').mockImplementation(() => {});

      destroyFireworksCanvas(state);

      expect(resetSpy).toHaveBeenCalledWith(state.resourceTracker);
    });

    it('should cancel pending resize RAF', () => {
      const state = createRendererState();
      state.resizeRafId = 12345;
      const cancelSpy = vi.spyOn(global, 'cancelAnimationFrame').mockImplementation(() => {});

      destroyFireworksCanvas(state);

      expect(cancelSpy).toHaveBeenCalledWith(12345);
    });

    it('should not cancel RAF when none pending', () => {
      const state = createRendererState();
      state.resizeRafId = null;
      const cancelSpy = vi.spyOn(global, 'cancelAnimationFrame').mockImplementation(() => {});

      destroyFireworksCanvas(state);

      expect(cancelSpy).not.toHaveBeenCalled();
    });

    it('should clear container innerHTML', () => {
      const state = createRendererState();
      const container = document.createElement('div');
      container.innerHTML = '<div>content</div>';
      state.container = container;

      destroyFireworksCanvas(state);

      expect(container.innerHTML).toBe('');
    });

    it('should handle null container gracefully', () => {
      const state = createRendererState();
      state.container = null;

      expect(() => destroyFireworksCanvas(state)).not.toThrow();
    });
  });

  describe('handleFireworksAnimationStateChange', () => {
    it('should destroy fireworks when animations disabled', () => {
      const state = createRendererState();
      const destroySpy = vi.spyOn(fireworksUtils, 'destroyFireworks').mockImplementation(() => {});

      handleFireworksAnimationStateChange(state, {
        shouldAnimate: false,
        prefersReducedMotion: false,
      });

      expect(destroySpy).toHaveBeenCalledWith(state.fireworksState);
    });

    it('should destroy fireworks when reduced motion preferred', () => {
      const state = createRendererState();
      const destroySpy = vi.spyOn(fireworksUtils, 'destroyFireworks').mockImplementation(() => {});

      handleFireworksAnimationStateChange(state, {
        shouldAnimate: true,
        prefersReducedMotion: true,
      });

      expect(destroySpy).toHaveBeenCalledWith(state.fireworksState);
    });

    it('should not destroy fireworks when animations enabled and no reduced motion', () => {
      const state = createRendererState();
      const destroySpy = vi.spyOn(fireworksUtils, 'destroyFireworks').mockImplementation(() => {});

      handleFireworksAnimationStateChange(state, {
        shouldAnimate: true,
        prefersReducedMotion: false,
      });

      expect(destroySpy).not.toHaveBeenCalled();
    });
  });
});
