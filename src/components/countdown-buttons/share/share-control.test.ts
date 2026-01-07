/**
 * Share Control Factory Tests
 * Unit tests for the share control factory function.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cleanupDOM } from '@/test-utils/dom-helpers';
import { mockClipboard } from '@/test-utils/share-fixtures';
import { createShareControl } from './share-control';
import type { ShareTargets } from './types';

describe('createShareControl', () => {
  const mockShareTargets: ShareTargets = {
    withSelectedTimezone: 'https://example.com/?tz=UTC',
    withLocalTimezone: 'https://example.com/?tz=America/Los_Angeles',
    withoutTimezone: 'https://example.com/',
  };

  const mockGetShareTargets = vi.fn(() => mockShareTargets);
  let clipboard: ReturnType<typeof mockClipboard>;

  beforeEach(() => {
    clipboard = mockClipboard();
    mockGetShareTargets.mockClear();
  });

  afterEach(() => {
    clipboard.restore();
    vi.restoreAllMocks();
    cleanupDOM();
  });

  describe('mode selection', () => {
    it.each([
      { mode: 'timer' as const },
      { mode: 'absolute' as const },
    ])('should render a simple share button for %s mode', ({ mode }) => {
      const controller = createShareControl({
        mode,
        getShareTargets: mockGetShareTargets,
      });
      const element = controller.getElement();

      expect(element.tagName).toBe('BUTTON');
      expect(element.getAttribute('data-testid')).toBe('share-button');
      expect(element.getAttribute('aria-haspopup')).toBeNull();
    });

    it('should create a menu for wall-clock mode', () => {
      const controller = createShareControl({
        mode: 'wall-clock',
        getShareTargets: mockGetShareTargets,
      });
      const element = controller.getElement();

      // Menu is a container div
      expect(element.tagName).toBe('DIV');
      expect(element.classList.contains('share-menu-container')).toBe(true);
      
      // Should have button with aria-haspopup
      const button = element.querySelector('[data-testid="share-button"]');
      expect(button?.getAttribute('aria-haspopup')).toBe('menu');
    });
  });

  describe('onCopy callback', () => {
    it('should call onCopy with type for wall-clock mode', async () => {
      const onCopy = vi.fn();
      const controller = createShareControl({
        mode: 'wall-clock',
        getShareTargets: mockGetShareTargets,
        onCopy,
      });
      document.body.appendChild(controller.getElement());

      const button = controller.getElement().querySelector('[data-testid="share-button"]') as HTMLButtonElement;
      const selectedTzItem = controller.getElement().querySelector('[data-testid="share-selected-timezone"]') as HTMLButtonElement;

      button.click();
      selectedTzItem.click();
      await vi.waitFor(() => {
        expect(onCopy).toHaveBeenCalled();
      });

      expect(onCopy).toHaveBeenCalledWith(mockShareTargets.withSelectedTimezone, 'withSelectedTimezone');
    });

    it('should call onCopy with withSelectedTimezone type for timer mode', async () => {
      const onCopy = vi.fn();
      const controller = createShareControl({
        mode: 'timer',
        getShareTargets: mockGetShareTargets,
        onCopy,
      });
      const element = controller.getElement();

      element.click();
      await vi.waitFor(() => {
        expect(onCopy).toHaveBeenCalled();
      });

      expect(onCopy).toHaveBeenCalledWith(mockShareTargets.withSelectedTimezone, 'withSelectedTimezone');
    });
  });

  describe('on-demand URL computation', () => {
    it('should call getShareTargets on each copy action', async () => {
      const controller = createShareControl({
        mode: 'timer',
        getShareTargets: mockGetShareTargets,
      });
      const element = controller.getElement();

      // First click
      element.click();
      await vi.waitFor(() => {
        expect(mockGetShareTargets).toHaveBeenCalledTimes(1);
      });

      // Second click
      element.click();
      await vi.waitFor(() => {
        expect(mockGetShareTargets).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('destroy', () => {
    it('should clean up resources without throwing', () => {
      const controller = createShareControl({
        mode: 'wall-clock',
        getShareTargets: mockGetShareTargets,
      });

      // Open the menu to activate focus trap
      const element = controller.getElement();
      element.querySelector('button')?.click();

      // Should not throw when destroying
      expect(() => controller.destroy()).not.toThrow();
    });

    it('should forward destroy to simple button controller', async () => {
      const controller = createShareControl({
        mode: 'timer', // Simple button mode, not menu
        getShareTargets: mockGetShareTargets,
      });
      const element = controller.getElement();

      // First click works
      element.click();
      await vi.waitFor(() => {
        expect(mockGetShareTargets).toHaveBeenCalledTimes(1);
      });

      // Destroy and verify click handler is removed
      controller.destroy();
      mockGetShareTargets.mockClear();
      element.click();
      
      // After destroy, click should not trigger handler
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(mockGetShareTargets).not.toHaveBeenCalled();
    });
  });
});
