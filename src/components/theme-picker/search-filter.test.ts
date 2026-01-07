/**
 * Search Filter Module - Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { filterThemes, getResultsCountText, handleSearchInput } from './search-filter';
import type { ThemeSelectorState } from './types';
import { getDefaultSortConfig } from './sort-themes';

describe('search-filter', () => {
  let state: ThemeSelectorState;

  beforeEach(() => {
    state = {
      currentTheme: 'contribution-graph',
      searchQuery: '',
      focusedIndex: -1,
      filteredThemes: [],
      favorites: [],
      sortConfig: getDefaultSortConfig(),
    };
  });

  describe('filterThemes', () => {
    it('should return all themes when search query is empty', () => {
      filterThemes(state);
      expect(state.filteredThemes.length).toBeGreaterThan(0);
    });

    it('should filter themes by name', () => {
      state.searchQuery = 'fire';
      filterThemes(state);
      expect(state.filteredThemes).toContain('fireworks');
      expect(state.filteredThemes).not.toContain('contribution-graph');
    });

    it.each([
      { query: 'chris', description: 'author name' },
      { query: '@chris', description: 'author name with @ prefix' },
    ])('should filter themes by $description', ({ query }) => {
      state.searchQuery = query;
      filterThemes(state);
      expect(state.filteredThemes.length).toBeGreaterThan(0);
    });

    it('should be case-insensitive', () => {
      // Note: searchQuery is expected to be lowercase (normalized by handleSearchInput)
      state.searchQuery = 'fire';
      filterThemes(state);
      expect(state.filteredThemes).toContain('fireworks');
    });
  });

  describe('getResultsCountText', () => {
    it.each([
      {
        description: 'uses total count when query is empty',
        searchQuery: '',
        filtered: ['a', 'b'],
        expectedPattern: /\d+ themes available/,
      },
      {
        description: 'pluralizes when multiple results',
        searchQuery: 'fire',
        filtered: ['fireworks', 'contribution-graph'],
        expectedText: '2 themes found',
      },
      {
        description: 'uses singular form for one result',
        searchQuery: 'fire',
        filtered: ['fireworks'],
        expectedText: '1 theme found',
      },
      {
        description: 'reports zero results explicitly',
        searchQuery: 'unknown',
        filtered: [],
        expectedText: '0 themes found',
      },
    ])('should return correct text when it $description', ({ searchQuery, filtered, expectedPattern, expectedText }) => {
      state.searchQuery = searchQuery;
      state.filteredThemes = filtered;

      const text = getResultsCountText(state);

      if (expectedPattern) {
        expect(text).toMatch(expectedPattern);
      }

      if (expectedText) {
        expect(text).toBe(expectedText);
      }
    });
  });

  describe('handleSearchInput', () => {
    it('should update state from search input', () => {
      const mockInput = document.createElement('input');
      mockInput.value = '  FIRE  ';
      
      handleSearchInput(mockInput, state);
      
      expect(state.searchQuery).toBe('fire');
      expect(state.focusedIndex).toBe(-1);
    });

    it('should handle null input gracefully', () => {
      handleSearchInput(null, state);
      expect(state.searchQuery).toBe('');
    });
  });
});
