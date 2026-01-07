/**
 * Theme Preview Image Generation
 * Creates optimized WebP images for theme selector cards and README documentation.
 *
 * Image sizes generated (all in `images/` subfolder):
 * - **Card 1x**: 426x240 (standard displays)
 * - **Card 2x**: 852x480 (retina/HiDPI displays)
 * - **README**: 1200x675 (documentation)
 *
 * Cards use srcset for responsive loading - browser picks 1x or 2x based on device pixel ratio.
 */

import type { Browser, Page } from 'playwright';
import { resolve } from 'path';
import { mkdirSync } from 'fs';
import sharp from 'sharp';
import {
  CAPTURE_DELAY_MS,
  createBrowser,
  createPage,
  buildCountdownUrl,
  extractThemeData,
  fileExists,
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

/** Subfolder name for theme images */
export const IMAGES_SUBFOLDER = 'images';

/**
 * Image size presets for different use cases.
 * All use 16:9 aspect ratio to match theme display.
 */
export const IMAGE_SIZES = {
  /**
   * Card images for theme selector (1x standard displays).
   * 426x240 is the native display size.
   */
  'card-1x': { width: 426, height: 240 },
  /**
   * Card images for theme selector (2x retina/HiDPI displays).
   * 852x480 provides crisp rendering on high-density screens.
   */
  'card-2x': { width: 852, height: 480 },
  /**
   * README images for documentation.
   * 1200x675 provides 2x retina support for ~600x338 display.
   */
  readme: { width: 1200, height: 675 },
} as const;

/** Image size type */
export type ImageSizeType = keyof typeof IMAGE_SIZES;

/** Capture dimensions (full resolution before resize) */
const CAPTURE_WIDTH = 1600;
const CAPTURE_HEIGHT = 900;

/** Timer duration for preview capture in seconds. */
const PREVIEW_TIMER_DURATION_SECONDS = 2;

// =============================================================================
// Types
// =============================================================================

/** Configuration options for theme preview generation */
export type PreviewConfig = BaseImageConfig;

/** Size option for preview generation - 'card' generates both 1x and 2x */
export type SizeOption = 'card' | 'readme' | 'both';

/** Options for preview generation behavior */
export interface PreviewOptions {
  /** Specific theme ID to generate (undefined = all themes) */
  themeId?: string;
  /** Force overwrite even if preview exists */
  force: boolean;
  /** Color mode for preview (default: both) */
  colorMode?: 'dark' | 'light' | 'both';
  /** Image size to generate (default: both) */
  size?: SizeOption;
}

/** Result of preview generation for a single theme */
export type PreviewResult = 'generated' | 'skipped';

// =============================================================================
// Configuration
// =============================================================================

/**
 * Builds the configuration for theme preview generation from environment variables.
 * Outputs to src/themes directory so previews are co-located with theme code.
 * @param baseDir - Base directory for output (defaults to src/themes)
 * @returns Configuration object with port, base URL, and output directory
 */
export function buildPreviewConfig(baseDir?: string): PreviewConfig {
  const { port, baseUrl } = resolvePortAndBaseUrl();
  const outputDir = baseDir || resolve(process.cwd(), 'src/themes');
  const completionMessage = '00:00';

  return { port, baseUrl, outputDir, completionMessage };
}

// =============================================================================
// CLI Argument Parsing
// =============================================================================

/**
 * Parse command line arguments for preview generation.
 *
 * Supported formats:
 * - `<themeId>` - Generate specific theme (forces overwrite)
 * - `--theme <themeId>` or `--theme=<themeId>` - Generate specific theme
 * - `--force` or `-f` - Force overwrite all existing previews
 * - `--size <card|readme|both>` - Image size to generate (default: both)
 *
 * @param args - Command line arguments (typically process.argv.slice(2))
 * @returns Parsed preview options
 */
export function parsePreviewArgs(args: string[]): PreviewOptions {
  let themeId: string | undefined;
  let force = false;
  let colorMode: 'dark' | 'light' | 'both' = 'both';
  let size: SizeOption = 'both';

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--force' || arg === '-f') {
      force = true;
    } else if (arg === '--theme' && args[i + 1]) {
      themeId = args[i + 1];
      force = true; // Specific theme always forces
      i++; // Skip next arg
    } else if (arg.startsWith('--theme=')) {
      themeId = arg.slice('--theme='.length);
      force = true;
    } else if (arg === '--color-mode' && args[i + 1]) {
      const mode = args[i + 1];
      if (mode === 'dark' || mode === 'light' || mode === 'both') {
        colorMode = mode;
      }
      i++; // Skip next arg
    } else if (arg.startsWith('--color-mode=')) {
      const mode = arg.slice('--color-mode='.length);
      if (mode === 'dark' || mode === 'light' || mode === 'both') {
        colorMode = mode;
      }
    } else if (arg === '--size' && args[i + 1]) {
      const sizeArg = args[i + 1];
      if (sizeArg === 'card' || sizeArg === 'readme' || sizeArg === 'both') {
        size = sizeArg;
      }
      i++; // Skip next arg
    } else if (arg.startsWith('--size=')) {
      const sizeArg = arg.slice('--size='.length);
      if (sizeArg === 'card' || sizeArg === 'readme' || sizeArg === 'both') {
        size = sizeArg;
      }
    } else if (!arg.startsWith('-')) {
      // Positional argument = theme ID
      themeId = arg;
      force = true; // Specific theme always forces
    }
  }

  return { themeId, force, colorMode, size };
}

