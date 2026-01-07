/**
 * Toast DOM Builders
 *
 * Creates DOM elements for toast notifications with accessibility support.
 */

import { cloneTemplate } from '@core/utils/dom';

import type { ToastAction, ToastConfig } from './types';

/**
 * CSS classes for toast elements
 */
const CSS = {
  container: 'toast',
  visible: 'toast--visible',
  noAnimation: 'toast--no-animation',
  content: 'toast__content',
  icon: 'toast__icon',
  message: 'toast__message',
  actions: 'toast__actions',
  button: 'toast__button',
  buttonPrimary: 'toast__button--primary',
  buttonSecondary: 'toast__button--secondary',
  dismissBtn: 'toast__dismiss',
} as const;

/**
 * Get variant-specific CSS class
 */
function getVariantClass(variant: ToastConfig['variant']): string {
  return `toast--${variant}`;
}

/** Create an action button with appropriate styling. */
function createActionButton(action: ToastAction, isPrimary: boolean): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `${CSS.button} ${isPrimary ? CSS.buttonPrimary : CSS.buttonSecondary}`;
  button.textContent = action.label;
  button.addEventListener('click', action.onClick);
  return button;
}

/** Create dismiss button with ARIA label. */
function createDismissButton(onDismiss: () => void): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = CSS.dismissBtn;
  button.setAttribute('aria-label', 'Dismiss');
  button.innerHTML = '×';
  button.addEventListener('click', onDismiss);
  return button;
}

/**
 * Create a toast element with accessibility attributes and optional actions.
 *
 * @remarks
 * Static structure defined in index.html as `<template id="toast-element-template">`.
 * Clones template and configures:
 * - Variant class (`toast--info`, `toast--error`, etc.)
 * - ARIA attributes (`role`, `aria-live`)
 * - Reduced motion support (`toast--no-animation`)
 * - Dynamic action buttons (primary, secondary, dismiss)
 *
 * @param config - Toast configuration (variant, message, icon, actions)
 * @param onDismiss - Callback when dismiss button is clicked
 * @returns Configured toast element
 */
export function createToastElement(
  config: ToastConfig,
  onDismiss: () => void
): HTMLElement {
  const container = cloneTemplate<HTMLElement>('toast-element-template');
  
  // Apply variant class
  container.classList.add(getVariantClass(config.variant));
  
  // Set ARIA attributes
  container.setAttribute('role', config.role ?? 'status');
  container.setAttribute('aria-live', config.role === 'alert' ? 'assertive' : 'polite');
  container.setAttribute('data-testid', `toast-${config.id}`);
  container.setAttribute('data-toast-id', config.id);

  // Check reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    container.classList.add(CSS.noAnimation);
  }

  // Get content elements
  const iconEl = container.querySelector(`.${CSS.icon}`) as HTMLElement;
  const messageEl = container.querySelector(`.${CSS.message}`) as HTMLElement;
  const actionsEl = container.querySelector(`.${CSS.actions}`) as HTMLElement;

  // Set icon (if provided)
  if (config.icon) {
    iconEl.textContent = config.icon;
  } else {
    iconEl.remove();
  }

  // Set message
  messageEl.textContent = config.message;

  // NOTE: Actions container only rendered if needed to reduce DOM size
  const hasActions = config.action || config.secondaryAction || config.dismissible !== false;
  if (hasActions) {
    // NOTE: Secondary action first for left-to-right visual order (secondary | primary | dismiss)
    if (config.secondaryAction) {
      actionsEl.appendChild(createActionButton(config.secondaryAction, false));
    }

    // Primary action
    if (config.action) {
      actionsEl.appendChild(createActionButton(config.action, true));
    }

    // Dismiss button (always rightmost)
    if (config.dismissible !== false) {
      actionsEl.appendChild(createDismissButton(onDismiss));
    }
  } else {
    actionsEl.remove();
  }

  return container;
}

/** Clones toast-stack-template without modification. */
export function createToastStackContainer(): HTMLElement {
  return cloneTemplate<HTMLElement>('toast-stack-template');
}
