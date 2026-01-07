/**
 * Shared Theme Utilities
 * Barrel export for shared theme utilities.
 *
 * Theme authors should import types from `@themes/shared/types` and utilities from `@themes/shared`.
 * This keeps themes decoupled from core implementation details.
 */

export { DEFAULT_ANIMATION_STATE, shouldEnableAnimations } from './animation-state';
export { setHiddenIfChanged, setTextIfChanged } from './dom-guards';
export type {
  AnimationStateContext,
  CelebrationOptions,
  LandingPageRenderer,
  MountContext,
  ResourceTracker,
  StateWithResourceTracker,
  ThemeConfig,
  TimePageRenderer,
  TimeRemaining,
} from './types';
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
  trackObserver,
} from '@/core/resource-tracking';