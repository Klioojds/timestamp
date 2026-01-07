/**
 * Timezone Options Tests
 * Tests for timezone option building and grouping logic.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatTimezoneLabel,
  buildTimezoneOptions,
  groupOptions,
  getOptionDisplayText,
  type TimezoneOption,
} from './options';
import { createOptionsFixture, createNewYorkOption, MOCK_WALL_CLOCK_TARGET } from './test-fixtures';

// Mock the timezone utilities to control test behavior
vi.mock('@core/time/timezone', () => ({
  getAllTimezones: vi.fn(() => [
    'America/New_York',
    'Europe/London',
    'Asia/Tokyo',
    'Pacific/Auckland',
    'Europe/Paris',
    'America/Los_Angeles',
  ]),
  formatOffsetLabel: vi.fn((tz: string, _ref: string) => {
    const offsets: Record<string, string> = {
      'America/New_York': '-5 hours',
      'Europe/London': '+0 hours',
      'Asia/Tokyo': '+9 hours',
      'Pacific/Auckland': '+13 hours',
      'Europe/Paris': '+1 hours',
      'America/Los_Angeles': '-8 hours',
    };
    return offsets[tz] ?? 'UTC';
  }),
}));

vi.mock('@core/time/wall-clock-conversion', () => ({
  hasWallClockTimeReached: vi.fn((_wallClockTarget, tz: string) => tz === 'Pacific/Auckland'),
}));

vi.mock('../../app/data/cities', () => ({
  FEATURED_CITIES: [
    { id: 'nyc', name: 'New York', timezone: 'America/New_York' },
    { id: 'london', name: 'London', timezone: 'Europe/London' },
    { id: 'tokyo', name: 'Tokyo', timezone: 'Asia/Tokyo' },
    { id: 'auckland', name: 'Auckland', timezone: 'Pacific/Auckland' },
  ],
  findCityByTimezone: vi.fn((tz: string) => {
    const cities: Record<string, { name: string }> = {
      'America/New_York': { name: 'New York' },
      'Europe/London': { name: 'London' },
      'Asia/Tokyo': { name: 'Tokyo' },
      'Pacific/Auckland': { name: 'Auckland' },
    };
    return cities[tz];
  }),
}));

describe('Timezone Options', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('formatTimezoneLabel', () => {
    it.each([
      { tz: 'America/New_York', expected: 'New York (-5 hours)', description: 'with city name and offset' },
      { tz: 'America/Los_Angeles', expected: 'Los Angeles (-8 hours)', description: 'with underscores in name' },
      { tz: 'Europe/London', expected: 'London (+0 hours)', description: 'with simple timezone name' },
    ])('should format timezone label $description', ({ tz, expected }) => {
      expect(formatTimezoneLabel(tz)).toBe(expected);
    });
  });

  describe('buildTimezoneOptions', () => {
    it('should build options from all timezones', () => {
      const options = buildTimezoneOptions('America/New_York', MOCK_WALL_CLOCK_TARGET);

      expect(options.length).toBe(6);
    });

    it('should mark user timezone correctly', () => {
      const options = buildTimezoneOptions('America/New_York', MOCK_WALL_CLOCK_TARGET);

      const userOption = options.find((option) => option.value === 'America/New_York');
      expect(userOption?.isUserZone).toBe(true);

      const otherOption = options.find((option) => option.value === 'Europe/London');
      expect(otherOption?.isUserZone).toBe(false);
    });

    it('should mark featured timezones correctly', () => {
      const options = buildTimezoneOptions('America/New_York', MOCK_WALL_CLOCK_TARGET);

      const featuredOption = options.find((option) => option.value === 'Asia/Tokyo');
      expect(featuredOption?.isFeatured).toBe(true);

      const nonFeatured = options.find((option) => option.value === 'Europe/Paris');
      expect(nonFeatured?.isFeatured).toBe(false);
    });

    it('should mark celebrating timezones correctly', () => {
      const options = buildTimezoneOptions('America/New_York', MOCK_WALL_CLOCK_TARGET);

      const celebrating = options.find((option) => option.value === 'Pacific/Auckland');
      expect(celebrating?.isCelebrating).toBe(true);

      const notCelebrating = options.find((option) => option.value === 'America/New_York');
      expect(notCelebrating?.isCelebrating).toBe(false);
    });

    it('should disable celebration when no wallClockTarget is provided (landing page)', () => {
      // When wallClockTarget is undefined, all timezones should have isCelebrating=false
      const options = buildTimezoneOptions('America/New_York');

      // No timezone should be celebrating when targetDate is not provided
      const celebratingOptions = options.filter((option) => option.isCelebrating);
      expect(celebratingOptions).toHaveLength(0);

      // Specifically check Auckland which would normally be celebrating
      const auckland = options.find((option) => option.value === 'Pacific/Auckland');
      expect(auckland?.isCelebrating).toBe(false);
    });

    it('should include city name for featured timezones', () => {
      const options = buildTimezoneOptions('America/New_York', MOCK_WALL_CLOCK_TARGET);

      const tokyo = options.find((option) => option.value === 'Asia/Tokyo');
      expect(tokyo?.city).toBe('Tokyo');
    });
  });

  describe('groupOptions', () => {
    it('should group options by category', () => {
      const options = createOptionsFixture();

      const groups = groupOptions(options);

      expect(groups.celebrating).toHaveLength(1);
      expect(groups.celebrating[0].value).toBe('Pacific/Auckland');

      expect(groups.userZone).toHaveLength(1);
      expect(groups.userZone[0].value).toBe('America/New_York');

      expect(groups.featured).toHaveLength(1);
      expect(groups.featured[0].value).toBe('Europe/London');

      expect(groups.others).toHaveLength(1);
      expect(groups.others[0].value).toBe('Europe/Paris');
    });

    it('should handle empty option arrays', () => {
      const groups = groupOptions([]);

      expect(groups.celebrating).toHaveLength(0);
      expect(groups.userZone).toHaveLength(0);
      expect(groups.featured).toHaveLength(0);
      expect(groups.others).toHaveLength(0);
    });
  });

  describe('getOptionDisplayText', () => {
    it('should return city name when available', () => {
      expect(getOptionDisplayText(createNewYorkOption())).toBe('New York');
    });

    it('should return label when city is not available', () => {
      const option: TimezoneOption = {
        value: 'Europe/Paris',
        label: 'Paris (+1 hours)',
        isFeatured: false,
        isUserZone: false,
        isCelebrating: false,
      };

      expect(getOptionDisplayText(option)).toBe('Paris (+1 hours)');
    });
  });
});
