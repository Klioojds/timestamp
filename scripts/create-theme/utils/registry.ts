import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { toCamelCase, toSnakeCase } from './string-utils';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Go up from scripts/create-theme/utils to project root, then into src/themes
export const THEMES_DIR = path.resolve(__dirname, '../../../src/themes');

/** Path to sitemap.xml - used internally by updateSitemapLastmod */
const SITEMAP_PATH = path.resolve(__dirname, '../../../public/sitemap.xml');

/**
 * Update the theme registry (src/themes/registry/registry-core.ts) to include the new theme.
 *
 * This function:
 * 1. Adds a config import
 * 2. Adds a loader function
 * 3. Adds an entry to THEME_REGISTRY
 *
 * The registry is the single source of truth for available themes.
 * After this update, the theme is immediately available throughout the app.
 *
 * @param themeName - Kebab-case theme name
 * @throws Error if registry-core.ts structure doesn't match expected patterns
 */
export function updateRegistry(themeName: string): void {
  const registryPath = path.join(THEMES_DIR, 'registry', 'registry-core.ts');
  let content = fs.readFileSync(registryPath, 'utf-8');

  const camel = toCamelCase(themeName);
  const snakeUpper = toSnakeCase(themeName).toUpperCase();
  const pascal = themeName.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');

  // 1. Add import for the new theme's config (alphabetically)
  const configImportPattern = /import \{ (\w+)_CONFIG \} from '\.\.\/([^']+)\/config';/g;
  const imports: Array<{ name: string; theme: string; fullLine: string; index: number }> = [];
  let match: RegExpExecArray | null;
  
  while ((match = configImportPattern.exec(content)) !== null) {
    imports.push({
      name: match[1],
      theme: match[2],
      fullLine: match[0],
      index: match.index,
    });
  }

  if (imports.length === 0) {
    throw new Error('Could not find config import pattern in registry-core.ts');
  }

  // Find the correct alphabetical position
  const newImport = `import { ${snakeUpper}_CONFIG } from '../${themeName}/config';`;
  let insertIndex = -1;

  for (let i = 0; i < imports.length; i++) {
    if (themeName.localeCompare(imports[i].theme) < 0) {
      // Insert before this import
      insertIndex = imports[i].index;
      break;
    }
  }

  if (insertIndex === -1) {
    // Insert after the last import
    const lastImport = imports[imports.length - 1];
    const lineEnd = content.indexOf('\n', lastImport.index) + 1;
    content = content.slice(0, lineEnd) + newImport + '\n' + content.slice(lineEnd);
  } else {
    // Insert before the found position
    content = content.slice(0, insertIndex) + newImport + '\n' + content.slice(insertIndex);
  }

  // 2. Add loader function BEFORE Stryker restore comment (within the disable block)
  const loaderFunction = `
const load${pascal}Theme = async (): Promise<LoadedThemeModule> => {
  const module = await import('../${themeName}');
  return {
    timePageRenderer: module.${camel}TimePageRenderer,
    landingPageRenderer: module.${camel}LandingPageRenderer,
    config: module.${snakeUpper}_CONFIG,
  };
};
`;

  // Find the Stryker restore comment and insert BEFORE it (keeping it within disable block)
  const strykerRestorePattern = /(\/\/ Stryker restore all)/;
  const strykerMatch = content.match(strykerRestorePattern);
  if (strykerMatch) {
    content = content.replace(strykerRestorePattern, `${loaderFunction}\n$1`);
  } else {
    throw new Error('Could not find Stryker restore comment in registry-core.ts');
  }

  // 3. Add registry entry using createRegistryEntry helper
  const registryEntry = `  '${themeName}': createRegistryEntry(${snakeUpper}_CONFIG, load${pascal}Theme),`;

  // Find the closing of THEME_REGISTRY (look for last entry before "} as const")
  const registryClosingPattern = /(createRegistryEntry\([^)]+\),)\n(} as const)/;
  const registryMatch = content.match(registryClosingPattern);

  if (registryMatch) {
    content = content.replace(
      registryClosingPattern,
      `$1\n${registryEntry}\n$2`
    );
  } else {
    throw new Error('Could not find THEME_REGISTRY closing pattern in registry-core.ts');
  }

  fs.writeFileSync(registryPath, content);
}

/**
 * Update sitemap.xml lastmod date to today.
 *
 * Adding a new theme is a meaningful content change that users will see,
 * so we update the sitemap to signal to search engines that the site
 * has been updated. This follows Google's guidance on lastmod usage.
 *
 * @see https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
 */
export function updateSitemapLastmod(): void {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  let content = fs.readFileSync(SITEMAP_PATH, 'utf-8');

  // Replace the lastmod date
  content = content.replace(
    /<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/,
    `<lastmod>${today}</lastmod>`
  );

  fs.writeFileSync(SITEMAP_PATH, content);
}
