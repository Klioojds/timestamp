import { expect, test, type Page } from '@playwright/test';

const waitForLanding = async (page: Page) => {
  await expect(page.getByTestId('landing-page')).toBeVisible();
  // Wait for background to render (async theme loading)
  // Landing page uses same squares as countdown theme
  await page.waitForSelector('.contribution-graph-square, .star', { timeout: 5000 });
};

test.describe('Landing Page', () => {
  test('should load landing page by default', async ({ page }) => {
    await page.goto('/');
    await waitForLanding(page);
    await expect(page.getByTestId('landing-mode-wall-clock')).toBeChecked();
  });

  test('should configure timer mode and start countdown', async ({ page }) => {
    await page.goto('/');
    await waitForLanding(page);

    await page.getByTestId('landing-mode-timer').check();
    // Use 10 seconds instead of 2 to prevent celebration before visibility check
    await page.getByTestId('landing-duration-seconds').fill('10');
    await page.getByTestId('landing-start-button').click();

    await expect(page.getByTestId('landing-page')).toBeHidden();
    // Use waitForSelector with attached state since aria-hidden may be set during celebration
    await page.waitForSelector('[data-testid="countdown-display"]', { state: 'attached' });
  });

  test('should start countdown immediately when using deep link skip', async ({ page }) => {
    // Use 10 seconds instead of 2 to prevent celebration before visibility check
    await page.goto('/?mode=timer&duration=10&skip=true');
    await expect(page.getByTestId('landing-page')).toBeHidden();
    // Use waitForSelector with attached state since aria-hidden may be set during celebration
    await page.waitForSelector('[data-testid="countdown-display"]', { state: 'attached' });
  });

  test('should fall back to landing page with error when deep link is invalid', async ({ page }) => {
    await page.goto('/?mode=timer&duration=invalid&skip=true');
    await expect(page.getByTestId('landing-page')).toBeVisible();
    // Error toast uses the unified toast system
    await expect(page.locator('.toast--error')).toBeVisible();
  });

  test('should display header inside landing card for proper text contrast', async ({ page }) => {
    await page.goto('/');
    await waitForLanding(page);

    // Header should be inside the card, not floating outside
    const header = page.getByTestId('landing-card').getByTestId('landing-header');
    await expect(header).toBeVisible();

    // Title should be readable
    const title = page.getByRole('heading', { name: 'Timestamp' });
    await expect(title).toBeVisible();
  });

  test('should clean up previous background when switching themes', async ({ page }) => {
    await page.goto('/');
    await waitForLanding(page);

      const background = page.getByTestId('landing-theme-background');
      await expect(background).toHaveAttribute('data-theme-id', 'contribution-graph');
    const contributionSquares = await page.locator('.contribution-graph-square').count();
    expect(contributionSquares).toBeGreaterThan(0);

    // Wait for theme card to be visible and scroll into view if needed
    const fireworksCard = page.getByTestId('theme-card-fireworks');
    await expect(fireworksCard).toBeVisible({ timeout: 5000 });
    await fireworksCard.scrollIntoViewIfNeeded();
    await fireworksCard.click();

    // Wait for theme background to update (async theme loading)
      await expect(background).toHaveAttribute('data-theme-id', 'fireworks');
    
    // Wait for stars to render
    await page.waitForSelector('.landing-star', { timeout: 5000, state: 'attached' });

    // GitHub squares should be cleaned up
    const contributionSquaresAfter = await page.locator('.contribution-graph-square').count();
    expect(contributionSquaresAfter).toBe(0);

    // Fireworks stars should be visible
    const stars = await page.locator('.landing-star').count();
    expect(stars).toBe(30);
  });

  test('should show error when timer mode has no duration values', async ({ page }) => {
    await page.goto('/');
    await waitForLanding(page);

    // Switch to timer mode
    await page.getByTestId('landing-mode-timer').check();

    // Don't fill any duration fields - leave them empty
    // Click start button
    await page.getByTestId('landing-start-button').click();

    // Should show error toast (unified toast system with toast-{id} format)
    const errorToast = page.locator('[data-testid="toast-landing-error-toast"]');
    await expect(errorToast).toBeVisible();
    await expect(errorToast).toContainText('Duration required');

    // Should show inline error
    const durationError = page.locator('#landing-duration-error');
    await expect(durationError).toBeVisible();
    await expect(durationError).toContainText('at least one value');

    // Should not have started countdown
    await expect(page.getByTestId('landing-page')).toBeVisible();
  });

  test('should accept timer with only one field filled', async ({ page }) => {
    await page.goto('/');
    await waitForLanding(page);

    // Switch to timer mode
    await page.getByTestId('landing-mode-timer').check();

    // Fill only seconds field
    await page.getByTestId('landing-duration-seconds').fill('10');

    // Click start button
    await page.getByTestId('landing-start-button').click();

    // Should start countdown
    await expect(page.getByTestId('landing-page')).toBeHidden();
    await page.waitForSelector('[data-testid="countdown-display"]', { state: 'attached' });
  });
});

