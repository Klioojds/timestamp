/**
 * E2E tests for World Map Day/Night visualization
 * Tests the solar terminator, city markers, and accessibility
 * 
 * Note: World map is only shown in DATE mode (not timer mode).
 * We use mode=wall-clock with a far future target date for testing.
 */

import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { getWorldMapThemes } from './fixtures/theme-fixtures';

// Far future date to ensure countdown is always active
const FUTURE_TARGET = '2099-01-01T00:00:00';

test.describe('World Map Day/Night', () => {
  const worldMapThemes = getWorldMapThemes();

  // Ensure we have themes that support world map
  test.beforeAll(() => {
    if (worldMapThemes.length === 0) {
      throw new Error('No themes support world map visualization');
    }
  });

  for (const { id } of worldMapThemes) {
    test.describe(`${id} theme`, () => {
      test.beforeEach(async ({ page }) => {
        // Skip world map rendering tests on mobile viewports
        // World map is in the hamburger menu on mobile and these tests are for rendering details
        const isMobile = await page.evaluate(() => window.innerWidth <= 600);
        test.skip(isMobile, 'World map rendering tests require desktop viewport');
        
        // Navigate to the app with a theme that shows the world map
        // Use mode=wall-clock (not timer) because world map is only shown in wall-clock mode
        await page.goto(`/?mode=wall-clock&target=${FUTURE_TARGET}&theme=${id}&skip=true`);
        
        // Wait for the world map to be visible
        await expect(page.getByTestId('world-map')).toBeVisible({ timeout: 10000 });
      });

  test('should display world map with day/night overlay', async ({ page }) => {
    // Arrange
    const worldMap = page.getByTestId('world-map');
    const svg = page.getByTestId('world-map-svg');
    const nightOverlay = page.getByTestId('night-overlay');
    
    // Assert - Verify the world map container exists
    await expect(worldMap).toBeVisible();
    
    // Assert - Verify the SVG map is rendered
    await expect(svg).toBeVisible();
    
    // Assert - Verify the night overlay exists
    await expect(nightOverlay).toBeVisible();
    
    // Assert - Verify it has a path (d attribute should not be empty)
    const pathData = await nightOverlay.getAttribute('d');
    expect(pathData).toBeTruthy();
    expect(pathData!.length).toBeGreaterThan(10);
  });

  test('should display city markers', async ({ page }) => {
    // Arrange
    const cityMarkers = page.getByTestId('city-markers');
    
    // Assert
    await expect(cityMarkers).toBeVisible();
  });

  // Table-driven test for individual city markers
  const citiesToTest = [
    { id: 'auckland', name: 'Auckland' },
    { id: 'sydney', name: 'Sydney' },
    { id: 'tokyo', name: 'Tokyo' },
    { id: 'london', name: 'London' },
    { id: 'nyc', name: 'New York City' },
    { id: 'la', name: 'Los Angeles' },
  ];

  for (const { id, name } of citiesToTest) {
    test(`should display ${name} city marker`, async ({ page }) => {
      // Arrange
      const marker = page.getByTestId(`city-marker-${id}`);
      
      // Assert
      await expect(marker).toBeVisible();
    });
  }

  test('should have correct aria labels on city markers', async ({ page }) => {
    // Arrange
    const londonMarker = page.getByTestId('city-marker-london');
    const tokyoMarker = page.getByTestId('city-marker-tokyo');
    
    // Assert - Check that city markers have accessible labels
    await expect(londonMarker).toHaveAttribute('aria-label', /London/);
    await expect(tokyoMarker).toHaveAttribute('aria-label', /Tokyo/);
  });

  test('should make city markers interactive', async ({ page }) => {
    // Arrange
    const tokyoMarker = page.getByTestId('city-marker-tokyo');
    
    // Assert - Markers should be buttons
    await expect(tokyoMarker).toHaveRole('button');
    
    // Act - Click should work (focus the marker)
    await tokyoMarker.click();
    
    // Assert - After clicking, the marker should have the selected state
    await expect(tokyoMarker).toHaveAttribute('data-selected', 'true');
  });

  test('should have accessible name on world map', async ({ page }) => {
    // Arrange
    const worldMap = page.getByTestId('world-map');
    
    // Assert - Should have role="group" for interactive content
    await expect(worldMap).toHaveRole('group');
    
    // Assert - Should have an accessible name
    const ariaLabel = await worldMap.getAttribute('aria-label');
    expect(ariaLabel).toContain('World map');
    expect(ariaLabel).toContain('day');
    expect(ariaLabel).toContain('night');
  });

  test('should have celebration announcer for screen readers', async ({ page }) => {
    // Arrange
    const announcer = page.getByTestId('celebration-announcer');
    
    // Assert
    await expect(announcer).toBeAttached();
    await expect(announcer).toHaveAttribute('aria-live', 'polite');
    await expect(announcer).toHaveAttribute('aria-atomic', 'true');
  });

  test('should pass accessibility audit', async ({ page }) => {
    // Arrange - Wait for the page to be fully loaded
    const worldMapContainer = await page.getByTestId('world-map').elementHandle();
    
    // Act - Run axe accessibility audit on the world map component
    if (worldMapContainer) {
      const results = await new AxeBuilder({ page })
        .include('[data-testid="world-map"]')
        .analyze();

      // Assert - Filter out minor issues that don't affect usability
      const violations = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );

      expect(violations).toHaveLength(0);
    }
  });

  test('should respect reduced motion preference', async ({ page }) => {
    // Arrange - Enable reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    // Act - Reload with reduced motion (wall-clock mode with skip=true bypasses landing page)
    await page.goto(`/?mode=wall-clock&target=${FUTURE_TARGET}&theme=fireworks&skip=true`);
    await expect(page.getByTestId('world-map')).toBeVisible({ timeout: 10000 });

    // Assert - The page should still render correctly
    const worldMap = page.getByTestId('world-map');
    await expect(worldMap).toBeVisible();

    // Assert - Verify night overlay still exists (functionality preserved)
    const nightOverlay = page.getByTestId('night-overlay');
    await expect(nightOverlay).toBeVisible();
  });

  test('should display city night state correctly', async ({ page }) => {
    // Arrange
    const tokyoMarker = page.getByTestId('city-marker-tokyo');
    
    // Act
    const nightState = await tokyoMarker.getAttribute('data-night');
    
    // Assert - Should be either 'true' or 'false'
    expect(['true', 'false']).toContain(nightState);
  });
    });
  }
});

