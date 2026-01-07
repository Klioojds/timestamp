/**
 * Shared fixtures for timezone selector tests.
 */
import type { TimezoneOption } from './options';

/** Wall-clock target used for celebration calculations in tests. */
export const MOCK_WALL_CLOCK_TARGET = {
  year: 2025,
  month: 0,
  day: 1,
  hours: 0,
  minutes: 0,
  seconds: 0,
};

/** Base fixture mirroring common app scenarios. */
const BASE_OPTIONS: TimezoneOption[] = [
  {
    value: 'Pacific/Auckland',
    label: 'Auckland (+13 hours)',
    city: 'Auckland',
    isFeatured: true,
    isUserZone: false,
    isCelebrating: true,
  },
  {
    value: 'America/New_York',
    label: 'New York (-5 hours)',
    city: 'New York',
    isFeatured: true,
    isUserZone: true,
    isCelebrating: false,
  },
  {
    value: 'Europe/London',
    label: 'London (+0 hours)',
    city: 'London',
    isFeatured: true,
    isUserZone: false,
    isCelebrating: false,
  },
  {
    value: 'Europe/Paris',
    label: 'Paris (+1 hours)',
    isFeatured: false,
    isUserZone: false,
    isCelebrating: false,
  },
];

/**
 * Return a deep-cloned copy of the base options.
 * @returns Freshly cloned timezone options
 * @remarks Ensures test isolation
 */
export function createOptionsFixture(): TimezoneOption[] {
  return BASE_OPTIONS.map((option) => ({ ...option }));
}

/** Smaller option set used for filter-focused tests. @returns Minimal cloned option set */
export function createFilterOptionsFixture(): TimezoneOption[] {
  return [
    {
      value: 'America/New_York',
      label: 'New York (-5 hours)',
      city: 'New York',
      isFeatured: true,
      isUserZone: true,
      isCelebrating: false,
    },
    {
      value: 'Europe/London',
      label: 'London (+0 hours)',
      city: 'London',
      isFeatured: true,
      isUserZone: false,
      isCelebrating: false,
    },
    {
      value: 'Asia/Tokyo',
      label: 'Tokyo (+9 hours)',
      city: 'Tokyo',
      isFeatured: true,
      isUserZone: false,
      isCelebrating: false,
    },
  ];
}

/** Convenience accessor for a single featured option. @returns New York option clone */
export function createNewYorkOption(): TimezoneOption {
  return {
    value: 'America/New_York',
    label: 'New York (-5 hours)',
    city: 'New York',
    isFeatured: true,
    isUserZone: false,
    isCelebrating: false,
  };
}
