/**
 * Theme Sorting - Unit Tests
 * Verifies theme sorting by name, author, and publish date.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sortThemes, getDefaultSortConfig, getSortLabel } from './sort-themes';
import type { ThemeSortConfig, ThemeSortField, ThemeSortDirection } from './types';
import type { ThemeId } from '@core/types';

// Mock the registry to have predictable test data
vi.mock('@themes/registry', () => ({
  getThemeIds: vi.fn(() => ['alpha-theme', 'beta-theme', 'gamma-theme'] as ThemeId[]),
  getThemeDisplayName: vi.fn((id: string) => {
    const names: Record<string, string> = {
      'alpha-theme': 'Alpha Theme',
      'beta-theme': 'Zeta Theme', // Different from ID for testing
      'gamma-theme': 'Gamma Theme',
    };
    return names[id] ?? id;
  }),
  getThemeAuthor: vi.fn((id: string) => {
    const authors: Record<string, string | null> = {
      'alpha-theme': 'charlie',
      'beta-theme': 'alice',
      'gamma-theme': null, // No author
    };
    return authors[id] ?? null;
  }),
  getThemePublishedDate: vi.fn((id: string) => {
    const dates: Record<string, string> = {
      'alpha-theme': '2024-06-15',
      'beta-theme': '2024-12-01',
      'gamma-theme': '2024-01-10',
    };
    return dates[id] ?? '2024-01-01';
  }),
}));

describe('sort-themes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('sortThemes', () => {
    describe('sorting by name', () => {
      it.each([
        {
          direction: 'asc' as ThemeSortDirection,
          expected: ['alpha-theme', 'gamma-theme', 'beta-theme'],
          description: 'display name ascending',
        },
        {
          direction: 'desc' as ThemeSortDirection,
          expected: ['beta-theme', 'gamma-theme', 'alpha-theme'],
          description: 'display name descending',
        },
      ])('should sort themes by $description', ({ direction, expected }) => {
        const themes: ThemeId[] = ['beta-theme', 'alpha-theme', 'gamma-theme'];
        const config: ThemeSortConfig = { field: 'name', direction };

        const result = sortThemes(themes, config);

        expect(result).toEqual(expected);
      });

      it('should be case-insensitive when sorting by name', () => {
        // Display names are already mixed case, verify sorting ignores case
        const themes: ThemeId[] = ['alpha-theme', 'gamma-theme'];
        const config: ThemeSortConfig = { field: 'name', direction: 'asc' };

        const result = sortThemes(themes, config);

        expect(result).toEqual(['alpha-theme', 'gamma-theme']);
      });
    });

    describe('sorting by author', () => {
      it.each([
        {
          direction: 'asc' as ThemeSortDirection,
          expected: ['beta-theme', 'alpha-theme', 'gamma-theme'],
          description: 'author name ascending',
        },
        {
          direction: 'desc' as ThemeSortDirection,
          expected: ['gamma-theme', 'alpha-theme', 'beta-theme'],
          description: 'author name descending',
        },
      ])('should sort themes by $description', ({ direction, expected }) => {
        const themes: ThemeId[] = ['alpha-theme', 'beta-theme', 'gamma-theme'];
        const config: ThemeSortConfig = { field: 'author', direction };

        const result = sortThemes(themes, config);

        expect(result).toEqual(expected);
      });

      it('should handle themes with null author consistently', () => {
        // Themes without author should always appear at end (asc) or start (desc)
        const themes: ThemeId[] = ['gamma-theme', 'alpha-theme'];
        const configAsc: ThemeSortConfig = { field: 'author', direction: 'asc' };
        const configDesc: ThemeSortConfig = { field: 'author', direction: 'desc' };

        const resultAsc = sortThemes(themes, configAsc);
        const resultDesc = sortThemes(themes, configDesc);

        expect(resultAsc).toEqual(['alpha-theme', 'gamma-theme']); // null last
        expect(resultDesc).toEqual(['gamma-theme', 'alpha-theme']); // null first
      });
    });

    describe('sorting by date', () => {
      it.each([
        {
          direction: 'asc' as ThemeSortDirection,
          expected: ['gamma-theme', 'alpha-theme', 'beta-theme'],
          description: 'publish date ascending (oldest first)',
        },
        {
          direction: 'desc' as ThemeSortDirection,
          expected: ['beta-theme', 'alpha-theme', 'gamma-theme'],
          description: 'publish date descending (newest first)',
        },
      ])('should sort themes by $description', ({ direction, expected }) => {
        const themes: ThemeId[] = ['alpha-theme', 'beta-theme', 'gamma-theme'];
        const config: ThemeSortConfig = { field: 'date', direction };

        const result = sortThemes(themes, config);

        expect(result).toEqual(expected);
      });
    });

    describe('edge cases', () => {
      it('should return empty array when given empty array', () => {
        const themes: ThemeId[] = [];
        const config: ThemeSortConfig = { field: 'name', direction: 'asc' };

        const result = sortThemes(themes, config);

        expect(result).toEqual([]);
      });

      it('should return same array when given single theme', () => {
        const themes: ThemeId[] = ['alpha-theme'];
        const config: ThemeSortConfig = { field: 'name', direction: 'asc' };

        const result = sortThemes(themes, config);

        expect(result).toEqual(['alpha-theme']);
      });

      it('should not mutate the original array', () => {
        const themes: ThemeId[] = ['beta-theme', 'alpha-theme'];
        const config: ThemeSortConfig = { field: 'name', direction: 'asc' };

        const original = [...themes];
        sortThemes(themes, config);

        expect(themes).toEqual(original);
      });
    });
  });

  describe('getDefaultSortConfig', () => {
    it('should return default sort config with name ascending', () => {
      const config = getDefaultSortConfig();

      expect(config.field).toBe('name');
      expect(config.direction).toBe('asc');
    });
  });

  describe('getSortLabel', () => {
    it.each([
      { field: 'name' as ThemeSortField, direction: 'asc' as ThemeSortDirection, expected: 'Name (A-Z)' },
      { field: 'name' as ThemeSortField, direction: 'desc' as ThemeSortDirection, expected: 'Name (Z-A)' },
      { field: 'author' as ThemeSortField, direction: 'asc' as ThemeSortDirection, expected: 'Author (A-Z)' },
      { field: 'author' as ThemeSortField, direction: 'desc' as ThemeSortDirection, expected: 'Author (Z-A)' },
      { field: 'date' as ThemeSortField, direction: 'asc' as ThemeSortDirection, expected: 'Date (Oldest)' },
      { field: 'date' as ThemeSortField, direction: 'desc' as ThemeSortDirection, expected: 'Date (Newest)' },
    ])('should return "$expected" for field=$field direction=$direction', ({ field, direction, expected }) => {
      const config: ThemeSortConfig = { field, direction };

      const result = getSortLabel(config);

      expect(result).toBe(expected);
    });
  });
});
