/**
 * Shared constants for the World Map component set.
 */

/** Intersection observer threshold for visibility detection (1% visible). */
export const VISIBILITY_THRESHOLD = 0.01;

/** Interval for checking celebration state changes (ms). Fast polling for real-time updates. */
export const CELEBRATION_POLL_INTERVAL_MS = 1000;

/** Default interval for updating the solar terminator overlay (ms). One minute for visual accuracy. */
export const DEFAULT_TERMINATOR_UPDATE_MS = 60000;

/** Delay before clearing live-region announcements (ms). Prevents screen reader re-announcements. */
export const ANNOUNCEMENT_CLEAR_DELAY_MS = 5000;
