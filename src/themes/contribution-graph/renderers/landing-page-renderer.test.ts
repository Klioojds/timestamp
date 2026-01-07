import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createThemeTestContainer, mountLandingPageRenderer } from '../test-utils';
import { contributionGraphLandingPageRenderer } from './landing-page-renderer';
import * as landingState from '../utils/ui/state';

describe('ContributionGraph Landing Page Renderer', () => {
  let container: HTMLElement;
  let cleanup: () => void;

  beforeEach(() => {
    const testContainer = createThemeTestContainer();
    container = testContainer.container;
    cleanup = testContainer.cleanup;
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('mount', () => {
    it('should create background element when renderer mounts', () => {
      const renderer = mountLandingPageRenderer(container);
      expect(container.children.length).toBeGreaterThan(0);
      renderer.destroy();
    });

    it('should set aria-hidden on background when renderer mounts', () => {
      const renderer = mountLandingPageRenderer(container);
      const background = container.querySelector('[aria-hidden="true"]');
      expect(background).toBeTruthy();
      renderer.destroy();
    });
  });

  describe('destroy', () => {
    it('should clean up all elements when destroy is called', () => {
      const renderer = contributionGraphLandingPageRenderer(container);
      renderer.mount(container);
      renderer.destroy();
      expect(container.children.length).toBe(0);
    });
  });

  describe('delegation', () => {
    it('should forward animation state changes to handler', () => {
      const renderer = contributionGraphLandingPageRenderer(container);
      const animationSpy = vi.spyOn(landingState, 'handleLandingAnimationStateChange');

      renderer.onAnimationStateChange({ shouldAnimate: false, prefersReducedMotion: true, reason: 'test' });

      expect(animationSpy).toHaveBeenCalled();
    });

    it('should delegate size updates to resize handler', () => {
      const renderer = contributionGraphLandingPageRenderer(container);
      const resizeSpy = vi.spyOn(landingState, 'handleLandingResize');

      renderer.setSize(800, 600);

      expect(resizeSpy).toHaveBeenCalled();
    });

    it('should destroy using landing renderer cleanup', () => {
      const renderer = contributionGraphLandingPageRenderer(container);
      const destroySpy = vi.spyOn(landingState, 'destroyLandingRenderer');

      renderer.destroy();

      expect(destroySpy).toHaveBeenCalled();
    });
  });

  describe('getElementCount', () => {
    it('should return element counts when background is mounted', () => {
      const renderer = mountLandingPageRenderer(container);
      const counts = renderer.getElementCount();
      expect(counts).toHaveProperty('total');
      expect(counts).toHaveProperty('animated');
      renderer.destroy();
    });
  });
});
