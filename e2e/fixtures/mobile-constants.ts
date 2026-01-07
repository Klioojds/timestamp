/**
 * @file mobile-constants.ts
 * @description Shared constants and URLs for mobile responsive E2E tests
 */

/** Mobile viewport dimensions (iPhone SE/8) */
export const MOBILE_VIEWPORT = { width: 375, height: 667 };

/** Small mobile viewport dimensions (iPhone 5/SE gen1) */
export const SMALL_MOBILE_VIEWPORT = { width: 320, height: 568 };

/** Tablet viewport dimensions (iPad portrait) */
export const TABLET_VIEWPORT = { width: 768, height: 1024 };

/** Desktop viewport dimensions */
export const DESKTOP_VIEWPORT = { width: 1440, height: 900 };

// Valid deep link URLs for testing different modes
/** Date mode (default): includes timezone selector and world map */
export const TEST_URL = '/?theme=contribution-graph&mode=wall-clock&target=2099-01-01T00:00:00';

/** Fireworks theme test URL */
export const FIREWORKS_TEST_URL = '/?theme=fireworks&mode=wall-clock&target=2099-01-01T00:00:00';

/** Timer mode: no timezone selector or world map */
export const TIMER_TEST_URL = '/?mode=timer&duration=300';
