/**
 * @file view.test.ts
 * @description Unit tests for the perf-overlay view module
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createOverlayDOM, getOverlayElements, updateExpandState } from './view';

describe('Perf Overlay View', () => {
  describe('createOverlayDOM', () => {
    it('should create a container with correct class', () => {
      const container = createOverlayDOM();
      expect(container.className).toBe('perf-overlay');
    });

    it('should set accessibility attributes', () => {
      const container = createOverlayDOM();
      expect(container.getAttribute('role')).toBe('complementary');
      expect(container.getAttribute('aria-label')).toBe('Performance Monitor');
    });

    it('should contain header with title', () => {
      const container = createOverlayDOM();
      const title = container.querySelector('.perf-overlay__title');
      expect(title).not.toBeNull();
      expect(title?.textContent).toBe('Performance');
    });

    it('should contain control buttons', () => {
      const container = createOverlayDOM();
      const clearBtn = container.querySelector('[data-action="clear"]');
      const closeBtn = container.querySelector('[data-action="close"]');
      expect(clearBtn).not.toBeNull();
      expect(closeBtn).not.toBeNull();
    });

    it('should contain metric elements', () => {
      const container = createOverlayDOM();
      const fpsMetric = container.querySelector('[data-metric="fps"]');
      const frameMetric = container.querySelector('[data-metric="frame"]');
      const domMetric = container.querySelector('[data-metric="dom"]');
      const inpMetric = container.querySelector('[data-metric="inp"]');
      expect(fpsMetric).not.toBeNull();
      expect(frameMetric).not.toBeNull();
      expect(domMetric).not.toBeNull();
      expect(inpMetric).not.toBeNull();
    });

    it('should contain details section', () => {
      const container = createOverlayDOM();
      const details = container.querySelector('.perf-overlay__details');
      expect(details).not.toBeNull();
    });

    it('should contain stats container', () => {
      const container = createOverlayDOM();
      const stats = container.querySelector('[data-stats="fps"]');
      expect(stats).not.toBeNull();
    });

    it('should contain operations container', () => {
      const container = createOverlayDOM();
      const ops = container.querySelector('[data-operations]');
      expect(ops).not.toBeNull();
    });
  });

  describe('getOverlayElements', () => {
    it('should return all element references', () => {
      const container = createOverlayDOM();
      const elements = getOverlayElements(container);

      expect(elements.container).toBe(container);
      expect(elements.fpsMetric).not.toBeNull();
      expect(elements.frameMetric).not.toBeNull();
      expect(elements.domMetric).not.toBeNull();
      expect(elements.inpMetric).not.toBeNull();
      expect(elements.statsContainer).not.toBeNull();
      expect(elements.operationsContainer).not.toBeNull();
      expect(elements.detailsSection).not.toBeNull();
      expect(elements.expandButton).not.toBeNull();
    });
  });

  describe('updateExpandState', () => {
    let container: HTMLDivElement;

    beforeEach(() => {
      container = createOverlayDOM();
      document.body.appendChild(container);
    });

    afterEach(() => {
      container.remove();
    });

    it('should add is-expanded class when expanded', () => {
      const elements = getOverlayElements(container);
      updateExpandState(elements, true);

      expect(elements.detailsSection?.classList.contains('is-expanded')).toBe(true);
    });

    it('should remove is-expanded class when collapsed', () => {
      const elements = getOverlayElements(container);
      updateExpandState(elements, true);
      updateExpandState(elements, false);

      expect(elements.detailsSection?.classList.contains('is-expanded')).toBe(false);
    });

    it('should update button text when expanded', () => {
      const elements = getOverlayElements(container);
      updateExpandState(elements, true);

      expect(elements.expandButton?.textContent).toContain('Hide Details');
    });

    it('should update button text when collapsed', () => {
      const elements = getOverlayElements(container);
      updateExpandState(elements, false);

      expect(elements.expandButton?.textContent).toContain('Show Details');
    });
  });
});
