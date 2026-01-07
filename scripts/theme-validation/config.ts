/**
 * Theme Configuration Validation
 *
 * Validates all theme configurations against required schema.
 * Checks ThemeConfig properties, registry entries, file existence,
 * date formats, author profiles (optional), and theme exports.
 */

import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { registerWebpMockLoader } from '../image-generation/shared.js';
import {
    detectUndocumentedDependencies,
    emitDependencyWarnings,
} from '../utils/theme-dependency-validation.js';
import {
    checkSuspiciousPatterns,
    validateAuthorFormat,
    validateColors,
    validatePreviewExists,
    validatePublishedDateFormat,
    validateRegistryMatch,
    validateRequiredFields,
    type ThemeConfigForValidation,
    type ValidationResult,
} from '../utils/theme-validation.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Core project dependencies to exclude from theme-specific warnings. */
const CORE_DEPENDENCIES = [
  { name: 'natural-earth', url: 'https://www.naturalearthdata.com/' },
  { name: '@primer/octicons', url: 'https://github.com/primer/octicons' },
  { name: 'playwright', url: 'https://playwright.dev/' },
  { name: 'suncalc', url: 'https://github.com/mourner/suncalc' },
  { name: 'typescript', url: 'https://www.typescriptlang.org/' },
  { name: 'vite', url: 'https://vitejs.dev/' },
  { name: 'vitest', url: 'https://vitest.dev/' },
];

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface RegistryEntry {
  id: string;
  name: string;
  description: string;
  publishedDate: string;
  author: string | null;
  supportsWorldMap?: boolean;
  dependencies?: Array<{ name: string; url: string }>;
}

interface ThemeModule {
  [key: string]: unknown;
}

interface ThemeValidationResult {
  themeId: string;
  valid: boolean;
  errors: Array<{ field: string; message: string; suggestion?: string }>;
  warnings: Array<{ field: string; message: string; suggestion?: string }>;
}

interface ValidationSummary {
  totalThemes: number;
  passedThemes: number;
  failedThemes: number;
  totalErrors: number;
  totalWarnings: number;
  results: ThemeValidationResult[];
}

export interface ConfigValidationOptions {
  check?: boolean;
  skipNetwork?: boolean;
  theme?: string;
}

// =============================================================================
// THEME LOADING
// =============================================================================

async function loadThemeRegistry(): Promise<Record<string, RegistryEntry>> {
  const registryPath = resolve(__dirname, '../../src/themes/registry/index.ts');
  const registry = (await import(registryPath)) as {
    THEME_REGISTRY: Record<string, RegistryEntry>;
  };
  return registry.THEME_REGISTRY;
}

async function loadThemeConfig(themeId: string): Promise<ThemeModule> {
  // Load config/index.ts directly to avoid SCSS imports in index.ts
  const configPath = resolve(__dirname, `../../src/themes/${themeId}/config/index.ts`);
  return (await import(configPath)) as ThemeModule;
}

function checkStylesExist(themeId: string): ValidationResult {
  const errors: ValidationResult['errors'] = [];
  const warnings: ValidationResult['warnings'] = [];
  
  const stylesPath = resolve(__dirname, `../../src/themes/${themeId}/styles.scss`);
  if (!existsSync(stylesPath)) {
    errors.push({
      type: 'MISSING_FILE',
      field: 'styles',
      message: 'styles.scss file not found',
      suggestion: `Create ${themeId}/styles.scss with theme-specific styles`,
    });
  }
  
  return { valid: errors.length === 0, errors, warnings };
}

// =============================================================================
// VALIDATION LOGIC
// =============================================================================

function getThemeConfig(module: ThemeModule, themeId: string): ThemeConfigForValidation | null {
  const upperName = themeId.toUpperCase().replace(/-/g, '_');
  const configConstName = `${upperName}_CONFIG`;
  const config = module[configConstName];

  if (!config || typeof config !== 'object') {
    return null;
  }

  return config as ThemeConfigForValidation;
}

