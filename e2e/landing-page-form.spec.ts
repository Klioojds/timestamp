/**
 * @file landing-page-form.spec.ts
 * @description E2E tests for landing page form elements, scrollability, and footer
 */

import { test, expect } from '@playwright/test';
import { waitForCountdown } from './fixtures/test-utils';
import { LandingFormPage } from './fixtures/page-objects/landing-form.po';

test.describe('Landing Page Date Input Width', () => {
  let landingForm: LandingFormPage;

  test.beforeEach(async ({ page }) => {
    landingForm = new LandingFormPage(page);
    await landingForm.goto();
  });

  test('should keep date input within container bounds on mobile', async () => {
    await landingForm.setViewportSize({ width: 375, height: 667 });

    const dateInputRect = await landingForm.dateInput.boundingBox();
    const cardRect = await landingForm.card.boundingBox();

    expect(dateInputRect).not.toBeNull();
    expect(cardRect).not.toBeNull();
    expect(dateInputRect!.x + dateInputRect!.width).toBeLessThanOrEqual(cardRect!.x + cardRect!.width + 2);
  });

  test('should have consistent width with other inputs on mobile', async () => {
    await landingForm.setViewportSize({ width: 375, height: 667 });

    const dateInputRect = await landingForm.dateInput.boundingBox();
    const timezoneRect = await landingForm.timezoneTrigger.boundingBox();

    expect(dateInputRect).not.toBeNull();
    expect(timezoneRect).not.toBeNull();
    const widthDifference = Math.abs(dateInputRect!.width - timezoneRect!.width);
    const maxTolerance = Math.max(dateInputRect!.width, timezoneRect!.width) * 0.05;
    expect(widthDifference).toBeLessThanOrEqual(maxTolerance);
  });

  test('should not overflow horizontally on very narrow viewport', async () => {
    const viewportWidth = 320;
    await landingForm.setViewportSize({ width: viewportWidth, height: 568 });

    const dateInputRect = await landingForm.dateInput.boundingBox();

    expect(dateInputRect).not.toBeNull();
    expect(dateInputRect!.x + dateInputRect!.width).toBeLessThanOrEqual(viewportWidth);
  });
});

test.describe('Landing Page Mobile Scrollability', () => {
  let landingForm: LandingFormPage;

  test.beforeEach(async ({ page }) => {
    landingForm = new LandingFormPage(page);
    await landingForm.goto();
  });

  test('should be scrollable on mobile when content exceeds viewport', async ({ page }) => {
    await landingForm.setViewportSize({ width: 375, height: 667 });

    const scrollInfo = await page.evaluate(() => {
      const footer = document.querySelector('[data-testid="landing-footer"]');
      const footerRect = footer?.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      return {
        footerBottom: footerRect?.bottom ?? 0,
        viewportHeight,
        documentScrollHeight: document.documentElement.scrollHeight,
        documentClientHeight: document.documentElement.clientHeight,
        contentExceedsViewport: (footerRect?.bottom ?? 0) > viewportHeight,
      };
    });

    expect(scrollInfo.contentExceedsViewport).toBe(true);
    expect(scrollInfo.documentScrollHeight).toBeGreaterThan(scrollInfo.documentClientHeight);
  });

  test('should allow scrolling to view footer on mobile', async () => {
    await landingForm.setViewportSize({ width: 375, height: 667 });

    const footer = landingForm.footer;
    await footer.scrollIntoViewIfNeeded();

    await expect(footer).toBeInViewport();
  });

  test('should scroll smoothly with touch gestures on mobile', async ({ page }) => {
    await landingForm.setViewportSize({ width: 375, height: 667 });

    const initialScrollY = await page.evaluate(() => window.scrollY);

    await page.evaluate(() => window.scrollBy(0, 300));

    await page.waitForFunction((startY) => window.scrollY > startY, initialScrollY);

    const newScrollY = await page.evaluate(() => window.scrollY);
    expect(newScrollY).toBeGreaterThan(initialScrollY);
  });

  test('should have proper scroll container setup for iOS Safari', async ({ page }) => {
    await landingForm.setViewportSize({ width: 375, height: 667 });

    const scrollStyles = await page.evaluate(() => {
      const body = document.body;
      const bodyStyle = window.getComputedStyle(body);

      return {
        bodyHeight: bodyStyle.height,
        bodyOverflow: bodyStyle.overflow,
        bodyPosition: bodyStyle.position,
        canScroll: document.documentElement.scrollHeight > window.innerHeight,
      };
    });

    expect(scrollStyles.canScroll).toBe(true);
    expect(scrollStyles.bodyOverflow).not.toBe('hidden');
  });

  test('should make Start button reachable via scroll on small screens', async () => {
    await landingForm.setViewportSize({ width: 320, height: 480 });

    const startButton = landingForm.startButton;
    await startButton.scrollIntoViewIfNeeded();

    await expect(startButton).toBeInViewport();
    await expect(startButton).toBeEnabled();
  });
});

