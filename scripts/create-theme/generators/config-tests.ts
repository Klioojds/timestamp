/**
 * Generate the config unit test file (config/index.test.ts).
 *
 * Creates Vitest tests covering:
 * - Theme configuration validation
 * - Required properties present
 * - Values within expected ranges
 *
 * @param themeName - Kebab-case theme name
 * @returns Generated TypeScript source code
 */
import { toPascalCase, toSnakeCase } from '../utils/string-utils';

export function generateConfigTestTs(themeName: string): string {
  const pascal = toPascalCase(themeName);
  const snakeUpper = toSnakeCase(themeName).toUpperCase();

  return `import { describe, it, expect } from 'vitest';
import { ${snakeUpper}_CONFIG } from './index';

describe('${pascal} Config', () => {
  describe('Theme Configuration', () => {
    it('should have valid theme ID', () => {
      expect(${snakeUpper}_CONFIG.id).toBe('${themeName}');
    });

    it('should have required config properties', () => {
      expect(${snakeUpper}_CONFIG.name).toBeDefined();
      expect(${snakeUpper}_CONFIG.name).toMatch(/^[A-Z]/);
      expect(${snakeUpper}_CONFIG.description).toBeDefined();
      expect(${snakeUpper}_CONFIG.publishedDate).toMatch(/^\\d{4}-\\d{2}-\\d{2}$/);
      expect(${snakeUpper}_CONFIG.author).toBeDefined();
    });

    it('should have sensible supportsWorldMap setting', () => {
      expect(typeof ${snakeUpper}_CONFIG.supportsWorldMap).toBe('boolean');
    });

    it('should have optional components configuration', () => {
      expect(${snakeUpper}_CONFIG.optionalComponents).toBeDefined();
      expect(typeof ${snakeUpper}_CONFIG.optionalComponents.timezoneSelector).toBe('boolean');
      expect(typeof ${snakeUpper}_CONFIG.optionalComponents.worldMap).toBe('boolean');
    });

    it('should have colors defined for both modes', () => {
      expect(${snakeUpper}_CONFIG.colors).toBeDefined();
      expect(${snakeUpper}_CONFIG.colors?.dark).toBeDefined();
      expect(${snakeUpper}_CONFIG.colors?.light).toBeDefined();
      expect(${snakeUpper}_CONFIG.colors?.dark?.accentPrimary).toBeDefined();
      expect(${snakeUpper}_CONFIG.colors?.light?.accentPrimary).toBeDefined();
    });
  });
});
`;
}
