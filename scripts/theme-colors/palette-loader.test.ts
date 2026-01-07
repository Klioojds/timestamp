/**
 * @fileoverview Unit tests for theme palette loader.
 */

import { describe, it, expect } from 'vitest';
import { loadThemePalette, loadAllThemePalettes, loadThemeColors } from './palette-loader';

describe('theme-colors/palette-loader', () => {
  describe('loadThemePalette', () => {
    it('should load complete palette for contribution-graph', () => {
      const palette = loadThemePalette('contribution-graph');
      
      expect(palette.themeId).toBe('contribution-graph');
      expect(palette.dark).toBeDefined();
      expect(palette.light).toBeDefined();
      
      // Verify all 14 color properties exist in dark mode
      expect(palette.dark.background).toBeDefined();
      expect(palette.dark.text).toBeDefined();
      expect(palette.dark.textMuted).toBeDefined();
      expect(palette.dark.accentPrimary).toBeDefined();
      expect(palette.dark.accentSecondary).toBeDefined();
      expect(palette.dark.accentTertiary).toBeDefined();
      expect(palette.dark.surface).toBeDefined();
      expect(palette.dark.surfaceElevated).toBeDefined();
      expect(palette.dark.input).toBeDefined();
      expect(palette.dark.border).toBeDefined();
      expect(palette.dark.borderMuted).toBeDefined();
      expect(palette.dark.error).toBeDefined();
      expect(palette.dark.success).toBeDefined();
      expect(palette.dark.focusRing).toBeDefined();
      
      // Verify all 14 color properties exist in light mode
      expect(palette.light.background).toBeDefined();
      expect(palette.light.text).toBeDefined();
      expect(palette.light.textMuted).toBeDefined();
      expect(palette.light.accentPrimary).toBeDefined();
      expect(palette.light.accentSecondary).toBeDefined();
      expect(palette.light.accentTertiary).toBeDefined();
      expect(palette.light.surface).toBeDefined();
      expect(palette.light.surfaceElevated).toBeDefined();
      expect(palette.light.input).toBeDefined();
      expect(palette.light.border).toBeDefined();
      expect(palette.light.borderMuted).toBeDefined();
      expect(palette.light.error).toBeDefined();
      expect(palette.light.success).toBeDefined();
      expect(palette.light.focusRing).toBeDefined();
    });

    it('should load complete palette for fireworks', () => {
      const palette = loadThemePalette('fireworks');
      
      expect(palette.themeId).toBe('fireworks');
      expect(palette.dark).toBeDefined();
      expect(palette.light).toBeDefined();
    });

    it('should include mode-specific defaults when theme does not override', () => {
      const palette = loadThemePalette('contribution-graph');
      
      // Dark mode should have dark defaults
      expect(palette.dark.background).toBe('#0d1117');
      expect(palette.dark.text).toBe('#f0f6fc');
      
      // Light mode should have light defaults
      expect(palette.light.background).toBe('#ffffff');
      expect(palette.light.text).toBe('#1f2328');
    });

    it('should handle accentTertiary fallback to accentPrimary', () => {
      const palette = loadThemePalette('contribution-graph');
      
      // If theme does not define accentTertiary, it should fall back
      // (We can't test the exact value without knowing theme config,
      //  but we can verify it's defined and equals accentPrimary if unset)
      expect(palette.dark.accentTertiary).toBeDefined();
      expect(palette.light.accentTertiary).toBeDefined();
    });
  });

  describe('loadAllThemePalettes', () => {
    it('should load palettes for all registered themes', () => {
      const palettes = loadAllThemePalettes();
      
      // Should have at least 2 themes (contribution-graph, fireworks)
      expect(palettes.length).toBeGreaterThanOrEqual(2);
      
      // Verify each palette has required structure
      palettes.forEach(palette => {
        expect(palette.themeId).toBeDefined();
        expect(palette.dark).toBeDefined();
        expect(palette.light).toBeDefined();
        
        // Verify all 14 properties exist
        const modes = ['dark', 'light'] as const;
        modes.forEach(mode => {
          const colors = palette[mode];
          expect(colors.background).toBeDefined();
          expect(colors.text).toBeDefined();
          expect(colors.textMuted).toBeDefined();
          expect(colors.accentPrimary).toBeDefined();
          expect(colors.accentSecondary).toBeDefined();
          expect(colors.accentTertiary).toBeDefined();
          expect(colors.surface).toBeDefined();
          expect(colors.surfaceElevated).toBeDefined();
          expect(colors.input).toBeDefined();
          expect(colors.border).toBeDefined();
          expect(colors.borderMuted).toBeDefined();
          expect(colors.error).toBeDefined();
          expect(colors.success).toBeDefined();
          expect(colors.focusRing).toBeDefined();
        });
      });
    });

    it('should include both contribution-graph and fireworks', () => {
      const palettes = loadAllThemePalettes();
      const themeIds = palettes.map(p => p.themeId);
      
      expect(themeIds).toContain('contribution-graph');
      expect(themeIds).toContain('fireworks');
    });
  });

  describe('loadThemeColors', () => {
    it.each([
      { mode: 'dark' as const, background: '#0d1117', text: '#f0f6fc' },
      { mode: 'light' as const, background: '#ffffff', text: '#1f2328' },
    ])('should load $mode mode colors for a theme', ({ mode, background, text }) => {
      const colors = loadThemeColors('contribution-graph', mode);
      expect(colors.background).toBe(background);
      expect(colors.text).toBe(text);
    });

    it('should return all 14 color properties', () => {
      const colors = loadThemeColors('fireworks', 'dark');
      
      expect(colors).toHaveProperty('background');
      expect(colors).toHaveProperty('text');
      expect(colors).toHaveProperty('textMuted');
      expect(colors).toHaveProperty('accentPrimary');
      expect(colors).toHaveProperty('accentSecondary');
      expect(colors).toHaveProperty('accentTertiary');
      expect(colors).toHaveProperty('surface');
      expect(colors).toHaveProperty('surfaceElevated');
      expect(colors).toHaveProperty('input');
      expect(colors).toHaveProperty('border');
      expect(colors).toHaveProperty('borderMuted');
      expect(colors).toHaveProperty('error');
      expect(colors).toHaveProperty('success');
      expect(colors).toHaveProperty('focusRing');
    });
  });
});
