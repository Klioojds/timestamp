/**
 * Main validation runner with CLI interface.
 * Orchestrates all validation checks and reports results.
 *
 * @packageDocumentation
 */

import type { ThemeId } from '../../src/themes/registry';
import type { ResolvedColorMode, ThemeModeColors } from '../../src/core/types';
import { parseColor, getContrastRatio, meetsContrastRequirement, getLuminance } from './contrast';
import { loadThemePalette, loadAllThemePalettes } from './palette-loader';
import {
  createSummary,
  formatSummary,
  type FormatOptions,
  type ValidationResult,
  type ThemeValidationResults,
  type ValidationSummary,
} from './reporter';

type ContrastCheckType = 'normal-text' | 'ui-component' | 'hierarchy';

interface ContrastCheck {
  combination: string;
  foreground: keyof ThemeModeColors;
  background: keyof ThemeModeColors;
  type: ContrastCheckType;
  lightnessDeltaThreshold?: number;
}

const REQUIRED_RATIOS: Record<ContrastCheckType, number> = {
  'normal-text': 4.5,
  'ui-component': 3.0,
  hierarchy: 1.1,
};

const TEXT_CONTRAST_CHECKS: readonly ContrastCheck[] = [
  { combination: 'text on surface', foreground: 'text', background: 'surface', type: 'normal-text' },
  { combination: 'text on surfaceElevated', foreground: 'text', background: 'surfaceElevated', type: 'normal-text' },
  { combination: 'text on input', foreground: 'text', background: 'input', type: 'normal-text' },
  { combination: 'textMuted on surface', foreground: 'textMuted', background: 'surface', type: 'normal-text' },
  { combination: 'textMuted on surfaceElevated', foreground: 'textMuted', background: 'surfaceElevated', type: 'normal-text' },
  { combination: 'textMuted on input', foreground: 'textMuted', background: 'input', type: 'normal-text' },
  { combination: 'error on surface', foreground: 'error', background: 'surface', type: 'normal-text' },
  { combination: 'error on input', foreground: 'error', background: 'input', type: 'normal-text' },
  { combination: 'success on surface', foreground: 'success', background: 'surface', type: 'normal-text' },
  { combination: 'success on surfaceElevated', foreground: 'success', background: 'surfaceElevated', type: 'normal-text' },
];

const UI_CONTRAST_CHECKS: readonly ContrastCheck[] = [
  { combination: 'border on background', foreground: 'border', background: 'background', type: 'ui-component' },
  { combination: 'borderMuted on surface', foreground: 'borderMuted', background: 'surface', type: 'ui-component' },
  { combination: 'focusRing on background', foreground: 'focusRing', background: 'background', type: 'ui-component' },
  { combination: 'focusRing on surface', foreground: 'focusRing', background: 'surface', type: 'ui-component' },
];

const HIERARCHY_CONTRAST_CHECKS: readonly ContrastCheck[] = [
  {
    combination: 'surfaceElevated vs surface (hierarchy)',
    foreground: 'surfaceElevated',
    background: 'surface',
    type: 'hierarchy',
    lightnessDeltaThreshold: 5,
  },
];

function runContrastChecks(
  colors: Required<ThemeModeColors>,
  mode: ResolvedColorMode,
  checks: readonly ContrastCheck[]
): ValidationResult[] {
  const parsedColorCache = new Map<keyof ThemeModeColors, ReturnType<typeof parseColor>>();

  const getParsedColor = (colorName: keyof ThemeModeColors) => {
    const cached = parsedColorCache.get(colorName);
    if (cached) {
      return cached;
    }

    const parsed = parseColor(colors[colorName]);
    parsedColorCache.set(colorName, parsed);
    return parsed;
  };

  return checks.map(check => {
    const foreground = getParsedColor(check.foreground);
    const background = getParsedColor(check.background);
    const ratio = getContrastRatio(foreground, background);
    const lightnessDelta =
      check.lightnessDeltaThreshold !== undefined
        ? Math.abs(getLuminance(foreground) - getLuminance(background)) * 100
        : undefined;

    const required = REQUIRED_RATIOS[check.type];
    const passed =
      check.type === 'hierarchy'
        ? ratio >= required || (lightnessDelta ?? 0) >= (check.lightnessDeltaThreshold ?? 0)
        : meetsContrastRequirement(ratio, check.type === 'normal-text' ? 'normal-text' : 'ui-component');

    return {
      combination: check.combination,
      foreground: check.foreground,
      background: check.background,
      ratio,
      required,
      passed,
      mode,
    };
  });
}

/**
 * CLI options for validation runner.
 */
export interface ValidationOptions {
  /** Single theme to validate (or undefined for all) */
  theme?: ThemeId;
  /** Color mode(s) to validate */
  mode?: 'dark' | 'light' | 'both';
  /** Verbose output */
  verbose?: boolean;
  /** Allow failures (exit code 0 even with failures) */
  allowFailures?: boolean;
}

