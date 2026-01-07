/**
 * Time page renderer state and lifecycle management.
 *
 * Extends base renderer state with time page-specific functionality:
 * - Activity phase tracking
 * - Celebration controller
 * - Resize handling with RAF throttling
 * - Completion message storage
 */

import { cancelCallbacks, shouldEnableAnimations } from '@themes/shared';
import type {
  MountContext,
  TimeRemaining,
} from '@themes/shared/types';

import { getActivityPhase } from '../../../config';
import { calculateGridDimensions, formatCountdown } from '../../grid';
import {
  type CelebrationController,
  createCelebrationController,
  showCompletionMessageWithAmbient,
  startCountdownAmbient,
  stopActivity,
} from '../animation';
import { createGrid } from '../grid-builder';
import { startPeriodicCleanup } from '../memory-management';
import { renderDigits } from '../text-rendering';
import {
  type BaseRendererState,
  createBaseRendererState,
  updateRendererContainer as baseUpdateRendererContainer,
} from './base-renderer-state';

/**
 * Time page renderer state.
 * Extends base state with time page-specific fields.
 */
export interface TimePageRendererState extends BaseRendererState {
  /** Resize observer for viewport changes. */
  resizeObserver: ResizeObserver | null;
  /** Last rendered time for change detection. */
  lastTime: TimeRemaining | null;
  /** Celebration animation controller. */
  celebrationController: CelebrationController;
  /** Message to display during celebration. */
  completionMessage: string;
}

/**
 * Create initial time page renderer state.
 *
 * @returns Fresh time page renderer state
 * @internal
 */
export function createTimePageRendererState(): TimePageRendererState {
  return {
    ...createBaseRendererState(),
    resizeObserver: null,
    lastTime: null,
    celebrationController: createCelebrationController(),
    completionMessage: '',
  };
}

/**
 * Update activity phase if time remaining crosses a phase boundary.
 * Phase determines ambient square frequency (calm, growing, urgent, critical).
 *
 * @param state - Time page renderer state
 * @param time - Current time remaining
 * @internal
 */
export function updateActivityPhase(state: TimePageRendererState, time: TimeRemaining): void {
  const newPhase = getActivityPhase(time.total);
  if (newPhase !== state.loopState.currentPhase) {
    state.loopState.currentPhase = newPhase;
  }
}

/**
 * Update container reference when DOM element moves.
 * Re-export from base with time page specific type.
 * @internal
 */
export function updateRendererContainer(state: TimePageRendererState, newContainer: HTMLElement): void {
  baseUpdateRendererContainer(state, newContainer);
}

/**
 * Handle viewport resize.
 * Rebuilds grid when dimensions change and restores state.
 *
 * @param state - Time page renderer state
 */
export function handleResize(state: TimePageRendererState): void {
  if (!state.container || !state.gridState) return;

  const { cols: newCols, rows: newRows } = calculateGridDimensions(
    window.innerWidth,
    window.innerHeight
  );

  // Only rebuild if dimensions actually changed
  if (newCols === state.gridState.cols && newRows === state.gridState.rows) return;

  const celebrationPhase = state.gridState.grid.getAttribute('data-celebration-phase');
  const isInCelebration =
    celebrationPhase === 'celebrated' || celebrationPhase === 'wall-complete';

  // CRITICAL: Stop loop before grid rebuild (holds closure over old gridState)
  stopActivity(state);

  // CRITICAL: Cancel pending callbacks to release old square references (preserve ResizeObserver)
  cancelCallbacks(state.resourceTracker);

  const existingGrid = state.container.querySelector('.contribution-graph-grid');
  if (existingGrid) existingGrid.remove();

  // NOTE: Fresh grid state forces GC of old squares
  state.gridState = createGrid(state.container);

  if (isInCelebration) {
    showCompletionMessageWithAmbient(state, state.completionMessage);
  } else if (state.lastTime) {
    const shouldPulse = shouldEnableAnimations(state.getAnimationState);
    const lines = formatCountdown(
      state.lastTime.days,
      state.lastTime.hours,
      state.lastTime.minutes,
      state.lastTime.seconds,
      state.gridState.cols
    );
    renderDigits(state.gridState, lines, shouldPulse);
    startCountdownAmbient(state);
  } else {
    // NOTE: Start ambient even without lastTime (visual continuity during resize)
    startCountdownAmbient(state);
  }
}

/**
 * Setup resize observer with RAF throttling.
 *
 * @param state - Time page renderer state
 */
function setupResizeObserver(state: TimePageRendererState): void {
  if (!state.container) return;

  state.resizeObserver = new ResizeObserver(() => {
    if (state.resizeRafId !== null) return;
    state.resizeRafId = requestAnimationFrame(() => {
      state.resizeRafId = null;
      handleResize(state);
    });
  });

  state.resizeObserver.observe(state.container);
  state.resourceTracker.observers.push(state.resizeObserver);
}

/**
 * Setup renderer mount (container, grid, resize observer).
 *
 * @param state - Time page renderer state
 * @param targetContainer - Container element to mount into
 * @param context - Optional mount context with animation state getter
 * @internal
 */
export function setupRendererMount(
  state: TimePageRendererState,
  targetContainer: HTMLElement,
  context?: MountContext
): void {
  state.container = targetContainer;
  state.container.setAttribute('data-testid', 'theme-container');

  if (context?.getAnimationState) {
    state.getAnimationState = context.getAnimationState;
  }

  state.gridState = createGrid(state.container);
  setupResizeObserver(state);
  
  // Start periodic memory cleanup for long-running countdowns
  state.periodicCleanupId = startPeriodicCleanup(state.gridState, state.resourceTracker);
}
