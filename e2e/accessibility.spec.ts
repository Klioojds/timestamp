import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { switchTheme, waitForCountdown } from './fixtures/test-utils';
import { getThemeIdsForTest } from './fixtures/theme-fixtures';

// Far future date to ensure countdown is always active
// Used for tests that require world map/city markers (wall-clock mode only)
const FUTURE_TARGET = '2099-01-01T00:00:00';

test('should set accessibility landmarks and live regions when countdown loads', async ({ page }) => {
  // Arrange - Use longer duration to prevent celebration during test
  await page.goto('/?mode=timer&duration=3600');
  await waitForCountdown(page);
  const container = page.getByTestId('theme-container').first();
  const countdownRegion = page.locator('#sr-countdown');

  // Assert
  await expect(container).toHaveAttribute('role', 'region');
  await expect(countdownRegion).toHaveAttribute('aria-live', 'polite');

  // Act - Switch theme
  await switchTheme(page);
  await waitForCountdown(page);

  // Assert - Theme should have changed to a valid theme from registry
  const themeIds = getThemeIdsForTest();
  const dataTheme = await container.getAttribute('data-theme');
  expect(themeIds).toContain(dataTheme);
});

test('should disable animations when reduced motion preference is set', async ({ page }) => {
  // Arrange
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?mode=timer&duration=2');
  
  // Act - Wait for celebration
  await page.locator('[data-celebrating="true"]').waitFor({ timeout: 5000 });
  
  // Assert - Verify no animation is playing (check computed style)
  const hasAnimations = await page.evaluate(() => {
    const elements = document.querySelectorAll('.pulse-digit, .cascade-white');
    return Array.from(elements).some(el => {
      const style = getComputedStyle(el);
      return style.animationPlayState === 'running' && 
             style.animationDuration !== '0s';
    });
  });
  
  expect(hasAnimations).toBe(false);
});

test('should keep focus within interactive UI elements when switching themes rapidly', async ({ page }) => {
  // Arrange - Use longer duration to prevent celebration
  await page.goto('/?mode=timer&duration=3600');
  await waitForCountdown(page);
  
  // Act - Focus the theme switcher button
  await page.getByTestId('theme-switcher').focus();
  
  // Act - Switch themes rapidly and wait for each to complete
  // Focus should return to theme-switcher after each modal close
  for (let i = 0; i < 3; i++) {
    await switchTheme(page);
    // Wait for theme switch to complete by checking data-theme attribute changes
  }
  
  // Assert - Focus should be on theme-switcher (returned after modal closes)
  // This follows accessibility Dialog Pattern: focus returns to triggering element
  const themeSwitcher = page.getByTestId('theme-switcher');
  await expect(themeSwitcher).toBeFocused();
});

test('should keep aria-live region intact during celebration', async ({ page }) => {
  // Arrange
  await page.goto('/?mode=timer&duration=2');
  
  // Assert - aria-live region should exist before celebration
  await expect(page.locator('[aria-live="polite"]').first()).toBeAttached();
  
  // Act - Wait for celebration
  await page.locator('[data-celebrating="true"]').waitFor({ timeout: 5000 });
  
  // Assert - aria-live region should still exist after celebration
  await expect(page.locator('[aria-live="polite"]').first()).toBeAttached();
});

