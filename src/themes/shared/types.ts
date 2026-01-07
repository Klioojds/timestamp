/**
 * Shared theme-facing types re-exported from core.
 * Keeps theme packages decoupled from core implementation details.
 *
 * Theme authors should import ALL types from this file (`@themes/shared/types`)
 * rather than directly from `@core/types`.
 */

export type { StateWithResourceTracker } from '@/core/resource-tracking';
export type {
  AnimationStateChangeReason,
  AnimationStateContext,
  AnimationStateGetter,
  CelebrationOptions,
  LandingPageRenderer,
  MountContext,
  ResourceTracker,
  ThemeConfig,
  ThemeId,
  TimePageRenderer,
  TimeRemaining,
} from '@core/types';
