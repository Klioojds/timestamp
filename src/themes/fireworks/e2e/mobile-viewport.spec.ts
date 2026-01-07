/**
 * Fireworks Theme Mobile Viewport Tests
 *
 * Tests mobile viewport behavior specific to the fireworks theme.
 */

import { test, expect } from '@playwright/test';

const MOBILE_VIEWPORT = { width: 375, height: 667 };
const LARGE_MOBILE_VIEWPORT = { width: 414, height: 896 };
const SMALL_MOBILE_VIEWPORT = { width: 320, height: 568 };
const FIREWORKS_TEST_URL = '/?theme=fireworks&mode=wall-clock&target=2099-01-01T00:00:00';

const navigateToFireworks = async (
  page: import('@playwright/test').Page,
  viewport = MOBILE_VIEWPORT
) => {
  await page.setViewportSize(viewport);
  await page.goto(FIREWORKS_TEST_URL);
};

const expectBoundingBox = async (locator: import('@playwright/test').Locator) => {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  return box!;
};

test.describe('Fireworks Theme: Mobile Viewport', () => {
  test('keeps countdown and canvas within viewport bounds', async ({ page }) => {
    await navigateToFireworks(page, MOBILE_VIEWPORT);

    const countdownDisplay = page.getByTestId('countdown-display');
    const canvas = page.locator('canvas').first();
    const themeContainer = page.getByTestId('theme-container');

    await expect(countdownDisplay).toBeVisible();
    await expect(canvas).toBeVisible();
    await expect(themeContainer).toBeVisible();

    const [countdownBox, canvasBox, containerBox] = await Promise.all([
      expectBoundingBox(countdownDisplay),
      expectBoundingBox(canvas),
      expectBoundingBox(themeContainer),
    ]);

    expect(countdownBox.x).toBeGreaterThanOrEqual(0);
    expect(countdownBox.x + countdownBox.width).toBeLessThanOrEqual(MOBILE_VIEWPORT.width);

    expect(canvasBox.width).toBeGreaterThanOrEqual(MOBILE_VIEWPORT.width - 10);
    expect(canvasBox.height).toBeGreaterThanOrEqual(MOBILE_VIEWPORT.height - 10);

    expect(containerBox.x).toBeLessThanOrEqual(5);
    expect(containerBox.width).toBeGreaterThanOrEqual(MOBILE_VIEWPORT.width - 10);
  });

  test('maintains centered layout after viewport shrink', async ({ page }) => {
    await navigateToFireworks(page, LARGE_MOBILE_VIEWPORT);

    // User interaction: resize to a smaller device (simulates orientation change/device swap)
    await page.setViewportSize(SMALL_MOBILE_VIEWPORT);

    const countdownDisplay = page.getByTestId('countdown-display');
    const themeContainer = page.getByTestId('theme-container');

    await expect(countdownDisplay).toBeVisible();
    await expect(themeContainer).toBeVisible();

    const countdownBox = await expectBoundingBox(countdownDisplay);
    const centerX = countdownBox.x + countdownBox.width / 2;
    const screenCenter = SMALL_MOBILE_VIEWPORT.width / 2;

    expect(Math.abs(centerX - screenCenter)).toBeLessThan(SMALL_MOBILE_VIEWPORT.width * 0.25);
    expect(countdownBox.x + countdownBox.width).toBeLessThanOrEqual(SMALL_MOBILE_VIEWPORT.width);
  });
});
