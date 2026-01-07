/**
 * Timer controls - play/pause/reset functionality for timer mode.
 * Consolidates all timer-specific control logic.
 */
import type { StateManager } from '@core/state';
import type { CountdownMode, TimePageRenderer } from '@core/types';

import type { UIComponents } from '../ui/ui-factory';
import type { TimeLoop } from './tick-scheduler';

/** Timer control dependencies. */
export interface TimerControlDependencies {
  mode: CountdownMode;
  originalDurationMs: number | null;
  timeLoop: TimeLoop | null;
  stateManager: StateManager;
  container: HTMLElement;
  uiComponents: UIComponents | null;
  currentTheme: TimePageRenderer | null;
  getTargetDate: () => Date;
  updateTargetDate: (nextDate: Date) => void;
}

/**
 * Handles timer play/pause toggle (timer mode only).
 * When pausing, stores remaining time. When resuming, recalculates target date.
 */
export function handlePlayPause(
  isPlaying: boolean,
  deps: Pick<TimerControlDependencies, 'mode' | 'timeLoop' | 'updateTargetDate'>
): void {
  const { mode, timeLoop, updateTargetDate } = deps;
  if (!timeLoop || mode !== 'timer') return;

  if (isPlaying) {
    // Resuming: recalculate target date based on paused remaining time
    const pausedMs = timeLoop.getPausedRemainingMs();
    if (pausedMs !== null && pausedMs > 0) {
      updateTargetDate(new Date(Date.now() + pausedMs));
    }
    timeLoop.resume();
  } else {
    // Pausing: TimeLoop stores remaining time internally
    timeLoop.pause();
  }
}

/**
 * Handles timer reset (timer mode only).
 * Resets countdown to original duration while preserving play/pause state.
 * Always provides immediate visual feedback.
 */
export function handleReset(deps: TimerControlDependencies): void {
  const {
    mode,
    originalDurationMs,
    timeLoop,
    stateManager,
    container,
    uiComponents,
    currentTheme,
    updateTargetDate,
  } = deps;

  if (!timeLoop || mode !== 'timer' || originalDurationMs === null) return;

  const wasPaused = timeLoop.isPaused();
  const wasCelebrating = stateManager.getCelebrationState() !== 'counting';

  // Calculate new target date from original duration
  updateTargetDate(new Date(Date.now() + originalDurationMs));

  // If timer was celebrating, reset to counting state
  if (wasCelebrating) {
    stateManager.resetCelebration();
    stateManager.setComplete(false);
    container.removeAttribute('data-celebrating');

    // Ensure timer controls show playing state after reset from celebration
    uiComponents?.timerControls?.setPlaying(true);

    // Reset any theme-specific celebration UI
    currentTheme?.onCounting?.();

    // Restart the loop if it was stopped due to celebration
    if (!timeLoop.isRunning()) {
      timeLoop.start();
    }
  }

  // Normal reset (not from celebration)
  if (!wasCelebrating && wasPaused) {
    // Update the paused remaining time to the original duration
    timeLoop.setPausedRemainingMs(originalDurationMs);
  }

  // Always force display update for immediate visual feedback
  timeLoop.forceUpdate();
}
