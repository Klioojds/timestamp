/**
 * Theme Focus Preservation - utilities for preserving and restoring focus during theme transitions.
 * Handles focus memory across theme switch lifecycle and ARIA attributes on theme containers.
 */

import { formatTimeRemainingHumanWithoutSeconds } from '@core/time/time';
import type { ThemeId, TimeRemaining } from '@core/types';

import { FOCUSABLE_SELECTOR } from '@/core/config/constants';

/**
 * Set up required attributes on a theme container.
 * 
 * Configures ARIA attributes and data attributes for theme container accessibility
 * and testing. Sets role="region" for landmark navigation and appropriate aria-label.
 * 
 * @param container - The container element to set up
 * @param themeId - Theme identifier for data-theme attribute
 * @param timeDescription - Optional ARIA label describing time remaining, defaults to "Countdown display"
 * 
 * @example
 * ```typescript
 * setupThemeContainer(container, 'contribution-graph', 'Countdown: 5 days remaining');
 * ```
 */
export function setupThemeContainer(
  container: HTMLElement,
  themeId: ThemeId,
  timeDescription?: string
): void {
  container.setAttribute('data-testid', 'theme-container');
  container.setAttribute('data-theme', themeId);
  container.setAttribute('role', 'region');
  container.setAttribute('aria-label', timeDescription ?? 'Countdown display');
  container.tabIndex = -1;
}

/**
 * Preserve focus within a container before destruction.
 * Returns currently focused element if inside container, else first focusable element or container.
 */
export function preserveFocusWithin(container: HTMLElement): HTMLElement | null {
  const active = document.activeElement as HTMLElement | null;
  if (active && container.contains(active)) {
    return active;
  }
  const focusable = container.querySelector(FOCUSABLE_SELECTOR) as HTMLElement | null;
  return focusable ?? container;
}

/** Restore focus after theme switch. Validates element exists and is attached to DOM. */
export function restoreFocusWithin(container: HTMLElement, element: HTMLElement | null): void {
  const isValidTarget = element && element.isConnected && container.contains(element);
  const target = isValidTarget ? element : container;
  target?.focus?.();
}

/** Construct accessible name from time remaining. Excludes seconds to reduce DOM churn. */
export function getCountdownAccessibleName(time: TimeRemaining | null, isComplete: boolean): string {
  if (isComplete) {
    return 'The countdown has completed.';
  }
  if (time) {
    return `Countdown: ${formatTimeRemainingHumanWithoutSeconds(time)}`;
  }
  return 'Countdown display';
}