// =============================================================================
// File Existence Check
// =============================================================================

/**
 * Check if a preview image already exists at the given path.
 * @param filePath - Absolute path to check
 * @returns true if file exists, false otherwise
 */
export function previewExists(filePath: string): boolean {
  return fileExists(filePath);
}

// =============================================================================
// Screenshot Capture
// =============================================================================

/** Delay after clicking fullscreen for the mode to activate */
const PREVIEW_FULLSCREEN_ACTIVATION_DELAY_MS = 500;

/**
 * Delay after countdown reaches 00:00 to capture celebration animations.
 * 
 * Timing math (for contribution-graph wall build ~1800ms):
 * - Fullscreen activation: 500ms
 * - CAPTURE_DELAY_MS: 1000ms (from shared.ts)
 * - This delay: added after the above
 * - Timer duration: 2000ms
 * 
 * Total before capture = 500 + 1000 + this value
 * Timer completes at ~2000ms from page load
 * Reduced to 200ms to capture early celebration (minimal wall coverage of timer)
 */
const PREVIEW_CELEBRATION_CAPTURE_DELAY_MS = 200;

/**
 * Get the filename suffix for an image size type.
 * @param sizeType - The size type
 * @returns Filename suffix (e.g., '-card-1x', '-card-2x', or '')
 */
function getSizeSuffix(sizeType: ImageSizeType): string {
  switch (sizeType) {
    case 'card-1x':
      return '-card-1x';
    case 'card-2x':
      return '-card-2x';
    case 'readme':
      return '';
  }
}

/**
 * Build the output filename for a preview image.
 * Images are stored in the `images/` subfolder within each theme.
 * @param outputDir - Base output directory
 * @param themeId - Theme identifier
 * @param colorMode - Color mode (dark or light)
 * @param sizeType - Image size type
 * @returns Full path to output file
 */
export function buildPreviewFilename(
  outputDir: string,
  themeId: string,
  colorMode: 'dark' | 'light',
  sizeType: ImageSizeType
): string {
  const suffix = getSizeSuffix(sizeType);
  return resolve(outputDir, themeId, IMAGES_SUBFOLDER, `preview-${colorMode}${suffix}.webp`);
}

/**
 * Captures a screenshot of a countdown theme for preview image.
 * Clicks fullscreen button, waits for countdown to complete and celebration
 * animations to start, then captures as PNG and converts to WebP.
 * @param page - Playwright page instance
 * @param url - URL to navigate to
 * @param outputPath - File path for saving the screenshot (should end in .webp)
 * @param colorMode - Color mode preference ('dark' or 'light')
 * @param sizeType - Target image size type
 */
export async function captureThemePreviewScreenshot(
  page: Page,
  url: string,
  outputPath: string,
  colorMode: 'dark' | 'light',
  sizeType: ImageSizeType = 'readme'
): Promise<void> {
  // Emulate the color scheme at browser level (affects prefers-color-scheme media query)
  await page.emulateMedia({ colorScheme: colorMode });

  // Also set color mode preference in localStorage before navigating
  await page.addInitScript((mode: 'dark' | 'light') => {
    localStorage.setItem('countdown:color-mode', mode);
  }, colorMode);

  await page.goto(url, { waitUntil: 'networkidle' });

  // Click fullscreen button to enter fullscreen mode
  const fullscreenButton = page.locator('[data-testid="fullscreen-button"]');
  if (await fullscreenButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await fullscreenButton.click();
    await page.waitForTimeout(PREVIEW_FULLSCREEN_ACTIVATION_DELAY_MS);
  }

  // Wait for countdown to complete (timer duration) and celebration animations to start
  await page.waitForTimeout(CAPTURE_DELAY_MS + PREVIEW_CELEBRATION_CAPTURE_DELAY_MS);

  // Hide any remaining UI chrome
  await hideUIElements(page);

  // Capture as PNG buffer (Playwright doesn't support WebP directly)
  const pngBuffer = await page.screenshot({ type: 'png' });

  // Get target dimensions
  const { width, height } = IMAGE_SIZES[sizeType];

  // Convert to WebP using sharp with resize and quality 85
  await sharp(pngBuffer)
    .resize(width, height, { fit: 'cover' })
    .webp({ quality: 85 })
    .toFile(outputPath);
}

