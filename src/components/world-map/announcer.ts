/**
 * CRITICAL: Stable live-region for celebration announcements. Element must never be recreated.
 */

import { cancelAll, createResourceTracker, type ResourceTracker, safeSetTimeout } from '@/core/resource-tracking';

import { ANNOUNCEMENT_CLEAR_DELAY_MS } from './constants';

/**
 * Controller interface for celebration announcements
 */
export interface AnnouncerController {
  /** Announce a new celebration (throttled to prevent spam) */
  announceCelebration: (cityName: string) => void;
  /** Get the live-region element (for testing) */
  getElement: () => HTMLElement;
  /** Clean up (only removes content, not the element itself) */
  destroy: () => void;
}

/**
 * Create stable live-region for celebration announcements (updates via textContent only).
 * @example
 * ```typescript
 * const announcer = createAnnouncer(mapContainer);
 * announcer.announceCelebration('New York');
 * ```
 */
export function createAnnouncer(container: HTMLElement): AnnouncerController {
  // Create stable live-region element (NEVER recreate this!)
  const liveRegion = document.createElement('div');
  liveRegion.className = 'celebration-announcer';
  liveRegion.setAttribute('role', 'status');
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.setAttribute('aria-atomic', 'true');
  liveRegion.setAttribute('data-testid', 'celebration-announcer');
  
  container.appendChild(liveRegion);
  
  let lastAnnouncedCity: string | null = null;
  const resourceTracker: ResourceTracker = createResourceTracker();

  /**
   * Announce a new celebration with throttling.
   * Only announces if the city is different from the last announcement.
   */
  function announceCelebration(cityName: string): void {
    // NOTE: Throttle to prevent screen reader spam when multiple cities celebrate simultaneously.
    if (cityName === lastAnnouncedCity) {
      return;
    }
    
    lastAnnouncedCity = cityName;
    
    // Clear any pending clear timeout
    cancelAll(resourceTracker);
    
    // Update live region (this triggers screen reader announcement)
    liveRegion.textContent = `${cityName} has reached the countdown target! Celebration time!`;
    
    // Clear announcement after delay to prepare for next one
    safeSetTimeout(() => {
      liveRegion.textContent = '';
    }, ANNOUNCEMENT_CLEAR_DELAY_MS, resourceTracker);
  }

  return {
    announceCelebration,
    
    getElement(): HTMLElement {
      return liveRegion;
    },
    
    destroy(): void {
      // Clear any pending timeout
      cancelAll(resourceTracker);
      
      // Clear content but DON'T remove the element
      // (removal is handled by parent component cleanup)
      liveRegion.textContent = '';
      lastAnnouncedCity = null;
    },
  };
}
