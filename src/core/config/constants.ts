/** Core Application Constants */

/** Maximum timer duration: 365 days in seconds (31,536,000). @public */
export const MAX_DURATION_SECONDS = 31_536_000;

/** Default message shown when countdown completes. @public */
export const DEFAULT_COMPLETION_MESSAGE = "Time's up!";

/** CSS selector for focusable elements (used by focus preservation during theme switching). @public */
export const FOCUSABLE_SELECTOR =
  'button:not([disabled]):not([tabindex="-1"]), [href]:not([tabindex="-1"]), input:not([disabled]):not([tabindex="-1"]), select:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])';