// =============================================================================
// Image Generation
// =============================================================================

/**
 * Expand a size option to the actual image size types to generate.
 * 'card' generates both 1x and 2x variants for responsive images.
 * @param sizeOption - The size option from CLI
 * @returns Array of image size types to generate
 */
function expandSizeOption(sizeOption: SizeOption): ImageSizeType[] {
  switch (sizeOption) {
    case 'card':
      return ['card-1x', 'card-2x'];
    case 'readme':
      return ['readme'];
    case 'both':
      return ['card-1x', 'card-2x', 'readme'];
  }
}

/**
 * Generates preview images for a single theme.
 * Outputs to the theme's `images/` subfolder with naming convention:
 * - Card 1x: `preview-{mode}-card-1x.webp` (426x240)
 * - Card 2x: `preview-{mode}-card-2x.webp` (852x480)
 * - README: `preview-{mode}.webp` (1200x675)
 *
 * @param page - Playwright page instance
 * @param theme - Theme data containing id and display name
 * @param config - Preview image configuration
 * @param options - Preview generation options (default: no force)
 * @returns 'generated' if any image was created, 'skipped' if all already exist
 */
export async function generateThemePreview(
  page: Page,
  theme: ThemeData,
  config: PreviewConfig,
  options: PreviewOptions = { force: false, colorMode: 'both', size: 'both' }
): Promise<PreviewResult> {
  const colorMode = options.colorMode || 'both';
  const sizeOption = options.size || 'both';
  
  const colorModes: Array<'dark' | 'light'> = colorMode === 'both' ? ['dark', 'light'] : [colorMode];
  const sizeTypes = expandSizeOption(sizeOption);

  let anyGenerated = false;

  // Ensure images subfolder exists
  const imagesDir = resolve(config.outputDir, theme.id, IMAGES_SUBFOLDER);
  mkdirSync(imagesDir, { recursive: true });

  for (const mode of colorModes) {
    // Navigate and capture screenshot once per color mode
    const url = buildCountdownUrl(config.baseUrl, theme.id, config.completionMessage, PREVIEW_TIMER_DURATION_SECONDS);
    
    // Check which sizes need generation for this color mode
    const sizesToGenerate: ImageSizeType[] = [];
    for (const sizeType of sizeTypes) {
      const filename = buildPreviewFilename(config.outputDir, theme.id, mode, sizeType);
      if (!options.force && previewExists(filename)) {
        const { width, height } = IMAGE_SIZES[sizeType];
        console.log(`  ⏭️  ${theme.displayName} (${theme.id}, ${mode}, ${width}x${height}) - already exists, skipping`);
      } else {
        sizesToGenerate.push(sizeType);
      }
    }

    if (sizesToGenerate.length === 0) {
      continue;
    }

    // Capture screenshot once at full resolution
    console.log(`  📸 Capturing ${theme.displayName} (${theme.id}, ${mode})...`);
    
    // Emulate the color scheme at browser level
    await page.emulateMedia({ colorScheme: mode });
    await page.addInitScript((colorModeParam: 'dark' | 'light') => {
      localStorage.setItem('countdown:color-mode', colorModeParam);
    }, mode);

    await page.goto(url, { waitUntil: 'networkidle' });

    // Click fullscreen button to enter fullscreen mode
    const fullscreenButton = page.locator('[data-testid="fullscreen-button"]');
    if (await fullscreenButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await fullscreenButton.click();
      await page.waitForTimeout(PREVIEW_FULLSCREEN_ACTIVATION_DELAY_MS);
    }

    // Wait for countdown to complete and celebration animations
    await page.waitForTimeout(CAPTURE_DELAY_MS + PREVIEW_CELEBRATION_CAPTURE_DELAY_MS);
    await hideUIElements(page);

    // Capture as PNG buffer once
    const pngBuffer = await page.screenshot({ type: 'png' });

    // Generate each requested size from the same screenshot
    for (const sizeType of sizesToGenerate) {
      const filename = buildPreviewFilename(config.outputDir, theme.id, mode, sizeType);
      const { width, height } = IMAGE_SIZES[sizeType];
      const sizeLabel = `${width}x${height}`;

      console.log(`  🖼️  ${theme.displayName} (${mode}, ${sizeLabel})...`);

      await sharp(pngBuffer)
        .resize(width, height, { fit: 'cover' })
        .webp({ quality: 85 })
        .toFile(filename);

      const suffix = getSizeSuffix(sizeType);
      console.log(`     ✅ Saved: src/themes/${theme.id}/${IMAGES_SUBFOLDER}/preview-${mode}${suffix}.webp`);
      anyGenerated = true;
    }
  }

  return anyGenerated ? 'generated' : 'skipped';
}