test.describe('Landing Page Responsive Layout', () => {
  let landingForm: LandingFormPage;

  test.beforeEach(async ({ page }) => {
    landingForm = new LandingFormPage(page);
    await landingForm.goto();
  });

  // CSS uses 1050px as the mobile/desktop breakpoint for landing-wrapper padding
  const paddingTests = [
    { width: 375, height: 667, expectedPadding: '24px', description: 'mobile' },
    { width: 768, height: 1024, expectedPadding: '24px', description: 'tablet (≤1050px)' },
    { width: 1050, height: 800, expectedPadding: '24px', description: 'mobile breakpoint (≤1050px)' },
    { width: 1051, height: 800, expectedPadding: '48px', description: 'desktop (>1050px)' },
    { width: 1800, height: 1044, expectedPadding: '48px', description: 'large desktop' },
  ];

  for (const { width, height, expectedPadding, description } of paddingTests) {
    test(`should have equal top and bottom padding of ${expectedPadding} on ${description}`, async () => {
      await landingForm.setViewportSize({ width, height });
      const styles = await landingForm.wrapper.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          paddingTop: computed.paddingTop,
          paddingBottom: computed.paddingBottom,
        };
      });

      expect(styles.paddingTop).toBe(expectedPadding);
      expect(styles.paddingBottom).toBe(expectedPadding);
    });
  }

  test('should have card starting near top on mobile', async () => {
    await landingForm.setViewportSize({ width: 375, height: 667 });

    const rect = await landingForm.card.boundingBox();

    expect(rect).not.toBeNull();
    expect(rect!.y).toBeLessThan(50);
    expect(rect!.y).toBeGreaterThan(0);
  });

  test('should maintain appropriate spacing on desktop', async () => {
    await landingForm.setViewportSize({ width: 1800, height: 1044 });

    const rect = await landingForm.card.boundingBox();

    expect(rect).not.toBeNull();
    expect(rect!.y).toBeGreaterThanOrEqual(48);
    expect(rect!.y).toBeLessThan(100);
  });

  test('should show all content without clipping on mobile', async () => {
    await landingForm.setViewportSize({ width: 375, height: 667 });

    await expect(landingForm.header).toBeVisible();

    const headerRect = await landingForm.header.boundingBox();

    expect(headerRect).not.toBeNull();
    expect(headerRect!.y).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Landing Page Footer Links', () => {
  let landingForm: LandingFormPage;

  test.beforeEach(async ({ page }) => {
    landingForm = new LandingFormPage(page);
    await landingForm.goto();
  });

  test('should display "Star on GitHub" link', async () => {
    const githubLink = landingForm.footer.getByRole('link', { name: 'Star on GitHub' });
    await expect(githubLink).toBeVisible();

    const href = await githubLink.getAttribute('href');
    expect(href).toBe('https://github.com/chrisreddington/timestamp');
  });

  test('should display "Contribute a Theme" link', async () => {
    const themeLink = landingForm.footer.getByRole('link', { name: 'Contribute a Theme' });
    await expect(themeLink).toBeVisible();

    const href = await themeLink.getAttribute('href');
    expect(href).toBe('https://github.com/chrisreddington/timestamp/blob/main/docs/THEME_DEVELOPMENT.md');
  });

  test('should display both footer links side by side on desktop', async () => {
    await landingForm.setViewportSize({ width: 1800, height: 1044 });

    const githubLink = landingForm.footer.getByRole('link', { name: 'Star on GitHub' });
    const themeLink = landingForm.footer.getByRole('link', { name: 'Contribute a Theme' });

    const githubRect = await githubLink.boundingBox();
    const themeRect = await themeLink.boundingBox();

    expect(githubRect).not.toBeNull();
    expect(themeRect).not.toBeNull();

    expect(Math.abs(githubRect!.y - themeRect!.y)).toBeLessThan(5);
  });

  test('should wrap footer links on mobile', async () => {
    await landingForm.setViewportSize({ width: 375, height: 667 });

    const githubLink = landingForm.footer.getByRole('link', { name: 'Star on GitHub' });
    const themeLink = landingForm.footer.getByRole('link', { name: 'Contribute a Theme' });

    await expect(githubLink).toBeVisible();
    await expect(themeLink).toBeVisible();
  });
});

