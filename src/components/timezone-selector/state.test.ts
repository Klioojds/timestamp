/**
 * Timezone Selector State Tests
 * Tests for component state management and filtering.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createInitialState,
  filterOptions,
  refreshOptions,
  updateSelection,
  openDropdown,
  closeDropdown,
  applyFilter,
  type TimezoneSelectorState,
} from './state';
import { createFilterOptionsFixture, createOptionsFixture } from './test-fixtures';

// Mock dependencies
vi.mock('@core/time/timezone', () => ({
  getUserTimezone: vi.fn(() => 'America/New_York'),
  getAllTimezones: vi.fn(() => [
    'America/New_York',
    'Europe/London',
    'Asia/Tokyo',
  ]),
  formatOffsetLabel: vi.fn(() => '-5 hours'),
}));

vi.mock('@core/time/wall-clock-conversion', () => ({
  hasWallClockTimeReached: vi.fn(() => false),
}));

vi.mock('../../data/cities', () => ({
  FEATURED_CITIES: [
    { id: 'nyc', name: 'New York', timezone: 'America/New_York' },
    { id: 'london', name: 'London', timezone: 'Europe/London' },
  ],
  findCityByTimezone: vi.fn((tz: string) => {
    const cities: Record<string, { name: string }> = {
      'America/New_York': { name: 'New York' },
      'Europe/London': { name: 'London' },
    };
    return cities[tz];
  }),
}));

describe('Timezone Selector State', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createInitialState', () => {
    it('should create initial state with user timezone', () => {
      const state = createInitialState();

      expect(state.currentSelection).toBe('America/New_York');
      expect(state.isOpen).toBe(false);
      expect(state.userTimezone).toBe('America/New_York');
    });

    it('should use provided initial timezone', () => {
      const state = createInitialState('Europe/London');

      expect(state.currentSelection).toBe('Europe/London');
    });

    it('should use provided wallClockTarget', () => {
      const wallClockTarget = { year: 2025, month: 5, day: 15, hours: 12, minutes: 0, seconds: 0 };
      const state = createInitialState(undefined, wallClockTarget);

      expect(state.wallClockTarget).toEqual(wallClockTarget);
    });

    it('should have undefined wallClockTarget when none provided (landing page)', () => {
      const state = createInitialState();
      // When no wallClockTarget is provided, celebration detection is disabled
      expect(state.wallClockTarget).toBeUndefined();
    });

    it('should have allOptions equal to filteredOptions initially', () => {
      const state = createInitialState();

      expect(state.allOptions).toEqual(state.filteredOptions);
    });
  });

  describe('filterOptions', () => {
    const options = createFilterOptionsFixture();

    it.each([
      ['empty query returns all', ''],
      ['whitespace returns all', '   '],
    ])('should %s', (_desc, query) => {
      const result = filterOptions(options, query);
      expect(result).toEqual(options);
    });

    it.each([
      ['timezone value', 'america', 'America/New_York'],
      ['label', 'tokyo', 'Asia/Tokyo'],
      ['city name', 'london', 'Europe/London'],
      ['case-insensitive', 'NEW YORK', 'America/New_York'],
    ])('should filter by %s', (_desc, query, expectedValue) => {
      const result = filterOptions(options, query);
      expect(result).toHaveLength(1);
      expect(result[0].value).toBe(expectedValue);
    });

    it('should return empty array for no matches', () => {
      const result = filterOptions(options, 'xyz123');
      expect(result).toHaveLength(0);
    });
  });

  describe('refreshOptions', () => {
    it('should rebuild options with current state', () => {
      const state = createInitialState();
      const refreshed = refreshOptions(state);

      expect(refreshed.allOptions).toBeDefined();
      expect(refreshed.filteredOptions).toEqual(refreshed.allOptions);
    });
  });

  describe('updateSelection', () => {
    it('should update current selection', () => {
      const state = createInitialState();
      const updated = updateSelection(state, 'Europe/London');

      expect(updated.currentSelection).toBe('Europe/London');
      expect(updated.allOptions).toEqual(state.allOptions);
    });
  });

  describe('openDropdown', () => {
    it('should set isOpen to true', () => {
      const state = createInitialState();
      const opened = openDropdown(state);

      expect(opened.isOpen).toBe(true);
    });
  });

  describe('closeDropdown', () => {
    it('should set isOpen to false', () => {
      const state = openDropdown(createInitialState());
      const closed = closeDropdown(state);

      expect(closed.isOpen).toBe(false);
    });

    it('should reset filtered options to all options', () => {
      let state = createInitialState();
      state = applyFilter(state, 'tokyo');
      expect(state.filteredOptions.length).toBeLessThan(state.allOptions.length);

      const closed = closeDropdown(state);
      expect(closed.filteredOptions).toEqual(closed.allOptions);
    });
  });

  describe('applyFilter', () => {
    it('should filter options by query', () => {
      const state = createInitialState();
      const filtered = applyFilter(state, 'tokyo');

      expect(filtered.filteredOptions.length).toBeLessThanOrEqual(
        state.allOptions.length
      );
    });

    it('should not modify allOptions', () => {
      const state = createInitialState();
      const originalOptions = [...state.allOptions];
      const filtered = applyFilter(state, 'tokyo');

      expect(filtered.allOptions).toEqual(originalOptions);
    });
  });
});
