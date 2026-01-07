/**
 * @file landing-page-responsive.spec.ts
 * @description Consolidated E2E tests for landing page responsive layout behavior.
 * Includes smoke tests for background coverage, grid layout, and resize handling.
 */

import { test, expect } from '@playwright/test';
import { assertThemeLayout } from './fixtures/test-utils';

test.describe('Landing Page Responsive Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="landing-page"]');
  });

  test.describe('Background Coverage (smoke)', () => {
    test('maintains visual coverage after resize', async ({ page }) => {
      await page.setViewportSize({ width: 800, height: 600 });
      await page.reload();
      await page.waitForTimeout(300);

      await page.setViewportSize({ width: 1600, height: 1200 });
      await page.waitForTimeout(300);

      const background = page.getByTestId('landing-theme-background');
      const rect = await background.boundingBox();

      expect(rect).not.toBeNull();
      expect(rect!.width).toBeGreaterThanOrEqual(1600);
      expect(rect!.height).toBeGreaterThanOrEqual(1200);
    });
  });

  test.describe('Theme Grid Layout (smoke)', () => {
    // CSS uses 1050px as the mobile/tablet breakpoint for theme grid
    // Mobile (≤1050px): Single column
    // Desktop (>1050px): Multi-column

    test('stacks cards on mobile (375px)', async ({ page }) => {
      await assertThemeLayout({ page, viewport: { width: 375, height: 667 }, expectStacked: true });
    });

    test('stacks cards on tablet (≤1050px)', async ({ page }) => {
      await assertThemeLayout({ page, viewport: { width: 768, height: 1024 }, expectStacked: true });
    });

    test('shows multi-column layout on desktop (>1050px)', async ({ page }) => {
      await assertThemeLayout({ page, viewport: { width: 1440, height: 900 }, expectStacked: false });
    });
  });

  test.describe('Resize Handling (smoke)', () => {
    test('grid remains usable when resizing desktop → mobile → desktop', async ({ page }) => {
      // Use .first() because there are two grids (All Themes + Favorites tabs)
      const grid = page.getByTestId('theme-selector-grid').first();

      await page.setViewportSize({ width: 1200, height: 800 });
      await expect(grid).toBeVisible();

      await page.setViewportSize({ width: 480, height: 800 });
      await page.waitForTimeout(150);
      await expect(grid).toBeVisible();

      await page.setViewportSize({ width: 1280, height: 900 });
      await page.waitForTimeout(150);
      await expect(grid).toBeVisible();
    });
  });
});
