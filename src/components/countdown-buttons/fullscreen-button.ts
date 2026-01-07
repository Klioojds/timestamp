/** Fullscreen button component (desktop-only). Returns null on mobile/tablet. Uses Fullscreen API with auto-hiding exit button. */
import { createIcon, createIconButton, ICON_SIZES } from '@core/utils/dom';

import { initFullscreenManager, isFullscreenApiAvailable, requestFullscreen } from './fullscreen-manager';

/** Options for creating a fullscreen button. */
export interface FullscreenButtonOptions {
  /** Whether device is mobile (returns null if true) */
  isMobile: boolean;
  /** Whether fullscreen is currently active */
  isFullscreen: boolean;
  /** Callback when fullscreen toggle is requested */
  onToggle: () => void;
}

/**
 * Create fullscreen button element. Returns null on mobile/tablet.
 * @returns Button element or null if mobile/API unavailable
 */
export function createFullscreenButton(options: FullscreenButtonOptions): HTMLButtonElement | null {
  if (options.isMobile || !isFullscreenApiAvailable()) return null;

  const button = createIconButton({
    testId: 'fullscreen-button',
    label: 'Enter fullscreen',
    icon: createIcon({ name: 'screen-full', size: ICON_SIZES.LG }),
    className: 'countdown-button fullscreen-button',
  });
  button.id = 'fullscreen-button';

  const text = document.createElement('span');
  text.textContent = 'Fullscreen';
  button.appendChild(text);

  button.addEventListener('click', options.onToggle);

  return button;
}

export { initFullscreenManager, requestFullscreen };