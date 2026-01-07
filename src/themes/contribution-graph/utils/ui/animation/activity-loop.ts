/**
 * Activity loop management for ambient square animations.
 *
 * Handles starting, stopping, and scheduling ambient activity ticks
 * based on countdown phase and animation state.
 */

import { debounceTimeout } from '@themes/shared';
import type { AnimationStateGetter, ResourceTracker } from '@themes/shared/types';

import type { ActivityPhase } from '../../../config';
import { getPhaseConfigByName } from '../../../config';
import type { GridState } from '../../../types';
import { activityTick, clearAmbientActivity } from './ambient-activity';

/** Activity loop state container. */
export interface ActivityLoopState {
  /** Current activity phase. */
  currentPhase: ActivityPhase;
  /** Whether activity loop is running. */
  isActivityRunning: boolean;
  /** Timeout ID for next activity tick. */
  activityTimeoutId: number | null;
}

/** Create initial activity loop state. @returns New activity loop state */
export function createActivityLoopState(): ActivityLoopState {
  return {
    currentPhase: 'calm',
    isActivityRunning: false,
    activityTimeoutId: null,
  };
}

/** Schedule next activity tick based on current phase (respects animation state). */
export function scheduleActivityTick(
  gridState: GridState | null,
  loopState: ActivityLoopState,
  getAnimationState: AnimationStateGetter,
  resourceTracker: ResourceTracker
): void {
  if (!gridState || !loopState.isActivityRunning) return;

  const { shouldAnimate, prefersReducedMotion } = getAnimationState();
  if (!shouldAnimate || prefersReducedMotion) return;

  const config = getPhaseConfigByName(loopState.currentPhase);
  loopState.activityTimeoutId = debounceTimeout(
    loopState.activityTimeoutId,
    () => {
      if (gridState && loopState.isActivityRunning) {
        activityTick(gridState, loopState.currentPhase, resourceTracker);
        scheduleActivityTick(gridState, loopState, getAnimationState, resourceTracker);
      }
    },
    config.tickIntervalMs,
    resourceTracker
  );
}

/**
 * Start ambient activity loop with immediate tick.
 * @remarks PERF FIX: Immediate tick prevents delay on load
 */
export function startActivity(
  gridState: GridState | null,
  loopState: ActivityLoopState,
  getAnimationState: AnimationStateGetter,
  resourceTracker: ResourceTracker
): void {
  if (loopState.isActivityRunning) return;
  loopState.isActivityRunning = true;

  if (gridState) {
    activityTick(gridState, loopState.currentPhase, resourceTracker);
  }

  scheduleActivityTick(gridState, loopState, getAnimationState, resourceTracker);
}

/** Stop ambient activity loop and clear all ambient squares. */
export function stopActivity(
  gridState: GridState | null,
  loopState: ActivityLoopState
): void {
  loopState.isActivityRunning = false;
  if (loopState.activityTimeoutId !== null) {
    clearTimeout(loopState.activityTimeoutId);
    loopState.activityTimeoutId = null;
  }
  if (gridState) {
    clearAmbientActivity(gridState);
  }
}
