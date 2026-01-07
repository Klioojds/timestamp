/**
 * Focus Trap Utility
 * Traps keyboard focus within a container element for modal dialogs.
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
 */

import { FOCUSABLE_SELECTOR } from '@/core/config/constants';

/** Options for creating a focus trap. */
export interface FocusTrapOptions {
  container: HTMLElement;
  initialFocus?: HTMLElement;
  returnFocusOnDeactivate?: boolean;
  escapeDeactivates?: boolean;
  clickOutsideDeactivates?: boolean;
  onEscape?: () => void;
  onClickOutside?: (event?: MouseEvent) => void;
}

/** Controller for managing focus trap lifecycle. */
export interface FocusTrapController {
  activate(): void;
  deactivate(): void;
  isActive(): boolean;
}

/** Get all focusable elements within a container. */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const elements = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
  // Note: offsetParent is null in jsdom, so we only check hidden attribute
  return Array.from(elements).filter((el) => !el.hidden);
}

/**
 * Create a focus trap controller for a container element.
 * @param options - Focus trap configuration
 */
export function createFocusTrap(options: FocusTrapOptions): FocusTrapController {
  const {
    container,
    initialFocus,
    returnFocusOnDeactivate = true,
    escapeDeactivates = true,
    clickOutsideDeactivates = true,
    onEscape,
    onClickOutside,
  } = options;

  let active = false;
  let previouslyFocusedElement: HTMLElement | null = null;

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && escapeDeactivates) {
      onEscape?.();
      return;
    }

    if (event.key !== 'Tab') return;

    const focusableElements = getFocusableElements(container);
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }

  function handleClickOutside(event: MouseEvent): void {
    if (!clickOutsideDeactivates) return;
    const target = event.target as Node;
    if (target && !container.contains(target)) {
      onClickOutside?.(event);
    }
  }

  function activate(): void {
    if (active) return;
    active = true;
    previouslyFocusedElement = document.activeElement as HTMLElement;
    container.addEventListener('keydown', handleKeydown);
    document.addEventListener('mousedown', handleClickOutside);
    if (initialFocus) {
      initialFocus.focus();
    } else {
      const focusableElements = getFocusableElements(container);
      if (focusableElements.length > 0) focusableElements[0].focus();
    }
  }

  function deactivate(): void {
    if (!active) return;
    active = false;
    container.removeEventListener('keydown', handleKeydown);
    document.removeEventListener('mousedown', handleClickOutside);
    if (returnFocusOnDeactivate && previouslyFocusedElement) {
      previouslyFocusedElement.focus();
    }
  }

  return { activate, deactivate, isActive: () => active };
}
