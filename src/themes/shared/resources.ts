/**
 * Shared Cleanup Utilities
 * Re-exports from \@core/utils/cleanup for theme convenience.
 */

export type { ResourceTracker, StateWithResourceTracker } from '@/core/resource-tracking';
export {
    cancelAll,
    cancelCallbacks,
    cancelTimeout,
    createResourceTracker,
    debounceTimeout,
    getTrackedTimerCount,
    safeRequestAnimationFrame,
    safeSetInterval,
    safeSetTimeout,
    scheduleSafeTimeout,
    trackListener,
    trackObserver
} from '@/core/resource-tracking';

