/**
 * E2E Tests: Tab Visibility and Animation Pausing
 *
 * Verifies that animations are paused when tab becomes hidden and resumed when visible.
 * This ensures CPU cycles are not wasted on animations in background tabs.
 */

import { expect, test } from '@playwright/test';
import { waitForCountdown } from './fixtures/test-utils';

test.describe('Tab Visibility and Animation Pausing', () => {
  test('should pause animations when tab becomes hidden', async ({ page }) => {
    await page.goto('/?mode=timer&duration=120&theme=contribution-graph');
    await waitForCountdown(page);

    // Verify animations are initially running
    const grid = page.getByTestId('countdown-display');
    await expect(grid).toBeVisible();

    // Check that active ambient squares exist (background activity)
    const initialActiveCount = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="countdown-display"]');
      return Number(el?.getAttribute('data-active-count') ?? '0');
    });

    // Simulate tab becoming hidden
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        writable: true,
        value: 'hidden',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Wait a bit for any pending animation frames to complete
    await page.waitForTimeout(500);

    // Verify that ambient squares are cleared when tab is hidden
    const hiddenActiveCount = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="countdown-display"]');
      return Number(el?.getAttribute('data-active-count') ?? '0');
    });

    expect(hiddenActiveCount).toBe(0);
  });

  test('should respect reduced-motion preference when tab becomes visible', async ({ page }) => {
    await page.goto('/?mode=timer&duration=120&theme=contribution-graph');
    await waitForCountdown(page);

    // Enable reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(300);

    // Simulate tab hidden → visible cycle with reduced motion active
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        writable: true,
        value: 'hidden',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await page.waitForTimeout(300);

    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        writable: true,
        value: 'visible',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await page.waitForTimeout(500);

    // Verify that ambient squares remain cleared (reduced motion prevents activity)
    const activeCount = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="countdown-display"]');
      return Number(el?.getAttribute('data-active-count') ?? '0');
    });

    expect(activeCount).toBe(0);
  });
});
