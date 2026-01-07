/**
 * Solar terminator renderer with RAF batching and pause/resume capability.
 */

import { getNightRegionPath, isNight } from '@core/solar';

import type { CityMarker } from '@/app/data/cities';
import { latLngToSvg, MAP_VIEWBOX } from '@/app/data/world-map-svg';

import { DEFAULT_TERMINATOR_UPDATE_MS } from './constants';

/**
 * Options for creating the terminator renderer
 */
export interface TerminatorRendererOptions {
  /** SVG path element for night overlay */
  nightOverlay: SVGPathElement;
  /** Map of timezone to marker button elements */
  markerElements: Map<string, HTMLButtonElement>;
  /** Array of city data */
  cities: readonly CityMarker[];
  /** Update interval in milliseconds (default: 60000 = 1 minute) */
  updateInterval?: number;
  /** Injectable time function for testing */
  getCurrentTime?: () => Date;
}

/**
 * Controller interface for the terminator renderer
 */
export interface TerminatorRendererController {
  /** Manually trigger a terminator update */
  update: () => void;
  /** Pause automatic updates (call when map is hidden) */
  pause: () => void;
  /** Resume automatic updates */
  resume: () => void;
  /** Check if renderer is currently active */
  isActive: () => boolean;
  /** Clean up and stop all intervals */
  destroy: () => void;
}

/**
 * Create terminator renderer with automatic pause/resume for hidden states.
 * @example
 * ```typescript
 * const terminator = createTerminatorRenderer({
 *   nightOverlay: svgPathElement,
 *   markerElements: markerMap,
 *   cities: FEATURED_CITIES,
 * });
 * ```
 */
export function createTerminatorRenderer(
  options: TerminatorRendererOptions
): TerminatorRendererController {
  const {
    nightOverlay,
    markerElements,
    cities,
    updateInterval = DEFAULT_TERMINATOR_UPDATE_MS,
    getCurrentTime = () => new Date(),
  } = options;

  let intervalId: number | null = null;
  let pendingUpdate = false;
  let isPaused = false;

  /** Update night overlay and city night states using RAF for efficient batching. */
  function update(): void {
    const now = getCurrentTime();
    
    // Calculate night region path
    const nightPath = getNightRegionPath(now, latLngToSvg, {
      width: MAP_VIEWBOX.width,
      height: MAP_VIEWBOX.height,
    });
    nightOverlay.setAttribute('d', nightPath);

    // Update city night states
    cities.forEach((city) => {
      const marker = markerElements.get(city.timezone);
      if (!marker) return;

      const cityIsNight = isNight(city.lat, city.lng, now);
      marker.setAttribute('data-night', cityIsNight.toString());
    });
  }

  /** Schedule update via RAF (prevents multiple updates per frame). */
  function scheduleUpdate(): void {
    if (pendingUpdate || isPaused) return;
    
    pendingUpdate = true;
    requestAnimationFrame(() => {
      // CRITICAL: Skip update if paused during RAF queue (prevents final unwanted update)
      if (isPaused) {
        pendingUpdate = false;
        return;
      }
      update();
      pendingUpdate = false;
    });
  }

  function startInterval(): void {
    if (intervalId !== null) return;
    
    intervalId = window.setInterval(() => {
      scheduleUpdate();
    }, updateInterval);
  }

  function stopInterval(): void {
    if (intervalId === null) return;
    
    clearInterval(intervalId);
    intervalId = null;
  }

  function pause(): void {
    if (isPaused) return;
    isPaused = true;
    pendingUpdate = false;
    stopInterval();
  }

  function resume(): void {
    if (!isPaused) return;
    isPaused = false;
    
    // Immediate update when resuming
    scheduleUpdate();
    startInterval();
  }

  // Initial update and start interval
  update();
  startInterval();

  return {
    update,
    pause,
    resume,
    
    isActive(): boolean {
      return !isPaused && intervalId !== null;
    },
    
    destroy(): void {
      stopInterval();
      isPaused = true;
      pendingUpdate = false;
    },
  };
}
