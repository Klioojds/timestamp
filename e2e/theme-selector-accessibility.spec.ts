/**
 * Theme Selector Accessibility E2E Tests
 *
 * Tests accessibility for the theme selector component.
 * Covers:
 * - Sort dropdown keyboard navigation (Tab, Space, Enter, Arrow, Escape)
 * - Theme card keyboard shortcuts ('f' for favorite, 'a' for author)
 * - Listbox pattern compliance (single tabbable item, arrow navigation)
 * - Cross-browser compatibility (Chrome and Safari/WebKit)
 */

import { expect, test } from '@playwright/test';

test.describe('Theme Selector Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to landing page where theme selector is displayed
    await page.goto('/');
    // Wait for theme selector to be visible
    await page.waitForSelector('[data-testid="theme-selector"]');
  });

  test.describe('Sort Dropdown Keyboard Navigation', () => {
    test('should reach sort dropdown via Tab from search input', async ({ page }) => {
      const searchInput = page.getByTestId('theme-search-input');
      const sortButton = page.getByTestId('theme-sort-button');

      await searchInput.focus();
      await page.keyboard.press('Tab');

      await expect(sortButton).toBeFocused();
    });

    test('should open sort dropdown with Enter key', async ({ page }) => {
      const sortButton = page.getByTestId('theme-sort-button');
      const sortMenu = page.getByTestId('theme-sort-menu');

      await sortButton.focus();
      await page.keyboard.press('Enter');

      await expect(sortMenu).toHaveAttribute('aria-hidden', 'false');
    });

    test('should close sort dropdown with Escape key', async ({ page }) => {
      const sortButton = page.getByTestId('theme-sort-button');
      const sortMenu = page.getByTestId('theme-sort-menu');

      // Open the menu
      await sortButton.focus();
      await page.keyboard.press('Enter');
      await expect(sortMenu).toHaveAttribute('aria-hidden', 'false');

      // Close with Escape
      await page.keyboard.press('Escape');
      await expect(sortMenu).toHaveAttribute('aria-hidden', 'true');
      await expect(sortButton).toBeFocused();
    });

    test('should navigate sort options with Arrow keys', async ({ page }) => {
      const sortButton = page.getByTestId('theme-sort-button');

      await sortButton.focus();
      await page.keyboard.press('Enter');

      // Navigate down through options
      await page.keyboard.press('ArrowDown');
      const secondOption = page.getByTestId('theme-sort-option-name-desc');
      await expect(secondOption).toBeFocused();

      // Navigate up
      await page.keyboard.press('ArrowUp');
      const firstOption = page.getByTestId('theme-sort-option-name-asc');
      await expect(firstOption).toBeFocused();
    });

    test('should select sort option with Enter key', async ({ page }) => {
      const sortButton = page.getByTestId('theme-sort-button');
      const sortMenu = page.getByTestId('theme-sort-menu');

      await sortButton.focus();
      await page.keyboard.press('Enter');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');

      // Menu should close after selection
      await expect(sortMenu).toHaveAttribute('aria-hidden', 'true');
      // Button label should update
      await expect(sortButton).toContainText('Name (Z-A)');
    });

    test('should keep sort options out of Tab order when closed', async ({ page }) => {
      const sortOptions = page
        .getByTestId('theme-sort-menu')
        .locator('[data-testid^="theme-sort-option-"]');
      const count = await sortOptions.count();

      for (let i = 0; i < count; i++) {
        await expect(sortOptions.nth(i)).toHaveAttribute('tabindex', '-1');
      }
    });
  });

  test.describe('Theme Card Grid Pattern', () => {
    test('should use arrow keys to navigate between theme cards', async ({ page }) => {
      // Focus first theme card - target the select gridcell
      const firstCard = page.getByTestId('theme-card-contribution-graph');
      const firstCell = firstCard.locator('[role="gridcell"]').first();
      await firstCell.focus();
      await expect(firstCell).toBeFocused();

      // Arrow down to next card
      await page.keyboard.press('ArrowDown');
      // Should move to next card's select cell (fireworks or similar)
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toHaveAttribute('role', 'gridcell');
    });

    test('should select theme with Enter key', async ({ page }) => {
      const firstCard = page.getByTestId('theme-card-contribution-graph');
      const selectCell = firstCard.locator('[role="gridcell"]').first();
      await selectCell.focus();
      await page.keyboard.press('Enter');

      // Select gridcell should be marked as selected
      await expect(selectCell).toHaveAttribute('aria-selected', 'true');
    });

  });

  test.describe('Theme Card Keyboard Shortcuts', () => {
    test('should toggle favorite with "f" key when select cell is focused', async ({ page }) => {
      const firstCard = page.getByTestId('theme-card-contribution-graph');
      const selectCell = firstCard.locator('[role="gridcell"]').first();
      const favButton = page.getByTestId('favorite-btn-contribution-graph');

      await selectCell.focus();

      // Get initial state
      const initialPressed = await favButton.getAttribute('aria-pressed');

      // Press 'f' to toggle
      await page.keyboard.press('f');

      // State should have toggled
      const newPressed = await favButton.getAttribute('aria-pressed');
      expect(newPressed).not.toBe(initialPressed);
    });

    test('should open author profile with "a" key when select cell is focused', async ({ page, context }) => {
      const firstCard = page.getByTestId('theme-card-contribution-graph');
      const selectCell = firstCard.locator('[role="gridcell"]').first();
      await selectCell.focus();

      // Listen for new page/tab
      const pagePromise = context.waitForEvent('page');

      // Press 'a' to open author link
      await page.keyboard.press('a');

      // Should open new tab with GitHub profile
      const newPage = await pagePromise;
      expect(newPage.url()).toContain('github.com');
      await newPage.close();
    });

    test('should redirect non-reserved keys to search input', async ({ page }) => {
      const firstCard = page.getByTestId('theme-card-contribution-graph');
      const selectCell = firstCard.locator('[role="gridcell"]').first();
      const searchInput = page.getByTestId('theme-search-input');

      await selectCell.focus();

      // Press 'g' (not reserved) - should redirect to search
      await page.keyboard.press('g');

      await expect(searchInput).toBeFocused();
    });
  });

  test.describe('Mouse Interaction Flow', () => {
    test('should select theme when clicking card background (select cell)', async ({ page }) => {
      const firstCard = page.getByTestId('theme-card-contribution-graph');
      const selectCell = firstCard.locator('[role="gridcell"]').first();

      // Click the select cell
      await selectCell.click();

      // Card should be selected
      await expect(selectCell).toHaveAttribute('aria-selected', 'true');
    });

    test('should toggle favorite without selecting theme when clicking favorite button', async ({ page }) => {
      const firstCard = page.getByTestId('theme-card-contribution-graph');
      const selectCell = firstCard.locator('[role="gridcell"]').first();
      const favButton = page.getByTestId('favorite-btn-contribution-graph');

      // Get initial states
      const initialSelected = await selectCell.getAttribute('aria-selected');
      const initialPressed = await favButton.getAttribute('aria-pressed');

      // Click favorite button
      await favButton.click();

      // Favorite should toggle
      const newPressed = await favButton.getAttribute('aria-pressed');
      expect(newPressed).not.toBe(initialPressed);

      // Selection state should NOT change (event should be isolated)
      const newSelected = await selectCell.getAttribute('aria-selected');
      expect(newSelected).toBe(initialSelected);
    });
  });

  test.describe('Contribute Card Accessibility', () => {
    test('should have role=row for grid pattern compliance', async ({ page }) => {
      const contributeCard = page.getByTestId('contribute-theme-card');
      await expect(contributeCard).toHaveAttribute('role', 'row');
    });

    test('should activate with Enter key', async ({ page, context }) => {
      const contributeCard = page.getByTestId('contribute-theme-card');
      // Focus the link inside the gridcell
      const link = contributeCard.locator('a.contribute-theme-card');
      await link.focus();

      const pagePromise = context.waitForEvent('page');
      await page.keyboard.press('Enter');

      const newPage = await pagePromise;
      expect(newPage.url()).toContain('THEME_DEVELOPMENT');
      await newPage.close();
    });
  });
});

