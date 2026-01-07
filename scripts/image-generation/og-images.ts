/**
 * OG (Open Graph) Image Generation
 * Creates 1200x630 PNG images for social media sharing
 */

import type { Browser, Page } from 'playwright';
import { resolve } from 'path';
import {
  CAPTURE_DELAY_MS,
  createBrowser,
  createPage,
  buildCountdownUrl,
  extractThemeData,
  hideUIElements,
  loadThemeRegistry,
  registerWebpMockLoader,
  resolvePortAndBaseUrl,
  type BaseImageConfig,
  type ThemeData,
} from './shared';

// =============================================================================
// Constants
// =============================================================================

/** OG image width per Open Graph specification (1200px) */
export const OG_IMAGE_WIDTH = 1200;

/** OG image height per Open Graph specification (630px) */
export const OG_IMAGE_HEIGHT = 630;

/** Timer duration for OG image capture in seconds (1 second countdown) */
const OG_TIMER_DURATION_SECONDS = 1;

/** Delay after clicking fullscreen for the mode to activate */
const OG_FULLSCREEN_ACTIVATION_DELAY_MS = 500;

/** Delay after countdown reaches 00:00 to capture celebrated state */
const OG_CELEBRATION_CAPTURE_DELAY_MS = 2750;

// =============================================================================
// Types
// =============================================================================

/** Configuration options for OG image generation */
export type OGImageConfig = BaseImageConfig;

// =============================================================================
// Configuration
// =============================================================================

/**
 * Builds the configuration for OG image generation from environment variables.
 * @param baseDir - Base directory for output (defaults to public/)
 * @returns Configuration object with port, base URL, and output directory
 */
export function buildOGConfig(baseDir?: string): OGImageConfig {
  const { port, baseUrl } = resolvePortAndBaseUrl();
  const outputDir = baseDir || resolve(process.cwd(), 'public');
  const completionMessage = 'Timestamp';

  return { port, baseUrl, outputDir, completionMessage };
}

// =============================================================================
// Screenshot Capture
// =============================================================================

/**
 * Captures a screenshot of a countdown theme for OG image.
 * Clicks fullscreen button, waits for countdown to complete and celebration
 * animations to finish (celebrated state), then captures the screenshot.
 * @param page - Playwright page instance
 * @param url - URL to navigate to
 * @param outputPath - File path for saving the screenshot
 */
export async function captureThemeScreenshot(
  page: Page,
  url: string,
  outputPath: string
): Promise<void> {
  // Emulate dark color scheme at browser level
  await page.emulateMedia({ colorScheme: 'dark' });

  // Set color mode preference in localStorage before navigating
  await page.addInitScript(() => {
    localStorage.setItem('countdown:color-mode', 'dark');
  });

  await page.goto(url, { waitUntil: 'networkidle' });

  // Click fullscreen button to enter fullscreen mode
  const fullscreenButton = page.locator('[data-testid="fullscreen-button"]');
  if (await fullscreenButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await fullscreenButton.click();
    await page.waitForTimeout(OG_FULLSCREEN_ACTIVATION_DELAY_MS);
  }

  // Wait for countdown to complete and celebration animations to finish (celebrated state)
  await page.waitForTimeout(CAPTURE_DELAY_MS + OG_CELEBRATION_CAPTURE_DELAY_MS);

  await hideUIElements(page);
  await page.screenshot({
    path: outputPath,
    type: 'png',
  });
}

// =============================================================================
// Image Generation
// =============================================================================

/**
 * Generates an OG image for a single theme.
 * @param page - Playwright page instance
 * @param theme - Theme data containing id and display name
 * @param config - OG image configuration
 */
export async function generateThemeOGImage(
  page: Page,
  theme: ThemeData,
  config: OGImageConfig
): Promise<void> {
  console.log(`  📸 ${theme.displayName} (${theme.id})...`);

  const url = buildCountdownUrl(config.baseUrl, theme.id, config.completionMessage, OG_TIMER_DURATION_SECONDS);
  const filename = resolve(config.outputDir, `og-image-${theme.id}.png`);

  await captureThemeScreenshot(page, url, filename);

  console.log(`     ✅ Saved: public/og-image-${theme.id}.png`);
}

/**
 * Generates the default OG image using the default theme.
 * @param page - Playwright page instance
 * @param defaultThemeId - Default theme identifier from registry
 * @param config - OG image configuration
 */
export async function generateDefaultOGImage(
  page: Page,
  defaultThemeId: string,
  config: OGImageConfig
): Promise<void> {
  console.log(`\n  📸 Default (${defaultThemeId})...`);

  const url = buildCountdownUrl(config.baseUrl, defaultThemeId, config.completionMessage, OG_TIMER_DURATION_SECONDS);
  const filename = resolve(config.outputDir, 'og-image.png');

  await captureThemeScreenshot(page, url, filename);

  console.log('     ✅ Saved: public/og-image.png\n');
}

// =============================================================================
// Browser/Page Factory (OG-specific wrappers)
// =============================================================================

/**
 * Creates a Playwright browser instance for OG image generation.
 * @returns Playwright browser instance
 */
export async function createOGBrowser(): Promise<Browser> {
  return createBrowser();
}

/**
 * Creates a Playwright page with OG image dimensions (1200x630).
 * @param browser - Playwright browser instance
 * @returns Playwright page instance with OG viewport
 */
export async function createOGPage(browser: Browser): Promise<Page> {
  return createPage(browser, OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT);
}

// =============================================================================
// Main Orchestration
// =============================================================================

/**
 * Main function to generate OG images for all themes.
 * Orchestrates the entire process: browser setup, theme iteration, and cleanup.
 * @param registryPath - Optional path to registry file (for testing)
 */
export async function generateOGImages(registryPath?: string): Promise<void> {
  // Register loader and load registry
  registerWebpMockLoader();

  const resolvedRegistryPath =
    registryPath || resolve(process.cwd(), 'src/themes/registry/index.ts');
  const registry = await loadThemeRegistry(resolvedRegistryPath);
  const { DEFAULT_THEME_ID } = registry;

  // Extract theme data from registry
  const themes = extractThemeData(registry);

  const config = buildOGConfig();

  console.log('🎨 Generating Open Graph images for all themes...');
  console.log(`   Using base URL: ${config.baseUrl}`);
  console.log(`   Themes found: ${themes.map((t) => t.id).join(', ')}\n`);

  const browser = await createOGBrowser();
  const page = await createOGPage(browser);

  try {
    // Generate OG image for each theme
    for (const theme of themes) {
      await generateThemeOGImage(page, theme, config);
    }

    // Generate default OG image using DEFAULT_THEME_ID from registry
    await generateDefaultOGImage(page, DEFAULT_THEME_ID, config);

    console.log('✨ OG image generation complete!');
    console.log(`   Generated ${themes.length + 1} images\n`);
  } catch (error) {
    console.error('❌ Error generating OG images:', error);
    throw error;
  } finally {
    await browser.close();
  }
}


