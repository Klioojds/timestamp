/**
 * Formats validation results for human-readable output.
 * Provides colorized console output with actionable suggestions.
 *
 * @packageDocumentation
 */

import type { ThemeId } from '../../src/themes/registry';
import type { ResolvedColorMode } from '../../src/core/types';

/**
 * Options for formatting validation output.
 */
export interface FormatOptions {
  /** Show all checks including passes (default: failures only) */
  verbose?: boolean;
}

/**
 * Validation result for a single color combination.
 */
export interface ValidationResult {
  /** Color pair being tested (e.g., "text on surface") */
  combination: string;
  /** Foreground color name */
  foreground: string;
  /** Background color name */
  background: string;
  /** Actual contrast ratio */
  ratio: number;
  /** Required ratio for contrast */
  required: number;
  /** Whether the combination passes */
  passed: boolean;
  /** Color mode being tested */
  mode: ResolvedColorMode;
}

/**
 * Complete validation results for a theme.
 */
export interface ThemeValidationResults {
  /** Theme identifier */
  themeId: ThemeId;
  /** Color mode */
  mode: ResolvedColorMode;
  /** All validation results */
  results: ValidationResult[];
  /** Whether all validations passed */
  passed: boolean;
}

/**
 * Summary of validation results across all themes.
 */
export interface ValidationSummary {
  /** Total number of themes tested */
  totalThemes: number;
  /** Number of themes that passed */
  passedThemes: number;
  /** Number of themes that failed */
  failedThemes: number;
  /** Total validation checks performed */
  totalChecks: number;
  /** Number of passing checks */
  passedChecks: number;
  /** Number of failing checks */
  failedChecks: number;
  /** Theme-level results */
  themes: ThemeValidationResults[];
}

/**
 * Formats a validation result as a console line.
 *
 * @param result - Validation result to format
 * @returns Formatted string with pass/fail indicator and contrast ratio
 *
 * @example
 * ```typescript
 * const result = {
 *   combination: 'text on surface',
 *   foreground: 'text',
 *   background: 'surface',
 *   ratio: 4.6,
 *   required: 4.5,
 *   passed: true,
 *   mode: 'dark'
 * };
 * console.log(formatValidationResult(result));
 * // Output: "✓ text on surface: 4.6:1 (required 4.5:1)"
 * ```
 */
export function formatValidationResult(result: ValidationResult): string {
  const icon = result.passed ? '✓' : '✗';
  const status = result.passed ? 'PASS' : 'FAIL';
  const ratio = result.ratio.toFixed(2);
  const required = result.required.toFixed(1);
  
  return `${icon} [${status}] ${result.combination}: ${ratio}:1 (required ${required}:1)`;
}

/**
 * Formats theme validation results with all checks.
 *
 * @param themeResults - Complete theme validation results
 * @returns Formatted multi-line string
 *
 * @example
 * ```typescript
 * const results = {
 *   themeId: 'contribution-graph',
 *   mode: 'dark',
 *   results: [...],
 *   passed: true
 * };
 * console.log(formatThemeResults(results));
 * // Output:
 * // contribution-graph (dark mode) - PASSED
 * //   ✓ text on surface: 14.2:1 (required 4.5:1)
 * //   ✓ border on background: 3.2:1 (required 3.0:1)
 * //   ...
 * ```
 */
export function formatThemeResults(themeResults: ThemeValidationResults): string {
  const { themeId, mode, results, passed } = themeResults;
  const status = passed ? 'PASSED' : 'FAILED';
  
  const lines = [
    `${themeId} (${mode} mode) - ${status}`,
    ...results.map(r => `  ${formatValidationResult(r)}`),
  ];
  
  return lines.join('\n');
}

/**
 * Calculates the minimum color adjustment needed to meet contrast requirement.
 *
 * @param currentRatio - Current contrast ratio
 * @param requiredRatio - Required contrast ratio
 * @param foreground - Foreground color name
 * @param background - Background color name
 * @returns Suggestion string with adjustment guidance
 *
 * @example
 * ```typescript
 * const suggestion = getSuggestion(2.8, 3.0, 'border', 'background');
 * // Output: "Increase border lightness or decrease background lightness to reach 3.0:1"
 * ```
 */
