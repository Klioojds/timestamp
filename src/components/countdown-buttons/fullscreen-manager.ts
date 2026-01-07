/** Fullscreen manager utilities - Handles fullscreen lifecycle, exit button behavior, and vendor prefixes. */

import { createIcon, createIconButton, ICON_SIZES } from '@core/utils/dom';

import { cancelAll, createResourceTracker, type ResourceTracker, safeSetTimeout } from '@/core/resource-tracking';

import { EXIT_BUTTON_HIDE_DELAY_MS } from './constants';

const EXIT_BUTTON_VISIBLE_CLASS = 'show-exit-button';

/**
 * Detect whether Fullscreen API is available (guards vendor-prefixed false values).
 * @returns true if Fullscreen API is available
 */
export function isFullscreenApiAvailable(): boolean {
  const doc = document as Document & {
    webkitFullscreenEnabled?: boolean;
    mozFullScreenEnabled?: boolean;
    msFullscreenEnabled?: boolean;
  };
  const flags = [doc.fullscreenEnabled, doc.webkitFullscreenEnabled, doc.mozFullScreenEnabled, doc.msFullscreenEnabled];
  return !flags.some((value) => value === false);
}

function isFullscreen(): boolean {
  return !!(
    document.fullscreenElement ||
    (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement ||
    (document as Document & { mozFullScreenElement?: Element }).mozFullScreenElement ||
    (document as Document & { msFullscreenElement?: Element }).msFullscreenElement
  );
}

/**
 * Request fullscreen with vendor prefix fallbacks.
 * @returns Promise resolving when fullscreen is entered
 * @throws Error if fullscreen request fails
 */
export async function requestFullscreen(): Promise<void> {
  const elem = document.documentElement as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void> | void;
    mozRequestFullScreen?: () => Promise<void> | void;
    msRequestFullscreen?: () => Promise<void> | void;
  };

  try {
    if (elem.requestFullscreen) await elem.requestFullscreen();
    else if (elem.webkitRequestFullscreen) await elem.webkitRequestFullscreen();
    else if (elem.mozRequestFullScreen) await elem.mozRequestFullScreen();
    else if (elem.msRequestFullscreen) await elem.msRequestFullscreen();
  } catch (error) {
    console.error('Failed to enter fullscreen:', error);
    throw error;
  }
}

async function exitFullscreen(): Promise<void> {
  const doc = document as Document & {
    webkitExitFullscreen?: () => Promise<void> | void;
    mozCancelFullScreen?: () => Promise<void> | void;
    msExitFullscreen?: () => Promise<void> | void;
  };

  try {
    if (doc.exitFullscreen) await doc.exitFullscreen();
    else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
    else if (doc.mozCancelFullScreen) await doc.mozCancelFullScreen();
    else if (doc.msExitFullscreen) await doc.msExitFullscreen();
  } catch (error) {
    console.error('Failed to exit fullscreen:', error);
  }
}

function createExitButton(): HTMLButtonElement {
  const button = createIconButton({
    testId: 'exit-fullscreen-button',
    label: 'Exit fullscreen mode',
    icon: createIcon({ name: 'screen-normal', size: ICON_SIZES.LG }),
    className: 'countdown-button exit-fullscreen-button',
  });
  button.id = 'exit-fullscreen-button';
  button.setAttribute('data-visible', 'false');

  const text = document.createElement('span');
  text.textContent = 'Exit Fullscreen';
  button.appendChild(text);

  return button;
}

interface FullscreenManagerState {
  exitButton: HTMLButtonElement | null;
  resourceTracker: ResourceTracker;
  mouseMoveHandler: (() => void) | null;
  fullscreenChangeHandler: (() => void) | null;
  keydownHandler: ((event: KeyboardEvent) => void) | null;
}

/** Options for fullscreen manager. */
export interface FullscreenManagerOptions {
  /** Container for fullscreen styling hooks. */
  container?: HTMLElement | null;
}

const managerState: FullscreenManagerState = {
  exitButton: null,
  resourceTracker: createResourceTracker(),
  mouseMoveHandler: null,
  fullscreenChangeHandler: null,
  keydownHandler: null,
};

