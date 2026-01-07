/**
 * Cleanup Utilities
 * Resource cleanup helpers for managing timers, intervals, and other async operations.
 * Prevents memory leaks by tracking and bulk-canceling resources.
 */

/** Cleanup handles for tracking disposable resources. */
export interface ResourceTracker {
  /** Active setInterval IDs */
  intervals: number[];
  /** Active setTimeout IDs */
  timeouts: number[];
  /** Active requestAnimationFrame IDs */
  rafs: number[];
  /** Active observers (ResizeObserver, IntersectionObserver, etc.) */
  observers: Array<{ disconnect: () => void }>;
  /** Active event listeners with cleanup */
  listeners: Array<{ remove: () => void }>;
}

/** DEV-only timer registry for debugging */
const __DEV__ = process.env.NODE_ENV !== 'production';
let trackedTimerCount = 0;

type TimerScheduler = (handler: () => void, delay: number) => number;

const TIMER_ERROR_PREFIX = '[safeTimer] Callback error:';

const incrementActiveTimers = (): void => {
  if (__DEV__) {
    trackedTimerCount++;
  }
};

const createSafeTimer = (
  scheduleTimer: TimerScheduler,
  targetCollection: number[],
  callback: () => void,
  delayMs: number,
  label: string
): number => {
  const timerId = scheduleTimer(() => {
    try {
      callback();
    } catch (error) {
      console.error(label ? `[${label}] Callback error:` : TIMER_ERROR_PREFIX, error);
    }
  }, delayMs);

  targetCollection.push(timerId);
  incrementActiveTimers();
  return timerId;
};

/**
 * Create an empty ResourceTracker object.
 * @public
 */
export function createResourceTracker(): ResourceTracker {
  return {
    intervals: [],
    timeouts: [],
    rafs: [],
    observers: [],
    listeners: [],
  };
}

/**
 * Reset and clear all cleanup tracker.
 * Call this during component/theme destruction to prevent memory leaks.
 *
 * @param handles - The ResourceTracker object to reset
 * @public
 */
export function cancelAll(tracker: ResourceTracker): void {
  tracker.intervals.forEach((id) => clearInterval(id));
  tracker.timeouts.forEach((id) => clearTimeout(id));
  tracker.rafs.forEach((id) => cancelAnimationFrame(id));
  tracker.observers.forEach((observer) => observer.disconnect());
  tracker.listeners.forEach((listener) => listener.remove());

  // Update DEV timer count
  if (__DEV__) {
    trackedTimerCount -= tracker.intervals.length + tracker.timeouts.length;
    if (trackedTimerCount < 0) trackedTimerCount = 0; // Safety clamp
  }

  tracker.intervals = [];
  tracker.timeouts = [];
  tracker.rafs = [];
  tracker.observers = [];
  tracker.listeners = [];
}

/**
 * Cancel pending JavaScript callbacks (setInterval, setTimeout, requestAnimationFrame).
 * Preserves observers and listeners - use during grid rebuild to cancel old callbacks
 * while keeping resize observer and event listeners active.
 *
 * @param handles - The ResourceTracker object to partially reset
 * @public
 */
export function cancelCallbacks(tracker: ResourceTracker): void {
  tracker.intervals.forEach((id) => clearInterval(id));
  tracker.timeouts.forEach((id) => clearTimeout(id));
  tracker.rafs.forEach((id) => cancelAnimationFrame(id));

  // Update DEV timer count
  if (__DEV__) {
    trackedTimerCount -= tracker.intervals.length + tracker.timeouts.length;
    if (trackedTimerCount < 0) trackedTimerCount = 0; // Safety clamp
  }

  tracker.intervals = [];
  tracker.timeouts = [];
  tracker.rafs = [];
  // Keep observers and listeners intact!
}

/**
 * Create an interval with automatic cleanup tracking and error handling.
 *
 * @param callback - Function to execute
 * @param intervalMs - Interval in milliseconds
 * @param handles - ResourceTracker to register with
 * @returns Interval ID
 * @public
 */
export function safeSetInterval(
  callback: () => void,
  intervalMs: number,
  tracker: ResourceTracker
): number {
  return createSafeTimer(window.setInterval, tracker.intervals, callback, intervalMs, 'safeSetInterval');
}

