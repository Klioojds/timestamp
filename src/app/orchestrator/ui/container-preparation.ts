/**
 * DOM Setup Utilities - container preparation before mounting orchestrator.
 */

import type { AccessibilityManager } from '@core/utils/accessibility';

/** Data attribute to identify the main landmark wrapper. */
const MAIN_WRAPPER_ATTR = 'data-countdown-main';

/** Prepares container for countdown (overflow:hidden, a11y init, scroll reset). */
export function prepareContainer(
  host: HTMLElement,
  a11yManager: AccessibilityManager
): void {
  host.classList.add('countdown-view');
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
  
  // CRITICAL: Reset scroll to prevent landing page scroll persisting
  window.scrollTo(0, 0);
  
  // Wrap host content in <main> landmark for screen reader navigation.
  // Themes render into this main element, ensuring consistent landmark structure.
  const mainEl = document.createElement('main');
  mainEl.setAttribute(MAIN_WRAPPER_ATTR, 'true');
  mainEl.style.cssText = 'display: contents;';
  
  // Move any existing children into main (shouldn't be any, but be safe)
  while (host.firstChild) {
    mainEl.appendChild(host.firstChild);
  }
  host.appendChild(mainEl);
  
  a11yManager.init(host);
}

/** Restores container state after countdown destroyed. */
export function restoreContainer(container: HTMLElement): void {
  container.classList.remove('countdown-view');
  document.documentElement.style.overflow = '';
  document.body.style.overflow = '';
  
  // Remove main landmark wrapper if present
  const mainEl = container.querySelector(`[${MAIN_WRAPPER_ATTR}]`);
  if (mainEl) {
    // Move children back to container before removing main
    while (mainEl.firstChild) {
      container.appendChild(mainEl.firstChild);
    }
    mainEl.remove();
  }
}

/** Hides the loading element. */
export function hideLoadingElement(): void {
  const loadingElement = document.getElementById('loading');
  if (loadingElement) {
    loadingElement.classList.add('hidden');
    loadingElement.hidden = true;
  }
}
