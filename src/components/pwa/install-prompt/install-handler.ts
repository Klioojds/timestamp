/** Install prompt event handler and installation logic. */

import { isInstalledPWA } from '@core/pwa/platform';

import type { BeforeInstallPromptEvent, InstallPromptState } from './types';
import { STORAGE_KEYS } from './types';

/** Minimum visits required before showing the prompt on iOS devices. */
const IOS_PROMPT_VISIT_THRESHOLD = 1;

/** Minimum visits required before showing the prompt on browsers with native prompts. */
const DEFAULT_PROMPT_VISIT_THRESHOLD = 2;

/** Get current install prompt state from localStorage. */
export function getPromptState(): InstallPromptState {
  const visitCount = parseInt(
    localStorage.getItem(STORAGE_KEYS.VISIT_COUNT) || '0',
    10
  );
  const dismissed = localStorage.getItem(STORAGE_KEYS.DISMISSED) === 'true';
  return { visible: false, dismissed, visitCount };
}

/** Increment visit count in localStorage. */
export function incrementVisitCount(): number {
  const state = getPromptState();
  const newCount = state.visitCount + 1;
  localStorage.setItem(STORAGE_KEYS.VISIT_COUNT, newCount.toString());
  return newCount;
}

export function markDismissed(): void {
  localStorage.setItem(STORAGE_KEYS.DISMISSED, 'true');
}

/**
 * Handle native install prompt flow.
 * @param deferredPrompt - The deferred install prompt event
 * @returns True if user accepted install
 */
export async function handleNativeInstall(
  deferredPrompt: BeforeInstallPromptEvent | null
): Promise<boolean> {
  if (!deferredPrompt) {
    return false;
  }

  // Show native install prompt
  await deferredPrompt.prompt();

  // Wait for user choice
  const { outcome } = await deferredPrompt.userChoice;

  if (import.meta.env.DEV) {
    if (outcome === 'accepted') {
      console.log('[PWA] User accepted install prompt');
    } else {
      console.log('[PWA] User dismissed install prompt');
    }
  }

  return outcome === 'accepted';
}

/**
 * Check if prompt should be shown based on current state.
 * @param iOS - Whether running on iOS platform
 * @returns True if prompt should be shown
 */
export function shouldShowPrompt(iOS: boolean): boolean {
  if (isInstalledPWA()) {
    return false;
  }

  const state = getPromptState();

  if (state.dismissed) {
    return false;
  }

  if (iOS) {
    return state.visitCount >= IOS_PROMPT_VISIT_THRESHOLD;
  }

  return state.visitCount >= DEFAULT_PROMPT_VISIT_THRESHOLD;
}

/**
 * Create handler for beforeinstallprompt event.
 * @param setDeferredPrompt - Callback to store deferred prompt
 * @param showPrompt - Callback to show the prompt
 * @returns Event handler function
 */
export function createBeforeInstallPromptHandler(
  setDeferredPrompt: (prompt: BeforeInstallPromptEvent) => void,
  showPrompt: () => void
): (event: Event) => void {
  return (event: Event) => {
    event.preventDefault();

    if (isInstalledPWA()) {
      return;
    }

    setDeferredPrompt(event as BeforeInstallPromptEvent);

    const state = getPromptState();
    if (!state.dismissed && state.visitCount >= DEFAULT_PROMPT_VISIT_THRESHOLD) {
      showPrompt();
    }
  };
}
