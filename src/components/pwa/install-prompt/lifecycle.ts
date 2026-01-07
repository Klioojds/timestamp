/** Lifecycle controller - handles show/hide with focus trapping. */

import {
  createFocusTrap,
  type FocusTrapController,
} from '@core/utils/accessibility/focus-trap';

export interface LifecycleController {
  show: () => void;
  hide: () => void;
  isVisible: () => boolean;
  destroy: () => void;
}

export interface LifecycleOptions {
  overlay: HTMLElement;
  dialog: HTMLElement;
  onDismiss: () => void;
}

/**
 * Create lifecycle controller with reusable focus trap.
 * @param options - Lifecycle configuration options
 * @returns Controller for managing show/hide
 */
export function createLifecycleController(
  options: LifecycleOptions
): LifecycleController {
  const { overlay, dialog, onDismiss } = options;

  let isVisibleState = false;
  let focusTrap: FocusTrapController | null = null;

  focusTrap = createFocusTrap({
    container: dialog,
    returnFocusOnDeactivate: true,
    escapeDeactivates: true,
    clickOutsideDeactivates: true,
    onEscape: () => {
      hide();
    },
    onClickOutside: () => {
      onDismiss();
    },
  });

  function show(): void {
    if (isVisibleState) {
      return;
    }

    overlay.hidden = false;
    isVisibleState = true;
    focusTrap?.activate();
  }

  function hide(): void {
    if (!isVisibleState) {
      return;
    }

    overlay.hidden = true;
    isVisibleState = false;
    focusTrap?.deactivate();
  }

  function isVisible(): boolean {
    return isVisibleState;
  }

  function destroy(): void {
    if (focusTrap?.isActive()) {
      focusTrap.deactivate();
    }
    focusTrap = null;
  }

  return {
    show,
    hide,
    isVisible,
    destroy,
  };
}
