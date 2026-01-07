/** Share Control Factory - Creates share menu (wall-clock) or simple button (timer/absolute) based on mode. */

import { getModeConfig } from '@core/config/mode-config';

import { createSimpleShareButton } from './share-button';
import { createShareMenu } from './share-menu';
import type { ShareController, ShareControlOptions } from './types';

/**
 * Create share control based on countdown mode (menu for wall-clock, button for timer/absolute).
 * @returns Controller with getElement and destroy methods
 */
export function createShareControl(options: ShareControlOptions): ShareController {
  const { mode, getShareTargets, onCopy } = options;
  const config = getModeConfig(mode);
  
  if (config.isWallClock) {
    return createShareMenu({ getShareTargets, onCopy });
  }
  
  return createSimpleShareButton({
    getShareTargets,
    onCopy: onCopy ? (url) => onCopy(url, 'withSelectedTimezone') : undefined,
  });
}