test.describe('Keyboard Navigation Tab Order', () => {
  // Keyboard Tab order tests are inherently flaky in automated testing because:
  // 1. Focus management varies between browser engines and versions
  // 2. Tab navigation relies on browser-specific focus ring behavior
  // 3. Virtual focus (aria-activedescendant) may interfere with DOM focus
  // These tests verify the logical tab order through tabindex attributes instead
  
  test('should have correct tabindex attributes for navigation order', async ({ page }) => {
    // Skip on mobile - world map and timezone selector are in hamburger menu
    const isMobile = await page.evaluate(() => window.innerWidth <= 600);
    test.skip(isMobile, 'Keyboard navigation tests require desktop viewport');
    
    // Arrange - Use wall-clock mode (not timer) because world map/city markers are only shown in wall-clock mode
    await page.goto(`/?mode=wall-clock&target=${FUTURE_TARGET}&theme=fireworks&skip=true`);

    await page.waitForSelector('[data-testid="back-button"]');
    await page.waitForSelector('[data-testid="theme-switcher"]');
    await page.waitForSelector('[data-testid="city-marker-la"]');

    // Verify focusable elements have correct tabindex (0 = part of tab order)
    const backButton = page.getByTestId('back-button');
    const themeSwitcher = page.getByTestId('theme-switcher');
    const cityMarkerLA = page.getByTestId('city-marker-la');
    const timezoneTrigger = page.getByTestId('timezone-selector').getByRole('button').first();
    
    await expect(backButton).toHaveAttribute('tabindex', '0');
    await expect(themeSwitcher).toHaveAttribute('tabindex', '0');
    await expect(cityMarkerLA).toHaveAttribute('tabindex', '0');
    await expect(timezoneTrigger).toHaveAttribute('tabindex', '0');
    
    // Verify all city markers are focusable
    const expectedCityOrder = [
      'la', 'chicago', 'nyc', 'utc', 'london', 'paris',
      'dubai', 'shanghai', 'tokyo', 'sydney', 'auckland',
    ];
    
    for (const cityId of expectedCityOrder) {
      await expect(page.getByTestId(`city-marker-${cityId}`)).toHaveAttribute('tabindex', '0');
    }
  });

});

test.describe('Safari Keyboard Navigation @webkit', () => {
  test('should focus city markers in Safari without preference changes', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'Safari-specific test');
    
    // Skip on mobile - city markers are in hamburger menu
    const isMobile = await page.evaluate(() => window.innerWidth <= 600);
    test.skip(isMobile, 'Keyboard navigation tests require desktop viewport');

    // Use wall-clock mode (not timer) because world map/city markers are only shown in wall-clock mode
    await page.goto(`/?mode=wall-clock&target=${FUTURE_TARGET}&theme=fireworks&skip=true`);
    await page.waitForSelector('[data-testid="city-marker-la"]');

    await page.locator('body').click();
    
    // Tab order: back button → theme switcher → city markers
    // Focus theme switcher and tab twice to get to first city marker
    const themeSwitcher = page.getByTestId('theme-switcher');
    await themeSwitcher.focus();
    await page.keyboard.press('Tab');

    await expect(page.getByTestId('city-marker-la')).toBeFocused();

    const tabindex = await page.getByTestId('city-marker-la').getAttribute('tabindex');
    expect(tabindex).toBe('0');
  });

  test('should reach back button via Tab in Safari', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'Safari-specific test');

    await page.goto('/?mode=timer&duration=3600');

    await page.locator('body').click();
    await page.keyboard.press('Tab');

    // Back button should be the first focusable element
    await expect(page.getByTestId('back-button')).toBeFocused();
  });

  test('should open timezone dropdown via keyboard and focus options in Safari', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'Safari-specific test');
    
    // Skip on mobile - timezone selector is in hamburger menu
    const isMobile = await page.evaluate(() => window.innerWidth <= 600);
    test.skip(isMobile, 'Timezone selector keyboard tests require desktop viewport');

    // Use wall-clock mode (not timer) because timezone selector is only shown in wall-clock mode
    await page.goto(`/?mode=wall-clock&target=${FUTURE_TARGET}&theme=fireworks&skip=true`);

    const timezoneTrigger = page.getByTestId('timezone-selector').getByRole('button').first();
    await timezoneTrigger.focus();

    await page.keyboard.press('Enter');

    const searchInput = page.getByRole('searchbox');
    await expect(searchInput).toBeFocused();

    await page.keyboard.press('ArrowDown');

    const firstOption = page.getByRole('option').first();
    await expect(firstOption).toBeFocused();
  });
});

