/**
 * Accessibility utilities for countdown announcements, reduced motion support,
 * DOM attribute optimization, and visually hidden elements.
 */

import { cancelAll, createResourceTracker, type ResourceTracker, safeSetTimeout } from '@core/resource-tracking';
import { formatTimeRemainingHuman } from '@core/time/time';
import type { TimeRemaining } from '@core/types';

// ============================================================================
// Visually Hidden Elements
// ============================================================================

/** Options for creating a visually hidden element. */
export interface VisuallyHiddenOptions {
  role?: string;
  ariaLive?: 'polite' | 'assertive';
  ariaAtomic?: boolean;
  id?: string;
  textContent?: string;
  additionalClasses?: string[];
  /** Apply inline clip styles (for shadow roots or missing stylesheet). */
  applyInlineStyles?: boolean;
}

/**
 * Create a visually hidden element with optional ARIA attributes (uses `sr-only` class).
 * @param tagName - HTML element tag name
 * @param options - Optional ARIA attributes and styles
 */
export function createVisuallyHiddenElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K = 'div' as K,
  options: VisuallyHiddenOptions = {}
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);
  element.className = ['sr-only', ...(options.additionalClasses ?? [])].join(' ');

  if (options.role) element.setAttribute('role', options.role);
  if (options.ariaLive) element.setAttribute('aria-live', options.ariaLive);
  if (typeof options.ariaAtomic === 'boolean') {
    element.setAttribute('aria-atomic', options.ariaAtomic ? 'true' : 'false');
  }
  if (options.id) element.id = options.id;
  if (options.textContent) element.textContent = options.textContent;

  if (options.applyInlineStyles) {
    element.style.cssText =
      'position:absolute;width:1px;height:1px;padding:0;margin:-1px;' +
      'overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border-width:0';
  }

  return element;
}

// ============================================================================
// Attribute Caching - Reduces redundant DOM writes
// ============================================================================

/** Cache for tracking the last applied attribute value. */
export interface AttributeCache {
  current: string;
}

/**
 * Create an attribute cache container.
 * @param initialValue - Initial cached value
 */
export function createAttributeCache(initialValue = ''): AttributeCache {
  return { current: initialValue };
}

/**
 * Set an attribute only when the value changes. Returns true if updated.
 * @param element - Target element
 * @param attribute - Attribute name
 * @param value - New attribute value
 * @param cache - Cache tracking last value
 */
export function setAttributeIfChanged(
  element: HTMLElement,
  attribute: string,
  value: string,
  cache: AttributeCache
): boolean {
  if (cache.current === value) return false;
  element.setAttribute(attribute, value);
  cache.current = value;
  return true;
}

// ============================================================================
// Reduced Motion Manager
// ============================================================================

