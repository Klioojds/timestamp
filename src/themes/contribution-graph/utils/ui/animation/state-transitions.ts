/**
 * State transition helpers for time page renderer.
 *
 * Encapsulates common patterns for transitioning between counting,
 * celebrating, and celebrated states.
 */

import { cancelAll, shouldEnableAnimations } from '@themes/shared';

import { buildSquareClass, CSS_CLASSES } from '../../../config';
import type { GridState } from '../../../types';
import { stopPeriodicCleanup } from '../memory-management';
import {
  type BaseRendererState,
} from '../state/base-renderer-state';
import { clearCelebrationText, renderCelebrationText } from '../text-rendering/celebration-renderer';
import { startActivity as startActivityLoop, stopActivity as stopActivityLoop } from './activity-loop';
import { buildWall, clearWall, unbuildWall } from './wall-build';

/**
 * Renderer state interface (minimal for animation functions).
 * Extends base with animation-specific requirements.
 * Note: No additional fields needed - inherits all from BaseRendererState.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface RendererState extends BaseRendererState {
  // All required fields are inherited from BaseRendererState
}

/** Update ambient squares to exclude message bounding box (uses dirty flag to skip rebuild). */
export function updateAmbientSquaresForCelebration(state: GridState): void {
  const box = state.digitBoundingBox;
  if (!box) {
    state.ambientSquares = [...state.squares];
    state.ambientSquaresDirty = false;
    return;
  }

  state.ambientSquares = state.squares.filter((square) => {
    const isOutside =
      square.col < box.minCol ||
      square.col > box.maxCol ||
      square.row < box.minRow ||
      square.row > box.maxRow;
    const isMessage = square.element.classList.contains(CSS_CLASSES.MESSAGE);
    return isOutside && !isMessage;
  });
  state.ambientSquaresDirty = false;
}

/** Clear ambient CSS classes from all squares (CSS-driven animations, just remove is-ambient). */
export function clearAmbientTransitions(gridState: GridState | null): void {
  if (!gridState) return;

  for (const square of gridState.squares) {
    if (square.element.classList.contains(CSS_CLASSES.AMBIENT)) {
      if (
        !square.isDigit &&
        !square.element.classList.contains(CSS_CLASSES.WALL) &&
        !square.element.classList.contains(CSS_CLASSES.MESSAGE)
      ) {
        square.element.className = buildSquareClass(0);
      }
    }
  }
  gridState.activeAmbient.clear();
}

/** Start activity loop using renderer state. */
export function startActivity(state: RendererState): void {
  startActivityLoop(state.gridState, state.loopState, state.getAnimationState, state.resourceTracker);
}

/** Stop activity loop using renderer state. */
export function stopActivity(state: RendererState): void {
  stopActivityLoop(state.gridState, state.loopState);
}

/** Handle animation state change (clears ambient, starts/stops activity, resets time cache). */
export function handleRendererAnimationStateChange(
  state: RendererState,
  context: { shouldAnimate: boolean; prefersReducedMotion: boolean }
): void {
  clearAmbientTransitions(state.gridState);

  if (context.shouldAnimate && !context.prefersReducedMotion) {
    startActivity(state);
  } else {
    stopActivity(state);
  }

  if (state.gridState) {
    state.gridState.lastTimeStr = null;
  }
}

/** Display celebration message and start ambient activity around it. */
export function showCompletionMessageWithAmbient(state: RendererState, message: string): void {
  if (!state.gridState) return;

  const { boundingBox } = renderCelebrationText(state.gridState, message);
  state.gridState.digitBoundingBox = boundingBox;
  state.gridState.grid.setAttribute('data-celebration-phase', 'celebrated');

  if (shouldEnableAnimations(state.getAnimationState)) {
    updateAmbientSquaresForCelebration(state.gridState);
    startActivity(state);
  }
}

