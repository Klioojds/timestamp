/**
 * Toast DOM Builders Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createToastElement, createToastStackContainer } from './dom-builders';
import type { ToastConfig } from './types';

describe('Toast DOM Builders', () => {
  beforeEach(() => {
    // Reset reduced motion mock
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  describe('createToastElement', () => {
    const defaultConfig: ToastConfig = {
      id: 'test-toast',
      message: 'Test message',
      variant: 'info',
    };

    it('should create toast with correct structure', () => {
      const onDismiss = vi.fn();
      const toast = createToastElement(defaultConfig, onDismiss);

      expect(toast.classList.contains('toast')).toBe(true);
      expect(toast.classList.contains('toast--info')).toBe(true);
      expect(toast.getAttribute('role')).toBe('status');
      expect(toast.getAttribute('aria-live')).toBe('polite');
      expect(toast.getAttribute('data-testid')).toBe('toast-test-toast');
    });

    it('should set alert role for error variant', () => {
      const onDismiss = vi.fn();
      const toast = createToastElement({
        ...defaultConfig,
        variant: 'error',
        role: 'alert',
      }, onDismiss);

      expect(toast.getAttribute('role')).toBe('alert');
      expect(toast.getAttribute('aria-live')).toBe('assertive');
    });

    it('should include icon when provided', () => {
      const onDismiss = vi.fn();
      const toast = createToastElement({
        ...defaultConfig,
        icon: '🔔',
      }, onDismiss);

      const icon = toast.querySelector('.toast__icon');
      expect(icon).toBeTruthy();
      expect(icon?.textContent).toBe('🔔');
      expect(icon?.getAttribute('aria-hidden')).toBe('true');
    });

    it('should include message', () => {
      const onDismiss = vi.fn();
      const toast = createToastElement(defaultConfig, onDismiss);

      const message = toast.querySelector('.toast__message');
      expect(message?.textContent).toBe('Test message');
    });

    it('should include primary action button when provided', () => {
      const onClick = vi.fn();
      const onDismiss = vi.fn();
      const toast = createToastElement({
        ...defaultConfig,
        action: { label: 'Enable', onClick },
      }, onDismiss);

      const button = toast.querySelector('.toast__button--primary');
      expect(button).toBeTruthy();
      expect(button?.textContent).toBe('Enable');

      // Click should trigger action
      (button as HTMLButtonElement).click();
      expect(onClick).toHaveBeenCalled();
    });

    it('should include secondary action button when provided', () => {
      const onClick = vi.fn();
      const onDismiss = vi.fn();
      const toast = createToastElement({
        ...defaultConfig,
        secondaryAction: { label: 'Later', onClick },
      }, onDismiss);

      const button = toast.querySelector('.toast__button--secondary');
      expect(button).toBeTruthy();
      expect(button?.textContent).toBe('Later');

      (button as HTMLButtonElement).click();
      expect(onClick).toHaveBeenCalled();
    });

    it('should include dismiss button by default', () => {
      const onDismiss = vi.fn();
      const toast = createToastElement(defaultConfig, onDismiss);

      const dismissBtn = toast.querySelector('.toast__dismiss');
      expect(dismissBtn).toBeTruthy();
      expect(dismissBtn?.getAttribute('aria-label')).toBe('Dismiss');

      // Click should trigger dismiss
      (dismissBtn as HTMLButtonElement).click();
      expect(onDismiss).toHaveBeenCalled();
    });

    it('should not include dismiss button when dismissible is false', () => {
      const onDismiss = vi.fn();
      const toast = createToastElement({
        ...defaultConfig,
        dismissible: false,
        action: { label: 'OK', onClick: vi.fn() }, // Need at least one action
      }, onDismiss);

      const dismissBtn = toast.querySelector('.toast__dismiss');
      expect(dismissBtn).toBeNull();
    });

    it('should add no-animation class when reduced motion is preferred', () => {
      vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      const onDismiss = vi.fn();
      const toast = createToastElement(defaultConfig, onDismiss);

      expect(toast.classList.contains('toast--no-animation')).toBe(true);
    });
  });

  describe('createToastStackContainer', () => {
    it('should create container with correct attributes', () => {
      const container = createToastStackContainer();

      expect(container.classList.contains('toast-stack')).toBe(true);
      expect(container.getAttribute('aria-label')).toBe('Notifications');
      expect(container.getAttribute('data-testid')).toBe('toast-stack');
    });
  });
});
