/**
 * Toast Component
 *
 * Unified toast/notification system for the app. Toasts:
 * - Appear at top on desktop (\>1050px), bottom on mobile
 * - Can stack with proper spacing
 * - Are dismissible
 * - Support different variants (info, success, warning, error, permission)
 *
 * @example
 * ```typescript
 * import { showErrorToast, showPermissionToast, toastManager } from '@/components/toast';
 *
 * // Simple error toast
 * showErrorToast('Invalid URL parameters');
 *
 * // Permission request toast
 * showPermissionToast('Get notified when countdown completes', {
 *   label: 'Enable',
 *   onClick: () => Notification.requestPermission(),
 * });
 *
 * // Full control
 * const toast = toastManager.show({
 *   id: 'my-toast',
 *   message: 'Hello world',
 *   variant: 'info',
 *   duration: 5000,
 * });
 * toast.dismiss();
 * ```
 */

export {
    showErrorToast,
    showInfoToast,
    showPermissionToast,
    showSuccessToast,
    toastManager
} from './toast-manager';
export type { ToastAction, ToastConfig, ToastController, ToastManager, ToastVariant } from './types';
export { TOAST_DEFAULTS } from './types';

