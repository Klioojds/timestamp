/** PWA Module - Public API */

export type {
  BeforeInstallPromptEvent,
  InstallPromptState,
  PWARegistrationResult,
  UpdateCheckConfig,
} from './types';

import type { InstallPromptController } from '@components/pwa';

import type { UpdateManagerController } from './update-manager';
import type { UpdatePromptController } from './update-prompt';

let installPrompt: InstallPromptController | null = null;
let updatePrompt: UpdatePromptController | null = null;
let updateManager: UpdateManagerController | null = null;

const HOURLY_UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

/** Initializes PWA functionality (service worker, install prompt, update manager). @public */
export async function initPWA(): Promise<void> {
  const { registerServiceWorker } = await import('./registration');
  await registerServiceWorker();

  const { createInstallPrompt } = await import('@components/pwa');
  installPrompt = createInstallPrompt();
  document.body.appendChild(installPrompt.getElement());
  installPrompt.init();

  const { createUpdatePrompt } = await import('./update-prompt');
  updatePrompt = createUpdatePrompt();
  document.body.appendChild(updatePrompt.getElement());
  updatePrompt.init();

  const { createUpdateManager } = await import('./update-manager');
  updateManager = createUpdateManager({
    checkInterval: HOURLY_UPDATE_CHECK_INTERVAL_MS,
    autoReload: false,
  });
  updateManager.start();
}

/** Cleans up PWA resources. Safe to call multiple times. @public */
export function destroyPWA(): void {
  installPrompt?.destroy();
  installPrompt = null;
  updatePrompt?.destroy();
  updatePrompt = null;
  updateManager?.stop();
  updateManager = null;
}

