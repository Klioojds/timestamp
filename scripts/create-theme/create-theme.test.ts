import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import {
  normalizeAuthor,
  toCamelCase,
  toKebabCase,
  toPascalCase,
  toSnakeCase,
  validateThemeName,
} from './utils';

describe('create-theme utils', () => {
  describe('string transformations', () => {
    it.each([
      { input: 'My Theme', kebab: 'my-theme', pascal: 'MyTheme', camel: 'myTheme', snake: 'my_theme' },
      { input: 'neon-glow', kebab: 'neon-glow', pascal: 'NeonGlow', camel: 'neonGlow', snake: 'neon_glow' },
      { input: 'Theme 2026!', kebab: 'theme-2026', pascal: 'Theme2026', camel: 'theme2026', snake: 'theme_2026' },
    ])('should convert "$input" into canonical cases', ({ input, kebab, pascal, camel, snake }) => {
      expect(toKebabCase(input)).toBe(kebab);
      expect(toPascalCase(kebab)).toBe(pascal);
      expect(toCamelCase(kebab)).toBe(camel);
      expect(toSnakeCase(kebab)).toBe(snake);
    });

    it('should strip non alphanumeric characters when kebab-casing', () => {
      expect(toKebabCase('theme@special#chars!')).toBe('themespecialchars');
    });
  });

  describe('normalizeAuthor', () => {
    it('should strip leading @ and return normalized username', () => {
      const result = normalizeAuthor('@chrisreddington');
      expect(result).toBe('chrisreddington');
    });

    it('should return null for empty or undefined author', () => {
      expect(normalizeAuthor('')).toBeNull();
      expect(normalizeAuthor(undefined)).toBeNull();
    });

    it('should throw for invalid characters', () => {
      expect(() => normalizeAuthor('invalid$user')).toThrow(/Invalid GitHub username/);
    });
  });

  describe('validateThemeName', () => {
    let existsSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      existsSpy = vi.spyOn(fs, 'existsSync');
    });

    afterEach(() => {
      existsSpy.mockRestore();
    });

    it('should allow new kebab-case names', () => {
      existsSpy.mockReturnValue(false);

      expect(() => validateThemeName('aurora-lights')).not.toThrow();
    });

    it('should reject names that are not kebab-case', () => {
      existsSpy.mockReturnValue(false);

      expect(() => validateThemeName('InvalidName')).toThrow(/kebab-case/);
    });

    it('should reject when theme directory already exists', () => {
      existsSpy.mockReturnValue(true);

      expect(() => validateThemeName('fireworks')).toThrow(/already exists/);
    });
  });
});