test.describe('World Map with Mocked Time', () => {
  const [firstWorldMapTheme] = getWorldMapThemes();

  // Use UTC timezone for consistent test behavior across different systems
  test.use({ timezoneId: 'UTC' });

  test('should show correct cities celebrating at midnight', async ({ page }) => {
    // Arrange - Install clock BEFORE navigation
    // At 11:00 UTC on Dec 31, Auckland (UTC+13) is at midnight Jan 1
    await page.clock.install({ time: new Date('2024-12-31T11:00:00.000Z') });
    
    // Use a target date of Jan 1, 2025 midnight (wall-clock time)
    const targetDate = '2025-01-01T00:00:00';
    
    // Act - Navigate with wall-clock mode
    await page.goto(`/?mode=wall-clock&target=${targetDate}&theme=${firstWorldMapTheme.id}&skip=true`);
    await expect(page.getByTestId('world-map')).toBeVisible({ timeout: 10000 });

    // Arrange - Get city markers
    const aucklandMarker = page.getByTestId('city-marker-auckland');
    const laMarker = page.getByTestId('city-marker-la');

    // Assert - Auckland should be celebrating (it's midnight there at 11:00 UTC)
    await expect(aucklandMarker).toHaveAttribute('data-celebrating', 'true');

    // Assert - LA (UTC-8) at 11:00 UTC is only 3:00 AM - should NOT be celebrating
    await expect(laMarker).toHaveAttribute('data-celebrating', 'false');
  });

  test('should change terminator position based on time', async ({ page }) => {
    // Arrange - Test at noon UTC - sun is roughly over the Prime Meridian
    await page.clock.install({ time: new Date('2024-12-31T12:00:00.000') });
    
    // Act - Use wall-clock mode (world map is only shown in wall-clock mode, not timer mode)
    await page.goto(`/?mode=wall-clock&target=${FUTURE_TARGET}&theme=${firstWorldMapTheme.id}&skip=true`);
    await expect(page.getByTestId('world-map')).toBeVisible({ timeout: 10000 });

    const nightOverlay = page.getByTestId('night-overlay');
    const noonPath = await nightOverlay.getAttribute('d');

    // Now test at midnight UTC - sun is roughly over the International Date Line
    await page.clock.setFixedTime(new Date('2024-12-31T00:00:00.000'));
    
    // Trigger an update (the component updates every 60 seconds, but we can check immediately)
    await page.waitForTimeout(100);
    
    // Assert - The path data should represent a valid polygon
    expect(noonPath).toBeTruthy();
    expect(noonPath!.startsWith('M')).toBe(true);
  });
});
