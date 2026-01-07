import { test, expect, type Page } from '@playwright/test';
import {
  assertDropdownNavigationStaysVisible,
  closeMobileMenuIfNeeded,
  openMobileMenuIfNeeded,
  setTimezone,
  waitForCountdown,
} from './fixtures/test-utils';

// Far future date to ensure countdown is always active
const FUTURE_TARGET = '2099-01-01T00:00:00';

test('should allow selecting a different timezone', async ({ page }) => {
  // Use wall-clock mode (not timer) because timezone selector is only shown in wall-clock mode
  await page.goto(`/?mode=wall-clock&target=${FUTURE_TARGET}&skip=true`);
  await waitForCountdown(page);

  await setTimezone(page, 'UTC');
  
  // On mobile, open menu to check the trigger text
  const wasOpened = await openMobileMenuIfNeeded(page);
  const trigger = page.getByTestId('timezone-selector').getByRole('button').first();
  await expect(trigger).toContainText(/UTC/i);
  await closeMobileMenuIfNeeded(page, wasOpened);
});

test.describe('timezone selector keyboard navigation', () => {
  const navCases = [
    {
      name: 'Arrow navigation keeps focused option within viewport',
      navigationKeys: Array.from({ length: 31 }, (_, i) => (i === 0 ? 'ArrowDown' : 'ArrowDown')),
    },
    {
      name: 'Home jumps back to first option',
      navigationKeys: ['ArrowDown', ...Array.from({ length: 50 }, () => 'ArrowDown'), 'Home'],
      expected: 'first' as const,
    },
    {
      name: 'End jumps to last option',
      navigationKeys: ['ArrowDown', 'End'],
      expected: 'last' as const,
    },
  ];

  const contexts = [
    {
      name: 'countdown page (desktop)',
      skipMobile: true,
      setup: async (page: Page) => {
        await page.goto(`/?mode=wall-clock&target=${FUTURE_TARGET}&skip=true`);
        await waitForCountdown(page);
        const trigger = page.getByTestId('timezone-selector').getByRole('button').first();
        await trigger.click();
        const dropdownList = page.locator('.dropdown-list');
        const searchInput = page.getByRole('searchbox', { name: 'Search timezones' });
        return { dropdownList, searchInput };
      },
    },
    {
      name: 'landing page',
      skipMobile: false,
      setup: async (page: Page) => {
        await page.goto('/');
        const timezoneSection = page.getByTestId('landing-timezone-section');
        const trigger = timezoneSection.getByRole('button').first();
        await trigger.click();
        const dropdownList = timezoneSection.locator('.dropdown-list');
        const searchInput = timezoneSection.getByRole('searchbox', { name: 'Search timezones' });
        return { dropdownList, searchInput };
      },
    },
  ];

  for (const context of contexts) {
    for (const navCase of navCases) {
      test(`${context.name}: ${navCase.name}`, async ({ page }) => {
        const isMobile = await page.evaluate(() => window.innerWidth <= 600);
        if (context.skipMobile) {
          test.skip(isMobile, 'Timezone keyboard navigation tests require desktop viewport');
        }

        const { dropdownList, searchInput } = await context.setup(page);
        const expectedOption =
          navCase.expected === 'first'
            ? dropdownList.locator('.dropdown-option').first()
            : navCase.expected === 'last'
              ? dropdownList.locator('.dropdown-option').last()
              : undefined;

        await assertDropdownNavigationStaysVisible({
          page,
          dropdownList,
          searchInput,
          navigationKeys: navCase.navigationKeys,
          expectedFocusedOption: expectedOption,
        });
      });
    }
  }
});