/**
 * Shared Animation State Utilities
 * Animation state management helpers used across all theme implementations.
 */

import type { AnimationStateContext, AnimationStateGetter } from './types';

/**
 * Default animation state when no getter is provided.
 * Used during initialization before orchestrator connects.
 *
 * @public
 */
export const DEFAULT_ANIMATION_STATE: AnimationStateContext = {
  shouldAnimate: true,
  prefersReducedMotion: false,
};

/**
 * Check if animations should be enabled based on current animation state.
 * Animations are enabled when shouldAnimate is true AND reducedMotion is false.
 *
 * @param getAnimationState - Function to get current animation state
 * @returns true if animations should be enabled
 * @public
 */
export function shouldEnableAnimations(getAnimationState: AnimationStateGetter): boolean {
  const { shouldAnimate, prefersReducedMotion } = getAnimationState();
  return shouldAnimate && !prefersReducedMotion;
}
