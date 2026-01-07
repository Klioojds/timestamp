/**
 * @file css-custom-properties.spec.ts
 * @description Lean E2E smokes for responsive CSS variables. Detailed assertions live in unit tests
 * (`@themes/shared/responsive-layout.test.ts`).
 */

import { test, expect, type Page } from '@playwright/test';
import { waitForCountdown } from './fixtures/test-utils';

const MOBILE_VIEWPORT = { width: 375, height: 667 };
const DESKTOP_VIEWPORT = { width: 1440, height: 900 };
const TIMER_TEST_URL = '/?theme=contribution-graph&mode=timer&duration=3600';

async function readBreakpoint(page: Page): Promise<string> {
  return page.evaluate(() =>
    getComputedStyle(document.documentElement)
      .getPropertyValue('--viewport-breakpoint')
      .trim(),
  );
}

test.describe('Responsive CSS variables (smoke)', () => {
  test('applies mobile breakpoint vars on load', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto(TIMER_TEST_URL);
    await waitForCountdown(page);

    const breakpoint = await readBreakpoint(page);
    await expect(page.getByTestId('countdown-display')).toBeVisible();
    expect(breakpoint).toBe('mobile');
  });

  test('applies desktop breakpoint vars on load', async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto(TIMER_TEST_URL);
    await waitForCountdown(page);

    const breakpoint = await readBreakpoint(page);
    await expect(page.getByTestId('countdown-display')).toBeVisible();
    expect(breakpoint).toBe('desktop');
  });

  test('updates breakpoint vars after resize mobile → desktop', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto(TIMER_TEST_URL);
    await waitForCountdown(page);
    expect(await readBreakpoint(page)).toBe('mobile');

    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.waitForFunction(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue('--viewport-breakpoint')
        .trim() === 'desktop',
    );

    expect(await readBreakpoint(page)).toBe('desktop');
  });
});
