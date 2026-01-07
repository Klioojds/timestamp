/**
 * Helper utilities for deep linking E2E tests.
 */

import type { Page } from '@playwright/test';

/**
 * Build a deep link URL with the specified parameters.
 * 
 * Note: Valid deep links automatically start the countdown unless configure=true is specified.
 * 
 * @param params - URL parameters
 * @returns Relative URL path with query parameters
 */
export function buildDeepLinkUrl(params: {
  mode?: 'wall-clock' | 'absolute' | 'timer';
  target?: string;
  duration?: string;
  theme?: string;
  tz?: string;
  showWorldMap?: boolean;
  configure?: boolean;
  skip?: boolean;
}): string {
  const url = new URL('/', 'http://localhost:5173');
  
  if (params.mode) {
    url.searchParams.set('mode', params.mode);
  }
  
  // Handle target: wall-clock mode requires no Z suffix
  if (params.target) {
    let target = params.target;
    // For wall-clock mode, ensure target doesn't end with Z
    if (params.mode === 'wall-clock' && target.endsWith('Z')) {
      target = target.slice(0, -1); // Remove Z suffix
    }
    url.searchParams.set('target', target);
  }
  
  if (params.duration) url.searchParams.set('duration', params.duration);
  if (params.theme) url.searchParams.set('theme', params.theme);
  if (params.tz) url.searchParams.set('tz', params.tz);
  if (params.showWorldMap === false) url.searchParams.set('showWorldMap', 'false');
  if (params.showWorldMap === true) url.searchParams.set('showWorldMap', 'true');
  if (params.configure) url.searchParams.set('configure', 'true');
  if (params.skip) url.searchParams.set('skip', 'true');
  
  return url.pathname + url.search;
}

/**
 * Wait for the URL to change to match the expected pattern.
 * 
 * @param page - Playwright page instance
 * @param expectedPattern - String or RegExp pattern to match
 */
export async function waitForUrlChange(
  page: Page,
  expectedPattern: string | RegExp
): Promise<void> {
  await page.waitForFunction(
    (pattern) => {
      const currentUrl = window.location.href;
      return typeof pattern === 'string'
        ? currentUrl.includes(pattern)
        : pattern.test(currentUrl);
    },
    expectedPattern,
    { timeout: 5000 }
  );
}

/**
 * Navigate using browser back button and wait for navigation to complete.
 * 
 * @param page - Playwright page instance
 */
async function navigateBack(page: Page): Promise<void> {
  await page.goBack();
  await page.waitForLoadState('networkidle');
}

/**
 * Navigate using browser forward button and wait for navigation to complete.
 * 
 * @param page - Playwright page instance
 */
async function navigateForward(page: Page): Promise<void> {
  await page.goForward();
  await page.waitForLoadState('networkidle');
}
