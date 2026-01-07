import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { contributionGraphTimePageRenderer } from './time-page-renderer';
import { createTestContainer, removeTestContainer, mockResizeObserver } from '@/test-utils/theme-test-helpers';
import type { AnimationStateContext, MountContext } from '@themes/shared/types';
import * as animation from '../utils/ui/animation';
import * as rendererState from '../utils/ui/state';

/** Creates a mock MountContext with the given animation state. */
function createMockMountContext(state: Partial<AnimationStateContext> = {}): MountContext {
  const animationState: AnimationStateContext = {
    shouldAnimate: state.shouldAnimate ?? true,
    prefersReducedMotion: state.prefersReducedMotion ?? false,
    reason: state.reason,
  };
  return { getAnimationState: () => animationState };
}

describe('Contribution Graph Time Page Renderer', () => {
  let container: HTMLElement;
  let restoreResizeObserver: () => void;

  beforeEach(() => {
    container = createTestContainer();
    restoreResizeObserver = mockResizeObserver();
  });

  afterEach(() => {
    removeTestContainer(container);
    restoreResizeObserver();
    vi.restoreAllMocks();
  });

  describe('mount', () => {
    it('should mount successfully with grid display when renderer is created', () => {
      const theme = contributionGraphTimePageRenderer(new Date());
      theme.mount(container);
      expect(container.querySelector('.contribution-graph-grid')).toBeTruthy();
      expect(container.querySelector('[data-testid="countdown-display"]')).toBeTruthy();
    });

    it('should set data-testid on container when mounted', () => {
      const theme = contributionGraphTimePageRenderer(new Date());
      theme.mount(container);
      expect(container.getAttribute('data-testid')).toBe('theme-container');
    });

    it('should create squares in the grid when mounted', () => {
      const theme = contributionGraphTimePageRenderer(new Date());
      theme.mount(container);
      const squares = container.querySelectorAll('.contribution-graph-square');
      expect(squares.length).toBeGreaterThan(0);
    });

    it('should accept MountContext with animation state getter when provided', () => {
      const theme = contributionGraphTimePageRenderer(new Date());
      const context = createMockMountContext({ shouldAnimate: false, prefersReducedMotion: true });
      expect(() => {
        theme.mount(container, context);
      }).not.toThrow();
    });
  });

  describe('updateTime', () => {
    it('should render digit squares when updateTime is called', () => {
      const theme = contributionGraphTimePageRenderer(new Date());
      theme.mount(container);
      theme.updateTime({ days: 5, hours: 12, minutes: 30, seconds: 45, total: 500000000 });
      const digitSquares = container.querySelectorAll('.contribution-graph-square.is-digit');
      expect(digitSquares.length).toBeGreaterThan(0);
    });

    it('should apply pulse animation when animating is enabled', () => {
      const theme = contributionGraphTimePageRenderer(new Date());
      const context = createMockMountContext({ shouldAnimate: true, prefersReducedMotion: false });
      theme.mount(container, context);
      theme.updateTime({ days: 1, hours: 2, minutes: 3, seconds: 4, total: 100000 });
      const pulsingSquares = container.querySelectorAll('.contribution-graph-square.pulse-digit');
      expect(pulsingSquares.length).toBeGreaterThan(0);
    });

    it('should not pulse when reduced motion is preferred', () => {
      let animState = { shouldAnimate: true, prefersReducedMotion: true };
      const context: MountContext = { getAnimationState: () => animState };
      const theme = contributionGraphTimePageRenderer(new Date());
      theme.mount(container, context);
      theme.updateTime({ days: 0, hours: 0, minutes: 0, seconds: 1, total: 1000 });
      const pulsingSquares = container.querySelectorAll('.contribution-graph-square.pulse-digit');
      expect(pulsingSquares.length).toBe(0);
    });
  });

  describe('onAnimationStateChange', () => {
    it('should forward context to animation handler when animation state changes', () => {
      const theme = contributionGraphTimePageRenderer(new Date());
      const handlerSpy = vi.spyOn(animation, 'handleRendererAnimationStateChange').mockImplementation(() => {});
      theme.mount(container);

      theme.onAnimationStateChange({ shouldAnimate: false, prefersReducedMotion: false, reason: 'page-hidden' });

      expect(handlerSpy).toHaveBeenCalledWith(expect.any(Object), { shouldAnimate: false, prefersReducedMotion: false, reason: 'page-hidden' });
    });

    it('should handle animation being resumed', () => {
      const theme = contributionGraphTimePageRenderer(new Date());
      const context = createMockMountContext({ shouldAnimate: false });
      theme.mount(container, context);
      expect(() => {
        theme.onAnimationStateChange({ shouldAnimate: true, prefersReducedMotion: false });
      }).not.toThrow();
    });

    it('should handle reduced motion preference changes', () => {
      const theme = contributionGraphTimePageRenderer(new Date());
      theme.mount(container);
      expect(() => {
        theme.onAnimationStateChange({ shouldAnimate: true, prefersReducedMotion: true, reason: 'reduced-motion' });
      }).not.toThrow();
    });
  });

  describe('lifecycle hooks', () => {
    it('should render pixel art message when onCelebrating is called with reduced motion', () => {
      const theme = contributionGraphTimePageRenderer(new Date());
      // Use reduced motion context so celebration shows immediately without animation
      const context = createMockMountContext({ shouldAnimate: true, prefersReducedMotion: true });
      theme.mount(container, context);
      theme.onCelebrating({
        message: { forTextContent: 'Done!', forInnerHTML: 'Done!' },
        fullMessage: 'Done!'
      });
      // With pixel art celebration, message squares are added to grid
      const messageSquares = container.querySelectorAll('.contribution-graph-square.is-message');
      expect(messageSquares.length).toBeGreaterThan(0);
    });

    it('should show completion message without animation when onCelebrated is called', () => {
      const theme = contributionGraphTimePageRenderer(new Date());
      const messageSpy = vi.spyOn(animation, 'showCompletionMessageWithAmbient').mockImplementation(() => {});
      const clearSpy = vi.spyOn(animation, 'clearCelebrationVisuals').mockImplementation(() => {});
      theme.mount(container, createMockMountContext({ shouldAnimate: true, prefersReducedMotion: true }));

      theme.onCelebrated({ message: { forTextContent: 'Great', forInnerHTML: 'Great' } });

      expect(clearSpy).toHaveBeenCalled();
      expect(messageSpy).toHaveBeenCalled();
    });

    it('should keep grid visible when celebrating with pixel art', () => {
      const theme = contributionGraphTimePageRenderer(new Date());
      const context = createMockMountContext({ shouldAnimate: true, prefersReducedMotion: true });
      theme.mount(container, context);
      theme.onCelebrating({
        message: { forTextContent: 'Done!', forInnerHTML: 'Done!' },
        fullMessage: 'Done!'
      });
      const grid = container.querySelector('.contribution-graph-grid') as HTMLElement;
      // Grid stays visible for pixel art celebration
      expect(grid?.style.display).not.toBe('none');
    });

    it('should reset celebration UI when onCounting is called after celebration', () => {
      const theme = contributionGraphTimePageRenderer(new Date());
      const context = createMockMountContext({ shouldAnimate: true, prefersReducedMotion: true });
      theme.mount(container, context);
      theme.onCelebrating({
        message: { forTextContent: 'Done!', forInnerHTML: 'Done!' },
        fullMessage: 'Done!'
      });
      theme.onCounting();
      // Message squares should be cleared
      const messageSquares = container.querySelectorAll('.contribution-graph-square.is-message');
      expect(messageSquares.length).toBe(0);
    });

    it('should preserve grid layout after reset when toggling celebration state', () => {
      const theme = contributionGraphTimePageRenderer(new Date());
      const context = createMockMountContext({ shouldAnimate: true, prefersReducedMotion: true });
      theme.mount(container, context);
      
      // Get grid's initial layout properties via CSS custom properties
      const grid = container.querySelector('.contribution-graph-grid') as HTMLElement;
      const initialCols = grid.style.getPropertyValue('--contribution-graph-cols');
      const initialRows = grid.style.getPropertyValue('--contribution-graph-rows');
      expect(initialCols).toBeTruthy();
      expect(initialRows).toBeTruthy();
      
      // Trigger celebration then reset
      theme.onCelebrating({ message: 'Done!' });
      theme.onCounting();
      
      // Grid should still have proper layout
      const afterResetCols = grid.style.getPropertyValue('--contribution-graph-cols');
      const afterResetRows = grid.style.getPropertyValue('--contribution-graph-rows');
      expect(afterResetCols).toBe(initialCols);
      expect(afterResetRows).toBe(initialRows);
    });

    it('should render digits correctly after reset when counting resumes', () => {
      const theme = contributionGraphTimePageRenderer(new Date());
      const context = createMockMountContext({ shouldAnimate: true, prefersReducedMotion: true });
      theme.mount(container, context);
      
      // Complete celebration cycle
      theme.onCelebrating({ message: 'Done!' });
      theme.onCounting();
      
      // Update time should render new digits
      theme.updateTime({ days: 0, hours: 0, minutes: 5, seconds: 30, total: 330000 });
      
      const digitSquares = container.querySelectorAll('.contribution-graph-square.is-digit');
      expect(digitSquares.length).toBeGreaterThan(0);
    });
  });

  describe('cleanup', () => {
    it('should clean up all handles on destroy when destroy completes', async () => {
      const theme = contributionGraphTimePageRenderer(new Date());
      theme.mount(container);
      await theme.destroy();
      const handles = theme.getResourceTracker();
      expect(handles.intervals).toHaveLength(0);
      expect(handles.timeouts).toHaveLength(0);
      expect(handles.listeners).toHaveLength(0);
    });

    it('should clear container on destroy when destroy completes', async () => {
      const theme = contributionGraphTimePageRenderer(new Date());
      theme.mount(container);
      await theme.destroy();
      expect(container.innerHTML).toBe('');
    });
  });

  describe('updateContainer', () => {
    it('should delegate container updates to renderer state when updateContainer is invoked', () => {
      const theme = contributionGraphTimePageRenderer(new Date());
      const updateSpy = vi.spyOn(rendererState, 'updateTimeRendererContainer').mockImplementation(() => {});
      theme.updateContainer(container);
      expect(updateSpy).toHaveBeenCalled();
    });
  });
});
