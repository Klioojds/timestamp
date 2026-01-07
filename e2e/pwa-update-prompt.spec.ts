/**
 * E2E tests for PWA update prompt
 *
 * Tests update prompt visibility, responsive positioning, and accessibility.
 *
 * Note: Testing actual SW updates is challenging in E2E tests. These tests
 * focus on the UI component behavior when the prompt is shown.
 */

import { expect, test, type Page } from '@playwright/test';

/**
 * Helper to inject and show the update prompt for testing.
 * This simulates what happens when a SW update is available.
 */
async function showUpdatePrompt(page: Page): Promise<void> {
  await page.evaluate(() => {
    // Dispatch the custom event that triggers the update prompt
    window.dispatchEvent(new CustomEvent('pwa:update-available', {
      detail: { registration: null },
    }));
  });
}

/**
 * Locate the update prompt container via its ARIA role to avoid brittle class selectors.
 */
function getUpdatePrompt(page: Page) {
  return page.getByRole('status').filter({ has: page.getByRole('button', { name: 'Refresh' }) });
}

test.describe('PWA Update Prompt', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the landing page
    await page.goto('/timestamp/');
    await page.waitForLoadState('networkidle');
  });

  test('should have correct ARIA attributes for accessibility', async ({ page }) => {
    await showUpdatePrompt(page);

    const container = getUpdatePrompt(page);
    await expect(container).toBeVisible({ timeout: 3000 });

    // Verify ARIA attributes
    await expect(container).toHaveAttribute('aria-live', 'assertive');
    await expect(container).toHaveAttribute('role', 'status');
  });

  test('should have Refresh and Dismiss buttons', async ({ page }) => {
    await showUpdatePrompt(page);

    const container = getUpdatePrompt(page);
    const refreshBtn = container.getByRole('button', { name: 'Refresh' });
    const dismissBtn = container.getByRole('button', { name: 'Dismiss update notification' });

    await expect(refreshBtn).toBeVisible({ timeout: 3000 });
    await expect(dismissBtn).toBeVisible();
    await expect(refreshBtn).toHaveText('Refresh');
    await expect(dismissBtn).toHaveAttribute('aria-label', 'Dismiss update notification');
  });

  test('should dismiss on Escape key', async ({ page }) => {
    await showUpdatePrompt(page);

    const container = getUpdatePrompt(page);
    await expect(container).toHaveClass(/--visible/, { timeout: 3000 });

    // Press Escape
    await page.keyboard.press('Escape');

    // Should no longer be visible
    await expect(container).not.toHaveClass(/--visible/);
  });

  test('should dismiss on dismiss button click', async ({ page }) => {
    await showUpdatePrompt(page);

    const container = getUpdatePrompt(page);
    await expect(container).toHaveClass(/--visible/, { timeout: 3000 });

    // Click dismiss
    await container.getByRole('button', { name: 'Dismiss update notification' }).click();

    // Should no longer be visible
    await expect(container).not.toHaveClass(/--visible/);
  });

  test.describe('Responsive Positioning', () => {
    test('should be positioned at top-center on desktop', async ({ page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1200, height: 800 });

      await showUpdatePrompt(page);

      const container = getUpdatePrompt(page);
      await expect(container).toBeVisible({ timeout: 3000 });

      // Check CSS properties for top positioning
      const styles = await container.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          top: computed.top,
          bottom: computed.bottom,
          left: computed.left,
          transform: computed.transform,
        };
      });

      // On desktop, should have top positioning (top: 1rem = 16px)
      expect(styles.top).toBe('16px');
    });

    test('should be positioned at bottom-center on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await showUpdatePrompt(page);

      const container = getUpdatePrompt(page);
      await expect(container).toBeVisible({ timeout: 3000 });

      // Check CSS properties for bottom positioning
      const styles = await container.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return {
          bottom: computed.bottom,
          // Use bounding rect to verify position is near bottom
          distanceFromBottom: window.innerHeight - rect.bottom,
        };
      });

      // On mobile, should have bottom positioning (bottom: 1rem = 16px)
      // The element should be near the bottom of the viewport
      expect(styles.bottom).toBe('16px');
      expect(styles.distanceFromBottom).toBeLessThan(50); // Near bottom
    });
  });

  test.describe('Accessibility', () => {
    test('buttons should have minimum 44px touch targets', async ({ page }) => {
      await showUpdatePrompt(page);

      const container = getUpdatePrompt(page);
      const refreshBtn = container.getByRole('button', { name: 'Refresh' });
      const dismissBtn = container.getByRole('button', { name: 'Dismiss update notification' });

      await expect(refreshBtn).toBeVisible({ timeout: 3000 });

      // Check minimum dimensions
      // Use Math.round to handle sub-pixel floating-point differences (e.g., 43.999996 vs 44)
      const refreshSize = await refreshBtn.boundingBox();
      const dismissSize = await dismissBtn.boundingBox();

      expect(Math.round(refreshSize?.height ?? 0)).toBeGreaterThanOrEqual(44);
      expect(Math.round(dismissSize?.width ?? 0)).toBeGreaterThanOrEqual(44);
      expect(Math.round(dismissSize?.height ?? 0)).toBeGreaterThanOrEqual(44);
    });
  });

  test.describe('Reduced Motion', () => {
    test('should have no-animation class when prefers-reduced-motion', async ({ page }) => {
      // Emulate reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });

      await showUpdatePrompt(page);

      const container = getUpdatePrompt(page);
      await expect(container).toBeVisible({ timeout: 3000 });
      await expect(container).toHaveClass(/--no-animation/);
    });
  });
});
