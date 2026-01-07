/** Install Prompt - PWA install prompt with platform-specific instructions. */

import { createDialog, createOverlay, isIOS } from './dom-builders';
import {
  createBeforeInstallPromptHandler,
  handleNativeInstall,
  incrementVisitCount,
  markDismissed,
  shouldShowPrompt,
} from './install-handler';
import { createLifecycleController, type LifecycleController } from './lifecycle';
import type { BeforeInstallPromptEvent, InstallPromptController } from './types';

export type { InstallPromptController } from './types';

/**
 * Create an install prompt. Shows on 2nd+ visit if not dismissed.
 * @returns Controller for managing the prompt
 */
export function createInstallPrompt(): InstallPromptController {
  let deferredPrompt: BeforeInstallPromptEvent | null = null;
  const iOS = isIOS();

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  const overlay = createOverlay(prefersReducedMotion);
  const dialog = createDialog(prefersReducedMotion, iOS);
  overlay.appendChild(dialog);

  const lifecycle: LifecycleController = createLifecycleController({
    overlay,
    dialog,
    onDismiss: handleDismissClick,
  });

  const dismissButton = dialog.querySelector(
    '.install-prompt-secondary'
  ) as HTMLButtonElement;
  const installButton = dialog.querySelector(
    '.install-prompt-primary'
  ) as HTMLButtonElement | null;

  dismissButton?.addEventListener('click', handleDismissClick);
  installButton?.addEventListener('click', handleInstallClick);
  overlay.addEventListener('click', (event: MouseEvent) => {
    if (event.target === overlay) {
      handleDismissClick();
    }
  });

  async function handleInstallClick(): Promise<void> {
    await handleNativeInstall(deferredPrompt);
    deferredPrompt = null;
    lifecycle.hide();
  }

  function handleDismissClick(): void {
    markDismissed();
    lifecycle.hide();
  }

  function checkShowOnLoad(): void {
    incrementVisitCount();
    if (iOS && shouldShowPrompt(iOS)) {
      lifecycle.show();
    }
  }

  const beforeInstallPromptHandler = createBeforeInstallPromptHandler(
    (prompt) => {
      deferredPrompt = prompt;
    },
    () => lifecycle.show()
  );

  return {
    init(): void {
      window.addEventListener('beforeinstallprompt', beforeInstallPromptHandler);
      checkShowOnLoad();
    },

    destroy(): void {
      window.removeEventListener(
        'beforeinstallprompt',
        beforeInstallPromptHandler
      );
      lifecycle.destroy();
      overlay.remove();
      deferredPrompt = null;
    },

    getElement(): HTMLElement {
      return overlay;
    },

    show(): void {
      lifecycle.show();
    },

    hide(): void {
      lifecycle.hide();
    },
  };
}
