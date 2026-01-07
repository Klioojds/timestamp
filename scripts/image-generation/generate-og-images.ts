#!/usr/bin/env tsx
/**
 * Generate Open Graph social preview images for each theme
 *
 * This script uses Playwright to screenshot each countdown theme at completion state
 * and generates 1200x630 OG images for social media sharing.
 *
 * Uses the same pattern as sync-theme-fixtures.ts to mock .webp imports and
 * dynamically import from the theme registry.
 *
 * Run: npm run generate:og-images
 * Or with custom port: OG_PORT=5174 tsx scripts/generate-og-images.ts
 */

import { generateOGImages } from './og-images.js';

// Run the script
generateOGImages().catch((error) => {
  console.error(error);
  process.exit(1);
});