test.describe('Theme Author Links', () => {
  /**
   * E2E Focus: Test the user flow of clicking author links.
   * Unit tests (theme-selector.test.ts) cover aria/href/target details.
   */
  test('should not select theme when clicking author link', async ({ page }) => {
    await page.goto('/');
    await waitForLanding(page);

    // First, switch to fireworks theme so contribution-graph is not selected
    // Click on card name to avoid author link
    const fireworksCardName = page.locator('.theme-selector-card-name', { hasText: 'Fireworks' });
    await fireworksCardName.click();
    
    // Wait for fireworks background to render (async theme loading)
      const background = page.getByTestId('landing-theme-background');
      await expect(background).toHaveAttribute('data-theme-id', 'fireworks');
    await page.waitForSelector('.landing-star', { timeout: 5000, state: 'attached' });

    // Verify fireworks is selected (fireworks background should be visible)
      await expect(background).toHaveAttribute('data-theme-id', 'fireworks');

    // Click the author link for contribution-graph
    const authorLink = page.getByTestId('theme-author-contribution-graph');

    // We need to intercept the navigation to prevent actually leaving the page
    await page.evaluate(() => {
      document.querySelector('[data-testid="theme-author-contribution-graph"]')?.addEventListener(
        'click',
        (e) => e.preventDefault(),
        { once: true }
      );
    });

    await authorLink.click();

    // Theme should NOT have switched - fireworks background should still be visible
      await expect(background).toHaveAttribute('data-theme-id', 'fireworks');
    // Contribution graph background should NOT be visible
      await expect(background).not.toHaveAttribute('data-theme-id', 'contribution-graph');
  });

  test('should be keyboard accessible via shortcut key', async ({ page }) => {
    await page.goto('/');
    await waitForLanding(page);

    const authorLink = page.getByTestId('theme-author-contribution-graph');
    // Grid pattern: focus the gridcell (first cell of the row)
    const gridcell = page.locator('[data-theme-id="contribution-graph"] > [role="gridcell"]:first-child');

    // Per roving tabindex pattern, nested interactive elements should
    // have tabindex="-1" and be accessible via keyboard shortcuts
    await expect(authorLink).toHaveAttribute('tabindex', '-1');

    // Focus the gridcell first (the main focusable element in the row)
    await gridcell.focus();

    // Press 'a' to activate the author link (per keyboard-nav.ts shortcut)
    // This should click the link - we can verify by checking page opened
    const [newPage] = await Promise.all([
      page.context().waitForEvent('page'),
      page.keyboard.press('a')
    ]);

    // The author profile page should open in a new tab
    await expect(newPage).toHaveURL(/github\.com\/chrisreddington/);
    await newPage.close();
  });
});

