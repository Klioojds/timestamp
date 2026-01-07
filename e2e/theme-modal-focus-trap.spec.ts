/**
 * Theme Modal Focus Trap E2E Tests
 * 
 * Verifies that keyboard focus remains trapped within the theme selector modal
 * when open on the countdown page, preventing users from tabbing to elements
 * behind the modal overlay.
 */

import { expect, test } from '@playwright/test';
import { waitForCountdown } from './fixtures/test-utils';

test.describe('Theme Modal Focus Trap', () => {
  test('should trap Tab focus within modal when open', async ({ page }) => {
    // Arrange - Start countdown
    await page.goto('/?mode=timer&duration=3600');
    await waitForCountdown(page);

    // Act - Open theme modal
    await page.getByTestId('theme-switcher').click();
    await expect(page.getByTestId('theme-modal')).toBeVisible();

    // Verify elements outside modal exist but should not be reachable via Tab
    const outsideButton = page.getByTestId('timer-play-pause');
    await expect(outsideButton).toBeVisible(); // Exists but should not be focusable

    // Focus should start in search input
    const searchInput = page.getByTestId('theme-search-input');
    await expect(searchInput).toBeFocused();

    // Act - Press Tab multiple times to cycle through modal elements
    await page.keyboard.press('Tab'); // Should go to next element in modal
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Assert - Focus should still be within modal, not on outside elements
    const focusedElement = page.locator(':focus');
    const isInsideModal = await focusedElement.evaluate((el) => {
      const modal = document.querySelector('[data-testid="theme-modal"]');
      return modal?.contains(el) ?? false;
    });

    expect(isInsideModal).toBe(true);
  });

  test('should cycle focus back to first element when tabbing from last element', async ({ page }) => {
    // Arrange - Start countdown and open modal
    await page.goto('/?mode=timer&duration=3600');
    await waitForCountdown(page);
    await page.getByTestId('theme-switcher').click();
    await expect(page.getByTestId('theme-modal')).toBeVisible();

    const searchInput = page.getByTestId('theme-search-input');
    await expect(searchInput).toBeFocused();

    // Act - Tab through all modal elements to reach the last focusable element
    // The close button should be the last tab stop
    const closeButton = page.getByTestId('theme-modal-close');
    await closeButton.focus();
    await expect(closeButton).toBeFocused();

    // Tab one more time - should cycle back to first element (search input)
    await page.keyboard.press('Tab');

    // Assert - Should be back at search input
    await expect(searchInput).toBeFocused();
  });

  test('should cycle focus back to last element when shift-tabbing from first element', async ({ page }) => {
    // Arrange - Start countdown and open modal
    await page.goto('/?mode=timer&duration=3600');
    await waitForCountdown(page);
    await page.getByTestId('theme-switcher').click();
    await expect(page.getByTestId('theme-modal')).toBeVisible();

    const searchInput = page.getByTestId('theme-search-input');
    await expect(searchInput).toBeFocused();

    // Act - Shift+Tab from first element
    await page.keyboard.press('Shift+Tab');

    // Assert - Should jump to last focusable element (close button)
    const closeButton = page.getByTestId('theme-modal-close');
    await expect(closeButton).toBeFocused();
  });

  test('should close modal with Escape key and restore focus to trigger button', async ({ page }) => {
    // Arrange - Start countdown and open modal
    await page.goto('/?mode=timer&duration=3600');
    await waitForCountdown(page);
    
    const themeSwitcher = page.getByTestId('theme-switcher');
    await themeSwitcher.click();
    await expect(page.getByTestId('theme-modal')).toBeVisible();

    // Act - Press Escape
    await page.keyboard.press('Escape');

    // Assert - Modal should close and focus should return to theme switcher button
    await expect(page.getByTestId('theme-modal')).not.toBeVisible();
    await expect(themeSwitcher).toBeFocused();
  });
});
