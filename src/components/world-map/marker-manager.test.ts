import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CityMarker } from '@/app/data/cities';
import type { WallClockTime } from '@core/types';
import { createMarkerManager } from './marker-manager';

const mockCities = vi.hoisted(() => [] as CityMarker[]);

const mockGetCityPositionPercent = vi.hoisted(
  () => vi.fn<(city: CityMarker) => { x: number; y: number }>()
);

const mockHasWallClockTimeReached = vi.hoisted(
  () => vi.fn<(target: WallClockTime, timezone: string, currentDate: Date) => boolean>()
);

const mockGetUserTimezone = vi.hoisted(() => vi.fn<() => string>());

const mockApplyCelebrationState = vi.hoisted(
  () => vi.fn<(marker: HTMLButtonElement, city: CityMarker, isCelebrating: boolean) => void>()
);

vi.mock('@/app/data/cities', () => ({
  FEATURED_CITIES: mockCities,
  getCityPositionPercent: mockGetCityPositionPercent,
}));

vi.mock('@core/time/wall-clock-conversion', () => ({
  hasWallClockTimeReached: (
    ...args: Parameters<typeof mockHasWallClockTimeReached>
  ) => mockHasWallClockTimeReached(...args),
}));

vi.mock('@core/time/timezone', () => ({
  getUserTimezone: () => mockGetUserTimezone(),
}));

vi.mock('./celebration-state', () => ({
  applyCelebrationState: (
    ...args: Parameters<typeof mockApplyCelebrationState>
  ) => mockApplyCelebrationState(...args),
}));

const wallClockTarget: WallClockTime = {
  year: 2026,
  month: 0,
  day: 1,
  hours: 0,
  minutes: 0,
  seconds: 0,
};

const defaultCities = (): CityMarker[] => [
  {
    id: 'west',
    name: 'West City',
    timezone: 'America/Anchorage',
    lat: 61,
    lng: -150,
    utcOffset: -9,
  },
  {
    id: 'utc',
    name: 'UTC',
    timezone: 'UTC',
    lat: 0,
    lng: 0.2,
    utcOffset: 0,
  },
  {
    id: 'london',
    name: 'London',
    timezone: 'Europe/London',
    lat: 51.5,
    lng: 0.1,
    utcOffset: 0,
  },
  {
    id: 'east',
    name: 'East City',
    timezone: 'Asia/Tokyo',
    lat: 35.6,
    lng: 139.7,
    utcOffset: 9,
  },
];

const positionLookup: Record<string, { x: number; y: number }> = {
  west: { x: 10, y: 20 },
  utc: { x: 30, y: 40 },
  london: { x: 50, y: 60 },
  east: { x: 70, y: 80 },
};

const setMockCities = (cities: CityMarker[]): void => {
  mockCities.splice(0, mockCities.length, ...cities);
};