export function getSuggestion(
  currentRatio: number,
  requiredRatio: number,
  foreground: string,
  background: string
): string {
  if (currentRatio >= requiredRatio) {
    return 'Already meets requirement';
  }
  
  const deficit = requiredRatio - currentRatio;
  const percentageNeeded = ((deficit / currentRatio) * 100).toFixed(0);
  
  return `Increase ${foreground} lightness or decrease ${background} lightness by ~${percentageNeeded}% to reach ${requiredRatio.toFixed(1)}:1`;
}

/**
 * Formats validation summary across all themes.
 *
 * @param summary - Complete validation summary
 * @param options - Format options (verbose: show all checks vs failures only)
 * @returns Formatted multi-line string with statistics
 *
 * @example
 * ```typescript
 * const summary = {
 *   totalThemes: 2,
 *   passedThemes: 1,
 *   failedThemes: 1,
 *   totalChecks: 28,
 *   passedChecks: 26,
 *   failedChecks: 2,
 *   themes: [...]
 * };
 * // Failures only (default)
 * console.log(formatSummary(summary));
 * // All checks
 * console.log(formatSummary(summary, { verbose: true }));
 * ```
 */
export function formatSummary(summary: ValidationSummary, options: FormatOptions = {}): string {
  const { verbose = false } = options;
  const { totalThemes, passedThemes, failedThemes, totalChecks, passedChecks } = summary;
  
  const themePercentage = totalThemes > 0 ? ((passedThemes / totalThemes) * 100).toFixed(0) : '0';
  const checkPercentage = totalChecks > 0 ? ((passedChecks / totalChecks) * 100).toFixed(0) : '0';
  
  // Calculate unique themes (each theme-mode combination is a separate result)
  const uniqueThemes = new Set(summary.themes.map(t => t.themeId)).size;
  const modesPerTheme = totalThemes / uniqueThemes;
  const themeModeLabel = modesPerTheme > 1 ? ` (${modesPerTheme} modes each)` : '';
  
  const lines = [
    '━━━ Validation Summary ━━━',
    `Themes: ${passedThemes}/${totalThemes} passed (${themePercentage}%)${themeModeLabel}`,
    `Checks: ${passedChecks}/${totalChecks} passed (${checkPercentage}%)`,
    '',
  ];
  
  if (failedThemes > 0) {
    lines.push(`⚠️  ${failedThemes} theme(s) have accessibility issues`);
    lines.push('');
    
    // Show failed theme details
    summary.themes.forEach(theme => {
      if (!theme.passed) {
        // In verbose mode, show all results; otherwise only failures
        const resultsToShow = verbose ? theme.results : theme.results.filter(r => !r.passed);
        const formattedResults = resultsToShow.map(r => `  ${formatValidationResult(r)}`).join('\n');
        
        lines.push(`${theme.themeId} (${theme.mode} mode) - FAILED`);
        lines.push(formattedResults);
        lines.push('');
        
        // Add suggestions for failures
        theme.results.forEach(result => {
          if (!result.passed) {
            const suggestion = getSuggestion(
              result.ratio,
              result.required,
              result.foreground,
              result.background
            );
            lines.push(`    💡 ${suggestion}`);
          }
        });
        lines.push('');
      }
    });
  } else {
    lines.push('✅ All themes meet contrast requirements');
    
    // In verbose mode, show all passing results too
    if (verbose) {
      lines.push('');
      summary.themes.forEach(theme => {
        lines.push(formatThemeResults(theme));
        lines.push('');
      });
    }
  }
  
  return lines.join('\n');
}

/**
 * Creates a validation summary from theme results.
 *
 * @param themeResults - Array of theme validation results
 * @returns Complete validation summary with statistics
 *
 * @example
 * ```typescript
 * const summary = createSummary([themeResults1, themeResults2]);
 * console.log(summary.passedThemes); // 1
 * console.log(summary.failedThemes); // 1
 * ```
 */
export function createSummary(themeResults: ThemeValidationResults[]): ValidationSummary {
  const passedThemes = themeResults.filter(t => t.passed).length;
  const totalChecks = themeResults.reduce((sum, t) => sum + t.results.length, 0);
  const passedChecks = themeResults.reduce(
    (sum, t) => sum + t.results.filter(r => r.passed).length,
    0
  );
  
  return {
    totalThemes: themeResults.length,
    passedThemes,
    failedThemes: themeResults.length - passedThemes,
    totalChecks,
    passedChecks,
    failedChecks: totalChecks - passedChecks,
    themes: themeResults,
  };
}
