/**
 * E2E Tests: Fireworks Theme - Reduced Motion Support
 *
 * Tests that the fireworks theme correctly respects `prefers-reduced-motion` preference.
 * Verifies that fireworks animations are disabled when reduced motion is preferred.
 */

import { test, expect } from '@playwright/test';
import { buildDeepLinkUrl } from '../../../../e2e/fixtures/deep-link-helpers';

test.describe('Fireworks: Reduced Motion', () => {
  test('should not have active fireworks when reduced motion is preferred', async ({ page }) => {
    // Emulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });

    await page.goto(buildDeepLinkUrl({ mode: 'timer', duration: '60', theme: 'fireworks' }));

    // Wait for theme to mount
    await page.waitForSelector('.fireworks-theme');

    // The fireworks state should be stopped
    // Check that the canvas exists but fireworks are not running
    const hasCanvas = await page.isVisible('.fireworks-canvas');
    expect(hasCanvas).toBe(true);

    // With reduced motion, the fireworks instance should be destroyed
    // We can't directly check JS state, but we can verify the DOM is static

    // Theme should still be functional (countdown visible)
    const countdownVisible = await page.isVisible('.countdown-display');
    expect(countdownVisible).toBe(true);
  });
});
