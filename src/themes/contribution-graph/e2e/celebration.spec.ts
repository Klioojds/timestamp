/**
 * ContributionGraph Theme Celebration Tests
 *
 * Tests the wall-build animation and pixel art celebration text.
 */

import { expect, test } from '@playwright/test';

// Use a timer that expires in 2 seconds
const QUICK_TIMER_URL = '/?theme=contribution-graph&mode=timer&duration=2';

test.describe('ContributionGraph Theme: Celebration', () => {
  test('should show wall-building animation when timer completes', async ({ page }) => {
    await page.goto(QUICK_TIMER_URL);

    // Wait for countdown to display
    const countdownDisplay = page.getByTestId('countdown-display');
    await expect(countdownDisplay).toBeVisible();

    // Wait for timer to complete and wall build to start
    await page.waitForTimeout(3000);

    // Check for wall-building or celebration state
    const grid = page.locator('.contribution-graph-grid');
    await expect(grid).toBeAttached();

    // Either wall squares (during animation) or message squares (after animation) should exist
    const wallOrMessage = await page.locator('.contribution-graph-square.is-wall, .contribution-graph-square.is-message').count();
    expect(wallOrMessage).toBeGreaterThan(0);
  });

  test('should display pixel art message after celebration animation', async ({ page }) => {
    await page.goto(QUICK_TIMER_URL);

    // Wait for celebration to complete (wall build + fade + text reveal)
    await page.waitForTimeout(4500);

    // Message squares should be visible
    const messageSquares = page.locator('.contribution-graph-square.is-message');
    await expect(messageSquares.first()).toBeAttached({ timeout: 5000 });

    const count = await messageSquares.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('ContributionGraph Theme: Reduced Motion Celebration', () => {
  test('should show pixel art immediately with reduced motion', async ({ page }) => {
    // Enable reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });

    await page.goto(QUICK_TIMER_URL);

    // Wait for timer to expire
    await page.waitForTimeout(3000);

    // With reduced motion, message should appear immediately (no wall build)
    const messageSquares = page.locator('.contribution-graph-square.is-message');
    await expect(messageSquares.first()).toBeAttached({ timeout: 2000 });
  });
});
