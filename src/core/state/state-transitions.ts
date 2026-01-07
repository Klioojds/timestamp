/**
 * Celebration State Transitions - validation logic for celebration state transitions.
 * Defines valid state transitions and timezone celebration tracking.
 */

import type { CelebrationState } from '@core/types';

/**
 * Valid celebration state transitions table.
 * - counting → celebrating: Time reached (with animation)
 * - counting → celebrated: Already past on load / Already celebrated timezone (skip animation)
 * - celebrating → celebrated: Animation complete
 * - celebrated → counting: Timezone switch (only if not celebrated in new timezone)
 */
export const CELEBRATION_STATE_TRANSITIONS: Record<CelebrationState, CelebrationState[]> = {
  counting: ['celebrating', 'celebrated'], // Allow direct to celebrated for already-past dates
  celebrating: ['celebrated'],
  celebrated: ['counting'], // Only via timezone switch
};

/**
 * Validates if a state transition is allowed.
 *
 * @param from - Current celebration state
 * @param to - Target celebration state
 * @returns True if transition is valid
 * @example
 * ```typescript
 * isValidTransition('counting', 'celebrating'); // true
 * isValidTransition('counting', 'celebrated'); // true (skip animation)
 * ```
 */
export function isValidTransition(from: CelebrationState, to: CelebrationState): boolean {
  return CELEBRATION_STATE_TRANSITIONS[from].includes(to);
}

/**
 * Gets allowed transitions from a given state.
 *
 * @param from - Current celebration state
 * @returns Array of valid next states
 * @example
 * ```typescript
 * getAllowedTransitions('counting'); // ['celebrating']
 * ```
 */
export function getAllowedTransitions(from: CelebrationState): CelebrationState[] {
  return CELEBRATION_STATE_TRANSITIONS[from];
}
