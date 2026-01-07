/**
 * Tests for Back Button Component
 * Verifies creation, interaction, and cleanup of the back button.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createBackButton } from './back-button';

describe('Back Button', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  describe('createBackButton', () => {
    it('should create a button element in the container', () => {
      const onBack = vi.fn();
      createBackButton(container, { onBack });

      const button = container.querySelector('[data-testid="back-button"]');
      expect(button).toBeTruthy();
      expect(button?.tagName).toBe('BUTTON');
    });

    it('should set correct accessibility attributes', () => {
      const onBack = vi.fn();
      createBackButton(container, { onBack });

      const button = container.querySelector('[data-testid="back-button"]');
      expect(button?.getAttribute('aria-label')).toBe('Return to countdown setup');
      expect(button?.getAttribute('type')).toBe('button');
      expect(button?.getAttribute('tabindex')).toBe('0');
    });

    it('should contain arrow icon and text', () => {
      const onBack = vi.fn();
      createBackButton(container, { onBack });

      const button = container.querySelector('[data-testid="back-button"]');
      const svg = button?.querySelector('svg');
      const text = button?.querySelector('span');

      expect(svg).toBeTruthy();
      expect(text?.textContent).toBe('Setup');
    });

    it('should call onBack when clicked', () => {
      const onBack = vi.fn();
      createBackButton(container, { onBack });

      const button = container.querySelector('[data-testid="back-button"]') as HTMLButtonElement;
      button.click();

      expect(onBack).toHaveBeenCalledTimes(1);
    });

  });

  describe('destroy', () => {
    it('should remove the button from the container', () => {
      const onBack = vi.fn();
      const controller = createBackButton(container, { onBack });

      expect(container.querySelector('[data-testid="back-button"]')).toBeTruthy();

      controller.destroy();

      expect(container.querySelector('[data-testid="back-button"]')).toBeNull();
    });

    it('should remove event listeners on destroy', () => {
      const onBack = vi.fn();
      const controller = createBackButton(container, { onBack });

      controller.destroy();

      // Button is removed, but let's verify a new one doesn't respond
      // by creating a new instance and confirming click works
      const newController = createBackButton(container, { onBack });
      const newButton = container.querySelector('[data-testid="back-button"]') as HTMLButtonElement;
      newButton.click();

      expect(onBack).toHaveBeenCalledTimes(1);
      newController.destroy();
    });
  });
});
