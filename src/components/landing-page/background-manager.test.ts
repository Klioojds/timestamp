/**
 * Background Manager Tests
 * Tests for LandingPageRenderer lifecycle, visibility handling, and resize events.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createBackgroundManager, type BackgroundManagerController } from './background-manager';
import type { LandingPageRenderer } from '@themes/shared';

// Mock the registry's getLandingPageRendererFactory
vi.mock('@themes/registry', () => ({
  getLandingPageRendererFactory: vi.fn(),
}));

import { getLandingPageRendererFactory } from '@themes/registry';

describe('BackgroundManager', () => {
  let bgManager: BackgroundManagerController;
  let container: HTMLElement;
  let mockRenderer: LandingPageRenderer;

  beforeEach(() => {
    vi.useFakeTimers();

    // Create mock landing page renderer
    mockRenderer = {
      mount: vi.fn(),
      setSize: vi.fn(),
      onAnimationStateChange: vi.fn(),
      destroy: vi.fn(),
      getElementCount: vi.fn().mockReturnValue({ total: 100, animated: 5 }),
    };

    // Setup factory mock to return the mock renderer
    const mockFactory = vi.fn().mockReturnValue(mockRenderer);
    vi.mocked(getLandingPageRendererFactory).mockResolvedValue(mockFactory);

    // Create container
    container = document.createElement('div');
    document.body.appendChild(container);

    // Create background manager
    bgManager = createBackgroundManager();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    bgManager.destroy();
    container.remove();
  });

  describe('initialize', () => {
    it('should store container reference', () => {
      bgManager.initialize(container);

      // After initialize, render should work
      bgManager.render('contribution-graph');

      // Container should be cleared and have class set
      expect(container.className).toContain('landing-theme-background');
    });

    it('should setup visibility event listener', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

      bgManager.initialize(container);

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'visibilitychange',
        expect.any(Function)
      );
    });

    it('should setup resize event listener', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      bgManager.initialize(container);

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'resize',
        expect.any(Function)
      );
    });
  });

  describe('render', () => {
    beforeEach(() => {
      bgManager.initialize(container);
    });

    it('should create landing page renderer using factory', async () => {
      await bgManager.render('contribution-graph');

      expect(getLandingPageRendererFactory).toHaveBeenCalledWith('contribution-graph');
      // Context now uses getter pattern
      expect(mockRenderer.mount).toHaveBeenCalledWith(
        container, 
        expect.objectContaining({ getAnimationState: expect.any(Function) })
      );
      // Verify the getter returns expected initial state
      const mountCall = vi.mocked(mockRenderer.mount).mock.calls[0];
      const context = mountCall?.[1];
      expect(context?.getAnimationState()).toEqual({ shouldAnimate: true, prefersReducedMotion: false });
    });

    it('should update container class with theme', async () => {
      await bgManager.render('fireworks');

      expect(container.className).toBe('landing-theme-background landing-theme-background--fireworks');
    });

    it('should clear container before rendering', async () => {
      container.innerHTML = '<div>existing content</div>';

      await bgManager.render('contribution-graph');

      // Container should only have content from mount, not old content
      // (In real implementation, mount adds content)
      expect(container.innerHTML).toBe('');
    });

    it('should destroy previous renderer when rendering new theme', async () => {
      await bgManager.render('contribution-graph');

      // Reset the mock to track new calls
      mockRenderer.destroy.mockClear();

      // Create a new mock for the second render
      const newMockRenderer: LandingPageRenderer = {
        mount: vi.fn(),
        setSize: vi.fn(),
        destroy: vi.fn(),
        onAnimationStateChange: vi.fn(),
        getElementCount: vi.fn().mockReturnValue({ total: 50, animated: 2 }),
      };
      const newMockFactory = vi.fn().mockReturnValue(newMockRenderer);
      vi.mocked(getLandingPageRendererFactory).mockResolvedValue(newMockFactory);

      await bgManager.render('fireworks');

      expect(mockRenderer.destroy).toHaveBeenCalled();
      expect(newMockRenderer.mount).toHaveBeenCalled();
    });

    it('should return renderer via getRenderer', async () => {
      await bgManager.render('contribution-graph');

      expect(bgManager.getRenderer()).toBe(mockRenderer);
    });
  });

  describe('waitForReady', () => {
    beforeEach(() => {
      bgManager.initialize(container);
    });

    it('should resolve when background is ready', async () => {
      const renderPromise = bgManager.render('contribution-graph');
      await bgManager.waitForReady();

      expect(mockRenderer.mount).toHaveBeenCalled();
      await renderPromise; // Ensure render completes
    });

    it('should resolve immediately if no render in progress', async () => {
      await expect(bgManager.waitForReady()).resolves.toBeUndefined();
    });
  });

  describe('visibility handling', () => {
    beforeEach(async () => {
      bgManager.initialize(container);
      await bgManager.render('contribution-graph');
    });

    it('should call onAnimationStateChange with shouldAnimate=false when page becomes hidden', () => {
      // Simulate page becoming hidden
      Object.defineProperty(document, 'hidden', {
        value: true,
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      expect(mockRenderer.onAnimationStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          shouldAnimate: false,
          reason: 'page-hidden',
        })
      );
    });

    it('should call onAnimationStateChange with shouldAnimate=true when page becomes visible', () => {
      // First make it hidden
      Object.defineProperty(document, 'hidden', {
        value: true,
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      // Then make it visible
      Object.defineProperty(document, 'hidden', {
        value: false,
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      expect(mockRenderer.onAnimationStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          shouldAnimate: true,
          reason: 'page-hidden',
        })
      );
    });

    it('should not error if no renderer when visibility changes', () => {
      bgManager.destroy();

      // Should not throw
      expect(() => {
        Object.defineProperty(document, 'hidden', {
          value: true,
          configurable: true,
        });
        document.dispatchEvent(new Event('visibilitychange'));
      }).not.toThrow();
    });
  });

  describe('resize handling', () => {
    beforeEach(async () => {
      bgManager.initialize(container);
      await bgManager.render('contribution-graph');
    });

    it('should call setSize after debounce delay', () => {
      window.dispatchEvent(new Event('resize'));

      // Should not be called immediately
      expect(mockRenderer.setSize).not.toHaveBeenCalled();

      // Advance timers past debounce delay (150ms)
      vi.advanceTimersByTime(150);

      expect(mockRenderer.setSize).toHaveBeenCalledWith(
        window.innerWidth,
        window.innerHeight
      );
    });

    it('should debounce multiple resize events', () => {
      // Fire multiple resize events rapidly
      window.dispatchEvent(new Event('resize'));
      vi.advanceTimersByTime(50);
      window.dispatchEvent(new Event('resize'));
      vi.advanceTimersByTime(50);
      window.dispatchEvent(new Event('resize'));

      // Should not have been called yet
      expect(mockRenderer.setSize).not.toHaveBeenCalled();

      // Advance past debounce delay from last event
      vi.advanceTimersByTime(150);

      // Should only be called once
      expect(mockRenderer.setSize).toHaveBeenCalledTimes(1);
    });

    it('should not error if no renderer when resize fires', () => {
      bgManager.destroy();

      // Should not throw
      expect(() => {
        window.dispatchEvent(new Event('resize'));
        vi.advanceTimersByTime(150);
      }).not.toThrow();
    });
  });

  describe('destroy', () => {
    beforeEach(async () => {
      bgManager.initialize(container);
      await bgManager.render('contribution-graph');
    });

    it('should destroy landing page renderer', () => {
      bgManager.destroy();

      expect(mockRenderer.destroy).toHaveBeenCalled();
    });

    it('should remove visibility event listener', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      bgManager.destroy();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'visibilitychange',
        expect.any(Function)
      );
    });

    it('should remove resize event listener', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      bgManager.destroy();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'resize',
        expect.any(Function)
      );
    });

    it('should clear pending resize timeout', () => {
      // Start a resize
      window.dispatchEvent(new Event('resize'));

      // Destroy before timeout
      bgManager.destroy();

      // Advance timers - setSize should not be called
      vi.advanceTimersByTime(150);

      // destroy() already called destroy on renderer, so we check setSize wasn't called after
      expect(mockRenderer.setSize).not.toHaveBeenCalled();
    });

    it('should return null from getRenderer after destroy', () => {
      bgManager.destroy();

      expect(bgManager.getRenderer()).toBeNull();
    });
  });
});
