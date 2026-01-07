/**
 * Memory management utilities for long-running countdowns.
 *
 * Implements periodic cleanup strategies to prevent memory accumulation
 * over extended periods (days, weeks, months, years).
 */

import type { ResourceTracker } from '@themes/shared/types';

import type { GridState } from '../../types';

/**
 * Periodic cleanup configuration.
 * Lightweight cleanup for array pruning only - no grid reset needed.
 */
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Maximum size for callback tracking arrays.
 * Smaller = more aggressive cleanup = lower memory but risk cancelling active callbacks.
 * 20 timeout IDs is ~10 seconds of ambient activity at peak rate.
 */
const MAX_TIMEOUT_ENTRIES = 20;
const MAX_RAF_ENTRIES = 5;

/**
 * Perform aggressive cleanup on grid state to help garbage collection.
 * This runs periodically to ensure long-term memory stability for year-long countdowns.
 *
 * Cleanup strategy:
 * 1. Aggressively prune timeout/RAF tracking arrays (keep only recent entries)
 * 2. Rebuild ambient squares array to drop old references
 * 3. Clear animation state that may hold stale references
 *
 * Note: Grid reset is no longer needed - proper cleanup during resize handles GC.
 *
 * @param gridState - Current grid state
 * @param resourceTracker - Cleanup handles to prune
 */
function performPeriodicCleanup(
  gridState: GridState | null,
  resourceTracker: ResourceTracker
): void {
  if (!gridState) return;

  // AGGRESSIVE: Clear old timeout IDs - they've already fired, keeping them wastes memory
  // Timeout IDs are just numbers, but arrays grow unbounded without this
  if (resourceTracker.timeouts.length > MAX_TIMEOUT_ENTRIES) {
    resourceTracker.timeouts = resourceTracker.timeouts.slice(-MAX_TIMEOUT_ENTRIES);
  }

  // Clear RAF array similarly
  if (resourceTracker.rafs.length > MAX_RAF_ENTRIES) {
    resourceTracker.rafs = resourceTracker.rafs.slice(-MAX_RAF_ENTRIES);
  }

  // Clear intervals array of any stale entries (keep only active ones)
  // Intervals don't accumulate like timeouts, but defensive cleanup
  if (resourceTracker.intervals.length > 5) {
    resourceTracker.intervals = resourceTracker.intervals.slice(-5);
  }

  // Rebuild ambient squares array from scratch to drop any accumulated references
  // This ensures we don't keep references to old Square objects
  gridState.ambientSquares = gridState.squares.filter(
    (s) => !s.isDigit &&
           !s.element.classList.contains('is-wall') &&
           !s.element.classList.contains('is-message')
  );
  gridState.ambientSquaresDirty = false;

  // Clear activeAmbient of any squares that shouldn't be there
  // This prevents accumulation of Square references
  for (const square of gridState.activeAmbient) {
    if (square.isDigit || 
        square.element.classList.contains('is-wall') ||
        square.element.classList.contains('is-message')) {
      gridState.activeAmbient.delete(square);
      gridState.animatingSquares.delete(square);
    }
  }

  // Reset cached state to flush render pipeline
  gridState.lastTimeStr = null;
  gridState.lastDigitIndices.clear();
  
  // Clear digitBoundingBox to force recalculation (prevents stale box accumulation)
  gridState.digitBoundingBox = null;
}

/**
 * Start periodic memory cleanup for long-running countdowns (runs every 5 minutes).
 *
 * @param gridState - Grid state to clean
 * @param resourceTracker - Cleanup handles to manage
 * @returns Interval ID for stopping cleanup
 */
export function startPeriodicCleanup(
  gridState: GridState | null,
  resourceTracker: ResourceTracker
): number {
  const intervalId = window.setInterval(() => {
    performPeriodicCleanup(gridState, resourceTracker);
  }, CLEANUP_INTERVAL_MS);

  // Track in cleanup handles so it gets cleared on destroy
  resourceTracker.intervals.push(intervalId);

  return intervalId;
}

/**
 * Stop periodic cleanup interval.
 *
 * @param intervalId - Interval ID to clear
 */
export function stopPeriodicCleanup(intervalId: number | null): void {
  if (intervalId !== null) {
    clearInterval(intervalId);
  }
}
