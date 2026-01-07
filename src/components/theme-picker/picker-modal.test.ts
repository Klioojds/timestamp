/**
 * Theme Switcher Modal - Unit Tests
 * Verifies modal dialog behavior, focus trap, and accessibility.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupThemePickerTestDom, type ThemePickerTestContext } from '@/test-utils/theme-picker-fixtures';
import { createThemePickerModal } from './picker-modal';

describe('theme-switcher-modal', () => {
  let onSelect: ReturnType<typeof vi.fn>;
  let onClose: ReturnType<typeof vi.fn>;
  let testContext: ThemePickerTestContext;

  beforeEach(() => {
    onSelect = vi.fn();
    onClose = vi.fn();
    testContext = setupThemePickerTestDom();
  });

  afterEach(() => {
    testContext.restore();
  });

  describe('initialization and opening', () => {
    it('should create modal controller', () => {
      const modal = createThemePickerModal({
        currentTheme: 'contribution-graph',
        onSelect,
        onClose,
      });

      expect(modal).toHaveProperty('open');
      expect(modal).toHaveProperty('close');
      expect(modal).toHaveProperty('destroy');
    });

    it('should not be visible initially', () => {
      createThemePickerModal({
        currentTheme: 'contribution-graph',
        onSelect,
        onClose,
      });

      const overlay = document.querySelector('[data-testid="theme-modal-overlay"]');
      expect(overlay).toBeNull();
    });

    it('should display modal when opened', () => {
      const modal = createThemePickerModal({
        currentTheme: 'contribution-graph',
        onSelect,
        onClose,
      });

      modal.open();

      const overlay = document.querySelector('[data-testid="theme-modal-overlay"]');
      const modalDialog = document.querySelector('[data-testid="theme-modal"]');

      expect(overlay).not.toBeNull();
      expect(modalDialog).not.toBeNull();
    });

    it('should have proper ARIA attributes', () => {
      const modal = createThemePickerModal({
        currentTheme: 'contribution-graph',
        onSelect,
        onClose,
      });

      modal.open();

      const modalDialog = document.querySelector('[data-testid="theme-modal"]');
      
      expect(modalDialog?.getAttribute('role')).toBe('dialog');
      expect(modalDialog?.getAttribute('aria-modal')).toBe('true');
      expect(modalDialog?.getAttribute('aria-labelledby')).toBe('theme-modal-title');
    });

    it('should display title', () => {
      const modal = createThemePickerModal({
        currentTheme: 'contribution-graph',
        onSelect,
        onClose,
      });

      modal.open();

      const title = document.getElementById('theme-modal-title');
      expect(title?.textContent).toBe('Select Theme');
    });

    it('should contain theme selector', () => {
      const modal = createThemePickerModal({
        currentTheme: 'contribution-graph',
        onSelect,
        onClose,
      });

      modal.open();

      const themeSelector = document.querySelector('[data-testid="theme-selector"]');
      expect(themeSelector).not.toBeNull();
    });

    it('should focus search input on open to support keyboard users', () => {
      const modal = createThemePickerModal({
        currentTheme: 'contribution-graph',
        onSelect,
        onClose,
      });

      modal.open();

      const searchInput = document.querySelector('[data-testid="theme-search-input"]') as HTMLInputElement | null;

      expect(searchInput).not.toBeNull();
      expect(document.activeElement).toBe(searchInput);
    });

    it('should prevent body scroll when open', () => {
      const modal = createThemePickerModal({
        currentTheme: 'contribution-graph',
        onSelect,
        onClose,
      });

      modal.open();

      expect(document.body.style.overflow).toBe('hidden');
    });
  });

  describe('closing', () => {
    it.each([
      {
        description: 'close button click',
        performClose: () => {
          const closeButton = document.querySelector('[data-testid="theme-modal-close"]') as HTMLButtonElement;
          closeButton.click();
        },
      },
      {
        description: 'Escape key press',
        performClose: () => {
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        },
      },
      {
        description: 'overlay click',
        performClose: () => {
          const overlay = document.querySelector('[data-testid="theme-modal-overlay"]') as HTMLElement;
          overlay.click();
        },
      },
    ])('should close modal on $description', ({ performClose }) => {
      const modal = createThemePickerModal({
        currentTheme: 'contribution-graph',
        onSelect,
        onClose,
      });

      modal.open();
      performClose();

      expect(document.querySelector('[data-testid="theme-modal-overlay"]')).toBeNull();
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should restore body scroll when closed', () => {
      const modal = createThemePickerModal({
        currentTheme: 'contribution-graph',
        onSelect,
        onClose,
      });

      modal.open();
      expect(document.body.style.overflow).toBe('hidden');

      modal.close();
      expect(document.body.style.overflow).toBe('');
    });

    it('should restore focus to previous element when closed', () => {
      const button = document.createElement('button');
      document.body.appendChild(button);
      button.focus();

      const modal = createThemePickerModal({
        currentTheme: 'contribution-graph',
        onSelect,
        onClose,
      });

      modal.open();
      modal.close();

      expect(document.activeElement).toBe(button);
    });
  });

  describe('theme selection', () => {
    it('should call onSelect when theme is selected', () => {
      const modal = createThemePickerModal({
        currentTheme: 'contribution-graph',
        onSelect,
        onClose,
      });

      modal.open();

      const fireworksCell = document.querySelector('[data-theme-id="fireworks"] [role="gridcell"]') as HTMLElement;
      fireworksCell.click();

      expect(onSelect).toHaveBeenCalledWith('fireworks');
    });
  });

  describe('cleanup', () => {
    it.each([
      { description: 'when closed', openBeforeDestroy: false, expectedOnCloseCalls: 0 },
      { description: 'when open', openBeforeDestroy: true, expectedOnCloseCalls: 1 },
    ])('should destroy modal $description', ({ openBeforeDestroy, expectedOnCloseCalls }) => {
      const modal = createThemePickerModal({
        currentTheme: 'contribution-graph',
        onSelect,
        onClose,
      });

      if (openBeforeDestroy) {
        modal.open();
      }

      modal.destroy();

      expect(document.querySelector('[data-testid="theme-modal-overlay"]')).toBeNull();
      expect(onClose).toHaveBeenCalledTimes(expectedOnCloseCalls);
    });

    it('should handle destroy being called multiple times', () => {
      const modal = createThemePickerModal({
        currentTheme: 'contribution-graph',
        onSelect,
        onClose,
      });

      modal.destroy();
      expect(() => modal.destroy()).not.toThrow();
    });
  });

  describe('multiple open/close cycles', () => {
    it('should handle opening and closing multiple times', () => {
      const modal = createThemePickerModal({
        currentTheme: 'contribution-graph',
        onSelect,
        onClose,
      });

      // First cycle
      modal.open();
      expect(document.querySelector('[data-testid="theme-modal-overlay"]')).not.toBeNull();
      modal.close();
      expect(document.querySelector('[data-testid="theme-modal-overlay"]')).toBeNull();

      // Second cycle
      modal.open();
      expect(document.querySelector('[data-testid="theme-modal-overlay"]')).not.toBeNull();
      modal.close();
      expect(document.querySelector('[data-testid="theme-modal-overlay"]')).toBeNull();

      expect(onClose).toHaveBeenCalledTimes(2);
    });

    it('should ignore open when already open', () => {
      const modal = createThemePickerModal({
        currentTheme: 'contribution-graph',
        onSelect,
        onClose,
      });

      modal.open();
      modal.open(); // Should do nothing

      const overlays = document.querySelectorAll('[data-testid="theme-modal-overlay"]');
      expect(overlays.length).toBe(1);
    });

    it('should ignore close when already closed', () => {
      const modal = createThemePickerModal({
        currentTheme: 'contribution-graph',
        onSelect,
        onClose,
      });

      modal.close(); // Should do nothing

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('button container visibility during modal', () => {
    it('should dispatch modalOpen event when modal opens', () => {
      const modal = createThemePickerModal({
        currentTheme: 'contribution-graph',
        onSelect,
        onClose,
      });

      const eventHandler = vi.fn();
      document.addEventListener('theme-modal:open', eventHandler);

      modal.open();

      expect(eventHandler).toHaveBeenCalledTimes(1);
      
      document.removeEventListener('theme-modal:open', eventHandler);
    });

    it('should dispatch modalClose event when modal closes', () => {
      const modal = createThemePickerModal({
        currentTheme: 'contribution-graph',
        onSelect,
        onClose,
      });

      const eventHandler = vi.fn();
      document.addEventListener('theme-modal:close', eventHandler);

      modal.open();
      modal.close();

      expect(eventHandler).toHaveBeenCalledTimes(1);
      
      document.removeEventListener('theme-modal:close', eventHandler);
    });
  });
});
