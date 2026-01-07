/**
 * E2E Tests: Reduced Motion Support (Cross-Cutting)
 *
 * Tests that the application correctly respects `prefers-reduced-motion` preference.
 * Verifies that the `data-reduced-motion` attribute is properly set across all themes.
 *
 * NOTE: Theme-specific reduced motion tests are located in:
 * - src/themes/contribution-graph/e2e/reduced-motion.spec.ts
 * - src/themes/fireworks/e2e/reduced-motion.spec.ts
 */

import { test, expect } from '@playwright/test';
import { buildDeepLinkUrl } from './fixtures/deep-link-helpers';
import { getThemeIdsForTest } from './fixtures/theme-fixtures';

const THEMES_UNDER_TEST = getThemeIdsForTest();

test.describe('Reduced Motion Support (Cross-Cutting)', () => {
  test.describe('data-reduced-motion attribute', () => {
    test('should reflect reduced motion preference changes end-to-end', async ({ page }) => {
      await page.goto(
        buildDeepLinkUrl({ mode: 'timer', duration: '60', theme: 'contribution-graph' })
      );

      await page.waitForSelector('[data-testid="theme-container"]');

      // Baseline: no preference
      await expect(page).toHaveURL(/theme=contribution-graph/);
      let reducedMotion = await page.evaluate(() =>
        document.documentElement.getAttribute('data-reduced-motion')
      );
      expect(reducedMotion).toBe('false');

      // Enable reduced motion
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.waitForFunction(
        () => document.documentElement.getAttribute('data-reduced-motion') === 'true'
      );
      reducedMotion = await page.evaluate(() =>
        document.documentElement.getAttribute('data-reduced-motion')
      );
      expect(reducedMotion).toBe('true');

      // Disable again to ensure bidirectional updates
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.waitForFunction(
        () => document.documentElement.getAttribute('data-reduced-motion') === 'false'
      );
      reducedMotion = await page.evaluate(() =>
        document.documentElement.getAttribute('data-reduced-motion')
      );
      expect(reducedMotion).toBe('false');
    });
  });

  test.describe('Theme switching with reduced motion', () => {
    for (const themeId of THEMES_UNDER_TEST) {
      test(`should maintain reduced motion state when switching to ${themeId}`, async ({
        page,
      }) => {
        // Start with reduced motion enabled
        await page.emulateMedia({ reducedMotion: 'reduce' });

        await page.goto(
          buildDeepLinkUrl({ mode: 'timer', duration: '60', theme: 'contribution-graph' })
        );
        await page.waitForSelector('[data-testid="theme-container"]');

        // Verify reduced motion is active
        let reducedMotion = await page.evaluate(() => {
          return document.documentElement.getAttribute('data-reduced-motion');
        });
        expect(reducedMotion).toBe('true');

        // Switch to target theme via URL navigation
        await page.goto(buildDeepLinkUrl({ mode: 'timer', duration: '60', theme: themeId }));
        await page.waitForSelector('[data-testid="theme-container"]');

        // Reduced motion should still be active
        reducedMotion = await page.evaluate(() => {
          return document.documentElement.getAttribute('data-reduced-motion');
        });
        expect(reducedMotion).toBe('true');
      });
    }
  });
});
