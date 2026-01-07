/**
 * Time Loop Manager - interval scheduling and tick events.
 */

import { getTimeRemaining } from '@core/time/time';
import type { TimeRemaining } from '@core/types';

/** Time loop configuration. */
export interface TimeLoopOptions {
  getTargetDate: () => Date;
  onTick: (time: TimeRemaining) => void;
  onComplete: () => void;
  isComplete: () => boolean;
  tickInterval?: number;
}

/** Time loop controller interface. */
export interface TimeLoop {
  start(): void;
  stop(): void;
  /** Stores remaining time to avoid drift on resume. */
  pause(): void;
  resume(): void;
  isPaused(): boolean;
  tick(): void;
  isRunning(): boolean;
  getLastTime(): TimeRemaining | null;
  /** Returns null if not paused or never paused. */
  getPausedRemainingMs(): number | null;
  /** Only updates if currently paused. */
  setPausedRemainingMs(ms: number): void;
  /** Force display update after reset for immediate visual feedback. */
  forceUpdate(): void;
}

/** Default tick interval in milliseconds */
const DEFAULT_TICK_INTERVAL = 1000;

/** Creates a time loop manager. */
export function createTimeLoop(options: TimeLoopOptions): TimeLoop {
  const {
    getTargetDate,
    onTick,
    onComplete,
    isComplete,
    tickInterval = DEFAULT_TICK_INTERVAL,
  } = options;

  let intervalId: number | null = null;
  let lastTime: TimeRemaining | null = null;
  let paused = false;
  let pausedRemainingMs: number | null = null;

  function scheduleInterval(): void {
    if (intervalId === null) {
      intervalId = window.setInterval(processTick, tickInterval);
    }
  }

  function clearScheduledInterval(): void {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function processTick(): void {
    // Skip processing if already complete or paused
    if (isComplete() || paused) {
      return;
    }

    const time = getTimeRemaining(getTargetDate());
    lastTime = time;

    // Check for completion (only if not already complete from state)
    if (time.total <= 0 && !isComplete()) {
      onComplete();
      return;
    }

    // Normal tick - update display
    onTick(time);
  }

  return {
    start(): void {
      // Don't start if already running
      if (intervalId !== null) {
        return;
      }

      // Initial tick immediately
      processTick();

      // Start interval for subsequent ticks
      scheduleInterval();
    },

    stop(): void {
      clearScheduledInterval();
    },

    pause(): void {
      if (paused || isComplete()) {
        return;
      }
      
      // Store remaining time to avoid drift on resume
      const time = getTimeRemaining(getTargetDate());
      pausedRemainingMs = time.total;
      paused = true;
      
      // Stop the interval but keep paused state
      clearScheduledInterval();
    },

    resume(): void {
      if (!paused) {
        return;
      }
      
      paused = false;
      // Note: The caller (orchestrator) is responsible for updating the target date
      // based on pausedRemainingMs before calling resume.
      
      // Restart the interval
      processTick();
      scheduleInterval();
    },

    isPaused(): boolean {
      return paused;
    },

    tick(): void {
      processTick();
    },

    isRunning(): boolean {
      return intervalId !== null;
    },

    getLastTime(): TimeRemaining | null {
      return lastTime;
    },

    getPausedRemainingMs(): number | null {
      return pausedRemainingMs;
    },

    setPausedRemainingMs(ms: number): void {
      if (paused) {
        pausedRemainingMs = ms;
      }
    },

    forceUpdate(): void {
      // When paused, use stored remaining time to avoid drift
      // Otherwise calculate from target date
      const time = paused && pausedRemainingMs !== null
        ? getTimeRemaining(new Date(Date.now() + pausedRemainingMs))
        : getTimeRemaining(getTargetDate());
      lastTime = time;
      onTick(time);
    },
  };
}
