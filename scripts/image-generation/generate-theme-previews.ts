#!/usr/bin/env tsx
/**
 * Generate theme preview images for each countdown theme
 *
 * This script uses Playwright to screenshot each countdown theme at completion state
 * and generates WebP images in 16:9 aspect ratio with responsive variants.
 *
 * Preview images are saved to each theme's `images/` subfolder:
 * - Card 1x: 426x240 (standard displays)
 * - Card 2x: 852x480 (retina/HiDPI displays)
 * - README: 1200x675 (documentation)
 *
 * Usage:
 *   npm run generate:previews                    # Generate all (skip existing)
 *   npm run generate:previews -- --force         # Force regenerate all
 *   npm run generate:previews -- fireworks       # Generate specific theme (force)
 *   npm run generate:previews -- --theme=fireworks
 *
 * Environment variables:
 *   OG_PORT - Port for the preview server (default: 5173)
 *   OG_BASE_URL - Base URL override for the countdown page
 */

import { generateThemePreviews, parsePreviewArgs } from './theme-previews.js';

// Parse CLI arguments
const args = process.argv.slice(2);

// Handle --help
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: generate-theme-previews [options] [theme-id]

Options:
  <theme-id>              Generate preview for specific theme (forces overwrite)
  --theme <id>            Generate preview for specific theme
  --theme=<id>            Generate preview for specific theme
  --force, -f             Force overwrite existing previews
  --size <type>           Image size: card (852x480), readme (1200x675), both (default)
  --size=<type>           Image size: card, readme, or both
  --color-mode <mode>     Color mode: dark, light, or both (default)
  --help, -h              Show this help message

Image Sizes:
  card                    852x480 - Optimized for theme selector cards (2x retina)
  readme                  1200x675 - Optimized for README documentation (2x retina)
  both                    Generate both sizes (default)

Examples:
  npm run generate:previews                      # Generate all (skip existing)
  npm run generate:previews -- --force           # Force regenerate all
  npm run generate:previews -- fireworks         # Generate specific theme
  npm run generate:previews -- --size=card       # Generate card-size only
  npm run generate:previews -- --theme=fireworks --size=readme
`);
  process.exit(0);
}

const options = parsePreviewArgs(args);

// Run the script
generateThemePreviews(options).catch((error) => {
  console.error(error);
  process.exit(1);
});
