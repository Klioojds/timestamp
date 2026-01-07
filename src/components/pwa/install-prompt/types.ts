/** Install Prompt Types - shared type definitions for the install prompt component. */

import type { BeforeInstallPromptEvent, InstallPromptState } from '@app/pwa/types';

export type { BeforeInstallPromptEvent, InstallPromptState };

export interface InstallPromptController {
  /** Initialize the prompt and attach event listeners */
  init: () => void;
  /** Cleanup and remove event listeners */
  destroy: () => void;
  /** Get the prompt HTML element */
  getElement: () => HTMLElement;
  /** Show the install prompt */
  show: () => void;
  /** Hide the install prompt */
  hide: () => void;
}

export const STORAGE_KEYS = {
  VISIT_COUNT: 'pwa-install-visit-count',
  DISMISSED: 'pwa-install-dismissed',
} as const;