/**
 * Create a timeout with automatic cleanup tracking and error handling.
 *
 * @param callback - Function to execute
 * @param delayMs - Delay in milliseconds
 * @param handles - ResourceTracker to register with
 * @returns Timeout ID
 * @public
 */
export function safeSetTimeout(
  callback: () => void,
  delayMs: number,
  tracker: ResourceTracker
): number {
  return createSafeTimer(window.setTimeout, tracker.timeouts, callback, delayMs, 'safeSetTimeout');
}

/**
 * Get count of tracked timers (DEV only).
 * Useful for debugging and testing cleanup verification.
 *
 * @returns Tracked timer count or -1 in production
 * 
 * @internal Used only for testing cleanup behavior
 */
export function getTrackedTimerCount(): number {
  return __DEV__ ? trackedTimerCount : -1;
}

/**
 * Schedule a requestAnimationFrame with cleanup tracking.
 *
 * @param callback - RAF callback
 * @param handles - ResourceTracker to register with
 * @returns RAF ID
 * @public
 */
export function safeRequestAnimationFrame(
  callback: (timestamp: number) => void,
  tracker: ResourceTracker
): number {
  const rafId = requestAnimationFrame(callback);
  tracker.rafs.push(rafId);
  return rafId;
}

/**
 * Track an observer for cleanup (ResizeObserver, IntersectionObserver, MutationObserver).
 *
 * @param observer - Observer instance
 * @param handles - ResourceTracker to register with
 * @public
 */
export function trackObserver(
  observer: { disconnect: () => void },
  tracker: ResourceTracker
): void {
  tracker.observers.push(observer);
}

/**
 * Track an event listener for cleanup.
 *
 * @param remove - Cleanup function that removes the listener
 * @param handles - ResourceTracker to register with
 * @public
 */
export function trackListener(
  remove: () => void,
  tracker: ResourceTracker
): void {
  tracker.listeners.push({ remove });
}

/**
 * Type constraint for state objects with cleanup tracker.
 * Use with generic functions that need cleanup capabilities.
 * @public
 */
export interface StateWithResourceTracker {
  resourceTracker: ResourceTracker;
}

/**
 * Cancel a specific timeout and clear it from tracker.
 * Returns the new timeout ID if a new one is scheduled.
 *
 * @param timeoutId - Timeout ID to cancel
 * @param handles - ResourceTracker containing the timeout
 * @returns null (for assignment pattern)
 * @public
 */
export function cancelTimeout(
  timeoutId: number | null,
  tracker: ResourceTracker
): null {
  if (timeoutId !== null) {
    clearTimeout(timeoutId);
    const index = tracker.timeouts.indexOf(timeoutId);
    if (index !== -1) tracker.timeouts.splice(index, 1);
  }
  return null;
}

/**
 * Replace a timeout: cancel previous, schedule new.
 * Common pattern for debouncing/throttling.
 *
 * @param previousId - Previous timeout ID to cancel
 * @param callback - New callback to schedule
 * @param delayMs - Delay in milliseconds
 * @param handles - ResourceTracker to register with
 * @returns New timeout ID
 * @public
 */
export function debounceTimeout(
  previousId: number | null,
  callback: () => void,
  delayMs: number,
  tracker: ResourceTracker
): number {
  if (previousId !== null) {
    clearTimeout(previousId);
    const index = tracker.timeouts.indexOf(previousId);
    if (index !== -1) tracker.timeouts.splice(index, 1);
  }
  return safeSetTimeout(callback, delayMs, tracker);
}

/**
 * Schedule a timeout using state's cleanup tracker.
 * Convenience wrapper for components with state.resourceTracker.
 *
 * @param state - State object with resourceTracker property
 * @param callback - Function to execute
 * @param delayMs - Delay in milliseconds
 * @returns Timeout ID
 * @public
 */
export function scheduleSafeTimeout<T extends StateWithResourceTracker>(
  state: T,
  callback: () => void,
  delayMs: number
): number {
  return safeSetTimeout(callback, delayMs, state.resourceTracker);
}
