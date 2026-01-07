/**
 * E2E Fixture Synchronization
 *
 * Generates e2e/fixtures/theme-fixtures.ts from src/themes/registry/index.ts.
 * This ensures E2E tests have access to theme metadata without importing
 * .webp files that Node.js cannot handle.
 */

import { writeFileSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { registerWebpMockLoader } from '../image-generation/shared.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES_PATH = resolve(__dirname, '../../e2e/fixtures/theme-fixtures.ts');

interface RegistryEntry {
  id: string;
  supportsWorldMap?: boolean;
}

/**
 * Load theme registry from src/themes/registry/index.ts.
 * Requires webp mock loader to be registered before calling.
 *
 * @returns Theme registry object with theme IDs as keys
 */
async function loadThemeRegistry(): Promise<Record<string, RegistryEntry>> {
  const registryPath = resolve(__dirname, '../../src/themes/registry/index.ts');
  const registry = (await import(registryPath)) as {
    THEME_REGISTRY: Record<string, RegistryEntry>;
  };
  return registry.THEME_REGISTRY;
}

/**
 * Extract fixture data from theme registry.
 * Strips down to minimal properties needed for E2E tests.
 *
 * @param themeRegistry - Full theme registry object
 * @returns Array of fixture entries with id and supportsWorldMap
 */
function extractFixtures(themeRegistry: Record<string, RegistryEntry>): RegistryEntry[] {
  return Object.entries(themeRegistry).map(([id, entry]) => ({
    id,
    supportsWorldMap: entry.supportsWorldMap ?? false,
  }));
}

/**
 * Render fixture file content as TypeScript source code.
 *
 * @param themeIds - Array of theme ID strings
 * @param themeFixtures - Array of fixture entries
 * @returns Generated TypeScript source code
 */
function renderFixtureFile(themeIds: string[], themeFixtures: RegistryEntry[]): string {
  return `/**
 * Theme fixtures for E2E tests.
 *
 * ⚠️  AUTO-GENERATED FILE - DO NOT EDIT MANUALLY ⚠️
 *
 * This file is generated from src/themes/registry/index.ts
 * It syncs automatically when running: npm run test:e2e
 *
 * Manual sync: npm run theme sync:fixtures
 * CI validation: npm run theme sync:fixtures -- --check
 */

/**
 * Theme IDs - derived from THEME_REGISTRY keys.
 */
const THEME_IDS = ${JSON.stringify(themeIds)} as const;

export type ThemeId = (typeof THEME_IDS)[number];

export interface ThemeFixture {
  id: ThemeId;
  supportsWorldMap: boolean;
}

/**
 * Theme fixtures derived from THEME_REGISTRY configs.
 */
export const THEME_FIXTURES: ThemeFixture[] = ${JSON.stringify(themeFixtures, null, 2)
    .replace(/"id"/g, 'id')
    .replace(/"supportsWorldMap"/g, 'supportsWorldMap')};

/**
 * Get themes that support world map visualization.
 */
export function getWorldMapThemes(): ThemeFixture[] {
  return THEME_FIXTURES.filter((t) => t.supportsWorldMap);
}

/**
 * Get theme IDs for iteration in tests.
 */
export function getThemeIdsForTest(): ThemeId[] {
  return [...THEME_IDS];
}
`;
}

/**
 * Sync fixtures from registry.
 *
 * @returns true if successful
 */
export async function syncFixtures(): Promise<boolean> {
  try {
    registerWebpMockLoader();
    const registry = await loadThemeRegistry();
    const themeIds = Object.keys(registry);
    const fixtures = extractFixtures(registry);
    const content = renderFixtureFile(themeIds, fixtures);

    writeFileSync(FIXTURES_PATH, content, 'utf-8');
    console.log('✅ Theme fixtures synced from registry');
    console.log(`   Generated: ${FIXTURES_PATH}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to sync fixtures:', error);
    return false;
  }
}

/**
 * Check if fixtures are in sync with registry.
 *
 * @returns true if in sync, false otherwise
 */
export async function checkFixturesSync(): Promise<boolean> {
  try {
    registerWebpMockLoader();
    const registry = await loadThemeRegistry();
    const themeIds = Object.keys(registry);
    const fixtures = extractFixtures(registry);
    const expectedContent = renderFixtureFile(themeIds, fixtures);

    const existingContent = readFileSync(FIXTURES_PATH, 'utf-8');
    if (existingContent === expectedContent) {
      console.log('✅ Theme fixtures are in sync with registry');
      return true;
    }

    console.error('❌ Theme fixtures are out of sync with registry');
    console.error('   Run: npm run theme sync:fixtures');
    return false;
  } catch {
    console.error('❌ Theme fixtures file not found');
    console.error('   Run: npm run theme sync:fixtures');
    return false;
  }
}
