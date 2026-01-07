/**
 * Generate the theme entry point unit test file (index.test.ts).
 *
 * Tests that the theme entry point exports all required exports for registry integration.
 *
 * @param themeName - Kebab-case theme name
 * @returns Generated TypeScript source code
 */
import { toCamelCase, toSnakeCase } from '../utils/string-utils';

export function generateIndexTestTs(themeName: string): string {
  const camel = toCamelCase(themeName);
  const snakeUpper = toSnakeCase(themeName).toUpperCase();

  return `import { describe, expect, it } from 'vitest';
import * as entrypoint from './index';
import { ${snakeUpper}_CONFIG } from './config';
import { ${camel}TimePageRenderer } from './renderers/time-page-renderer';
import { ${camel}LandingPageRenderer } from './renderers/landing-page-renderer';

/** Tests for ${themeName} theme entry point exports. */
describe('${themeName} index', () => {
  it('should export configuration and renderer factories when the entry module loads', () => {
    expect(entrypoint.${snakeUpper}_CONFIG).toBe(${snakeUpper}_CONFIG);
    expect(entrypoint.${camel}TimePageRenderer).toBe(${camel}TimePageRenderer);
    expect(entrypoint.${camel}LandingPageRenderer).toBe(${camel}LandingPageRenderer);
  });

  it('should expose export names expected by the registry when importing the theme module', () => {
    const { ${snakeUpper}_CONFIG: config, ${camel}TimePageRenderer: timeRenderer, ${camel}LandingPageRenderer: landingRenderer } = entrypoint;

    expect(config).toBeDefined();
    expect(typeof timeRenderer).toBe('function');
    expect(typeof landingRenderer).toBe('function');
  });
});
`;
}
