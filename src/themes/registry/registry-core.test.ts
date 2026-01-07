/**
 * Tests for Theme Registry Core
 */
import { describe, it, expect } from 'vitest';
import {
  THEME_REGISTRY,
  DEFAULT_THEME_ID,
  type ThemeId,
} from './registry-core';
import { isValidThemeId } from './registry-validation';

describe('Registry Core', () => {
  describe('THEME_REGISTRY', () => {
    it.each([
      { themeId: 'contribution-graph' as ThemeId },
      { themeId: 'fireworks' as ThemeId },
    ])('should expose registry entry for %s', ({ themeId }) => {
      const entry = THEME_REGISTRY[themeId];

      expect(entry).toBeDefined();
      expect(entry.id).toBe(themeId);
      expect(typeof entry.loadTheme).toBe('function');
    });

    it('should have valid structure for all themes', () => {
      for (const themeId of Object.keys(THEME_REGISTRY) as ThemeId[]) {
        const entry = THEME_REGISTRY[themeId];
        expect(entry.id).toBeDefined();
        expect(entry.name).toBeDefined();
        expect(entry.description).toBeDefined();
        expect(entry.publishedDate).toBeDefined();
        expect(typeof entry.loadTheme).toBe('function');
      }
    });

    it('should have matching id property and key for all themes', () => {
      for (const themeId of Object.keys(THEME_REGISTRY) as ThemeId[]) {
        expect(THEME_REGISTRY[themeId].id).toBe(themeId);
      }
    });
  });

  describe('DEFAULT_THEME_ID', () => {
    it('should be a valid theme ID', () => {
      expect(isValidThemeId(DEFAULT_THEME_ID)).toBe(true);
    });

    it('should be contribution-graph', () => {
      expect(DEFAULT_THEME_ID).toBe('contribution-graph');
    });
  });
});
