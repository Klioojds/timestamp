/**
 * World map coordinator: delegates to marker-manager, terminator-renderer, and announcer.
 */

import '../../styles/components/world-map.scss';

import { type CityMarker, FEATURED_CITIES } from '@app/data/cities';
import { WORLD_MAP_SVG_PATH } from '@app/data/world-map-svg';
import type { ThemeStyles, WallClockTime } from '@core/types';
import { cloneTemplate } from '@core/utils/dom';

import { createAnnouncer } from './announcer';
import {
    CELEBRATION_POLL_INTERVAL_MS,
    DEFAULT_TERMINATOR_UPDATE_MS,
    VISIBILITY_THRESHOLD,
} from './constants';
import { createMarkerManager } from './marker-manager';
import { createTerminatorRenderer } from './terminator-renderer';

type VisibilityObserver = Pick<IntersectionObserver, 'observe' | 'unobserve' | 'disconnect'>;

function createFallbackEntry(target: HTMLElement): IntersectionObserverEntry {
  const rect = target.getBoundingClientRect();

  return {
    boundingClientRect: rect,
    intersectionRect: rect,
    intersectionRatio: 1,
    isIntersecting: true,
    rootBounds: null,
    target,
    time: performance.now(),
  } satisfies IntersectionObserverEntry;
}

function createVisibilityObserver(
  target: HTMLElement,
  handler: IntersectionObserverCallback
): VisibilityObserver {
  const ObserverCtor = globalThis.IntersectionObserver;

  if (ObserverCtor) {
    const observer = new ObserverCtor(handler, { threshold: VISIBILITY_THRESHOLD });
    observer.observe(target);
    return observer;
  }

  // NOTE: jsdom doesn't provide IntersectionObserver, causing ReferenceError in tests.
  // Fallback immediately invokes handler with synthetic entry to simulate visibility.
  handler([createFallbackEntry(target)], {} as IntersectionObserver);
  return {
    observe: () => handler([createFallbackEntry(target)], {} as IntersectionObserver),
    unobserve: () => undefined,
    disconnect: () => undefined,
  };
}

/**
 * Options for creating a world map
 */
export interface WorldMapOptions {
  /** Callback when a city is clicked */
  onCitySelect?: (city: CityMarker) => void;
  /** Initially selected timezone */
  initialTimezone?: string;
  /** Wall-clock target for celebration detection (required) */
  wallClockTarget: WallClockTime;
  /** CSS variable overrides for theme-specific styling */
  themeStyles?: ThemeStyles;
  /** Update interval for terminator in ms (default: 60000) */
  updateInterval?: number;
  /** Injectable time function for testing */
  getCurrentTime?: () => Date;
}

/**
 * Controller interface for the world map
 */
export interface WorldMapController {
  /** Update which timezone is selected */
  setTimezone: (timezone: string) => void;
  /** Update celebration states (call periodically) */
  updateCelebrationStates: () => void;
  /** Update the day/night terminator position */
  updateTerminator: () => void;
  /** Update theme-specific styles */
  setThemeStyles: (styles: ThemeStyles) => void;
  /** Set visibility of the world map (for responsive layout) */
  setVisible: (visible: boolean) => void;
  /** Pause automatic updates (call when map is hidden) - PERF: Saves CPU */
  pause: () => void;
  /** Resume automatic updates */
  resume: () => void;
  /** Get the wrapper element (for mobile menu integration) */
  getElement: () => HTMLElement;
  /** Clean up and remove the component */
  destroy: () => void;
}

/**
 * Create and render the world map with city markers and day/night visualization.
 * 
 * ARCHITECTURE: This function is a THIN COORDINATOR that:
 * 1. Creates the DOM structure
 * 2. Delegates to specialized modules (marker-manager, terminator-renderer, announcer)
 * 3. Manages cleanup and timer ownership (single owner pattern)
 * 
 * PERF: Includes pause/resume capability to stop intervals when map is hidden.
 *
 * @param container - Parent element to mount the map
 * @param options - Configuration including callbacks and wall-clock target
 * @returns Controller for managing the map
 * @throws Error if wallClockTarget is missing
 *
 * @example
 * ```typescript
 * const map = createWorldMap(container, {
 *   wallClockTarget: { year: 2025, month: 0, day: 1, hours: 0, minutes: 0, seconds: 0 },
 *   initialTimezone: 'America/New_York',
 *   onCitySelect: (city) => console.log(`Selected ${city.name}`),
 * });
 * map.pause();
 * map.destroy();
 * ```
 */
