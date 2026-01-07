/**
 * Theme Dependency Validation Helper
 *
 * Detects undocumented npm dependencies in theme source files
 * and emits warnings for missing documentation.
 *
 * This module is extracted from validate-theme-configs.ts to keep
 * that file under 350 lines per code quality standards.
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import type { ThemeDependency } from '../../src/core/types/index.js';

/**
 * Core dependency entry for exclusion from theme warnings.
 */
export interface CoreDependency {
  /** Package name as it appears in imports */
  name: string;
  /** URL for attribution */
  url: string;
}

/**
 * Pattern to detect npm package imports (not relative imports).
 * Matches: from 'package-name' or from "package-name"
 * Does NOT match: from './local' or from '../parent' or from '\@/'
 */
const NPM_IMPORT_PATTERN = /from\s+['"]([^./][^'"]*)['"]/g;

/**
 * Built-in Node.js modules to exclude from detection.
 */
const NODE_BUILTINS = new Set([
  'fs',
  'path',
  'url',
  'util',
  'os',
  'crypto',
  'events',
  'stream',
  'buffer',
  'child_process',
  'http',
  'https',
  'net',
  'tls',
  'dns',
  'assert',
  'readline',
  'querystring',
  'zlib',
  'node:fs',
  'node:path',
  'node:url',
  'node:util',
  'node:os',
  'node:crypto',
]);

/**
 * Internal path aliases to exclude from detection.
 * These are project-internal imports, not npm packages.
 */
const PATH_ALIASES = new Set(['@/', '@core/', '@themes/', '@app/', '@components/']);

/**
 * Normalize package name to base package (handle scoped packages and subpaths).
 *
 * @example
 * - 'lodash' → 'lodash'
 * - 'lodash/fp' → 'lodash'
 * - '\@primer/octicons' → '\@primer/octicons'
 * - '\@primer/octicons/build' → '\@primer/octicons'
 */
function normalizePackageName(importPath: string): string {
  // Handle scoped packages (@scope/package)
  if (importPath.startsWith('@')) {
    const parts = importPath.split('/');
    if (parts.length >= 2) {
      return `${parts[0]}/${parts[1]}`;
    }
    return importPath;
  }

  // Handle regular packages (package or package/subpath)
  const parts = importPath.split('/');
  return parts[0];
}

/**
 * Check if an import is a path alias (internal import).
 */
function isPathAlias(importPath: string): boolean {
  for (const alias of PATH_ALIASES) {
    if (importPath.startsWith(alias)) {
      return true;
    }
  }
  return false;
}

/**
 * Extract npm package imports from TypeScript source code.
 *
 * @param sourceCode - TypeScript file content
 * @returns Set of normalized npm package names
 */
export function extractNpmImports(sourceCode: string): Set<string> {
  const imports = new Set<string>();
  let match;

  // Reset regex lastIndex for safety
  NPM_IMPORT_PATTERN.lastIndex = 0;

  while ((match = NPM_IMPORT_PATTERN.exec(sourceCode)) !== null) {
    const importPath = match[1];

    // Skip Node.js builtins
    if (NODE_BUILTINS.has(importPath)) {
      continue;
    }

    // Skip path aliases (internal imports)
    if (isPathAlias(importPath)) {
      continue;
    }

    // Skip type-only imports (look for preceding 'import type')
    const precedingCode = sourceCode.slice(Math.max(0, match.index - 50), match.index);
    if (precedingCode.includes('import type')) {
      continue;
    }

    const packageName = normalizePackageName(importPath);
    imports.add(packageName);
  }

  return imports;
}

/**
 * Recursively find all TypeScript files in a directory.
 *
 * @param dir - Directory path
 * @returns Array of .ts file paths
 */
function findTypeScriptFiles(dir: string): string[] {
  const files: string[] = [];

  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        // Skip test directories and node_modules
        if (entry !== 'node_modules' && !entry.endsWith('.test') && entry !== 'e2e') {
          files.push(...findTypeScriptFiles(fullPath));
        }
      } else if (entry.endsWith('.ts') && !entry.endsWith('.test.ts') && !entry.endsWith('.spec.ts')) {
        files.push(fullPath);
      }
    }
  } catch {
    // Directory doesn't exist or isn't readable
  }

  return files;
}

/**
 * Detect undocumented npm dependencies in a theme's source files.
 *
 * @param themeId - Theme identifier (folder name)
 * @param documentedDeps - Dependencies documented in theme config
 * @param coreDeps - Core project dependencies to exclude from warnings
 * @param themesDir - Path to themes directory (default: process.cwd()/src/themes)
 * @returns Array of undocumented package names
 */
export function detectUndocumentedDependencies(
  themeId: string,
  documentedDeps: ThemeDependency[],
  coreDeps: CoreDependency[],
  themesDir?: string
): string[] {
  const basePath = themesDir ?? join(process.cwd(), 'src/themes');
  const themeDir = join(basePath, themeId);

  // Find all TypeScript files in the theme directory
  const tsFiles = findTypeScriptFiles(themeDir);

  // Extract all npm imports from theme source files
  const allImports = new Set<string>();
  for (const file of tsFiles) {
    try {
      const content = readFileSync(file, 'utf-8');
      const imports = extractNpmImports(content);
      for (const imp of imports) {
        allImports.add(imp);
      }
    } catch {
      // File read error, skip
    }
  }

  // Build sets for comparison
  const documentedNames = new Set(documentedDeps.map((d) => d.name));
  const coreNames = new Set(coreDeps.map((d) => d.name));

  // Find undocumented imports (not in documented deps and not in core deps)
  const undocumented: string[] = [];
  for (const imp of allImports) {
    if (!documentedNames.has(imp) && !coreNames.has(imp)) {
      undocumented.push(imp);
    }
  }

  return undocumented.sort();
}

/**
 * Emit warnings for undocumented dependencies.
 * Returns the count of warnings emitted.
 *
 * @param themeId - Theme identifier
 * @param undocumented - Array of undocumented package names
 * @returns Number of warnings emitted
 */
export function emitDependencyWarnings(themeId: string, undocumented: string[]): number {
  for (const pkg of undocumented) {
    console.warn(
      `⚠️  Theme "${themeId}" uses npm package "${pkg}" but it's not documented in dependencies array`
    );
  }
  return undocumented.length;
}
