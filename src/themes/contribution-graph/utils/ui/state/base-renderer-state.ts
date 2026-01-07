/**
 * Base renderer state and shared utilities.
 *
 * Provides common state interface, creation helpers, and shared methods
 * used by both time page and landing page renderers.
 */

import {
  createResourceTracker,
  DEFAULT_ANIMATION_STATE,
} from '@themes/shared';
import type {
  AnimationStateGetter,
  ResourceTracker,
} from '@themes/shared/types';

import type { GridState } from '../../../types';
import { type ActivityLoopState, createActivityLoopState } from '../animation';

/**
 * Base renderer state interface.
 * Contains fields common to both time page and landing page renderers.
 */
export interface BaseRendererState {
  /** Container element for the renderer. */
  container: HTMLElement | null;
  /** Grid state for the contribution graph. */
  gridState: GridState | null;
  /** Activity loop state for ambient animations. */
  loopState: ActivityLoopState;
  /** Cleanup handles for timers and observers. */
  resourceTracker: ResourceTracker;
  /** Animation state getter function. */
  getAnimationState: AnimationStateGetter;
  /** RAF ID for throttled resize handling. Null if not using RAF throttling. */
  resizeRafId: number | null;
  /** Periodic cleanup timer ID for memory management. */
  periodicCleanupId: number | null;
}

/**
 * Create base renderer state fields.
 * Call this from specific renderer state creation functions.
 *
 * @returns Base state fields with default values
 * @internal
 */
export function createBaseRendererState(): BaseRendererState {
  return {
    container: null,
    gridState: null,
    loopState: createActivityLoopState(),
    resourceTracker: createResourceTracker(),
    getAnimationState: () => DEFAULT_ANIMATION_STATE,
    resizeRafId: null,
    periodicCleanupId: null,
  };
}

/**
 * Check if renderer state is ready for operations.
 * A renderer is ready when both container and gridState are initialized.
 *
 * @param state - Renderer state to check
 * @returns true if renderer is ready for operations
 * @internal
 */
export function isRendererReady(state: BaseRendererState): boolean {
  return state.container !== null && state.gridState !== null;
}

/**
 * Update container reference when DOM element moves.
 * Called by orchestrator when theme container is relocated.
 *
 * @param state - Renderer state to update
 * @param newContainer - New container element
 * @internal
 */
export function updateRendererContainer(state: BaseRendererState, newContainer: HTMLElement): void {
  state.container = newContainer;
}