test.describe('Theme Selector Safari/WebKit Compatibility @webkit', () => {
  test.beforeEach(async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'Safari-specific test');
    await page.goto('/');
    await page.waitForSelector('[data-testid="theme-selector"]');
  });

  test('should reach sort dropdown via Tab in Safari', async ({ page }) => {
    const searchInput = page.getByTestId('theme-search-input');
    const sortButton = page.getByTestId('theme-sort-button');

    await searchInput.focus();
    await page.keyboard.press('Tab');

    await expect(sortButton).toBeFocused();
  });

  test('should open and close sort dropdown with keyboard in Safari', async ({ page }) => {
    const sortButton = page.getByTestId('theme-sort-button');
    const sortMenu = page.getByTestId('theme-sort-menu');

    await sortButton.focus();
    await page.keyboard.press('Space');
    await expect(sortMenu).toHaveAttribute('aria-hidden', 'false');

    await page.keyboard.press('Escape');
    await expect(sortMenu).toHaveAttribute('aria-hidden', 'true');
  });

  test.describe('Tab Navigation', () => {
    test('should switch to Favorites tab with click', async ({ page }) => {
      const favoritesTab = page.getByRole('tab', { name: /Favorites/i });
      const themesPanel = page.getByRole('tabpanel', { name: /Themes/i });
      const favoritesPanel = page.getByRole('tabpanel', { name: /Favorites/i });

      await favoritesTab.click();

      await expect(favoritesTab).toHaveAttribute('aria-selected', 'true');
      await expect(favoritesPanel).toBeVisible();
      await expect(themesPanel).toBeHidden();
    });

    test('should show empty state message when no favorites', async ({ page }) => {
      const favoritesTab = page.locator('[role="tab"]#tab-favorites');
      await favoritesTab.click();

      const emptyMessage = page.getByTestId('theme-selector-empty-state');
      await expect(emptyMessage).toBeVisible();
      await expect(emptyMessage).toHaveText('Mark your favorites with ❤️');
    });

    test('should show Contribute card in empty favorites state', async ({ page }) => {
      const favoritesTab = page.locator('[role="tab"]#tab-favorites');
      await favoritesTab.click();

      const contributeCard = page.getByTestId('contribute-theme-card');
      await expect(contributeCard).toBeVisible();
    });

    test('should show all themes in All Themes tab', async ({ page }) => {
      const themesTab = page.locator('[role="tab"]#tab-themes');
      await themesTab.click();

      const themeCards = page.locator('[data-testid^="theme-card-"]');
      const count = await themeCards.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should preserve search filter across tab switches', async ({ page }) => {
      const searchInput = page.getByTestId('theme-search-input');
      const themesTab = page.locator('[role="tab"]#tab-themes');
      const favoritesTab = page.locator('[role="tab"]#tab-favorites');

      // Search for a theme
      await searchInput.fill('contribution');

      // Switch to Favorites
      await favoritesTab.click();

      // Switch back to Themes
      await themesTab.click();

      // Search should still be applied
      await expect(searchInput).toHaveValue('contribution');
    });
  });
});
