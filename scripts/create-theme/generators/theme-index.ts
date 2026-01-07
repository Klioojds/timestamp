/**
 * Generate the main theme entry point file (index.ts).
 *
 * Creates a clean entry point that exports:
 * - Theme configuration
 * - Time page renderer factory
 * - Landing page renderer factory
 *
 * All implementation lives in dedicated files - index.ts ONLY exports.
 * Uses consistent import/export pattern matching established themes.
 *
 * @param themeName - Kebab-case theme name
 * @param _author - GitHub username of author (normalized, without \@) or null
 * @returns Generated TypeScript source code
 */
import { toCamelCase, toPascalCase, toSnakeCase } from '../utils/string-utils';

export function generateIndexTs(themeName: string, _author: string | null): string {
  const camel = toCamelCase(themeName);
  const pascal = toPascalCase(themeName);
  const snakeUpper = toSnakeCase(themeName).toUpperCase();

  // Exports sorted alphabetically (required by simple-import-sort)
  return `/**
 * ${pascal} Theme
 *
 * A countdown theme featuring a pulsing ring animation that demonstrates:
 * - Animation state management (distinct from orchestrator lifecycle)
 * - Proper pause/resume via onAnimationStateChange hook
 * - State object pattern for explicit, testable state
 * - Resource tracking with createResourceTracker()
 *
 * @remarks
 * Entry point for the ${themeName} theme. Exports theme configuration
 * and renderer factories for registry integration.
 *
 * Architecture:
 * - index.ts: Clean entry point (exports only, no implementation)
 * - config/: Theme configuration and constants
 * - renderers/: TimePageRenderer and LandingPageRenderer implementations
 * - utils/ui/: DOM creation and manipulation utilities
 */

import './styles.scss';

/** Theme configuration metadata and color scheme. */
export { ${snakeUpper}_CONFIG } from './config';

/** Landing page renderer factory (animated background). */
export { ${camel}LandingPageRenderer } from './renderers/landing-page-renderer';

/** Time page renderer factory (countdown display). */
export { ${camel}TimePageRenderer } from './renderers/time-page-renderer';
`;
}
