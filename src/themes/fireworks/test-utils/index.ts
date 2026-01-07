/**
 * Shared helpers for fireworks theme tests.
 *
 * @remarks
 * For mocking the fireworks-js library, use:
 * ```ts
 * vi.mock('fireworks-js', () => import('../test-utils/fireworks-js.mock'));
 * ```
 */
import type { LandingPageRenderer } from '@core/types';

import { createTestContainer, removeTestContainer } from '@/test-utils/theme-test-helpers';

import { fireworksLandingPageRenderer } from '../renderers/landing-page-renderer';

interface FireworksTestContainer {
  container: HTMLElement;
  cleanup: () => void;
}

/**
 * Create a DOM container for fireworks tests and return a paired cleanup handler.
 *
 * @param id - Optional DOM id for the container
 * @returns Container element with cleanup function
 *
 * @example
 * const testContainer = createFireworksTestContainer();
 * // ...mount theme into testContainer.container...
 * testContainer.cleanup();
 */
export function createFireworksTestContainer(id = 'fireworks-test-container'): FireworksTestContainer {
  const container = createTestContainer(id);
  return {
    container,
    cleanup: () => removeTestContainer(container),
  };
}

/**
 * Mount a fireworks background into the provided container.
 *
 * @param container - Target element to host the background
 * @returns Mounted background renderer
 *
 * @example
 * const renderer = mountFireworksBackground(container);
 * expect(container.querySelector('.landing-fireworks-starfield')).toBeTruthy();
 */
export function mountFireworksBackground(container: HTMLElement): LandingPageRenderer {
  const renderer = fireworksLandingPageRenderer(container);
  renderer.mount(container);
  return renderer;
}

/**
 * Render star markup into a temporary wrapper for assertions.
 *
 * @param html - Raw HTML string of generated stars
 * @returns Wrapper element and list of star elements
 *
 * @example
 * const stars = renderStarsFragment(generateStarsHtml());
 * expect(stars.stars.length).toBeGreaterThan(0);
 */
export function renderStarsFragment(html: string): { wrapper: HTMLElement; stars: NodeListOf<HTMLElement> } {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  return { wrapper, stars: wrapper.querySelectorAll<HTMLElement>('.star') };
}