function showExitButton(exitButton: HTMLButtonElement): void {
  // Clear existing hide timer
  cancelAll(managerState.resourceTracker);

  exitButton.setAttribute('data-visible', 'true');
  exitButton.setAttribute('aria-hidden', 'false');
  exitButton.style.visibility = 'visible';
  exitButton.classList.add(EXIT_BUTTON_VISIBLE_CLASS);

  safeSetTimeout(() => hideExitButton(exitButton), EXIT_BUTTON_HIDE_DELAY_MS, managerState.resourceTracker);
}

function hideExitButton(exitButton: HTMLButtonElement): void {
  exitButton.setAttribute('data-visible', 'false');
  exitButton.setAttribute('aria-hidden', 'true');
  exitButton.style.visibility = 'hidden';
  exitButton.classList.remove(EXIT_BUTTON_VISIBLE_CLASS);
}

/**
 * Initialize fullscreen management with exit button and chrome hiding.
 * @returns Cleanup function to remove listeners and exit fullscreen
 */
export function initFullscreenManager(options: FullscreenManagerOptions = {}): () => void {
  if (!isFullscreenApiAvailable()) return () => undefined;

  const container = options.container ?? document.getElementById('app');

  managerState.exitButton = createExitButton();
  document.body.appendChild(managerState.exitButton);
  hideExitButton(managerState.exitButton);
  managerState.exitButton.addEventListener('click', exitFullscreen);

  managerState.mouseMoveHandler = () => {
    const fullscreenActive = isFullscreen() || document.body.classList.contains('fullscreen-mode');
    if (fullscreenActive && managerState.exitButton) showExitButton(managerState.exitButton);
  };
  document.addEventListener('mousemove', managerState.mouseMoveHandler);

  managerState.fullscreenChangeHandler = () => {
    const fullscreenActive = isFullscreen();
    const chrome = document.querySelector('.countdown-button-container');

    if (chrome) chrome.setAttribute('data-chrome-hidden', fullscreenActive ? 'true' : 'false');
    document.body.classList.toggle('fullscreen-mode', fullscreenActive);
    if (container) {
      container.classList.toggle('fullscreen-mode', fullscreenActive);
      container.toggleAttribute('data-fullscreen', fullscreenActive);
    }

    cancelAll(managerState.resourceTracker);
    if (managerState.exitButton) hideExitButton(managerState.exitButton);
  };

  document.addEventListener('fullscreenchange', managerState.fullscreenChangeHandler);
  document.addEventListener('webkitfullscreenchange', managerState.fullscreenChangeHandler);
  document.addEventListener('mozfullscreenchange', managerState.fullscreenChangeHandler);
  document.addEventListener('MSFullscreenChange', managerState.fullscreenChangeHandler);

  managerState.keydownHandler = (event: KeyboardEvent) => {
    const fullscreenActive = isFullscreen() || document.body.classList.contains('fullscreen-mode');
    if (event.key === 'Escape' && fullscreenActive) void exitFullscreen();
  };
  document.addEventListener('keydown', managerState.keydownHandler);

  return () => {
    if (isFullscreen()) void exitFullscreen();
    cancelAll(managerState.resourceTracker);
    if (managerState.mouseMoveHandler) {
      document.removeEventListener('mousemove', managerState.mouseMoveHandler);
      managerState.mouseMoveHandler = null;
    }
    if (managerState.fullscreenChangeHandler) {
      document.removeEventListener('fullscreenchange', managerState.fullscreenChangeHandler);
      document.removeEventListener('webkitfullscreenchange', managerState.fullscreenChangeHandler);
      document.removeEventListener('mozfullscreenchange', managerState.fullscreenChangeHandler);
      document.removeEventListener('MSFullscreenChange', managerState.fullscreenChangeHandler);
      managerState.fullscreenChangeHandler = null;
    }
    if (managerState.keydownHandler) {
      document.removeEventListener('keydown', managerState.keydownHandler);
      managerState.keydownHandler = null;
    }
    if (managerState.exitButton?.parentElement) {
      managerState.exitButton.parentElement.removeChild(managerState.exitButton);
    }
    managerState.exitButton = null;
  };
}