/** Singleton for detecting and subscribing to motion preference changes. */
export const reducedMotionManager = {
  /** Check if reduced motion is currently preferred. */
  isActive(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  /** Subscribe to reduced motion preference changes. Returns cleanup function. */
  subscribe(callback: (active: boolean) => void): () => void {
    if (typeof window === 'undefined') return () => {};
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => callback(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  },
};

/** Convenience helper for boolean reduced motion checks. */
export function prefersReducedMotion(): boolean {
  return reducedMotionManager.isActive();
}

// ============================================================================
// Announcement Throttling
// ============================================================================

interface ThrottleConfig {
  threshold: number;
  interval: number;
}

// Adaptive throttling tiers based on time remaining.
// NOTE: Announcement frequency increases as countdown approaches zero to provide more urgent updates.
const ANNOUNCEMENT_THROTTLE_TIERS: ThrottleConfig[] = [
  { threshold: 10 * 1000, interval: 1000 },           // Final 10s: every second
  { threshold: 60 * 1000, interval: 10 * 1000 },      // <1 min: every 10s
  { threshold: 60 * 60 * 1000, interval: 30 * 1000 }, // <1 hour: every 30s
  { threshold: Infinity, interval: 60 * 1000 },       // >1 hour: every 60s
];

/** Get announcement interval based on time remaining (adaptive throttling). */
function getAnnouncementInterval(totalMs: number): number {
  for (const tier of ANNOUNCEMENT_THROTTLE_TIERS) {
    if (totalMs <= tier.threshold) return tier.interval;
  }
  return 60 * 1000;
}

// ============================================================================
// Accessibility Manager
// ============================================================================

/** Manages ARIA live regions and screen reader announcements. */
export interface AccessibilityManager {
  /** Initialize live regions. */
  init(container: HTMLElement): void;
  /** Announce countdown time (auto-throttled based on urgency). */
  announceCountdown(time: TimeRemaining): void;
  /** Announce theme change. */
  announceThemeChange(themeName: string): void;
  /** Announce celebration when countdown completes. */
  announceCelebration(message?: string): void;
  /** Announce that countdown has loaded. */
  announceLoaded(): void;
  /** Announce a generic message. */
  announceMessage(message: string): void;
  /** Clean up resources. */
  destroy(): void;
}

/** Create an accessibility manager with intelligent throttling for screen reader announcements. */
export function createAccessibilityManager(): AccessibilityManager {
  let countdownRegion: HTMLElement | null = null;
  let statusRegion: HTMLElement | null = null;
  let lastAnnouncementTime = 0;
  let lastAnnouncedTotal = -1;
  const resourceTracker: ResourceTracker = createResourceTracker();

  function ensureLiveRegions(container: HTMLElement): void {
    // NOTE: Attach to document.body instead of theme container so regions survive theme switches
    const host = typeof document !== 'undefined' && document.body ? document.body : container;
    if (!host) return;

    // Check if regions already exist in document
    countdownRegion = document.getElementById('sr-countdown');
    statusRegion = document.getElementById('sr-status');

    if (!countdownRegion) {
      countdownRegion = document.createElement('div');
      countdownRegion.id = 'sr-countdown';
      countdownRegion.className = 'sr-only';
      countdownRegion.setAttribute('aria-live', 'polite');
      countdownRegion.setAttribute('aria-atomic', 'true');
      host.appendChild(countdownRegion);
    }

    if (!statusRegion) {
      statusRegion = document.createElement('div');
      statusRegion.id = 'sr-status';
      statusRegion.className = 'sr-only';
      statusRegion.setAttribute('role', 'status');
      host.appendChild(statusRegion);
    }
  }

  return {
    init(container: HTMLElement): void {
      ensureLiveRegions(container);
    },

    announceCountdown(time: TimeRemaining): void {
      if (!countdownRegion) return;

      const now = Date.now();
      const interval = getAnnouncementInterval(time.total);

      // Don't announce if within throttle interval
      if (now - lastAnnouncementTime < interval) return;

      // Don't announce same second twice
      if (time.total === lastAnnouncedTotal) return;

      const announcement = `Countdown: ${formatTimeRemainingHuman(time)}`;
      countdownRegion.textContent = announcement;
      lastAnnouncementTime = now;
      lastAnnouncedTotal = time.total;
    },

    announceThemeChange(themeName: string): void {
      if (!statusRegion) return;
      
      // Use separate cleanup for theme announcements to not conflict with celebration
      cancelAll(resourceTracker);

      safeSetTimeout(() => {
        statusRegion!.textContent = `Theme changed to ${themeName}`;
      }, 300, resourceTracker);
    },

    announceCelebration(message?: string): void {
      if (!statusRegion) return;
      
      cancelAll(resourceTracker);

      safeSetTimeout(() => {
        statusRegion!.textContent = message ?? 'The countdown has completed.';
      }, 300, resourceTracker);
    },

    announceLoaded(): void {
      if (!statusRegion) return;
      statusRegion.textContent = 'Countdown loaded';
    },

    announceMessage(message: string): void {
      if (!statusRegion) return;
      // Clear any pending status updates to prioritize this one
      cancelAll(resourceTracker);
      
      statusRegion.textContent = message;
    },

    destroy(): void {
      // Remove created regions if they exist
      countdownRegion?.remove();
      statusRegion?.remove();
      countdownRegion = null;
      statusRegion = null;
      lastAnnouncementTime = 0;
      lastAnnouncedTotal = -1;
      cancelAll(resourceTracker);
    },
  };
}