/**
 * Validates text-on-surface contrast combinations.
 *
 * Checks:
 * - text on surface, surfaceElevated, input (4.5:1)
 * - textMuted on surface, surfaceElevated, input (4.5:1)
 * - error on surface, input (4.5:1)
 * - success on surface, surfaceElevated (4.5:1)
 *
 * @param colors - Theme color palette for a mode
 * @param mode - Color mode being validated
 * @returns Array of validation results
 */
function validateTextContrast(
  colors: Required<ThemeModeColors>,
  mode: ResolvedColorMode
): ValidationResult[] {
  return runContrastChecks(colors, mode, TEXT_CONTRAST_CHECKS);
}

/**
 * Validates UI component contrast (borders, focus rings).
 *
 * Checks:
 * - border on background (3:1)
 * - borderMuted on surface (3:1)
 * - focusRing on background and surface (3:1)
 *
 * @param colors - Theme color palette for a mode
 * @param mode - Color mode being validated
 * @returns Array of validation results
 */
function validateUIContrast(
  colors: Required<ThemeModeColors>,
  mode: ResolvedColorMode
): ValidationResult[] {
  return runContrastChecks(colors, mode, UI_CONTRAST_CHECKS);
}

/**
 * Validates surface hierarchy (surfaceElevated vs surface).
 *
 * Checks that surfaceElevated is visually distinct from surface:
 * - Minimum contrast ratio of 1.1:1 OR lightness delta ≥ 5
 *
 * @param colors - Theme color palette for a mode
 * @param mode - Color mode being validated
 * @returns Array of validation results
 */
function validateSurfaceHierarchy(
  colors: Required<ThemeModeColors>,
  mode: ResolvedColorMode
): ValidationResult[] {
  return runContrastChecks(colors, mode, HIERARCHY_CONTRAST_CHECKS);
}

/**
 * Validates a single theme and mode.
 *
 * @param themeId - Theme to validate
 * @param mode - Color mode to validate
 * @returns Theme validation results
 */
function validateThemeMode(themeId: ThemeId, mode: ResolvedColorMode): ThemeValidationResults {
  const palette = loadThemePalette(themeId);
  const colors = palette[mode];
  
  const results: ValidationResult[] = [
    ...validateTextContrast(colors, mode),
    ...validateUIContrast(colors, mode),
    ...validateSurfaceHierarchy(colors, mode),
  ];
  
  const passed = results.every(r => r.passed);
  
  return {
    themeId,
    mode,
    results,
    passed,
  };
}

/**
 * Validates all themes based on options.
 *
 * @param options - Validation options
 * @returns Validation summary
 *
 * @example
 * ```typescript
 * // Validate all themes, both modes
 * const summary = validateThemes({ mode: 'both' });
 *
 * // Validate single theme, dark mode only
 * const summary = validateThemes({ theme: 'contribution-graph', mode: 'dark' });
 * ```
 */
export function validateThemes(options: ValidationOptions = {}): ValidationSummary {
  const { theme, mode = 'both' } = options;
  
  // Determine which themes to validate
  const themesToValidate = theme ? [theme] : loadAllThemePalettes().map(p => p.themeId);
  
  // Determine which modes to validate
  const modesToValidate: ResolvedColorMode[] =
    mode === 'both' ? ['dark', 'light'] : [mode];
  
  // Collect all theme-mode results
  const themeResults: ThemeValidationResults[] = [];
  
  for (const themeId of themesToValidate) {
    for (const colorMode of modesToValidate) {
      themeResults.push(validateThemeMode(themeId, colorMode));
    }
  }
  
  return createSummary(themeResults);
}

/**
 * Runs validation and outputs results to console.
 *
 * @param options - Validation options
 * @returns Exit code (0 = pass, 1 = fail, or 0 if allowFailures is true)
 *
 * @example
 * ```typescript
 * // Run from CLI wrapper
 * const exitCode = runValidation({ theme: 'contribution-graph' });
 * process.exit(exitCode);
 * 
 * // Allow failures (exit 0 even with failures)
 * const exitCode = runValidation({ allowFailures: true });
 * ```
 */
export function runValidation(options: ValidationOptions = {}): number {
  try {
    const summary = validateThemes(options);
    const formatOptions: FormatOptions = { verbose: options.verbose };
    const formatted = formatSummary(summary, formatOptions);
    
    console.log(formatted);
    
    // If allowFailures is true, always return 0 (but still show failures)
    if (options.allowFailures) {
      if (summary.failedThemes > 0) {
        console.log('\n⚠️  Failures detected but ignored (--allow-failures enabled)');
      }
      return 0;
    }
    
    return summary.failedThemes > 0 ? 1 : 0;
  } catch (error) {
    console.error('Validation error:', error);
    return 1;
  }
}
