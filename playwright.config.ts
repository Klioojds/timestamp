/**
 * Playwright E2E Test Configuration
 *
 * @remarks
 * This configuration handles end-to-end browser testing:
 *
 * **Test Organization (Hybrid Pattern):**
 * - **Cross-cutting tests**: `e2e/` for app-wide features (theme switching, deep linking, etc.)
 * - **Theme-specific tests**: `src/themes/<theme>/e2e/` for theme-specific behavior
 *
 * **CI vs Local Projects:**
 * - **CI**: Only runs Chromium (installed via workflow) for speed
 * - **Local**: Runs all browsers (Chromium, Firefox, WebKit) plus mobile viewports
 *
 * **Timeouts:**
 * - Test timeout: 30s (full test including navigation)
 * - Expect timeout: 10s (individual assertions)
 * - Navigation timeout: 30s (page loads)
 *
 * **Base URL:**
 * - `http://localhost:5173/timestamp` matches Vite dev server with base path
 *
 * **Mobile Projects (local only):**
 * - `mobile-chrome`: Pixel 5 viewport for Android testing
 * - `mobile-safari`: iPhone 13 viewport for iOS testing
 * - `high-res`: 2560x1440 for performance testing
 *
 * @see {@link https://playwright.dev/docs/test-configuration} for Playwright options
 */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: ['e2e/**/*.spec.ts', 'src/themes/**/e2e/**/*.spec.ts'],
  testIgnore: ['**/.stryker-tmp/**', '**/coverage/**', '**/node_modules/**'],
  timeout: 30000,
  expect: { timeout: 10000 },
  retries: 1,
  reporter: process.env.CI ? 'blob' : 'dot',
  use: {
    baseURL: 'http://localhost:5173/timestamp',
    trace: 'on-first-retry',
    navigationTimeout: 30000,
  },
  projects: process.env.CI
    ? [
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },
      ]
    : [
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },
        {
          name: 'webkit',
          use: { ...devices['Desktop Safari'] },
        },
        {
          name: 'mobile-chrome',
          use: { ...devices['Pixel 5'] },
        }
      ],
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: !process.env.CI,
  },
});
