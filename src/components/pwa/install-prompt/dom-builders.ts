/** DOM builders for the install prompt dialog. */

import { cloneTemplate } from '@core/utils/dom/template-utils';

/** Detect iOS devices (iPad/iPhone/iPod, excludes Windows Phone). */
export function isIOS(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as unknown as { MSStream?: unknown }).MSStream
  );
}

function applyReducedMotionFlag(element: HTMLElement, reducedMotion: boolean): void {
  if (reducedMotion) {
    element.setAttribute('data-reduced-motion', 'true');
  }
}

/** @internal Create overlay element. */
export function createOverlay(reducedMotion: boolean): HTMLElement {
  const overlay = document.createElement('div');
  overlay.className = 'install-prompt-overlay';
  overlay.hidden = true;

  applyReducedMotionFlag(overlay, reducedMotion);

  return overlay;
}

/** @internal Create dialog element from template. */
export function createDialog(reducedMotion: boolean, iOS: boolean): HTMLElement {
  const dialog = cloneTemplate<HTMLElement>('pwa-install-dialog-template');

  applyReducedMotionFlag(dialog, reducedMotion);

  // Set description content based on platform
  const description = dialog.querySelector('#install-prompt-description') as HTMLElement;
  if (iOS) {
    description.innerHTML = `
      To install this app on your iOS device:
      <ol>
        <li>Tap the Share button <span aria-label="share icon" class="share-icon">⎙</span> at the bottom of the screen</li>
        <li>Scroll down and tap <strong>Add to Home Screen</strong></li>
        <li>Tap <strong>Add</strong> to confirm</li>
      </ol>
      This enables offline access and a full-screen experience.
    `;
  } else {
    description.textContent =
      'Install this app on your device for offline access. You can launch it from your home screen just like any other app.';
  }

  // Add buttons to container
  const buttonContainer = dialog.querySelector('.install-prompt-button-container') as HTMLElement;
  const dismissButton = createDismissButton(iOS);
  buttonContainer.appendChild(dismissButton);

  if (!iOS) {
    const installButton = createInstallButton();
    buttonContainer.appendChild(installButton);
  }

  return dialog;
}

export function createInstallButton(): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'Install';
  button.className = 'install-prompt-button install-prompt-primary';
  button.tabIndex = 0;
  return button;
}

export function createDismissButton(iOS: boolean): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = iOS ? 'Got it' : 'Not now';
  button.className = 'install-prompt-button install-prompt-secondary';
  button.setAttribute('aria-label', 'Dismiss install prompt');
  button.tabIndex = 0;
  return button;
}
