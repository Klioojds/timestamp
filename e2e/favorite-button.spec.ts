import { expect, test, type Page } from '@playwright/test';
import { buildDeepLinkUrl } from './fixtures/deep-link-helpers';
import { waitForCountdown, waitForLandingPage } from './fixtures/test-utils';

const FUTURE_TARGET = new Date('2099-01-01T00:00:00').toISOString().slice(0, -1);

async function startCountdownFromLanding(page: Page, theme: 'contribution-graph' | 'fireworks' = 'contribution-graph'): Promise<void> {
  await page.goto('/');
  await waitForLandingPage(page);
  
  // Select theme
  const themeCardName = page.locator('.theme-selector-card-name', { 
    hasText: theme === 'fireworks' ? 'Fireworks' : 'Contribution Graph' 
  });
  await themeCardName.click();
  
  // Wait for theme background to render
  if (theme === 'fireworks') {
    await expect(page.locator('.landing-theme-background--fireworks')).toBeVisible({ timeout: 5000 });
    await page.waitForSelector('.landing-star', { timeout: 5000, state: 'attached' });
  } else {
    await expect(page.locator('.landing-theme-background--contribution-graph')).toBeVisible({ timeout: 5000 });
  }
  
  // Set up timer mode for quick testing
  await page.getByTestId('landing-mode-timer').check();
  await page.getByTestId('landing-duration-hours').fill('00');
  await page.getByTestId('landing-duration-minutes').fill('01');
  await page.getByTestId('landing-duration-seconds').fill('30');
  await page.getByTestId('landing-start-button').click();
  await waitForCountdown(page);
}

test.describe('Favorite Button on Countdown', () => {
  test('should appear in the button container beside share and theme switcher', async ({ page }) => {
    await startCountdownFromLanding(page);

    const shareButton = page.getByTestId('share-button');
    const favoriteButton = page.getByTestId('favorite-button');
    const themeSwitcher = page.getByTestId('theme-switcher');

    await expect(shareButton).toBeVisible();
    await expect(favoriteButton).toBeVisible();
    await expect(themeSwitcher).toBeVisible();

    // Verify horizontal layout (favorite button between share and theme switcher)
    const shareRect = await shareButton.boundingBox();
    const favoriteRect = await favoriteButton.boundingBox();
    const themeRect = await themeSwitcher.boundingBox();

    expect(shareRect).toBeTruthy();
    expect(favoriteRect).toBeTruthy();
    expect(themeRect).toBeTruthy();

    if (!shareRect || !favoriteRect || !themeRect) {
      throw new Error('Unable to measure button positions');
    }

    // Favorite button should be between share and theme switcher
    expect(favoriteRect.x).toBeGreaterThan(shareRect.x);
    expect(themeRect.x).toBeGreaterThan(favoriteRect.x);
  });

  test('should have correct accessibility attributes when theme is not favorited', async ({ page }) => {
    // Clear localStorage to ensure clean state
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    
    await startCountdownFromLanding(page);

    const favoriteButton = page.getByTestId('favorite-button');
    await expect(favoriteButton).toHaveAttribute('aria-pressed', 'false');
    await expect(favoriteButton).toHaveAttribute('aria-label', 'Add to favorites');
  });

  test('should toggle favorite status when clicked', async ({ page }) => {
    // Clear localStorage to ensure clean state
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    
    await startCountdownFromLanding(page);

    const favoriteButton = page.getByTestId('favorite-button');

    // Initial state: not favorited
    await expect(favoriteButton).toHaveAttribute('aria-pressed', 'false');
    await expect(favoriteButton).toHaveAttribute('aria-label', 'Add to favorites');

    // Click to favorite
    await favoriteButton.click();
    await expect(favoriteButton).toHaveAttribute('aria-pressed', 'true');
    await expect(favoriteButton).toHaveAttribute('aria-label', 'Remove from favorites');

    // Click again to unfavorite
    await favoriteButton.click();
    await expect(favoriteButton).toHaveAttribute('aria-pressed', 'false');
    await expect(favoriteButton).toHaveAttribute('aria-label', 'Add to favorites');
  });

  test('should persist favorite status after page reload', async ({ page }) => {
    // Clear localStorage to ensure clean state
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    
    await startCountdownFromLanding(page, 'contribution-graph');

    const favoriteButton = page.getByTestId('favorite-button');

    // Favorite the theme
    await favoriteButton.click();
    await expect(favoriteButton).toHaveAttribute('aria-pressed', 'true');

    // Reload the page with the same theme
    const deepLinkUrl = buildDeepLinkUrl({
      mode: 'wall-clock',
      target: FUTURE_TARGET,
      theme: 'contribution-graph',
      skip: true,
    });
    await page.goto(deepLinkUrl);
    await waitForCountdown(page);

    // Verify favorite status persists
    const reloadedFavoriteButton = page.getByTestId('favorite-button');
    await expect(reloadedFavoriteButton).toHaveAttribute('aria-pressed', 'true');
    await expect(reloadedFavoriteButton).toHaveAttribute('aria-label', 'Remove from favorites');
  });

  test('should update when switching themes', async ({ page }) => {
    // Clear localStorage and set up specific favorites
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      // Pre-favorite fireworks theme
      localStorage.setItem('countdown:favorites', JSON.stringify(['fireworks']));
    });
    
    // Start with contribution-graph (not favorited)
    const deepLinkUrl = buildDeepLinkUrl({
      mode: 'wall-clock',
      target: FUTURE_TARGET,
      theme: 'contribution-graph',
      skip: true,
    });
    await page.goto(deepLinkUrl);
    await waitForCountdown(page);

    const favoriteButton = page.getByTestId('favorite-button');

    // contribution-graph should not be favorited
    await expect(favoriteButton).toHaveAttribute('aria-pressed', 'false');

    // Switch to fireworks theme (which is favorited)
    const themeSwitcher = page.getByTestId('theme-switcher');
    await themeSwitcher.click();

    // Wait for theme modal specifically
    const modal = page.getByTestId('theme-modal');
    await expect(modal).toBeVisible();

    // Click fireworks theme
    const fireworksCard = page.locator('[data-theme-id="fireworks"]');
    await fireworksCard.click();

    // Wait for theme switch to complete

    // Favorite button should now show favorited state
    await expect(favoriteButton).toHaveAttribute('aria-pressed', 'true');
    await expect(favoriteButton).toHaveAttribute('aria-label', 'Remove from favorites');
  });

  test('should be keyboard accessible', async ({ page }) => {
    // Clear localStorage to ensure clean state
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    
    await startCountdownFromLanding(page);

    const favoriteButton = page.getByTestId('favorite-button');

    // Initial state
    await expect(favoriteButton).toHaveAttribute('aria-pressed', 'false');

    // Focus the button
    await favoriteButton.focus();

    // Press Enter key
    await page.keyboard.press('Enter');
    await expect(favoriteButton).toHaveAttribute('aria-pressed', 'true');

    // Press Space key
    await page.keyboard.press('Space');
    await expect(favoriteButton).toHaveAttribute('aria-pressed', 'false');
  });
});
