/**
 * @fileoverview Unit tests for validation reporter.
 */

import { describe, it, expect } from 'vitest';
import {
  formatValidationResult,
  formatThemeResults,
  getSuggestion,
  formatSummary,
  createSummary,
  type ValidationResult,
  type ThemeValidationResults,
} from './reporter';

describe('theme-colors/reporter', () => {
  describe('formatValidationResult', () => {
    it('should format passing result', () => {
      const result: ValidationResult = {
        combination: 'text on surface',
        foreground: 'text',
        background: 'surface',
        ratio: 4.6,
        required: 4.5,
        passed: true,
        mode: 'dark',
      };
      
      const formatted = formatValidationResult(result);
      expect(formatted).toContain('✓');
      expect(formatted).toContain('PASS');
      expect(formatted).toContain('text on surface');
      expect(formatted).toContain('4.60:1');
      expect(formatted).toContain('required 4.5:1');
    });

    it('should format failing result', () => {
      const result: ValidationResult = {
        combination: 'border on background',
        foreground: 'border',
        background: 'background',
        ratio: 1.55,
        required: 3.0,
        passed: false,
        mode: 'dark',
      };
      
      const formatted = formatValidationResult(result);
      expect(formatted).toContain('✗');
      expect(formatted).toContain('FAIL');
      expect(formatted).toContain('border on background');
      expect(formatted).toContain('1.55:1');
      expect(formatted).toContain('required 3.0:1');
    });

    it('should round ratios to 2 decimal places', () => {
      const result: ValidationResult = {
        combination: 'test',
        foreground: 'fg',
        background: 'bg',
        ratio: 4.567891,
        required: 4.5,
        passed: true,
        mode: 'dark',
      };
      
      const formatted = formatValidationResult(result);
      expect(formatted).toContain('4.57:1');
    });
  });

  describe('formatThemeResults', () => {
    it('should format theme with all passing results', () => {
      const themeResults: ThemeValidationResults = {
        themeId: 'contribution-graph',
        mode: 'dark',
        results: [
          {
            combination: 'text on surface',
            foreground: 'text',
            background: 'surface',
            ratio: 14.2,
            required: 4.5,
            passed: true,
            mode: 'dark',
          },
          {
            combination: 'border on background',
            foreground: 'border',
            background: 'background',
            ratio: 3.2,
            required: 3.0,
            passed: true,
            mode: 'dark',
          },
        ],
        passed: true,
      };
      
      const formatted = formatThemeResults(themeResults);
      expect(formatted).toContain('contribution-graph (dark mode) - PASSED');
      expect(formatted).toContain('✓');
      expect(formatted).toContain('text on surface');
      expect(formatted).toContain('border on background');
    });

    it('should format theme with failures', () => {
      const themeResults: ThemeValidationResults = {
        themeId: 'fireworks',
        mode: 'light',
        results: [
          {
            combination: 'text on surface',
            foreground: 'text',
            background: 'surface',
            ratio: 4.6,
            required: 4.5,
            passed: true,
            mode: 'light',
          },
          {
            combination: 'border on background',
            foreground: 'border',
            background: 'background',
            ratio: 2.1,
            required: 3.0,
            passed: false,
            mode: 'light',
          },
        ],
        passed: false,
      };
      
      const formatted = formatThemeResults(themeResults);
      expect(formatted).toContain('fireworks (light mode) - FAILED');
      expect(formatted).toContain('✓');
      expect(formatted).toContain('✗');
    });
  });

  describe('getSuggestion', () => {
    it('should return message when already meets requirement', () => {
      const suggestion = getSuggestion(4.6, 4.5, 'text', 'surface');
      expect(suggestion).toBe('Already meets requirement');
    });

    it('should provide adjustment suggestion when failing', () => {
      const suggestion = getSuggestion(2.8, 3.0, 'border', 'background');
      expect(suggestion).toContain('Increase border lightness');
      expect(suggestion).toContain('decrease background lightness');
      expect(suggestion).toContain('3.0:1');
    });

    it('should calculate percentage needed for adjustment', () => {
      const suggestion = getSuggestion(1.55, 3.0, 'border', 'background');
      // Deficit: 1.45, Current: 1.55, Percentage: ~94%
      expect(suggestion).toMatch(/~\d+%/);
      expect(suggestion).toContain('3.0:1');
    });
  });

  describe('createSummary', () => {
    it('should calculate correct statistics for all passing', () => {
      const themeResults: ThemeValidationResults[] = [
        {
          themeId: 'contribution-graph',
          mode: 'dark',
          results: [
            {
              combination: 'text on surface',
              foreground: 'text',
              background: 'surface',
              ratio: 14.2,
              required: 4.5,
              passed: true,
              mode: 'dark',
            },
            {
              combination: 'border on background',
              foreground: 'border',
              background: 'background',
              ratio: 3.2,
              required: 3.0,
              passed: true,
              mode: 'dark',
            },
          ],
          passed: true,
        },
      ];
      
      const summary = createSummary(themeResults);
      
      expect(summary.totalThemes).toBe(1);
      expect(summary.passedThemes).toBe(1);
      expect(summary.failedThemes).toBe(0);
      expect(summary.totalChecks).toBe(2);
      expect(summary.passedChecks).toBe(2);
      expect(summary.failedChecks).toBe(0);
    });

    it('should calculate correct statistics with failures', () => {
      const themeResults: ThemeValidationResults[] = [
        {
          themeId: 'contribution-graph',
          mode: 'dark',
          results: [
            {
              combination: 'text on surface',
              foreground: 'text',
              background: 'surface',
              ratio: 14.2,
              required: 4.5,
              passed: true,
              mode: 'dark',
            },
          ],
          passed: true,
        },
        {
          themeId: 'fireworks',
          mode: 'dark',
          results: [
            {
              combination: 'text on surface',
              foreground: 'text',
              background: 'surface',
              ratio: 4.6,
              required: 4.5,
              passed: true,
              mode: 'dark',
            },
            {
              combination: 'border on background',
              foreground: 'border',
              background: 'background',
              ratio: 2.1,
              required: 3.0,
              passed: false,
              mode: 'dark',
            },
          ],
          passed: false,
        },
      ];
      
      const summary = createSummary(themeResults);
      
      expect(summary.totalThemes).toBe(2);
      expect(summary.passedThemes).toBe(1);
      expect(summary.failedThemes).toBe(1);
      expect(summary.totalChecks).toBe(3);
      expect(summary.passedChecks).toBe(2);
      expect(summary.failedChecks).toBe(1);
    });
  });

  describe('formatSummary', () => {
    it('should format summary with all passing', () => {
      const themeResults: ThemeValidationResults[] = [
        {
          themeId: 'contribution-graph',
          mode: 'dark',
          results: [
            {
              combination: 'text on surface',
              foreground: 'text',
              background: 'surface',
              ratio: 14.2,
              required: 4.5,
              passed: true,
              mode: 'dark',
            },
          ],
          passed: true,
        },
      ];
      
      const summary = createSummary(themeResults);
      const formatted = formatSummary(summary);
      
      expect(formatted).toContain('Validation Summary');
      expect(formatted).toContain('Themes: 1/1 passed (100%)');
      expect(formatted).toContain('Checks: 1/1 passed (100%)');
      expect(formatted).toContain('✅ All themes meet contrast requirements');
    });

    it('should format summary with failures and show suggestions', () => {
      const themeResults: ThemeValidationResults[] = [
        {
          themeId: 'fireworks',
          mode: 'dark',
          results: [
            {
              combination: 'border on background',
              foreground: 'border',
              background: 'background',
              ratio: 2.1,
              required: 3.0,
              passed: false,
              mode: 'dark',
            },
          ],
          passed: false,
        },
      ];
      
      const summary = createSummary(themeResults);
      const formatted = formatSummary(summary);
      
      expect(formatted).toContain('Validation Summary');
      expect(formatted).toContain('Themes: 0/1 passed (0%)');
      expect(formatted).toContain('Checks: 0/1 passed (0%)');
      expect(formatted).toContain('⚠️  1 theme(s) have accessibility issues');
      expect(formatted).toContain('fireworks (dark mode) - FAILED');
      expect(formatted).toContain('💡');
      expect(formatted).toContain('Increase border lightness');
    });

    it('should handle multiple failing themes', () => {
      const themeResults: ThemeValidationResults[] = [
        {
          themeId: 'theme1',
          mode: 'dark',
          results: [
            {
              combination: 'text on surface',
              foreground: 'text',
              background: 'surface',
              ratio: 3.0,
              required: 4.5,
              passed: false,
              mode: 'dark',
            },
          ],
          passed: false,
        },
        {
          themeId: 'theme2',
          mode: 'light',
          results: [
            {
              combination: 'border on background',
              foreground: 'border',
              background: 'background',
              ratio: 2.0,
              required: 3.0,
              passed: false,
              mode: 'light',
            },
          ],
          passed: false,
        },
      ];
      
      const summary = createSummary(themeResults);
      const formatted = formatSummary(summary);
      
      expect(formatted).toContain('⚠️  2 theme(s) have accessibility issues');
      expect(formatted).toContain('theme1 (dark mode) - FAILED');
      expect(formatted).toContain('theme2 (light mode) - FAILED');
    });
  });
});
