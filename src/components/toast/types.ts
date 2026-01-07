/**
 * Toast Component Types
 *
 * Defines types for the unified toast/notification system used across the app.
 * Toasts appear at the top on desktop and bottom on mobile, can stack,
 * and are dismissible.
 */

/**
 * Toast variant determines visual styling
 */
export type ToastVariant = 'info' | 'success' | 'warning' | 'error' | 'permission';

/**
 * Configuration for creating a toast
 */
export interface ToastConfig {
  /** Unique identifier for the toast */
  id: string;
  /** Main message text */
  message: string;
  /** Visual variant (affects colors) */
  variant: ToastVariant;
  /** Optional icon (emoji or icon element) */
  icon?: string;
  /** Whether the toast can be dismissed by clicking X */
  dismissible?: boolean;
  /** Auto-dismiss after milliseconds (0 = no auto-dismiss) */
  duration?: number;
  /** Primary action button */
  action?: ToastAction;
  /** Secondary action button */
  secondaryAction?: ToastAction;
  /** ARIA role override (default: 'status', use 'alert' for errors) */
  role?: 'status' | 'alert';
  /** Callback when toast is dismissed */
  onDismiss?: () => void;
}

/**
 * Action button configuration
 */
export interface ToastAction {
  /** Button text */
  label: string;
  /** Click handler */
  onClick: () => void;
  /** Whether this is the primary action (styled prominently) */
  primary?: boolean;
}

/**
 * Toast controller interface
 */
export interface ToastController {
  /** Show the toast */
  show(): void;
  /** Hide/dismiss the toast */
  dismiss(): void;
  /** Get the DOM element */
  getElement(): HTMLElement;
  /** Clean up resources */
  destroy(): void;
  /** Get the toast ID */
  getId(): string;
}

/**
 * Toast manager interface for handling multiple toasts
 */
export interface ToastManager {
  /** Show a toast with given config, returns controller */
  show(config: ToastConfig): ToastController;
  /** Dismiss a specific toast by ID */
  dismiss(id: string): void;
  /** Dismiss all toasts */
  dismissAll(): void;
  /** Get count of visible toasts */
  getCount(): number;
  /** Clean up all resources */
  destroy(): void;
}

/**
 * Default toast configuration values
 */
export const TOAST_DEFAULTS = {
  /** Default auto-dismiss duration (0 = no auto-dismiss) */
  duration: 0,
  /** Default dismissible state */
  dismissible: true,
  /** Gap between stacked toasts (px) */
  stackGap: 12,
  /** Maximum visible toasts */
  maxVisible: 3,
  /** Animation duration (ms) */
  animationDuration: 300,
} as const;
