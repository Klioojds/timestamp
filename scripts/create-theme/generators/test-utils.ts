/**
 * Generate the test-utils helper file (test-utils/index.ts).
 *
 * Creates shared test utilities for theme unit tests.
 * Uses consistent imports from \@themes/shared/types.
 *
 * @param themeName - Kebab-case theme name
 * @returns Generated TypeScript source code
 */
import { toCamelCase } from '../utils/string-utils';

export function generateTestUtilsTs(themeName: string): string {
  const camel = toCamelCase(themeName);
  return `/**
 * Test helpers for ${themeName} theme tests.
 */



import type { LandingPageRenderer } from '@themes/shared/types';

import { createTestContainer, removeTestContainer } from '@/test-utils/theme-test-helpers';

import { ${camel}LandingPageRenderer } from '../renderers/landing-page-renderer';

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
export function createThemeTestContainer(id = '${themeName}-test-container'): ThemeTestContainer {
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
  const renderer = ${camel}LandingPageRenderer(container);
  renderer.mount(container);
  return renderer;
}
`;
}
