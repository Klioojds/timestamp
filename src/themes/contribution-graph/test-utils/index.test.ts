import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../renderers/landing-page-renderer', () => {
  const renderer = {
    mount: vi.fn(),
    destroy: vi.fn(),
    getElementCount: vi.fn(() => ({ total: 1, animated: 1 })),
  };

  return {
    contributionGraphLandingPageRenderer: vi.fn(() => renderer),
  };
});

import { contributionGraphLandingPageRenderer } from '../renderers/landing-page-renderer';
import { createThemeTestContainer, mountLandingPageRenderer } from './index';

/** Tests for theme test utility helpers. */
describe('contribution-graph test-utils', () => {
  let createdContainers: HTMLElement[];

  beforeEach(() => {
    createdContainers = [];
  });

  afterEach(() => {
    createdContainers.forEach((container) => {
      container.parentElement?.removeChild(container);
    });
    vi.restoreAllMocks();
  });

  describe('createThemeTestContainer', () => {
    it.each([
      { id: undefined, expectedId: 'contribution-graph-test-container' },
      { id: 'custom-container', expectedId: 'custom-container' },
    ])('should create and append container with id $expectedId when id=$id', ({ id, expectedId }) => {
      const { container, cleanup } = createThemeTestContainer(id);
      createdContainers.push(container);

      expect(container.id).toBe(expectedId);
      expect(document.body.contains(container)).toBe(true);

      cleanup();
      expect(document.body.contains(container)).toBe(false);
    });
  });

  describe('mountLandingPageRenderer', () => {
    it('should instantiate renderer and call mount with provided container', () => {
      const container = document.createElement('div');
      const renderer = mountLandingPageRenderer(container);

      expect(contributionGraphLandingPageRenderer).toHaveBeenCalledWith(container);
      expect(renderer.mount).toHaveBeenCalledWith(container);
      expect(renderer).toHaveProperty('destroy');
    });
  });
});