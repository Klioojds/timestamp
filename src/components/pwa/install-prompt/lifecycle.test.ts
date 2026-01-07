/**
 * Lifecycle Module - Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createLifecycleController } from './lifecycle';

describe('lifecycle', () => {
  let overlay: HTMLElement;
  let dialog: HTMLElement;
  let onDismiss: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    overlay = document.createElement('div');
    overlay.hidden = true;
    
    dialog = document.createElement('div');
    const button = document.createElement('button');
    dialog.appendChild(button);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    onDismiss = vi.fn();
  });

  describe('show', () => {
    it('should make overlay visible', () => {
      const lifecycle = createLifecycleController({
        overlay,
        dialog,
        onDismiss,
      });

      expect(overlay.hidden).toBe(true);
      lifecycle.show();
      expect(overlay.hidden).toBe(false);
    });

    it('should set isVisible to true', () => {
      const lifecycle = createLifecycleController({
        overlay,
        dialog,
        onDismiss,
      });

      expect(lifecycle.isVisible()).toBe(false);
      lifecycle.show();
      expect(lifecycle.isVisible()).toBe(true);
    });

    it('should not change state if already visible', () => {
      const lifecycle = createLifecycleController({
        overlay,
        dialog,
        onDismiss,
      });

      lifecycle.show();
      expect(lifecycle.isVisible()).toBe(true);
      
      // Show again
      lifecycle.show();
      expect(lifecycle.isVisible()).toBe(true);
    });
  });

  describe('hide', () => {
    it('should hide overlay', () => {
      const lifecycle = createLifecycleController({
        overlay,
        dialog,
        onDismiss,
      });

      lifecycle.show();
      expect(overlay.hidden).toBe(false);
      
      lifecycle.hide();
      expect(overlay.hidden).toBe(true);
    });

    it('should set isVisible to false', () => {
      const lifecycle = createLifecycleController({
        overlay,
        dialog,
        onDismiss,
      });

      lifecycle.show();
      expect(lifecycle.isVisible()).toBe(true);
      
      lifecycle.hide();
      expect(lifecycle.isVisible()).toBe(false);
    });

    it('should not change state if already hidden', () => {
      const lifecycle = createLifecycleController({
        overlay,
        dialog,
        onDismiss,
      });

      expect(lifecycle.isVisible()).toBe(false);
      lifecycle.hide();
      expect(lifecycle.isVisible()).toBe(false);
    });
  });

  describe('focus trap', () => {
    it('should hide on Escape key', () => {
      const lifecycle = createLifecycleController({
        overlay,
        dialog,
        onDismiss,
      });

      lifecycle.show();
      expect(lifecycle.isVisible()).toBe(true);

      // Simulate Escape key
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      dialog.dispatchEvent(escapeEvent);

      expect(lifecycle.isVisible()).toBe(false);
    });

    it('should focus first focusable element on show', () => {
      const lifecycle = createLifecycleController({
        overlay,
        dialog,
        onDismiss,
      });

      const button = dialog.querySelector('button') as HTMLButtonElement;

      lifecycle.show();

      // Focus trap should focus the first focusable element
      expect(document.activeElement).toBe(button);
    });
  });

  describe('destroy', () => {
    it('should not throw when destroying', () => {
      const lifecycle = createLifecycleController({
        overlay,
        dialog,
        onDismiss,
      });

      lifecycle.show();
      expect(() => lifecycle.destroy()).not.toThrow();
    });

    it('should be safe to call multiple times', () => {
      const lifecycle = createLifecycleController({
        overlay,
        dialog,
        onDismiss,
      });

      lifecycle.destroy();
      expect(() => lifecycle.destroy()).not.toThrow();
    });
  });
});