async function checkGitHubProfile(
  username: string,
  fetchFn: typeof fetch = fetch
): Promise<ValidationResult> {
  const errors: ValidationResult['errors'] = [];
  const warnings: ValidationResult['warnings'] = [];

  try {
    const response = await fetchFn(`https://api.github.com/users/${username}`, {
      method: 'HEAD',
    });

    if (response.status === 404) {
      warnings.push({
        type: 'AUTHOR_NOT_FOUND',
        field: 'author',
        message: `GitHub profile not found: ${username}`,
        suggestion: 'Verify the GitHub username is correct',
      });
    } else if (response.status === 429) {
      warnings.push({
        type: 'RATE_LIMITED',
        field: 'author',
        message: 'GitHub API rate limit reached, skipping profile check',
      });
    } else if (!response.ok) {
      warnings.push({
        type: 'NETWORK_ERROR',
        field: 'author',
        message: `Failed to verify GitHub profile (HTTP ${response.status})`,
      });
    }
  } catch (error) {
    warnings.push({
      type: 'NETWORK_ERROR',
      field: 'author',
      message: `Network error checking GitHub profile: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }

  return { valid: true, errors, warnings };
}

async function validateTheme(
  themeId: string,
  registryEntry: RegistryEntry,
  options: ConfigValidationOptions
): Promise<ThemeValidationResult> {
  const allErrors: ThemeValidationResult['errors'] = [];
  const allWarnings: ThemeValidationResult['warnings'] = [];

  // Check that styles.scss exists
  const stylesResult = checkStylesExist(themeId);
  allErrors.push(...stylesResult.errors);
  allWarnings.push(...stylesResult.warnings);

  let themeModule: ThemeModule;
  try {
    themeModule = await loadThemeConfig(themeId);
  } catch (error) {
    return {
      themeId,
      valid: false,
      errors: [
        ...allErrors,
        {
          field: 'config',
          message: `Failed to load theme config: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      warnings: allWarnings,
    };
  }

  const themeConfig = getThemeConfig(themeModule, themeId);
  if (!themeConfig) {
    return {
      themeId,
      valid: false,
      errors: [...allErrors, { field: 'config', message: `Could not find theme config constant` }],
      warnings: allWarnings,
    };
  }

  const requiredFieldsResult = validateRequiredFields(themeConfig);
  allErrors.push(...requiredFieldsResult.errors);
  allWarnings.push(...requiredFieldsResult.warnings);

  if (themeConfig.publishedDate) {
    const dateResult = validatePublishedDateFormat(themeConfig.publishedDate);
    allErrors.push(...dateResult.errors);
    allWarnings.push(...dateResult.warnings);
  }

  if ('author' in themeConfig) {
    const authorResult = validateAuthorFormat(themeConfig.author);
    allErrors.push(...authorResult.errors);
    allWarnings.push(...authorResult.warnings);

    if (!options.skipNetwork && themeConfig.author !== null) {
      const profileResult = await checkGitHubProfile(themeConfig.author);
      allWarnings.push(...profileResult.warnings);
    }
  }

  const previewResult = await validatePreviewExists(themeId);
  allErrors.push(...previewResult.errors);
  allWarnings.push(...previewResult.warnings);

  if (themeConfig.colors) {
    const colorsResult = validateColors(themeConfig.colors);
    allErrors.push(...colorsResult.errors);
    allWarnings.push(...colorsResult.warnings);
  }

  const registryMatchResult = validateRegistryMatch(
    {
      id: registryEntry.id,
      displayName: registryEntry.name,
      author: registryEntry.author,
    },
    themeConfig
  );
  allErrors.push(...registryMatchResult.errors);
  allWarnings.push(...registryMatchResult.warnings);

  const suspiciousResult = checkSuspiciousPatterns(themeConfig);
  allWarnings.push(...suspiciousResult.warnings);

  const documentedDeps = themeConfig.dependencies ?? [];
  const undocumentedDeps = detectUndocumentedDependencies(themeId, documentedDeps, CORE_DEPENDENCIES);
  if (undocumentedDeps.length > 0) {
    emitDependencyWarnings(themeId, undocumentedDeps);
    for (const pkg of undocumentedDeps) {
      allWarnings.push({
        field: 'dependencies',
        message: `Undocumented npm dependency: ${pkg}`,
        suggestion: `Add to dependencies array in config.ts: { name: '${pkg}', url: '...' }`,
      });
    }
  }

  return {
    themeId,
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}

function formatOutput(summary: ValidationSummary): void {
  console.log('📊 Validation Results');
  console.log('─'.repeat(50));
  console.log();

  for (const result of summary.results) {
    const statusIcon = result.valid ? '✅' : '❌';
    console.log(`${statusIcon} ${result.themeId}`);

    if (result.errors.length > 0) {
      for (const error of result.errors) {
        console.log(`   ❌ ${error.field}: ${error.message}`);
        if (error.suggestion) {
          console.log(`      💡 ${error.suggestion}`);
        }
      }
    }

    if (result.warnings.length > 0) {
      for (const warning of result.warnings) {
        console.log(`   ⚠️  ${warning.field}: ${warning.message}`);
        if (warning.suggestion) {
          console.log(`      💡 ${warning.suggestion}`);
        }
      }
    }

    console.log();
  }

  console.log('─'.repeat(50));
  console.log(`Total themes: ${summary.totalThemes}`);
  console.log(`✅ Passed: ${summary.passedThemes}`);
  console.log(`❌ Failed: ${summary.failedThemes}`);
  console.log(`Errors: ${summary.totalErrors}`);
  console.log(`Warnings: ${summary.totalWarnings}`);
}

// =============================================================================
// EXPORTS
// =============================================================================

/**
 * Run configuration validation.
 *
 * @param options - Validation options
 * @returns Exit code (0 = pass, 1 = fail)
 */
export async function runConfigValidation(options: ConfigValidationOptions = {}): Promise<number> {
  console.log('🔍 Theme Configuration Validation');
  console.log('─'.repeat(50));

  if (options.theme) {
    console.log(`Mode: Single theme (${options.theme})`);
  } else {
    console.log('Mode: All themes');
  }

  if (options.skipNetwork) {
    console.log('Network checks: Disabled');
  }

  console.log('─'.repeat(50));
  console.log();

  registerWebpMockLoader();
  
  // Note: We load config.ts directly to avoid SCSS imports in index.ts

  const themeRegistry = await loadThemeRegistry();
  const themeIds = Object.keys(themeRegistry);

  const themesToValidate = options.theme
    ? themeIds.filter((id) => id === options.theme)
    : themeIds;

  if (options.theme && themesToValidate.length === 0) {
    console.error(`❌ Error: Theme "${options.theme}" not found in registry`);
    console.error(`   Available themes: ${themeIds.join(', ')}`);
    return 1;
  }

  console.log(`📦 Loaded ${themesToValidate.length} theme(s) from registry`);
  console.log();

  const results: ThemeValidationResult[] = [];
  for (const themeId of themesToValidate) {
    const registryEntry = themeRegistry[themeId];
    const result = await validateTheme(themeId, registryEntry, options);
    results.push(result);
  }

  const summary: ValidationSummary = {
    totalThemes: results.length,
    passedThemes: results.filter((r) => r.valid).length,
    failedThemes: results.filter((r) => !r.valid).length,
    totalErrors: results.reduce((sum, r) => sum + r.errors.length, 0),
    totalWarnings: results.reduce((sum, r) => sum + r.warnings.length, 0),
    results,
  };

  formatOutput(summary);

  if (options.check && summary.failedThemes > 0) {
    return 1;
  }

  return 0;
}
