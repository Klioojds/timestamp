/**
 * Toast Manager
 *
 * Manages a stack of toast notifications with:
 * - Responsive positioning (top on desktop, bottom on mobile)
 * - Stacking with proper spacing
 * - Auto-dismiss support
 * - Singleton pattern for app-wide use
 */

import '@/styles/components/toast.scss';

import { createToastElement, createToastStackContainer } from './dom-builders';
import type { ToastAction, ToastConfig, ToastController, ToastManager } from './types';
import { TOAST_DEFAULTS } from './types';

/** Active toast controllers by ID */
const activeToasts = new Map<string, ToastController>();

/** Stack container element */
let stackContainer: HTMLElement | null = null;

/** Auto-dismiss timers */
const dismissTimers = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Ensure the stack container exists in the DOM
 */
function ensureStackContainer(): HTMLElement {
  if (!stackContainer || !document.body.contains(stackContainer)) {
    stackContainer = createToastStackContainer();
    document.body.appendChild(stackContainer);
  }
  return stackContainer;
}

/**
 * Update stack positions based on visible toasts
 */
function updateStackPositions(): void {
  const container = ensureStackContainer();
  const toasts = Array.from(container.children) as HTMLElement[];
  
  toasts.forEach((toast, index) => {
    const offset = index * (toast.offsetHeight + TOAST_DEFAULTS.stackGap);
    toast.style.setProperty('--toast-offset', `${offset}px`);
  });
}

/** Create a toast controller managing visibility, auto-dismiss, and cleanup. */
function createToastController(config: ToastConfig): ToastController {
  let element: HTMLElement | null = null;
  let isVisible = false;

  const dismiss = (): void => {
    if (!isVisible || !element) return;
    
    isVisible = false;
    element.classList.remove('toast--visible');
    
    // NOTE: Clear auto-dismiss timer to prevent dismissing already-dismissed toast
    const timer = dismissTimers.get(config.id);
    if (timer) {
      clearTimeout(timer);
      dismissTimers.delete(config.id);
    }

    // Remove from active toasts immediately to prevent infinite loops
    // when enforcing max visible limit
    activeToasts.delete(config.id);

    // PERF: Remove element after animation (or immediately if reduced motion)
    const animDuration = element.classList.contains('toast--no-animation') 
      ? 0 
      : TOAST_DEFAULTS.animationDuration;
    
    setTimeout(() => {
      element?.remove();
      config.onDismiss?.();
      updateStackPositions();
    }, animDuration);
  };

  const show = (): void => {
    if (isVisible) return;

    // Create element
    element = createToastElement(config, dismiss);
    
    // Add to stack
    const container = ensureStackContainer();
    container.appendChild(element);
    
    // Trigger reflow then add visible class for animation
    void element.offsetHeight; // Force reflow
    element.classList.add('toast--visible');
    
    isVisible = true;
    activeToasts.set(config.id, controller);
    updateStackPositions();

    // Set up auto-dismiss if configured
    const duration = config.duration ?? TOAST_DEFAULTS.duration;
    if (duration > 0) {
      const timer = setTimeout(dismiss, duration);
      dismissTimers.set(config.id, timer);
    }
  };

  const controller: ToastController = {
    show,
    dismiss,
    getElement: () => element!,
    destroy: () => {
      dismiss();
      element = null;
    },
    getId: () => config.id,
  };

  return controller;
}

/**
 * Toast manager singleton
 */
export const toastManager: ToastManager = {
  show(config: ToastConfig): ToastController {
    // Dismiss existing toast with same ID
    const existing = activeToasts.get(config.id);
    if (existing) {
      existing.dismiss();
    }

    // Enforce max visible limit
    while (activeToasts.size >= TOAST_DEFAULTS.maxVisible) {
      const oldest = activeToasts.values().next().value;
      if (oldest) {
        oldest.dismiss();
      }
    }

    const controller = createToastController(config);
    controller.show();
    return controller;
  },

  dismiss(id: string): void {
    const toast = activeToasts.get(id);
    toast?.dismiss();
  },

  dismissAll(): void {
    for (const toast of activeToasts.values()) {
      toast.dismiss();
    }
  },

  getCount(): number {
    return activeToasts.size;
  },

  destroy(): void {
    this.dismissAll();
    stackContainer?.remove();
    stackContainer = null;
  },
};

/** Show an info toast with default icon and styling. */
export function showInfoToast(message: string, options?: Partial<ToastConfig>): ToastController {
  return toastManager.show({
    id: options?.id ?? `info-${Date.now()}`,
    message,
    variant: 'info',
    icon: 'ℹ️',
    ...options,
  });
}

/** Show a success toast with checkmark icon. */
export function showSuccessToast(message: string, options?: Partial<ToastConfig>): ToastController {
  return toastManager.show({
    id: options?.id ?? `success-${Date.now()}`,
    message,
    variant: 'success',
    icon: '✓',
    ...options,
  });
}

/** Show an error toast with assertive ARIA live region. */
export function showErrorToast(message: string, options?: Partial<ToastConfig>): ToastController {
  return toastManager.show({
    id: options?.id ?? `error-${Date.now()}`,
    message,
    variant: 'error',
    icon: '⚠️',
    role: 'alert',
    ...options,
  });
}

/** Show a permission request toast with action button. */
export function showPermissionToast(
  message: string,
  action: ToastAction,
  options?: Partial<ToastConfig>
): ToastController {
  return toastManager.show({
    id: options?.id ?? `permission-${Date.now()}`,
    message,
    variant: 'permission',
    icon: '🔔',
    action,
    ...options,
  });
}
