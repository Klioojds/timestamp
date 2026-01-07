/**
 * Celebration State Transitions - encapsulates state machine transitions for consistency.
 * Prevents duplication and ensures atomic state updates across orchestrator, time-handlers, and timezone-manager.
 */

import type { CelebrationState } from '@core/types';

/**
 * Minimal state manager interface for celebration transitions.
 * Avoids coupling to full StateManager type.
 */
interface CelebrationStateManager {
  setCelebrationState(state: CelebrationState): void;
  markCelebrated(timezone: string): void;
  setComplete(isComplete: boolean): void;
  resetCelebration(): void;
}

/**
 * Transition to celebrated state (skip animation).
 * Used when: initial load with past date, timezone switch to already-past timezone, or already-celebrated timezone.
 *
 * @param stateManager - State manager instance with celebration methods
 * @param container - Container element for data-celebrating attribute
 * @param timezone - Timezone to mark as celebrated
 * @example
 * ```typescript
 * // Initial load with past date
 * transitionToCelebrated(stateManager, container, initialTimezone);
 * ```
 */
export function transitionToCelebrated(
  stateManager: CelebrationStateManager,
  container: HTMLElement,
  timezone: string
): void {
  stateManager.setCelebrationState('celebrated');
  stateManager.markCelebrated(timezone);
  stateManager.setComplete(true);
  container.setAttribute('data-celebrating', 'true');
}

/**
 * Transition to celebrating state (start animation).
 * Used when: countdown naturally reaches zero for the first time in a timezone.
 *
 * @param stateManager - State manager instance with celebration methods
 * @param container - Container element for data-celebrating attribute
 * @param timezone - Timezone to mark as celebrated
 * @example
 * ```typescript
 * // Normal countdown completion
 * transitionToCelebrating(stateManager, container, currentTimezone);
 * theme.onCelebrating({ message });
 * completeCelebration(stateManager); // After animation
 * ```
 */
export function transitionToCelebrating(
  stateManager: CelebrationStateManager,
  container: HTMLElement,
  timezone: string
): void {
  stateManager.setCelebrationState('celebrating');
  stateManager.markCelebrated(timezone);
  stateManager.setComplete(true);
  container.setAttribute('data-celebrating', 'true');
}

/**
 * Complete celebration transition (after animation finishes).
 * Transitions from 'celebrating' → 'celebrated'.
 *
 * @param stateManager - State manager instance with celebration methods
 * @example
 * ```typescript
 * // After onCelebrating animation completes
 * completeCelebration(stateManager);
 * ```
 */
export function completeCelebration(stateManager: Pick<CelebrationStateManager, 'setCelebrationState'>): void {
  stateManager.setCelebrationState('celebrated');
}

/**
 * Transition back to counting state (resume countdown).
 * Used when: wall-clock timezone switch to a not-yet-reached timezone.
 *
 * @param stateManager - State manager instance with celebration methods
 * @param container - Container element for data-celebrating attribute
 * @example
 * ```typescript
 * // Timezone switch from past to future timezone
 * transitionToCounting(stateManager, container);
 * theme.onCounting?.(); // Reset celebration UI
 * ```
 */
export function transitionToCounting(
  stateManager: Pick<CelebrationStateManager, 'resetCelebration' | 'setComplete'>,
  container: HTMLElement
): void {
  stateManager.resetCelebration();
  stateManager.setComplete(false);
  container.removeAttribute('data-celebrating');
}
