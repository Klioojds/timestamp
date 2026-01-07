/**
 * Tests for Theme Registry Metadata Utilities
 */
import { describe, it, expect, vi } from 'vitest';
import {
  getThemeDisplayName,
  getThemeMetadata,
  getThemePublishedDate,
  isNewTheme,
  getThemeAuthor,
  getThemeTags,
  getThemeColorOverrides,
  getThemePalette,
} from './registry-metadata';
import { COLOR_SCHEME_DEFAULTS } from '@/core/config/color-scheme-defaults';

describe('Registry Metadata', () => {
  describe('getThemeDisplayName', () => {
    it.each([
      { themeId: 'contribution-graph' as const, expected: 'Contribution Graph' },
      { themeId: 'fireworks' as const, expected: 'Fireworks Celebration' },
    ])('should return "$expected" for $themeId', ({ themeId, expected }) => {
      expect(getThemeDisplayName(themeId)).toBe(expected);
    });
  });

  describe('getThemeMetadata', () => {
    it('should return metadata object with required fields', () => {
      const metadata = getThemeMetadata('contribution-graph');
      expect(metadata.id).toBe('contribution-graph');
      expect(metadata.name).toBe('Contribution Graph');
      expect(metadata.description).toBeDefined();
      expect(metadata.publishedDate).toBeDefined();
    });

    it('should return different metadata for different themes', () => {
      const graphMetadata = getThemeMetadata('contribution-graph');
      const fireworksMetadata = getThemeMetadata('fireworks');
      expect(graphMetadata.name).not.toBe(fireworksMetadata.name);
      expect(graphMetadata.id).not.toBe(fireworksMetadata.id);
    });

    it('should include author field', () => {
      const metadata = getThemeMetadata('contribution-graph');
      expect('author' in metadata).toBe(true);
    });
  });

  describe('getThemePublishedDate', () => {
    it('should return a date string for valid theme IDs', () => {
      const date = getThemePublishedDate('contribution-graph');
      expect(typeof date).toBe('string');
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/); // ISO 8601 YYYY-MM-DD format
    });

    it('should return valid parseable dates', () => {
      const dateStr = getThemePublishedDate('fireworks');
      const dateObj = new Date(dateStr);
      expect(dateObj.toString()).not.toBe('Invalid Date');
    });
  });

  describe('isNewTheme', () => {
    it('should return boolean for valid theme IDs', () => {
      const result = isNewTheme('contribution-graph');
      expect(typeof result).toBe('boolean');
    });

    it('should return true for themes published within 30 days', () => {
      // Mock "today" as 15 days after contribution-graph's publishedDate
      const publishedDate = new Date(getThemePublishedDate('contribution-graph'));
      const fifteenDaysLater = new Date(publishedDate);
      fifteenDaysLater.setDate(fifteenDaysLater.getDate() + 15);
      
      vi.useFakeTimers();
      vi.setSystemTime(fifteenDaysLater);
      
      expect(isNewTheme('contribution-graph')).toBe(true);
      
      vi.useRealTimers();
    });

    it('should return false for themes published over 30 days ago', () => {
      // Mock "today" as 60 days after fireworks' publishedDate
      const publishedDate = new Date(getThemePublishedDate('fireworks'));
      const sixtyDaysLater = new Date(publishedDate);
      sixtyDaysLater.setDate(sixtyDaysLater.getDate() + 60);
      
      vi.useFakeTimers();
      vi.setSystemTime(sixtyDaysLater);
      
      expect(isNewTheme('fireworks')).toBe(false);
      
      vi.useRealTimers();
    });

    it('should return false on exactly the 30th day (boundary)', () => {
      // Mock "today" as exactly 30 days after publishedDate
      // publishedDate > thirtyDaysAgo is false when they're equal
      const publishedDate = new Date(getThemePublishedDate('contribution-graph'));
      const thirtyDaysLater = new Date(publishedDate);
      thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
      
      vi.useFakeTimers();
      vi.setSystemTime(thirtyDaysLater);
      
      expect(isNewTheme('contribution-graph')).toBe(false);
      
      vi.useRealTimers();
    });

    it('should return true on the 29th day', () => {
      // Mock "today" as 29 days after publishedDate (still new)
      const publishedDate = new Date(getThemePublishedDate('contribution-graph'));
      const twentyNineDaysLater = new Date(publishedDate);
      twentyNineDaysLater.setDate(twentyNineDaysLater.getDate() + 29);
      
      vi.useFakeTimers();
      vi.setSystemTime(twentyNineDaysLater);
      
      expect(isNewTheme('contribution-graph')).toBe(true);
      
      vi.useRealTimers();
    });
  });

  describe('getThemeAuthor', () => {
    it('should return author string or null', () => {
      const author = getThemeAuthor('contribution-graph');
      expect(author === null || typeof author === 'string').toBe(true);
    });

    it('should return chrisreddington for built-in themes', () => {
      expect(getThemeAuthor('contribution-graph')).toBe('chrisreddington');
      expect(getThemeAuthor('fireworks')).toBe('chrisreddington');
    });
  });

  describe('getThemeTags', () => {
    it('should return an array for valid theme IDs', () => {
      const tags = getThemeTags('contribution-graph');
      expect(Array.isArray(tags)).toBe(true);
      expect(tags).toContain('github');
    });

    it('should return theme-specific tags', () => {
      const tags = getThemeTags('fireworks');
      expect(tags).toContain('celebration');
      expect(tags).toContain('fireworks');
    });
  });

  describe('getThemeColorOverrides', () => {
    it('should return only colors explicitly defined in theme config', () => {
      const overrides = getThemeColorOverrides('contribution-graph', 'dark');
      
      // contribution-graph defines accentPrimary and accentSecondary
      expect(overrides.accentPrimary).toBe('#39d353');
      expect(overrides.accentSecondary).toBe('#26a641');
      
      // Does NOT include defaults - these should be undefined
      expect(overrides.background).toBeUndefined();
      expect(overrides.text).toBeUndefined();
      expect(overrides.border).toBeUndefined();
    });

    it('should return different overrides for dark vs light mode', () => {
      const darkOverrides = getThemeColorOverrides('contribution-graph', 'dark');
      const lightOverrides = getThemeColorOverrides('contribution-graph', 'light');
      
      expect(darkOverrides.accentPrimary).toBe('#39d353');
      expect(lightOverrides.accentPrimary).toBe('#1a7f37');
    });

    it('should default to dark mode when mode not specified', () => {
      const overrides = getThemeColorOverrides('contribution-graph');
      expect(overrides.accentPrimary).toBe('#39d353');
    });
  });

  describe('getThemePalette', () => {
    it('should return complete color palette with defaults merged', () => {
      const palette = getThemePalette('contribution-graph', 'dark');
      
      // Theme overrides
      expect(palette.accentPrimary).toBe('#39d353');
      expect(palette.accentSecondary).toBe('#26a641');
      
      // Defaults for colors not overridden
      expect(palette.background).toBe(COLOR_SCHEME_DEFAULTS.dark.background);
      expect(palette.text).toBe(COLOR_SCHEME_DEFAULTS.dark.text);
    });

    it('should return all 14 color properties', () => {
      const palette = getThemePalette('contribution-graph', 'dark');
      const requiredProperties = [
        'background', 'text', 'textMuted', 'accentPrimary', 'accentSecondary',
        'accentTertiary', 'surface', 'surfaceElevated', 'input', 'border',
        'borderMuted', 'error', 'success', 'focusRing'
      ];
      
      for (const prop of requiredProperties) {
        expect(palette).toHaveProperty(prop);
        expect(palette[prop as keyof typeof palette]).toBeTruthy();
      }
    });

    it('should fall back accentTertiary to accentPrimary', () => {
      const palette = getThemePalette('contribution-graph', 'dark');
      expect(palette.accentTertiary).toBe(palette.accentPrimary);
    });

    it('should return different colors for dark vs light mode', () => {
      const darkPalette = getThemePalette('contribution-graph', 'dark');
      const lightPalette = getThemePalette('contribution-graph', 'light');
      
      expect(darkPalette.background).toBe(COLOR_SCHEME_DEFAULTS.dark.background);
      expect(lightPalette.background).toBe(COLOR_SCHEME_DEFAULTS.light.background);
    });

    it('should not mutate COLOR_SCHEME_DEFAULTS', () => {
      const originalDarkPrimary = COLOR_SCHEME_DEFAULTS.dark.accentPrimary;
      
      getThemePalette('contribution-graph', 'dark');
      
      expect(COLOR_SCHEME_DEFAULTS.dark.accentPrimary).toBe(originalDarkPrimary);
    });
  });
});
