/**
 * E2E Tests: Countdown Display (Cross-Cutting)
 *
 * Tests cross-cutting countdown functionality that applies to all themes.
 *
 * NOTE: Theme-specific activity animation tests are located in:
 * - src/themes/contribution-graph/e2e/activity-animation.spec.ts
 */

import { test, expect } from '@playwright/test';
import { waitForCountdown } from './fixtures/test-utils';

test('should show loading state and announce when loaded', async ({ page }) => {
  // Arrange
  await page.goto('/?mode=timer&duration=3600');
  await waitForCountdown(page);
  const loading = page.getByText('Loading...');
  const countdown = page.getByTestId('countdown-display');
  const status = page.getByRole('status').filter({ hasText: /countdown loaded/i });

  // Assert - Check loading state is hidden
  await expect(loading).not.toBeVisible();

  // Assert - App is visible
  await expect(countdown).toBeVisible();

  // Assert - Check live region announcement
  await expect(status).toHaveText('Countdown loaded');
});

test.describe('GitHub Button', () => {
  test('should display GitHub button in countdown view header', async ({ page }) => {
    await page.goto('/?mode=timer&duration=60');
    await waitForCountdown(page);

    const githubButton = page.getByTestId('github-button');
    await expect(githubButton).toBeVisible();
  });

  test('should have correct href and attributes', async ({ page }) => {
    await page.goto('/?mode=timer&duration=60');
    await waitForCountdown(page);

    const githubButton = page.getByTestId('github-button');
    await expect(githubButton).toHaveAttribute(
      'href',
      'https://github.com/chrisreddington/timestamp'
    );
    await expect(githubButton).toHaveAttribute('target', '_blank');
    await expect(githubButton).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(githubButton).toHaveAttribute('aria-label', 'View on GitHub (opens in new tab)');
  });

  test('should be keyboard accessible', async ({ page }) => {
    await page.goto('/?mode=timer&duration=60');
    await waitForCountdown(page);

    const githubButton = page.getByTestId('github-button');
    await githubButton.focus();
    await expect(githubButton).toBeFocused();
  });
});
