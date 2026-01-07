/** Offline indicator shows connection status. Auto-hides 3 seconds after coming online. */

import '../../styles/components/countdown-ui.css';

import { createIcon } from '@core/utils/dom';
import { cloneTemplate } from '@core/utils/dom/template-utils';

export interface OfflineIndicatorController {
  /** Initialize the indicator and attach event listeners */
  init: () => void;
  /** Cleanup and remove event listeners */
  destroy: () => void;
  /** Get the indicator HTML element */
  getElement: () => HTMLElement;
}

const INDICATOR_ICON_SIZE = 16;
const ONLINE_LABEL = 'Online';
const OFFLINE_LABEL = 'Offline';

/** Duration in ms to show "Online" message before auto-hiding */
const ONLINE_HIDE_DELAY_MS = 3000;

/**
 * Create an offline indicator from template.
 * @returns Controller for managing the indicator
 */
export function createOfflineIndicator(): OfflineIndicatorController {
  const container = cloneTemplate<HTMLElement>('offline-indicator-template');

  const iconWrapper = container.querySelector('.offline-indicator__icon') as HTMLSpanElement;
  const message = container.querySelector('span:not([aria-hidden])') as HTMLSpanElement;

  const offlineIcon = createIcon({
    name: 'cloud-offline',
    size: INDICATOR_ICON_SIZE as 16,
  });
  const onlineIcon = createIcon({
    name: 'cloud',
    size: INDICATOR_ICON_SIZE as 16,
  });

  let isVisible = false;
  let hideTimeoutId: number | null = null;

  function updateStatus(): void {
    const isOnline = navigator.onLine;

    if (hideTimeoutId !== null) {
      clearTimeout(hideTimeoutId);
      hideTimeoutId = null;
    }

    if (!isOnline) {
      iconWrapper.replaceChildren(offlineIcon.cloneNode(true));
      message.textContent = OFFLINE_LABEL;
      container.className = 'offline-indicator offline-indicator--offline';
      isVisible = true;
      return;
    }

    if (!isVisible) {
      return;
    }

    iconWrapper.replaceChildren(onlineIcon.cloneNode(true));
    message.textContent = ONLINE_LABEL;
    container.className = 'offline-indicator offline-indicator--online';

    hideTimeoutId = window.setTimeout(() => {
      container.className = 'offline-indicator';
      isVisible = false;
      hideTimeoutId = null;
    }, ONLINE_HIDE_DELAY_MS);
  }

  return {
    init(): void {
      updateStatus();
      window.addEventListener('online', updateStatus);
      window.addEventListener('offline', updateStatus);
    },

    destroy(): void {
      if (hideTimeoutId !== null) {
        clearTimeout(hideTimeoutId);
        hideTimeoutId = null;
      }

      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
      container.remove();
    },

    getElement(): HTMLElement {
      return container;
    },
  };
}
