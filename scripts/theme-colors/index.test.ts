/**
 * @fileoverview Unit tests for theme color validation runner.
 */

import { describe, it, expect } from 'vitest';
import { validateThemes } from './index';

describe('theme-colors/index', () => {
  describe('validateThemes', () => {
    it('should validate all themes in both modes by default', () => {
      const summary = validateThemes();
      
      // Should have at least 2 themes * 2 modes = 4 results
      expect(summary.totalThemes).toBeGreaterThanOrEqual(4);
      expect(summary.themes.length).toBe(summary.totalThemes);
      
      // Should have both dark and light mode results
      const modes = summary.themes.map(t => t.mode);
      expect(modes).toContain('dark');
      expect(modes).toContain('light');
    });

    it('should validate single theme when specified', () => {
      const summary = validateThemes({ theme: 'contribution-graph', mode: 'both' });
      
      // Should have exactly 2 results (dark + light)
      expect(summary.totalThemes).toBe(2);
      expect(summary.themes.every(t => t.themeId === 'contribution-graph')).toBe(true);
    });

    it.each([
      { mode: 'dark' as const },
      { mode: 'light' as const },
    ])('should validate $mode mode only when specified', ({ mode }) => {
      const summary = validateThemes({ mode });
      expect(summary.themes.every((t) => t.mode === mode)).toBe(true);
    });

    it('should include text contrast checks', () => {
      const summary = validateThemes({ theme: 'contribution-graph', mode: 'dark' });
      
      const results = summary.themes[0].results;
      const combinations = results.map(r => r.combination);
      
      expect(combinations).toContain('text on surface');
      expect(combinations).toContain('text on surfaceElevated');
      expect(combinations).toContain('text on input');
      expect(combinations).toContain('textMuted on surface');
      expect(combinations).toContain('textMuted on surfaceElevated');
      expect(combinations).toContain('textMuted on input');
      expect(combinations).toContain('error on surface');
      expect(combinations).toContain('error on input');
      expect(combinations).toContain('success on surface');
      expect(combinations).toContain('success on surfaceElevated');
    });

    it('should include UI contrast checks', () => {
      const summary = validateThemes({ theme: 'contribution-graph', mode: 'dark' });
      
      const results = summary.themes[0].results;
      const combinations = results.map(r => r.combination);
      
      expect(combinations).toContain('border on background');
      expect(combinations).toContain('borderMuted on surface');
      expect(combinations).toContain('focusRing on background');
      expect(combinations).toContain('focusRing on surface');
    });

    it('should include surface hierarchy check', () => {
      const summary = validateThemes({ theme: 'contribution-graph', mode: 'dark' });
      
      const results = summary.themes[0].results;
      const combinations = results.map(r => r.combination);
      
      expect(combinations).toContain('surfaceElevated vs surface (hierarchy)');
    });

    it('should calculate statistics correctly', () => {
      const summary = validateThemes({ theme: 'contribution-graph', mode: 'dark' });
      
      expect(summary.totalChecks).toBeGreaterThan(0);
      expect(summary.passedChecks + summary.failedChecks).toBe(summary.totalChecks);
      expect(summary.passedThemes + summary.failedThemes).toBe(summary.totalThemes);
    });

    it('should mark theme as failed if any check fails', () => {
      const summary = validateThemes();
      
      // Find any failing theme
      const failingTheme = summary.themes.find(t => !t.passed);
      
      if (failingTheme) {
        // Should have at least one failing result
        const failingResults = failingTheme.results.filter(r => !r.passed);
        expect(failingResults.length).toBeGreaterThan(0);
      }
    });

    it('should provide actual contrast ratios for each check', () => {
      const summary = validateThemes({ theme: 'contribution-graph', mode: 'dark' });
      
      const results = summary.themes[0].results;
      
      results.forEach(result => {
        expect(result.ratio).toBeGreaterThan(0);
        expect(result.ratio).toBeLessThanOrEqual(21); // Max contrast
        expect(result.required).toBeGreaterThan(0);
        expect(typeof result.passed).toBe('boolean');
      });
    });

    it('should handle both contribution-graph and fireworks themes', () => {
      const summary = validateThemes({ mode: 'dark' });
      
      const themeIds = summary.themes.map(t => t.themeId);
      expect(themeIds).toContain('contribution-graph');
      expect(themeIds).toContain('fireworks');
    });
  });

  describe('validation requirements', () => {
    it('should require 4.5:1 for text on surfaces', () => {
      const summary = validateThemes({ theme: 'contribution-graph', mode: 'dark' });
      const textOnSurface = summary.themes[0].results.find(r => r.combination === 'text on surface');
      
      expect(textOnSurface?.required).toBe(4.5);
    });

    it('should require 3.0:1 for UI components', () => {
      const summary = validateThemes({ theme: 'contribution-graph', mode: 'dark' });
      const borderOnBg = summary.themes[0].results.find(r => r.combination === 'border on background');
      
      expect(borderOnBg?.required).toBe(3.0);
    });

    it('should require 1.1:1 for surface hierarchy', () => {
      const summary = validateThemes({ theme: 'contribution-graph', mode: 'dark' });
      const hierarchy = summary.themes[0].results.find(r => r.combination.includes('hierarchy'));
      
      expect(hierarchy?.required).toBe(1.1);
    });
  });
});