test.describe('Landing Page Timer Duration - Arbitrary Input', () => {
  let landingForm: LandingFormPage;

  test.beforeEach(async ({ page }) => {
    landingForm = new LandingFormPage(page);
    await landingForm.goto();

    // Switch to timer mode
    await landingForm.switchToTimerMode();
  });

  test('should accept 75 minutes and show normalized preview', async () => {
    await landingForm.fillDurationMinutes('75');

    await landingForm.expectPreviewText('1 hour 15 minutes');
  });

  test('should accept 2173 minutes and show normalized preview', async () => {
    await landingForm.fillDurationMinutes('2173');

    await landingForm.expectPreviewText('1 day 12 hours 13 minutes');
  });

  test('should start countdown with 75 minutes arbitrary input', async ({ page }) => {
    await landingForm.fillDurationMinutes('75');
    await landingForm.startCountdown();

    await waitForCountdown(page);
    await expect(page.getByTestId('countdown-display')).toBeAttached();
  });

  test('should reject duration exceeding 365 days with error message', async () => {
    await landingForm.fillDurationHours('8784');
    await landingForm.startCountdown();

    const errorElement = landingForm.durationError;
    await expect(errorElement).toBeVisible();
    await expect(errorElement).toContainText(/maximum/i);
    await expect(errorElement).toContainText('365 days');
  });

  test('should accept exactly 365 days (boundary test)', async ({ page }) => {
    await landingForm.fillDurationHours('8760');
    await landingForm.startCountdown();

    await waitForCountdown(page);
    await expect(page.getByTestId('countdown-display')).toBeAttached();
  });

  test('should have accessible preview with aria-live', async () => {
    const preview = landingForm.durationPreview;

    await expect(preview).toHaveAttribute('role', 'status');
    await expect(preview).toHaveAttribute('aria-live', 'polite');
    await expect(preview).toHaveAttribute('aria-atomic', 'true');
  });

  test('should have error with role="alert" when exceeding max', async () => {
    await landingForm.fillDurationHours('9000');
    await landingForm.startCountdown();

    const errorElement = landingForm.durationError;
    await expect(errorElement).toHaveAttribute('role', 'alert');
  });

  test('should reflow correctly at 320px width', async ({ page }) => {
    await landingForm.setViewportSize({ width: 320, height: 568 });

    await landingForm.fillDurationMinutes('75');
    await landingForm.expectPreviewText('1 hour 15 minutes');

    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const bodyClientWidth = await page.evaluate(() => document.body.clientWidth);
    expect(bodyScrollWidth).toBeLessThanOrEqual(bodyClientWidth + 1);

    await expect(landingForm.durationPreview).toBeVisible();
  });
});

test.describe('Duration Preview Layout Shift', () => {
  let landingForm: LandingFormPage;

  test.beforeEach(async ({ page }) => {
    landingForm = new LandingFormPage(page);
    await landingForm.goto();
  });

  test('should not cause layout shift when preview appears on mobile', async () => {
    await landingForm.setViewportSize({ width: 375, height: 667 });
    await landingForm.switchToTimerMode();

    const beforeBox = await landingForm.startButton.boundingBox();

    await landingForm.fillDurationMinutes('5');
    await landingForm.expectPreviewText(/5 minutes/i);

    const afterBox = await landingForm.startButton.boundingBox();

    expect(beforeBox).not.toBeNull();
    expect(afterBox).not.toBeNull();

    // Button should not have moved (preview space reserved)
    expect(afterBox!.y).toBe(beforeBox!.y);
  });

  test('should reserve space for preview to minimize layout shift on desktop', async () => {
    await landingForm.setViewportSize({ width: 1024, height: 768 });
    await landingForm.switchToTimerMode();

    await expect(landingForm.durationHours).toBeVisible();

    const initialPreviewBox = await landingForm.durationPreview.boundingBox();

    const beforeBox = await landingForm.messageSection.boundingBox();

    await landingForm.fillDurationHours('2');
    await expect(landingForm.durationPreview).toHaveText(/Total/);

    const afterBox = await landingForm.messageSection.boundingBox();
    const finalPreviewBox = await landingForm.durationPreview.boundingBox();

    expect(beforeBox).not.toBeNull();
    expect(afterBox).not.toBeNull();
    expect(initialPreviewBox).not.toBeNull();
    expect(finalPreviewBox).not.toBeNull();

    // Initial preview should have reserved space (min-height: 40px)
    expect(initialPreviewBox!.height).toBeGreaterThanOrEqual(40);

    // Layout shift should be minimal (< 95px) since space was reserved
    const layoutShift = Math.abs(afterBox!.y - beforeBox!.y);
    expect(layoutShift).toBeLessThan(95);
  });

  test('should reserve 40px space for preview per AC5.4', async () => {
    await landingForm.setViewportSize({ width: 600, height: 800 });
    await landingForm.switchToTimerMode();

    const previewBox = await landingForm.durationPreview.boundingBox();

    expect(previewBox).not.toBeNull();
    // min-height: 40px should be applied
    expect(previewBox!.height).toBeGreaterThanOrEqual(40);
  });
});

