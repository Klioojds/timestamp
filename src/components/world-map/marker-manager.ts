/**
 * City marker manager with geographical ordering (W→E) for logical tab navigation.
 */

import { getUserTimezone } from '@core/time/timezone';
import { hasWallClockTimeReached } from '@core/time/wall-clock-conversion';
import type { WallClockTime } from '@core/types';

import { type CityMarker, FEATURED_CITIES, getCityPositionPercent } from '@/app/data/cities';

import { applyCelebrationState } from './celebration-state';

/**
 * Options for creating the marker manager
 */
export interface MarkerManagerOptions {
  /** Container element for markers */
  container: HTMLElement;
  /** Callback when a city is clicked */
  onCitySelect?: (city: CityMarker) => void;
  /** Initially selected timezone */
  initialTimezone?: string;
  /** Wall-clock target time used for celebration detection */
  wallClockTarget: WallClockTime;
  /** Optional time provider for deterministic tests */
  getCurrentTime?: () => Date;
}

/**
 * Controller interface for marker management
 */
export interface MarkerManagerController {
  /** Update which timezone is selected */
  setTimezone: (timezone: string) => void;
  /** Update celebration states for all markers */
  updateCelebrationStates: () => string[]; // Returns newly celebrating cities
  /** Get marker element map (for terminator renderer) */
  getMarkerElements: () => Map<string, HTMLButtonElement>;
  /** Clean up markers */
  destroy: () => void;
}

/**
 * Create marker manager with W→E geographical sorting for tab navigation.
 * @example
 * ```typescript
 * const markers = createMarkerManager({
 *   container: mapSvg,
 *   wallClockTarget: { year: 2025, month: 0, day: 1, hours: 0, minutes: 0, seconds: 0 },
 * });
 * ```
 */
export function createMarkerManager(
  options: MarkerManagerOptions
): MarkerManagerController {
  const {
    container,
    onCitySelect,
    initialTimezone,
    wallClockTarget,
    getCurrentTime = () => new Date(),
  } = options;

  const userTimezone = getUserTimezone();
  const markerElements = new Map<string, HTMLButtonElement>();
  const celebrationStates = new Map<string, boolean>();

  // Create city marker buttons sorted West to East by longitude for logical focus order
  const citiesSortedByLongitude = [...FEATURED_CITIES].sort((a, b) => a.lng - b.lng);
  
  // NOTE: Handle UTC/London special case for consistent tab order.
  // Prime meridian proximity (<1° difference) creates sorting instability.
  const utcIndex = citiesSortedByLongitude.findIndex((city) => city.id === 'utc');
  const londonIndex = citiesSortedByLongitude.findIndex((city) => city.id === 'london');

  if (utcIndex > -1 && londonIndex > -1 && utcIndex > londonIndex) {
    // Ensure UTC appears before London for semantic clarity.
    const [utcCity] = citiesSortedByLongitude.splice(utcIndex, 1);
    citiesSortedByLongitude.splice(londonIndex, 0, utcCity);
  }

  // Create markers for each city
  citiesSortedByLongitude.forEach((city) => {
    const marker = document.createElement('button');
    marker.className = 'city-marker';

    // Use accurate lat/lng positioning
    const positionPercent = getCityPositionPercent(city);
    marker.style.left = `${positionPercent.x}%`;
    marker.style.top = `${positionPercent.y}%`;

    marker.setAttribute('data-timezone', city.timezone);
    marker.setAttribute('data-city', city.name);
    marker.setAttribute('data-testid', `city-marker-${city.id}`);
    marker.setAttribute('tabindex', '0');
    // NOTE: Explicit tabindex required for Safari keyboard navigation (WebKit bug #22261).

    // Check if this is user's timezone
    if (city.timezone === userTimezone) {
      marker.setAttribute('data-user', 'true');
    }

    // Check if selected
    if (city.timezone === initialTimezone) {
      marker.setAttribute('data-selected', 'true');
      marker.setAttribute('aria-current', 'location');
    }

    marker.innerHTML = `
      <span class="marker-dot"></span>
      <span class="marker-glow"></span>
      <span class="marker-label">${city.name}</span>
    `;

    marker.addEventListener('click', () => {
      setTimezone(city.timezone);
      onCitySelect?.(city);
    });

    container.appendChild(marker);
    markerElements.set(city.timezone, marker);
    
    // Initialize celebration state
    const isCelebrating = hasWallClockTimeReached(
      wallClockTarget,
      city.timezone,
      getCurrentTime()
    );
    celebrationStates.set(city.timezone, isCelebrating);
    applyCelebrationState(marker, city, isCelebrating);
  });

  function setTimezone(timezone: string): void {
    markerElements.forEach((marker, tz) => {
      const isSelected = tz === timezone;
      marker.setAttribute('data-selected', isSelected.toString());
      
      if (isSelected) {
        marker.setAttribute('aria-current', 'location');
      } else {
        marker.removeAttribute('aria-current');
      }
    });
  }

  /** Returns newly celebrating city names for announcements. */
  function updateCelebrationStates(): string[] {
    const newlyCelebrating: string[] = [];
    const referenceDate = getCurrentTime();

    FEATURED_CITIES.forEach((city) => {
      const marker = markerElements.get(city.timezone);
      if (!marker) return;

      const wasCelebrating = celebrationStates.get(city.timezone) || false;
      const isCelebrating = hasWallClockTimeReached(
        wallClockTarget,
        city.timezone,
        referenceDate
      );

      celebrationStates.set(city.timezone, isCelebrating);
      applyCelebrationState(marker, city, isCelebrating);

      // Track newly celebrating cities
      if (isCelebrating && !wasCelebrating) {
        newlyCelebrating.push(city.name);
      }
    });

    return newlyCelebrating;
  }

  return {
    setTimezone,
    updateCelebrationStates,
    
    getMarkerElements(): Map<string, HTMLButtonElement> {
      return markerElements;
    },
    
    destroy(): void {
      markerElements.clear();
      celebrationStates.clear();
      container.innerHTML = '';
    },
  };
}