export function createWorldMap(
  container: HTMLElement,
  options: WorldMapOptions
): WorldMapController {
  const {
    onCitySelect,
    initialTimezone,
    wallClockTarget,
    themeStyles,
    updateInterval = DEFAULT_TERMINATOR_UPDATE_MS,
    getCurrentTime = () => new Date(),
  } = options;

  if (!wallClockTarget) {
    throw new Error('createWorldMap requires a wallClockTarget option');
  }

  // Timer ownership: Single coordinator creates all intervals
  let celebrationIntervalId: number | null = null;
  let isPaused = false;

  let visibilityObserver: VisibilityObserver = {
    observe: () => undefined,
    unobserve: () => undefined,
    disconnect: () => undefined,
  };

  function isElementVisible(element: HTMLElement): boolean {
    if (!element.isConnected) return false;
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') {
      return false;
    }
    // NOTE: Check dimensions to handle collapsed or offscreen elements not caught by CSS.
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  // ========================================================================
  // EXTRACTION SEAM: DOM Structure Creation
  // This section creates the stable DOM structure. The aria-live element
  // is intentionally created here (not in announcer module) to ensure
  // proper insertion order, but its lifecycle is managed by announcer.
  // ========================================================================

  // Clone world map template
  const wrapper = cloneTemplate<HTMLElement>('world-map-template');

  // Set continent path data
  const continentPath = wrapper.querySelector('.continent') as SVGPathElement;
  continentPath.setAttribute('d', WORLD_MAP_SVG_PATH.replace(/\s+/g, ' '));

  // Apply initial theme styles
  if (themeStyles) {
    Object.entries(themeStyles).forEach(([key, value]) => {
      wrapper.style.setProperty(key, value);
    });
  }

  container.appendChild(wrapper);

  const markersContainer = wrapper.querySelector('.city-markers') as HTMLElement;
  const nightOverlay = wrapper.querySelector('.night-overlay') as SVGPathElement;

  // ========================================================================
  // EXTRACTION SEAM: Module Instantiation
  // Each module handles a specific concern with clear boundaries.
  // ========================================================================

  // Create marker manager (handles city buttons and celebration state)
  const markerManager = createMarkerManager({
    container: markersContainer,
    onCitySelect,
    initialTimezone,
    wallClockTarget,
    getCurrentTime,
  });

  // Create terminator renderer (handles day/night overlay)
  const terminatorRenderer = createTerminatorRenderer({
    nightOverlay,
    markerElements: markerManager.getMarkerElements(),
    cities: FEATURED_CITIES,
    updateInterval,
    getCurrentTime,
  });

  // Create announcer (stable live-region for screen readers)
  const announcer = createAnnouncer(wrapper);

  syncVisibility();

  function pause(): void {
    if (isPaused) return;
    visibilityObserver = createVisibilityObserver(wrapper, (entries) => {
      const [entry] = entries;
      if (!entry) return;
      // PERF: Pause/resume based on viewport intersection to save CPU when map is scrolled offscreen.
      if (entry.isIntersecting) {
        resume();
      } else {
        pause();
      }
    });
    isPaused = true;
    terminatorRenderer.pause();
  }

  function resume(): void {
    if (!isPaused) return;
    isPaused = false;
    terminatorRenderer.resume();
  }

  function syncVisibility(): void {
    if (isElementVisible(wrapper)) {
      resume();
    } else {
      pause();
    }
  }

  // ========================================================================
  // EXTRACTION SEAM: Celebration Interval
  // Timer ownership: This coordinator owns the celebration update interval.
  // Individual modules don't create their own timers to avoid conflicts.
  // ========================================================================

  function updateCelebrationStatesAndAnnounce(): void {
    const newlyCelebrating = markerManager.updateCelebrationStates();
    
    // Announce only the first newly celebrating city (throttled)
    if (newlyCelebrating.length > 0) {
      announcer.announceCelebration(newlyCelebrating[0]);
    }
  }

  // Initial celebration state update
  updateCelebrationStatesAndAnnounce();

  // Set up fast interval for celebration state updates (every second for real-time detection)
  celebrationIntervalId = window.setInterval(() => {
    if (!isPaused) {
      updateCelebrationStatesAndAnnounce();
    }
  }, CELEBRATION_POLL_INTERVAL_MS);

  // ========================================================================
  // Public API: Thin delegation to modules
  // ========================================================================

  const controller: WorldMapController = {
    setTimezone: (timezone: string) => markerManager.setTimezone(timezone),
    
    updateCelebrationStates: () => updateCelebrationStatesAndAnnounce(),
    
    updateTerminator: () => terminatorRenderer.update(),

    setThemeStyles(styles: ThemeStyles): void {
      Object.entries(styles).forEach(([key, value]) => {
        wrapper.style.setProperty(key, value);
      });
    },

    setVisible(visible: boolean): void {
      wrapper.hidden = !visible;
      
      // PERF P2.7: Pause/resume intervals when visibility changes
      if (visible) {
        resume();
      } else {
        pause();
      }
    },

    pause: () => pause(),

    resume: () => resume(),

    getElement(): HTMLElement {
      return wrapper;
    },

    destroy(): void {
      // Stop intervals
      if (celebrationIntervalId !== null) {
        clearInterval(celebrationIntervalId);
        celebrationIntervalId = null;
      }
      
      // Clean up modules
      terminatorRenderer.destroy();
      markerManager.destroy();
      announcer.destroy();
      visibilityObserver.disconnect();
      
      // Remove DOM
      wrapper.remove();
    },
  };

  return controller;
}
