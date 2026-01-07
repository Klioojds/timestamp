/**
 * Base renderer state for fireworks theme.
 *
 * @remarks
 * Defines shared state fields inherited by TimePageRendererState and LandingPageRendererState.
 * All fireworks renderers track destruction status and animation state from the orchestrator.
 *
 * @public
 */

import type { AnimationStateContext } from '@core/types';
import { DEFAULT_ANIMATION_STATE } from '@themes/shared';

/**
 * Base state inherited by all fireworks renderer states.
 *
 * @remarks
 * Provides destruction tracking and animation state access.
 * Extended by {@link FireworksTimePageRendererState} and {@link FireworksLandingPageRendererState}.
 */
export interface BaseFireworksRendererState {
  /** Lifecycle flag: true after destroy() called, prevents cleanup race conditions. */
  isDestroyed: boolean;
  /** Gets live animation state from orchestrator (animations on/off, reduced motion preference). */
  getAnimationState: () => AnimationStateContext;
}

/** Creates base renderer state (not destroyed, default animation state). */
export function createBaseRendererState(): BaseFireworksRendererState {
  return {
    isDestroyed: false,
    getAnimationState: () => DEFAULT_ANIMATION_STATE,
  };
}
