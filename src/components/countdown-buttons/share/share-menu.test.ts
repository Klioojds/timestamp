/**
 * Share Menu Tests
 * Unit tests for the share menu component (wall-clock mode).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockClipboard } from '@/test-utils/share-fixtures';
import { FEEDBACK_DURATION_MS } from '../constants';
import { createShareMenu } from './share-menu';
import type { ShareTargets } from './types';

describe('createShareMenu', () => {
  const mockShareTargets: ShareTargets = {
    withSelectedTimezone: 'https://example.com/?mode=wall-clock&tz=America/New_York',
    withLocalTimezone: 'https://example.com/?mode=wall-clock&tz=America/Los_Angeles',
    withoutTimezone: 'https://example.com/?mode=wall-clock',
  };

  const mockGetShareTargets = vi.fn(() => mockShareTargets);
  let clipboard: ReturnType<typeof mockClipboard>;

  const renderMenu = (overrides: Partial<Parameters<typeof createShareMenu>[0]> = {}) => {
    const controller = createShareMenu({ getShareTargets: mockGetShareTargets, ...overrides });
    const element = controller.getElement();
    document.body.appendChild(element);

    const button = element.querySelector('[data-testid="share-button"]') as HTMLButtonElement;
    const menu = element.querySelector('[role="menu"]') as HTMLElement;
    const items = element.querySelectorAll('[role="menuitem"]');

    const itemByTestId = (testId: string) =>
      element.querySelector(`[data-testid="${testId}"]`) as HTMLButtonElement;

    return { controller, element, button, menu, items, itemByTestId };
  };

  beforeEach(() => {
    clipboard = mockClipboard();
    vi.useFakeTimers();
    mockGetShareTargets.mockClear();
  });

  afterEach(() => {
    clipboard.restore();
    vi.restoreAllMocks();
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  describe('structure', () => {
    it('should render trigger and menu with expected ARIA', () => {
      const { element, button, menu, items } = renderMenu();

      expect(element.classList.contains('share-menu-container')).toBe(true);
      expect(button.getAttribute('aria-haspopup')).toBe('menu');
      expect(button.getAttribute('aria-expanded')).toBe('false');
      expect(button.getAttribute('aria-controls')).toBe(menu.id);
      expect(items).toHaveLength(3);
    });

    it('should have tabindex="0" on trigger button for keyboard navigation', () => {
      const { button } = renderMenu();
      expect(button.getAttribute('tabindex')).toBe('0');
    });

    it.each([
      ['share-selected-timezone', 'Selected timezone'],
      ['share-local-timezone', 'My local timezone'],
      ['share-without-timezone', 'Their timezone'],
    ])('should render %s label', (testId, label) => {
      const { itemByTestId } = renderMenu();
      expect(itemByTestId(testId).textContent?.trim()).toBe(label);
    });
  });

  describe('menu open/close', () => {
    it('should open menu on button click', () => {
      const { button, menu } = renderMenu();
      button.click();

      expect(button.getAttribute('aria-expanded')).toBe('true');
      expect(menu?.classList.contains('share-menu-dropdown--open')).toBe(true);
    });

    it('should close menu on second button click', () => {
      const { button, menu } = renderMenu();
      button.click(); // Open
      button.click(); // Close

      expect(button.getAttribute('aria-expanded')).toBe('false');
      expect(menu?.classList.contains('share-menu-dropdown--open')).toBe(false);
    });

    it('should close menu on Escape key', () => {
      const { button } = renderMenu();
      button.click(); // Open

      // Simulate Escape key
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      button.dispatchEvent(escapeEvent);

      expect(button.getAttribute('aria-expanded')).toBe('false');
    });
  });

  describe('menu item selection', () => {
    it.each([
      {
        testId: 'share-selected-timezone',
        targetKey: 'withSelectedTimezone' as const,
        type: 'withSelectedTimezone' as const,
      },
      {
        testId: 'share-local-timezone',
        targetKey: 'withLocalTimezone' as const,
        type: 'withLocalTimezone' as const,
      },
      {
        testId: 'share-without-timezone',
        targetKey: 'withoutTimezone' as const,
        type: 'withoutTimezone' as const,
      },
    ])('should copy URL for $testId', async ({ testId, targetKey, type }) => {
      const onCopy = vi.fn();
      const { button, itemByTestId } = renderMenu({ onCopy });

      button.click();
      itemByTestId(testId).click();
      await vi.runAllTimersAsync();

      expect(mockGetShareTargets).toHaveBeenCalled();
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockShareTargets[targetKey]);
      expect(onCopy).toHaveBeenCalledWith(mockShareTargets[targetKey], type);
    });

    it('should close menu after selection', async () => {
      const { button, menu, itemByTestId } = renderMenu();

      button.click();
      itemByTestId('share-selected-timezone').click();
      await vi.runAllTimersAsync();

      expect(menu?.classList.contains('share-menu-dropdown--open')).toBe(false);
    });

    it('should show success feedback after copy', async () => {
      const { button, itemByTestId } = renderMenu();

      button.click();
      itemByTestId('share-selected-timezone').click();

      await vi.waitFor(() => {
        expect(button.dataset.feedback).toBe('success');
      });
    });

    it('should show error feedback and reset label when copy fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      clipboard.writeText.mockRejectedValueOnce(new Error('denied'));
      const { button, itemByTestId } = renderMenu();

      button.click();
      itemByTestId('share-selected-timezone').click();

      await vi.waitFor(() => {
        expect(button.dataset.feedback).toBeDefined();
      });
      expect(button.dataset.feedback).toBe('error');
      expect(button.textContent).toContain('Failed');

      vi.advanceTimersByTime(FEEDBACK_DURATION_MS + 10);
      expect(button.dataset.feedback).toBeUndefined();
      expect(button.textContent).toContain('Copy');
      consoleSpy.mockRestore();
    });
  });

  describe('keyboard navigation', () => {
    it('should open menu on ArrowDown from trigger', () => {
      const { button } = renderMenu();

      button.focus();
      button.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));

      expect(button.getAttribute('aria-expanded')).toBe('true');
    });

    it.each([
      { keys: ['ArrowDown'], expectedIndex: 1 },
      { keys: ['ArrowDown', 'ArrowDown', 'ArrowDown'], expectedIndex: 0 },
      { keys: ['ArrowDown', 'ArrowUp'], expectedIndex: 0 },
      { keys: ['ArrowDown', 'Home'], expectedIndex: 0 },
      { keys: ['End'], expectedIndex: 2 },
    ])('should move focus for %o', ({ keys, expectedIndex }) => {
      const { button, menu, items } = renderMenu();

      button.click();
      keys.forEach(key => {
        menu.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
      });

      expect(document.activeElement).toBe(items[expectedIndex]);
    });
  });

  describe('mobile feedback', () => {
    it('should show scoped menu-item feedback when rendered in mobile menu', async () => {
      const wrapper = document.createElement('div');
      wrapper.className = 'mobile-menu-actions';
      document.body.appendChild(wrapper);

      const { controller, element, button, itemByTestId } = renderMenu();
      wrapper.appendChild(element);

      button.click();
      const targetItem = itemByTestId('share-selected-timezone');
      targetItem.click();

      await vi.waitFor(() => {
        expect(targetItem.dataset.feedback).toBeDefined();
      });
      expect(targetItem.dataset.feedback).toBe('success');

      const label = targetItem.querySelector('.share-menu-item-label');
      expect(label?.textContent).toBe('Copied!');

      vi.advanceTimersByTime(FEEDBACK_DURATION_MS + 10);
      expect(targetItem.dataset.feedback).toBeUndefined();
      expect(label?.textContent).toBe('Selected timezone');

      controller.destroy();
    });
  });

  describe('on-demand URL computation', () => {
    it('should get fresh URLs on each menu item click', async () => {
      const controller = createShareMenu({ getShareTargets: mockGetShareTargets });
      document.body.appendChild(controller.getElement());

      const button = controller.getElement().querySelector('[data-testid="share-button"]') as HTMLButtonElement;
      const selectedTzItem = controller.getElement().querySelector('[data-testid="share-selected-timezone"]') as HTMLButtonElement;

      // First click
      button.click();
      selectedTzItem.click();
      await vi.runAllTimersAsync();
      expect(mockGetShareTargets).toHaveBeenCalledTimes(1);

      // Second click
      button.click();
      selectedTzItem.click();
      await vi.runAllTimersAsync();
      expect(mockGetShareTargets).toHaveBeenCalledTimes(2);
    });

    it('should use updated URLs when getter returns different values', async () => {
      const dynamicTargets = { ...mockShareTargets };
      const dynamicGetter = vi.fn(() => ({ ...dynamicTargets }));
      
      const { button, itemByTestId } = renderMenu({ getShareTargets: dynamicGetter });

      button.click();
      itemByTestId('share-selected-timezone').click();
      await vi.runAllTimersAsync();
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockShareTargets.withSelectedTimezone);

      dynamicTargets.withSelectedTimezone = 'https://updated.com/?tz=Europe/London';

      button.click();
      itemByTestId('share-selected-timezone').click();
      await vi.runAllTimersAsync();
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://updated.com/?tz=Europe/London');
    });
  });

  describe('destroy', () => {
    it('should clean up without errors', () => {
      const { controller, button } = renderMenu();
      button.click();

      expect(() => controller.destroy()).not.toThrow();
    });
  });
});