/** Start ambient activity for celebration mode (after wall animation completes). */
export function startCelebrationAmbient(state: RendererState): void {
  if (!state.gridState) return;

  if (shouldEnableAnimations(state.getAnimationState)) {
    updateAmbientSquaresForCelebration(state.gridState);
    startActivity(state);
  }
}

/** Start ambient activity for countdown mode (all squares eligible). */
export function startCountdownAmbient(state: RendererState): void {
  if (shouldEnableAnimations(state.getAnimationState)) {
    startActivity(state);
  }
}

/** Reset grid to clean counting state (clears wall, celebration text, ambient). */
export function resetToCounting(state: GridState): void {
  clearWall(state);
  clearCelebrationText(state);

  state.activeAmbient.clear();
  state.ambientSquares = [...state.squares];
  state.ambientSquaresDirty = false;
  state.digitBoundingBox = null;
  state.lastTimeStr = null;
}
/** Prepare for celebration animation (stops activity, creates abort controller). @returns Abort signal */
export function prepareCelebration(state: RendererState & { celebrationController: CelebrationController }): AbortSignal {
  abortCelebrationAnimation(state.celebrationController);
  return createCelebrationAbortSignal(state.celebrationController);
}

/** Execute animated celebration: build wall → show message → unbuild → resume activity. @returns Promise resolving when complete */
export async function executeAnimatedCelebration(
  state: RendererState & { completionMessage: string },
  message: string,
  signal: AbortSignal
): Promise<void> {
  if (!state.gridState) return;
  
  state.completionMessage = message;
  const currentGridState = state.gridState;

  await buildWall(currentGridState);
  if (signal.aborted || !currentGridState.grid.isConnected) return;

  stopActivity(state);

  const { messageIndices, boundingBox } = renderCelebrationText(currentGridState, message);
  currentGridState.digitBoundingBox = boundingBox;

  await unbuildWall(currentGridState, messageIndices);
  if (signal.aborted || !currentGridState.grid.isConnected) return;

  startCelebrationAmbient(state);
}

/** Clear all celebration visuals (prepare for static celebration state). */
export function clearCelebrationVisuals(state: GridState): void {
  clearWall(state);
  
  for (const square of state.squares) {
    if (square.isDigit) {
      square.isDigit = false;
      square.element.className = buildSquareClass(0);
    }
  }
}
/** Celebration animation controller. */
export interface CelebrationController {
  abortController: AbortController | null;
}

/** Create a new celebration controller. @returns New celebration controller */
export function createCelebrationController(): CelebrationController {
  return { abortController: null };
}

/** Abort any running celebration animation. */
export function abortCelebrationAnimation(controller: CelebrationController): void {
  if (controller.abortController) {
    controller.abortController.abort();
    controller.abortController = null;
  }
}

/** Create new abort controller for celebration animation. @returns Abort signal for new controller */
export function createCelebrationAbortSignal(controller: CelebrationController): AbortSignal {
  abortCelebrationAnimation(controller);
  controller.abortController = new AbortController();
  return controller.abortController.signal;
}

/** Destroy renderer state and cleanup all resources. @returns Promise resolving when cleanup complete */
export async function destroyRendererState(state: RendererState & {
  celebrationController: CelebrationController;
  resizeObserver: ResizeObserver | null;
  lastTime: unknown;
  periodicCleanupId: number | null;
}): Promise<void> {
  abortCelebrationAnimation(state.celebrationController);
  stopActivity(state);

  // Stop periodic cleanup
  if (state.periodicCleanupId !== null) {
    stopPeriodicCleanup(state.periodicCleanupId);
    state.periodicCleanupId = null;
  }

  if (state.gridState) {
    clearWall(state.gridState);
    clearCelebrationText(state.gridState);
  }

  if (state.resizeRafId !== null) {
    cancelAnimationFrame(state.resizeRafId);
    state.resizeRafId = null;
  }

  cancelAll(state.resourceTracker);

  if (state.container) {
    state.container.replaceChildren();
    state.container = null;
  }
  state.gridState = null;
  state.resizeObserver = null;
  state.lastTime = null;
}
