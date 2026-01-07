/**
 * Test helpers for contribution-graph theme tests.
 */
import type { LandingPageRenderer } from '@core/types';

import { createTestContainer, removeTestContainer } from '@/test-utils/theme-test-helpers';

import { contributionGraphLandingPageRenderer } from '../renderers/landing-page-renderer';

interface ThemeTestContainer {
  container: HTMLElement;
  cleanup: () => void;
}

/**
 * Create a DOM container for theme tests.
 *
 * @returns Container element and cleanup function
 * @internal
 */
export function createThemeTestContainer(id = 'contribution-graph-test-container'): ThemeTestContainer {
  const container = createTestContainer(id);
  return {
    container,
    cleanup: () => removeTestContainer(container),
  };
}

/**
 * Mount a landing page renderer into the container.
 *
 * @param container - Container element to mount into
 * @returns Mounted landing page renderer
 * @internal
 */
export function mountLandingPageRenderer(container: HTMLElement): LandingPageRenderer {
  const renderer = contributionGraphLandingPageRenderer(container);
  renderer.mount(container);
  return renderer;
}
