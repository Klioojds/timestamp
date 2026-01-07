import { expect, test, type Page } from '@playwright/test';
import { buildDeepLinkUrl } from './fixtures/deep-link-helpers';
import { waitForCountdown, waitForLandingPage } from './fixtures/test-utils';

declare global {
  interface Window {
    __mockClipboardLastText?: string;
  }
}

const LANDING_DURATION = { hours: '00', minutes: '01', seconds: '30' };
const FUTURE_TARGET = new Date('2099-01-01T00:00:00').toISOString().slice(0, -1);

async function startCountdownFromLanding(page: Page): Promise<void> {
  await page.goto('/');
  await waitForLandingPage(page);
  // Click on card name to avoid author link interception
  const fireworksCardName = page.locator('.theme-selector-card-name', { hasText: 'Fireworks' });
  await fireworksCardName.click();
  // Wait for fireworks background to render after theme switch (async theme loading)
  await expect(page.locator('.landing-theme-background--fireworks')).toBeVisible({ timeout: 5000 });
  await page.waitForSelector('.landing-star', { timeout: 5000, state: 'attached' });
  await page.getByTestId('landing-mode-timer').check();
  await page.getByTestId('landing-duration-hours').fill(LANDING_DURATION.hours);
  await page.getByTestId('landing-duration-minutes').fill(LANDING_DURATION.minutes);
  await page.getByTestId('landing-duration-seconds').fill(LANDING_DURATION.seconds);
  await page.getByTestId('landing-start-button').click();
  await waitForCountdown(page);
}

async function mockClipboard(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const globalWindow = window as Window & { __mockClipboardLastText?: string };
    globalWindow.__mockClipboardLastText = '';
    const fakeClipboard = {
      writeText(text: string) {
        globalWindow.__mockClipboardLastText = text;
        return Promise.resolve();
      },
      readText() {
        return Promise.resolve(globalWindow.__mockClipboardLastText ?? '');
      },
    };
    Object.defineProperty(navigator, 'clipboard', {
      get: () => fakeClipboard,
      configurable: true,
    });
  });
}

async function readMockClipboard(page: Page): Promise<string> {
  return page.evaluate(() => window.__mockClipboardLastText ?? '');
}

test.describe('Share Button on Countdown', () => {
  test('should provide an accessible label for assistive technology', async ({ page }) => {
    await startCountdownFromLanding(page);

    const shareButton = page.getByTestId('share-button');
    await expect(shareButton).toHaveAttribute('aria-label', /copy countdown/i);
  });

  test('should copy the current countdown URL with theme and timezone parameters', async ({ page }) => {
    await mockClipboard(page);
    // Navigate directly to a URL with Tokyo timezone already set
    const deepLinkUrl = buildDeepLinkUrl({
      mode: 'wall-clock',
      target: FUTURE_TARGET,
      theme: 'fireworks',
      skip: true,
      tz: 'Asia/Tokyo',
    });

    await page.goto(deepLinkUrl);
    await waitForCountdown(page);

    // In wall-clock mode, the share button is a dropdown menu
    const shareButton = page.getByTestId('share-button');
    await expect(shareButton).toBeVisible();

    // Click to open the dropdown menu
    await page.evaluate(() => {
      const btn = document.querySelector('[data-testid="share-button"]') as HTMLButtonElement;
      btn?.click();
    });

    // Wait for the dropdown to be visible and click the "Selected timezone" option
    const selectedTzOption = page.getByTestId('share-selected-timezone');
    await expect(selectedTzOption).toBeVisible();
    await selectedTzOption.click();

    const clipboardText = await readMockClipboard(page);
    await expect(clipboardText).toContain('theme=fireworks');
    await expect(clipboardText).toContain('tz=Asia%2FTokyo');
    await expect(clipboardText).toContain('mode=wall-clock');
  });

  test('should update selected timezone URL when user changes timezone via selector', async ({ page }) => {
    await mockClipboard(page);
    // Navigate with Tokyo timezone
    const deepLinkUrl = buildDeepLinkUrl({
      mode: 'wall-clock',
      target: FUTURE_TARGET,
      theme: 'fireworks',
      skip: true,
      tz: 'Asia/Tokyo',
    });

    await page.goto(deepLinkUrl);
    await waitForCountdown(page);

    // Change timezone using the timezone selector
    const timezoneSelector = page.getByTestId('timezone-selector');
    await expect(timezoneSelector).toBeVisible();
    await timezoneSelector.click();

    // Select London timezone
    const londonOption = page.getByRole('option', { name: /London/i });
    await londonOption.click();

    // Open share menu and click "Selected timezone" option
    const shareButton = page.getByTestId('share-button');
    await shareButton.click();

    const selectedTzOption = page.getByTestId('share-selected-timezone');
    await expect(selectedTzOption).toBeVisible();
    await selectedTzOption.click();

    // The URL should now contain London timezone, not Tokyo
    const clipboardText = await readMockClipboard(page);
    await expect(clipboardText).toContain('tz=Europe%2FLondon');
    await expect(clipboardText).not.toContain('tz=Asia%2FTokyo');
  });

  test('should update selected timezone URL when user clicks city on world map', async ({ page }) => {
    await mockClipboard(page);
    // Navigate with Tokyo timezone
    const deepLinkUrl = buildDeepLinkUrl({
      mode: 'wall-clock',
      target: FUTURE_TARGET,
      theme: 'fireworks',
      skip: true,
      tz: 'Asia/Tokyo',
    });

    await page.goto(deepLinkUrl);
    await waitForCountdown(page);

    // World map should be visible
    const worldMap = page.getByTestId('world-map');
    await expect(worldMap).toBeVisible();

    // Click on NYC city marker (uses lowercase id)
    const nycMarker = page.getByTestId('city-marker-nyc');
    await expect(nycMarker).toBeVisible();
    await nycMarker.click();

    // Open share menu and click "Selected timezone" option
    const shareButton = page.getByTestId('share-button');
    await shareButton.click();

    const selectedTzOption = page.getByTestId('share-selected-timezone');
    await expect(selectedTzOption).toBeVisible();
    await selectedTzOption.click();

    // The URL should now contain New York timezone
    const clipboardText = await readMockClipboard(page);
    await expect(clipboardText).toContain('tz=America%2FNew_York');
    await expect(clipboardText).not.toContain('tz=Asia%2FTokyo');
  });
});