/**
 * E2E tests for per-timezone celebration lifecycle.
 * 
 * Tests the behavior when users switch between timezones during countdown,
 * ensuring each timezone can celebrate independently.
 */
import { test, expect } from '@playwright/test';
import { setTimezone, waitForCountdown } from './fixtures/test-utils';

// Far future date to ensure countdown is always active
const FUTURE_TARGET = '2099-01-01T00:00:00';

// Past date that all timezones have already celebrated
const PAST_TARGET = '2020-01-01T00:00:00';

test.describe('Timezone celebration lifecycle', () => {
  test('should not show timezone selector in timer mode', async ({ page }) => {
    // Timer mode is duration-based and timezone-agnostic
    await page.goto('/?mode=timer&duration=3600&skip=true');
    await waitForCountdown(page);

    // Verify timezone selector is not present
    await expect(page.getByTestId('timezone-selector')).not.toBeVisible();
  });

  test('should show timezone selector in wall-clock mode', async ({ page }) => {
    await page.goto(`/?mode=wall-clock&target=${FUTURE_TARGET}&skip=true`);
    await waitForCountdown(page);

    // On mobile, timezone selector is in hamburger menu
    const isMobile = await page.evaluate(() => window.innerWidth <= 600);
    
    if (isMobile) {
      // Open hamburger menu to verify timezone selector is there
      await page.getByTestId('mobile-menu-button').click();
      await expect(page.getByTestId('mobile-menu-overlay')).toBeVisible();
      await expect(page.getByTestId('timezone-selector')).toBeVisible();
      await page.getByTestId('mobile-menu-close').click();
    } else {
      // Verify timezone selector is present and visible inline
      await expect(page.getByTestId('timezone-selector')).toBeVisible();
    }
  });

  test('should allow switching between timezones in wall-clock mode', async ({ page }) => {
    await page.goto(`/?mode=wall-clock&target=${FUTURE_TARGET}&skip=true`);
    await waitForCountdown(page);

    // Switch to UTC (simple timezone without slash)
    await setTimezone(page, 'UTC');

    // Verify the timezone selector shows the new timezone
    const trigger = page.getByTestId('timezone-selector').getByRole('button').first();
    await expect(trigger).toContainText(/UTC/i);
  });

  test('should update URL when timezone is changed', async ({ page }) => {
    await page.goto(`/?mode=wall-clock&target=${FUTURE_TARGET}&skip=true`);
    await waitForCountdown(page);

    // Switch to UTC timezone
    await setTimezone(page, 'UTC');

    // Check that URL was updated with the new timezone
    await expect(page).toHaveURL(/tz=UTC/);
  });

  test('should maintain countdown display when switching timezones', async ({ page }) => {
    await page.goto(`/?mode=wall-clock&target=${FUTURE_TARGET}&skip=true`);
    await waitForCountdown(page);

    // Verify countdown is showing
    await expect(page.getByTestId('countdown-display')).toBeVisible();

    // Switch timezone
    await setTimezone(page, 'UTC');

    // Countdown should still be visible
    await expect(page.getByTestId('countdown-display')).toBeVisible();
  });

  test('should persist timezone selection in URL on theme switch', async ({ page }) => {
    await page.goto(`/?mode=wall-clock&target=${FUTURE_TARGET}&skip=true`);
    await waitForCountdown(page);

    // Set timezone first
    await setTimezone(page, 'UTC');
    await expect(page).toHaveURL(/tz=UTC/);

    // Switch theme via theme switcher
    await page.getByTestId('theme-switcher').click();
    await expect(page.getByTestId('theme-modal')).toBeVisible();
    
    // Select fireworks theme
    await page.getByTestId('theme-card-fireworks').click();
    await expect(page.getByTestId('theme-modal')).not.toBeVisible();

    // Verify timezone is preserved in URL
    await expect(page).toHaveURL(/tz=UTC/);
  });
});