describe('marker-manager', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    setMockCities(defaultCities());
    mockGetUserTimezone.mockReset().mockReturnValue('UTC');
    mockHasWallClockTimeReached.mockReset().mockReturnValue(false);
    mockGetCityPositionPercent.mockReset().mockImplementation((city) => positionLookup[city.id]);
    mockApplyCelebrationState.mockReset();
  });

  afterEach(() => {
    container.remove();
  });

  it('should initialize markers west-to-east, set positions, and apply user/selected flags with UTC before London', () => {
    const manager = createMarkerManager({
      container,
      initialTimezone: 'Europe/London',
      wallClockTarget,
    });

    const markers = Array.from(container.querySelectorAll('button'));
    expect(markers).toHaveLength(mockCities.length);
    expect(markers.map((node) => node.getAttribute('data-city'))).toEqual([
      'West City',
      'UTC',
      'London',
      'East City',
    ]);

    const markerMap = manager.getMarkerElements();
    expect(Array.from(markerMap.keys())).toEqual([
      'America/Anchorage',
      'UTC',
      'Europe/London',
      'Asia/Tokyo',
    ]);

    const londonMarker = markerMap.get('Europe/London');
    const utcMarker = markerMap.get('UTC');

    expect(londonMarker?.getAttribute('data-selected')).toBe('true');
    expect(londonMarker?.getAttribute('aria-current')).toBe('location');
    expect(utcMarker?.getAttribute('data-user')).toBe('true');
    expect(utcMarker?.style.left).toBe('30%');
    expect(utcMarker?.style.top).toBe('40%');

    expect(mockGetCityPositionPercent).toHaveBeenCalledTimes(mockCities.length);
    expect(mockApplyCelebrationState).toHaveBeenCalledTimes(mockCities.length);
  });

  it('should update selection state and aria-current in setTimezone', () => {
    setMockCities([
      {
        id: 'utc',
        name: 'UTC',
        timezone: 'UTC',
        lat: 0,
        lng: 0,
        utcOffset: 0,
      },
      {
        id: 'london',
        name: 'London',
        timezone: 'Europe/London',
        lat: 51.5,
        lng: 0.1,
        utcOffset: 0,
      },
    ]);

    const manager = createMarkerManager({
      container,
      initialTimezone: 'UTC',
      wallClockTarget,
    });

    manager.setTimezone('Europe/London');

    const markerMap = manager.getMarkerElements();
    expect(markerMap.get('Europe/London')?.getAttribute('data-selected')).toBe('true');
    expect(markerMap.get('Europe/London')?.getAttribute('aria-current')).toBe('location');
    expect(markerMap.get('UTC')?.getAttribute('data-selected')).toBe('false');
    expect(markerMap.get('UTC')?.hasAttribute('aria-current')).toBe(false);
  });

  it.each`
    initialCelebrating | nextCelebrating | expectedNew
    ${false} | ${true} | ${['UTC']}
    ${true} | ${true} | ${[]}
  `(
    'should return $expectedNew when celebration state moves from $initialCelebrating to $nextCelebrating',
    ({ initialCelebrating, nextCelebrating, expectedNew }) => {
      setMockCities([
        {
          id: 'utc',
          name: 'UTC',
          timezone: 'UTC',
          lat: 0,
          lng: 0,
          utcOffset: 0,
        },
        {
          id: 'london',
          name: 'London',
          timezone: 'Europe/London',
          lat: 51.5,
          lng: 0.1,
          utcOffset: 0,
        },
      ]);

      const celebrationStateByTimezone: Record<string, boolean> = {
        UTC: initialCelebrating,
        'Europe/London': true,
      };

      mockHasWallClockTimeReached.mockImplementation((_, timezone) => celebrationStateByTimezone[timezone]);

      const manager = createMarkerManager({
        container,
        initialTimezone: 'UTC',
        wallClockTarget,
        getCurrentTime: () => new Date('2026-01-01T00:00:00Z'),
      });

      celebrationStateByTimezone.UTC = nextCelebrating;

      const newlyCelebrating = manager.updateCelebrationStates();

      expect(newlyCelebrating).toEqual(expectedNew);
      expect(mockHasWallClockTimeReached).toHaveBeenCalledTimes(mockCities.length * 2);
      expect(mockApplyCelebrationState).toHaveBeenCalledTimes(mockCities.length * 2);
    }
  );

  it('should expose marker elements map', () => {
    const manager = createMarkerManager({ container, wallClockTarget });

    const map = manager.getMarkerElements();

    expect(map).toBeInstanceOf(Map);
    expect(map.get('UTC')).toBeInstanceOf(HTMLButtonElement);
    expect(map.size).toBe(mockCities.length);
  });

  it('should clear markers and internal maps on destroy', () => {
    const manager = createMarkerManager({ container, wallClockTarget });
    const markerMap = manager.getMarkerElements();

    expect(markerMap.size).toBe(mockCities.length);

    manager.destroy();

    expect(container.innerHTML).toBe('');
    expect(markerMap.size).toBe(0);
    expect(manager.getMarkerElements().size).toBe(0);
  });

  it('should handle marker click by updating selection and invoking onCitySelect', () => {
    const onCitySelect = vi.fn();
    const manager = createMarkerManager({
      container,
      onCitySelect,
      initialTimezone: 'Europe/London',
      wallClockTarget,
    });

    const targetMarker = manager.getMarkerElements().get('UTC');
    expect(targetMarker).toBeDefined();

    targetMarker?.click();

    expect(targetMarker?.getAttribute('data-selected')).toBe('true');
    expect(manager.getMarkerElements().get('Europe/London')?.getAttribute('data-selected')).toBe('false');
    expect(onCitySelect).toHaveBeenCalledTimes(1);
    expect(onCitySelect).toHaveBeenCalledWith(expect.objectContaining({ timezone: 'UTC' }));
  });

  describe('UTC/London sorting edge case', () => {
    it('should place UTC before London when both are present and UTC is initially after', () => {
      setMockCities([
        {
          id: 'london',
          name: 'London',
          timezone: 'Europe/London',
          lat: 51.5,
          lng: 0.1, // Slightly west
          utcOffset: 0,
        },
        {
          id: 'utc',
          name: 'UTC',
          timezone: 'UTC',
          lat: 0,
          lng: 0.2, // Slightly east
          utcOffset: 0,
        },
      ]);

      const manager = createMarkerManager({
        container,
        wallClockTarget,
      });

      const markers = Array.from(container.querySelectorAll('button'));
      const cityOrder = markers.map((m) => m.getAttribute('data-city'));

      expect(cityOrder).toEqual(['UTC', 'London']);
    });

    it('should not reorder UTC/London when UTC is already before London by longitude', () => {
      setMockCities([
        {
          id: 'utc',
          name: 'UTC',
          timezone: 'UTC',
          lat: 0,
          lng: -0.1,
          utcOffset: 0,
        },
        {
          id: 'london',
          name: 'London',
          timezone: 'Europe/London',
          lat: 51.5,
          lng: 0.1,
          utcOffset: 0,
        },
      ]);

      const manager = createMarkerManager({
        container,
        wallClockTarget,
      });

      const markers = Array.from(container.querySelectorAll('button'));
      const cityOrder = markers.map((m) => m.getAttribute('data-city'));

      expect(cityOrder).toEqual(['UTC', 'London']);
    });

    it('should handle missing UTC without error', () => {
      setMockCities([
        {
          id: 'london',
          name: 'London',
          timezone: 'Europe/London',
          lat: 51.5,
          lng: 0.1,
          utcOffset: 0,
        },
      ]);

      const manager = createMarkerManager({
        container,
        wallClockTarget,
      });

      const markers = Array.from(container.querySelectorAll('button'));
      expect(markers).toHaveLength(1);
      expect(markers[0].getAttribute('data-city')).toBe('London');
    });

    it('should handle missing London without error', () => {
      setMockCities([
        {
          id: 'utc',
          name: 'UTC',
          timezone: 'UTC',
          lat: 0,
          lng: 0,
          utcOffset: 0,
        },
      ]);

      const manager = createMarkerManager({
        container,
        wallClockTarget,
      });

      const markers = Array.from(container.querySelectorAll('button'));
      expect(markers).toHaveLength(1);
      expect(markers[0].getAttribute('data-city')).toBe('UTC');
    });
  });

  describe('data attribute values', () => {
    it.each([
      {
        description: 'data-timezone and data-city values',
        initialTimezone: 'Europe/London',
        userTimezone: 'UTC',
        assertions: (map: Map<string, HTMLButtonElement>) => {
          expect(map.get('UTC')?.getAttribute('data-timezone')).toBe('UTC');
          expect(map.get('Europe/London')?.getAttribute('data-city')).toBe('London');
        },
      },
      {
        description: 'data-user flag when city matches user timezone',
        initialTimezone: 'Europe/London',
        userTimezone: 'Asia/Tokyo',
        assertions: (map: Map<string, HTMLButtonElement>) => {
          expect(map.get('Asia/Tokyo')?.getAttribute('data-user')).toBe('true');
        },
      },
      {
        description: 'no data-user flag when city does not match user timezone',
        initialTimezone: 'Europe/London',
        userTimezone: 'America/New_York',
        assertions: (map: Map<string, HTMLButtonElement>) => {
          expect(map.get('UTC')?.hasAttribute('data-user')).toBe(false);
        },
      },
      {
        description: 'initial selection flags and aria-current',
        initialTimezone: 'Asia/Tokyo',
        userTimezone: 'UTC',
        assertions: (map: Map<string, HTMLButtonElement>) => {
          expect(map.get('Asia/Tokyo')?.getAttribute('data-selected')).toBe('true');
          expect(map.get('Asia/Tokyo')?.getAttribute('aria-current')).toBe('location');
          expect(map.get('UTC')?.getAttribute('data-selected')).not.toBe('true');
        },
      },
    ])('should set attributes for $description', ({ initialTimezone, userTimezone, assertions }) => {
      mockGetUserTimezone.mockReturnValue(userTimezone);

      const manager = createMarkerManager({
        container,
        initialTimezone,
        wallClockTarget,
      });

      assertions(manager.getMarkerElements());
    });
  });

  describe('setTimezone attribute updates', () => {
    it.each([
      {
        description: 'selected marker gets data-selected="true"',
        nextTimezone: 'Asia/Tokyo',
        expectSelected: (map: Map<string, HTMLButtonElement>) => {
          expect(map.get('Asia/Tokyo')?.getAttribute('data-selected')).toBe('true');
        },
      },
      {
        description: 'non-selected marker gets data-selected="false"',
        nextTimezone: 'Asia/Tokyo',
        expectSelected: (map: Map<string, HTMLButtonElement>) => {
          expect(map.get('UTC')?.getAttribute('data-selected')).toBe('false');
        },
      },
      {
        description: 'selected marker receives aria-current',
        nextTimezone: 'Europe/London',
        expectSelected: (map: Map<string, HTMLButtonElement>) => {
          expect(map.get('Europe/London')?.getAttribute('aria-current')).toBe('location');
        },
      },
      {
        description: 'non-selected marker removes aria-current',
        nextTimezone: 'Asia/Tokyo',
        expectSelected: (map: Map<string, HTMLButtonElement>) => {
          expect(map.get('UTC')?.hasAttribute('aria-current')).toBe(false);
        },
      },
    ])('should update attributes when $description', ({ nextTimezone, expectSelected }) => {
      const manager = createMarkerManager({
        container,
        initialTimezone: 'UTC',
        wallClockTarget,
      });

      manager.setTimezone(nextTimezone);

      expectSelected(manager.getMarkerElements());
    });
  });

  describe('celebration state tracking', () => {
    it('should return empty array when no cities transition to celebrating', () => {
      mockHasWallClockTimeReached.mockReturnValue(false);

      const manager = createMarkerManager({
        container,
        wallClockTarget,
      });

      const newlyCelebrating = manager.updateCelebrationStates();

      expect(newlyCelebrating).toEqual([]);
      expect(Array.isArray(newlyCelebrating)).toBe(true);
      expect(newlyCelebrating.length).toBe(0);
    });

    it('should return city names when transitioning from false to true', () => {
      const celebrationState: Record<string, boolean> = {
        UTC: false,
        'Europe/London': false,
        'America/Anchorage': false,
        'Asia/Tokyo': false,
      };

      mockHasWallClockTimeReached.mockImplementation((_, timezone) => celebrationState[timezone]);

      const manager = createMarkerManager({
        container,
        wallClockTarget,
      });

      celebrationState.UTC = true;
      celebrationState['Asia/Tokyo'] = true;

      const newlyCelebrating = manager.updateCelebrationStates();

      expect(newlyCelebrating).toContain('UTC');
      expect(newlyCelebrating).toContain('East City');
      expect(newlyCelebrating).toHaveLength(2);
    });

    it('should not return cities already celebrating', () => {
      mockHasWallClockTimeReached.mockReturnValue(true);

      const manager = createMarkerManager({
        container,
        wallClockTarget,
      });

      const newlyCelebrating = manager.updateCelebrationStates();

      expect(newlyCelebrating).toEqual([]);
    });

    it('should track celebration state per city', () => {
      const celebrationState: Record<string, boolean> = {
        UTC: true,
        'Europe/London': false,
        'America/Anchorage': false,
        'Asia/Tokyo': false,
      };

      mockHasWallClockTimeReached.mockImplementation((_, timezone) => celebrationState[timezone]);

      const manager = createMarkerManager({
        container,
        wallClockTarget,
      });

      celebrationState['Europe/London'] = true;
      const firstUpdate = manager.updateCelebrationStates();
      expect(firstUpdate).toEqual(['London']);

      celebrationState['Asia/Tokyo'] = true;
      const secondUpdate = manager.updateCelebrationStates();
      expect(secondUpdate).toEqual(['East City']);
    });

    it('should use provided getCurrentTime function for celebration detection', () => {
      const mockDate = new Date('2026-01-01T05:00:00Z');
      const getCurrentTime = vi.fn(() => mockDate);

      mockHasWallClockTimeReached.mockReturnValue(false);

      const manager = createMarkerManager({
        container,
        wallClockTarget,
        getCurrentTime,
      });

      manager.updateCelebrationStates();

      expect(getCurrentTime).toHaveBeenCalled();
      expect(mockHasWallClockTimeReached).toHaveBeenCalledWith(
        wallClockTarget,
        expect.any(String),
        mockDate
      );
    });
  });

  describe('marker elements map', () => {
    it('should skip markers that do not exist in the map during celebration update', () => {
      setMockCities([
        {
          id: 'utc',
          name: 'UTC',
          timezone: 'UTC',
          lat: 0,
          lng: 0,
          utcOffset: 0,
        },
      ]);

      mockHasWallClockTimeReached.mockReturnValue(true);

      const manager = createMarkerManager({
        container,
        wallClockTarget,
      });

      // Manually remove marker from container but leave it in internal map
      const markerMap = manager.getMarkerElements();
      markerMap.clear();

      // This should not throw
      const newlyCelebrating = manager.updateCelebrationStates();
      expect(newlyCelebrating).toEqual([]);
    });
  });
});
