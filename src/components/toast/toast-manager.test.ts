/**
 * Toast Manager Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  toastManager,
  showInfoToast,
  showErrorToast,
  showSuccessToast,
  showPermissionToast,
} from './toast-manager';

describe('Toast Manager', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    
    // Reset reduced motion mock
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    // Clean up any existing toasts
    toastManager.destroy();
  });

  afterEach(() => {
    toastManager.destroy();
    vi.useRealTimers();
  });

  describe('toastManager.show', () => {
    it('should show a toast and return controller', () => {
      const controller = toastManager.show({
        id: 'test',
        message: 'Hello',
        variant: 'info',
      });

      expect(controller).toBeDefined();
      expect(controller.getId()).toBe('test');
      expect(toastManager.getCount()).toBe(1);
    });

    it('should add toast element to DOM', () => {
      toastManager.show({
        id: 'dom-test',
        message: 'Test',
        variant: 'info',
      });

      const toast = document.querySelector('[data-toast-id="dom-test"]');
      expect(toast).toBeTruthy();
    });

    it('should dismiss existing toast with same ID', () => {
      const first = toastManager.show({
        id: 'same-id',
        message: 'First',
        variant: 'info',
      });

      const second = toastManager.show({
        id: 'same-id',
        message: 'Second',
        variant: 'info',
      });

      expect(toastManager.getCount()).toBe(1);
      expect(second.getElement().querySelector('.toast__message')?.textContent).toBe('Second');
    });

    it('should enforce max visible limit', () => {
      toastManager.show({ id: '1', message: 'One', variant: 'info' });
      toastManager.show({ id: '2', message: 'Two', variant: 'info' });
      toastManager.show({ id: '3', message: 'Three', variant: 'info' });
      toastManager.show({ id: '4', message: 'Four', variant: 'info' });

      // Default max is 3, so oldest should be dismissed
      expect(toastManager.getCount()).toBeLessThanOrEqual(3);
    });
  });

  describe('toastManager.dismiss', () => {
    it('should dismiss a specific toast by ID', () => {
      toastManager.show({ id: 'to-dismiss', message: 'Test', variant: 'info' });
      expect(toastManager.getCount()).toBe(1);

      toastManager.dismiss('to-dismiss');

      // Allow animation time
      vi.advanceTimersByTime(400);

      // Count decreases after animation
      expect(toastManager.getCount()).toBe(0);
    });
  });

  describe('toastManager.dismissAll', () => {
    it('should dismiss all toasts', () => {
      toastManager.show({ id: '1', message: 'One', variant: 'info' });
      toastManager.show({ id: '2', message: 'Two', variant: 'info' });

      toastManager.dismissAll();
      vi.advanceTimersByTime(400);

      expect(toastManager.getCount()).toBe(0);
    });
  });

  describe('convenience functions', () => {
    it('showInfoToast should create info variant', () => {
      const controller = showInfoToast('Info message');
      const element = controller.getElement();

      expect(element.classList.contains('toast--info')).toBe(true);
    });

    it('showErrorToast should create error variant with alert role', () => {
      const controller = showErrorToast('Error message');
      const element = controller.getElement();

      expect(element.classList.contains('toast--error')).toBe(true);
      expect(element.getAttribute('role')).toBe('alert');
    });

    it('showSuccessToast should create success variant', () => {
      const controller = showSuccessToast('Success message');
      const element = controller.getElement();

      expect(element.classList.contains('toast--success')).toBe(true);
    });

    it('showPermissionToast should include action button', () => {
      const onClick = vi.fn();
      const controller = showPermissionToast('Enable notifications?', {
        label: 'Enable',
        onClick,
      });
      const element = controller.getElement();

      expect(element.classList.contains('toast--permission')).toBe(true);

      const button = element.querySelector('.toast__button--primary');
      expect(button?.textContent).toBe('Enable');
    });

    it('showPermissionToast should wire action button click handler', () => {
      const onClick = vi.fn();
      const controller = showPermissionToast('Enable notifications?', {
        label: 'Enable',
        onClick,
      });

      const button = controller.getElement().querySelector('.toast__button--primary') as HTMLButtonElement;
      button.click();

      expect(onClick).toHaveBeenCalled();
    });
  });

  describe('auto-dismiss', () => {
    it('should auto-dismiss after specified duration', () => {
      toastManager.show({
        id: 'auto-dismiss',
        message: 'Test',
        variant: 'info',
        duration: 3000,
      });

      expect(toastManager.getCount()).toBe(1);

      vi.advanceTimersByTime(3000);

      // After duration, count should decrease
      vi.advanceTimersByTime(400); // Animation time
      expect(toastManager.getCount()).toBe(0);
    });

    it('should not auto-dismiss when duration is 0', () => {
      toastManager.show({
        id: 'no-auto-dismiss',
        message: 'Test',
        variant: 'info',
        duration: 0,
      });

      vi.advanceTimersByTime(10000);
      expect(toastManager.getCount()).toBe(1);
    });
  });

  describe('callbacks', () => {
    it('should call onDismiss when toast is dismissed', () => {
      const onDismiss = vi.fn();
      toastManager.show({
        id: 'callback-test',
        message: 'Test',
        variant: 'info',
        onDismiss,
      });

      toastManager.dismiss('callback-test');

      // Wait for animation
      vi.advanceTimersByTime(400);
      expect(onDismiss).toHaveBeenCalled();
    });
  });
});