test.describe('Initial load with already-celebrated timezone', () => {

  test('should skip celebration animation when loading URL with already-celebrated timezone', async ({ page }) => {
    // Track celebration phases to verify animation is skipped
    await page.addInitScript(() => {
      const win = window as unknown as { __celebrationPhases: string[] };
      win.__celebrationPhases = [];
      
      // Override MutationObserver to capture phase changes
      const OriginalObserver = window.MutationObserver;
      const originalObserve = OriginalObserver.prototype.observe;
      OriginalObserver.prototype.observe = function(target: Node, options?: MutationObserverInit) {
        // Call original observe
        originalObserve.call(this, target, options);
      };
      
      // Set up a global observer for data-celebration-phase after DOM is ready
      document.addEventListener('DOMContentLoaded', () => {
        const observer = new OriginalObserver((mutations) => {
          for (const mutation of mutations) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'data-celebration-phase') {
              const target = mutation.target as HTMLElement;
              const phase = target.getAttribute('data-celebration-phase');
              if (phase && !win.__celebrationPhases.includes(phase)) {
                win.__celebrationPhases.push(phase);
              }
            }
          }
        });
        
        // Wait for countdown display to exist, then observe it
        const checkForGrid = setInterval(() => {
          const grid = document.querySelector('[data-testid="countdown-display"]');
          if (grid) {
            clearInterval(checkForGrid);
            // Record initial phase if any
            const initialPhase = grid.getAttribute('data-celebration-phase');
            if (initialPhase && !win.__celebrationPhases.includes(initialPhase)) {
              win.__celebrationPhases.push(initialPhase);
            }
            observer.observe(grid, { attributes: true, attributeFilter: ['data-celebration-phase'] });
          }
        }, 50);
      });
    });
    
    // Navigate to a URL with a wall-clock target in the past
    // All timezones have already celebrated this target
    await page.goto(`/?mode=wall-clock&target=${PAST_TARGET}&tz=Australia%2FSydney&theme=contribution-graph`);
    
    // Wait for countdown to be attached (it will show celebration message)
    await expect(page.getByTestId('countdown-display').first()).toBeAttached({ timeout: 10000 });
    
    // Wait a moment for any potential animation phases to occur
    await page.waitForTimeout(500);
    
    // Get the recorded phases
    const phases = await page.evaluate(() => {
      const win = window as unknown as { __celebrationPhases: string[] };
      return win.__celebrationPhases;
    });
    
    // The 'wall-building' phase indicates the animation started
    // It should NOT be present when loading an already-celebrated timezone
    const hasWallBuilding = phases.includes('wall-building');
    
    // CRITICAL: wall-building should NOT be in the phases
    // If it is, the animation was triggered when it shouldn't have been
    expect(hasWallBuilding).toBe(false);
    
    // Should either have no phases (no animation at all) or go straight to celebrated/year-revealed
    if (phases.length > 0) {
      // If any phase is recorded, it should be the final state (celebrated or year-revealed)
      const hasFinalState = phases.includes('year-revealed') || phases.includes('celebrated');
      expect(hasFinalState).toBe(true);
    }
    
    // Verify the countdown display has data-celebrating attribute (shows it's in celebrated state)
    await expect(page.locator('#app[data-celebrating="true"]')).toBeAttached();
  });

  test('should show celebration message immediately when loading celebrated timezone', async ({ page }) => {
    // Navigate to URL with past target
    await page.goto(`/?mode=wall-clock&target=${PAST_TARGET}&tz=Europe%2FLondon&theme=contribution-graph`);
    
    // Wait for page to load
    await expect(page.getByTestId('countdown-display').first()).toBeAttached({ timeout: 10000 });
    
    // Verify that the countdown container shows celebrating state
    await expect(page.locator('#app[data-celebrating="true"]')).toBeAttached({ timeout: 3000 });
    
    // The aria-label should indicate completion
    const container = page.locator('#app');
    await expect(container).toHaveAttribute('aria-label', /completed/i);
  });
});