// =============================================================================
// Browser/Page Factory (Preview-specific wrappers)
// =============================================================================

/**
 * Creates a Playwright browser instance for preview generation.
 * @returns Playwright browser instance
 */
async function createPreviewBrowser(): Promise<Browser> {
  return createBrowser();
}

/**
 * Creates a Playwright page with capture dimensions (1600x900).
 * Full resolution capture is then resized to target dimensions.
 * @param browser - Playwright browser instance
 * @returns Playwright page instance with capture viewport
 */
export async function createPreviewPage(browser: Browser): Promise<Page> {
  return createPage(browser, CAPTURE_WIDTH, CAPTURE_HEIGHT);
}

// =============================================================================
// Main Orchestration
// =============================================================================

/**
 * Main function to generate preview images for all themes.
 * Orchestrates the entire process: browser setup, theme iteration, and cleanup.
 *
 * @param options - Preview options (theme filter, force overwrite, size)
 * @param registryPath - Optional path to registry file (for testing)
 */
export async function generateThemePreviews(
  options: PreviewOptions = { force: false, size: 'both' },
  registryPath?: string
): Promise<void> {
  // Register loader and load registry
  registerWebpMockLoader();

  const resolvedRegistryPath =
    registryPath || resolve(process.cwd(), 'src/themes/registry/index.ts');
  const registry = await loadThemeRegistry(resolvedRegistryPath);

  // Extract theme data from registry
  let themes = extractThemeData(registry);

  // Filter to specific theme if requested
  if (options.themeId) {
    const targetTheme = themes.find((t) => t.id === options.themeId);
    if (!targetTheme) {
      console.error(`❌ Theme '${options.themeId}' not found in registry.`);
      console.error(`   Available themes: ${themes.map((t) => t.id).join(', ')}`);
      throw new Error(`Theme '${options.themeId}' not found`);
    }
    themes = [targetTheme];
  }

  const config = buildPreviewConfig();
  const sizeOption = options.size || 'both';

  console.log('🖼️  Generating theme preview images...');
  console.log(`   Using base URL: ${config.baseUrl}`);
  console.log(`   Capture resolution: ${CAPTURE_WIDTH}x${CAPTURE_HEIGHT}`);
  console.log(`   Output subfolder: ${IMAGES_SUBFOLDER}/`);
  if (sizeOption === 'both' || sizeOption === 'card') {
    console.log(`   Card 1x output: ${IMAGE_SIZES['card-1x'].width}x${IMAGE_SIZES['card-1x'].height} (standard displays)`);
    console.log(`   Card 2x output: ${IMAGE_SIZES['card-2x'].width}x${IMAGE_SIZES['card-2x'].height} (retina/HiDPI)`);
  }
  if (sizeOption === 'both' || sizeOption === 'readme') {
    console.log(`   README output: ${IMAGE_SIZES.readme.width}x${IMAGE_SIZES.readme.height} (for documentation)`);
  }
  console.log(`   Color mode: ${options.colorMode || 'both'}`);
  console.log(`   Size: ${sizeOption}`);
  if (options.themeId) {
    console.log(`   Target theme: ${options.themeId}`);
  } else {
    console.log(`   Themes found: ${themes.map((t) => t.id).join(', ')}`);
  }
  if (options.force) {
    console.log(`   Mode: Force overwrite`);
  } else {
    console.log(`   Mode: Skip existing`);
  }
  console.log('');

  const browser = await createPreviewBrowser();
  const page = await createPreviewPage(browser);

  try {
    let generated = 0;
    let skipped = 0;

    // Generate preview for each theme
    for (const theme of themes) {
      const result = await generateThemePreview(page, theme, config, options);
      if (result === 'generated') {
        generated++;
      } else {
        skipped++;
      }
    }

    console.log('\n✨ Theme preview generation complete!');
    if (skipped > 0) {
      console.log(`   Generated: ${generated}, Skipped: ${skipped}\n`);
    } else {
      console.log(`   Generated ${generated} theme${generated === 1 ? '' : 's'}\n`);
    }
  } catch (error) {
    console.error('❌ Error generating theme previews:', error);
    throw error;
  } finally {
    await browser.close();
  }
}


