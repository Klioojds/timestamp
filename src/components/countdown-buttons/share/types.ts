/** Type definitions for share button/menu components. */

import type { CountdownMode } from '@core/types';
import type { ShareTargets } from '@core/url';

export type { ShareTargets } from '@core/url';

/** Controller interface for share components. */
export interface ShareController {
  getElement(): HTMLElement;
  destroy(): void;
}

/** Share target type for callback identification. */
export type ShareTargetType = 'withSelectedTimezone' | 'withLocalTimezone' | 'withoutTimezone';

/** Function that returns current share URLs (called on-demand). */
export type ShareTargetsGetter = () => ShareTargets;

/** Options for creating a share control. */
export interface ShareControlOptions {
  /** Countdown mode - wall-clock shows menu, timer/absolute show button */
  mode: CountdownMode;
  /** Function to get current share URLs (called on-demand when user clicks) */
  getShareTargets: ShareTargetsGetter;
  /** Optional callback when a link is copied */
  onCopy?: (url: string, type: ShareTargetType) => void;
}
