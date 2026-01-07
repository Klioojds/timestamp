/**
 * @file Tests for color-applicator module
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { applyThemeColorOverrides, __clearColorCache } from './theme-color-manager';
import type { ThemeModeColors } from '@core/types';
import { COLOR_VARIABLE_MAP } from '@/core/config/color-scheme-defaults';

describe('applyThemeColorOverrides', () => {
  /**
   * Complete test color scheme with all 14 properties.
   * Used for backward compatibility testing.
   */
  const testColors: Required<ThemeModeColors> = {
    background: '#0d1117',
    text: '#f0f6fc',
    textMuted: '#8b949e',
    accentPrimary: '#39d353',
    accentSecondary: '#58a6ff',
    accentTertiary: '#7ee787',
    surface: 'rgba(13, 17, 23, 0.95)',
    surfaceElevated: 'rgba(48, 54, 61, 0.5)',
    input: 'rgba(13, 17, 23, 0.8)',
    border: '#30363d',
    borderMuted: '#21262d',
    error: '#f85149',
    success: '#238636',
    focusRing: '#58a6ff',
  };

  beforeEach(() => {
    // Clear cache before each test
    __clearColorCache();
    // Clear existing CSS variables using COLOR_VARIABLE_MAP
    const root = document.documentElement.style;
    for (const { cssVar } of COLOR_VARIABLE_MAP) {
      root.removeProperty(cssVar);
    }
    // Clear data-color-mode attribute
    document.documentElement.removeAttribute('data-color-mode');
  });

  afterEach(() => {
    __clearColorCache();
  });

  it('should set CSS custom properties on document root', () => {
    applyThemeColorOverrides(testColors, 'dark');

    const root = document.documentElement.style;
    expect(root.getPropertyValue('--color-background')).toBe('#0d1117');
    expect(root.getPropertyValue('--color-text')).toBe('#f0f6fc');
    expect(root.getPropertyValue('--color-text-muted')).toBe('#8b949e');
    expect(root.getPropertyValue('--color-accent-primary')).toBe('#39d353');
    expect(root.getPropertyValue('--color-accent-secondary')).toBe('#58a6ff');
    expect(root.getPropertyValue('--color-accent-tertiary')).toBe('#7ee787');
    expect(root.getPropertyValue('--color-surface')).toBe('rgba(13, 17, 23, 0.95)');
    expect(root.getPropertyValue('--color-surface-elevated')).toBe('rgba(48, 54, 61, 0.5)');
    expect(root.getPropertyValue('--color-input')).toBe('rgba(13, 17, 23, 0.8)');
    expect(root.getPropertyValue('--color-border')).toBe('#30363d');
    expect(root.getPropertyValue('--color-border-muted')).toBe('#21262d');
    expect(root.getPropertyValue('--color-error')).toBe('#f85149');
    expect(root.getPropertyValue('--color-success')).toBe('#238636');
    expect(root.getPropertyValue('--color-focus-ring')).toBe('#58a6ff');
  });

  it('should set data-color-mode attribute on html element', () => {
    applyThemeColorOverrides(testColors, 'dark');
    expect(document.documentElement.getAttribute('data-color-mode')).toBe('dark');

    applyThemeColorOverrides(testColors, 'light');
    expect(document.documentElement.getAttribute('data-color-mode')).toBe('light');
  });

  it('should skip update if colors and mode unchanged', () => {
    applyThemeColorOverrides(testColors, 'dark');

    // Change CSS var directly (simulating external modification)
    const root = document.documentElement.style;
    root.setProperty('--color-accent-primary', '#ffffff');

    // Apply same colors and mode again - should skip update
    applyThemeColorOverrides(testColors, 'dark');

    // External modification should persist (proves we skipped update)
    expect(root.getPropertyValue('--color-accent-primary')).toBe('#ffffff');
  });

  it('should update when mode changes even if colors are same', () => {
    applyThemeColorOverrides(testColors, 'dark');
    
    // Change data-color-mode directly
    document.documentElement.setAttribute('data-color-mode', 'invalid');

    // Apply same colors but different mode - should update
    applyThemeColorOverrides(testColors, 'light');

    // Should have updated the attribute
    expect(document.documentElement.getAttribute('data-color-mode')).toBe('light');
  });

  it('should not mutate input colors object', () => {
    const colors: Required<ThemeModeColors> = {
      background: '#0d1117',
      text: '#f0f6fc',
      textMuted: '#8b949e',
      accentPrimary: '#39d353',
      accentSecondary: '#58a6ff',
      accentTertiary: '#7ee787',
      surface: 'rgba(13, 17, 23, 0.95)',
      surfaceElevated: 'rgba(48, 54, 61, 0.5)',
      input: 'rgba(13, 17, 23, 0.8)',
      border: '#30363d',
      borderMuted: '#21262d',
      error: '#f85149',
      success: '#238636',
      focusRing: '#58a6ff',
    };

    const originalColors = { ...colors };
    applyThemeColorOverrides(colors, 'dark');

    // Input should be unchanged
    expect(colors).toEqual(originalColors);
  });

  it('should handle different color values for each property', () => {
    const colors: Required<ThemeModeColors> = {
      background: '#111111',
      text: '#222222',
      textMuted: '#333333',
      accentPrimary: '#444444',
      accentSecondary: '#555555',
      accentTertiary: '#666666',
      surface: '#777777',
      surfaceElevated: '#888888',
      input: '#999999',
      border: '#aaaaaa',
      borderMuted: '#bbbbbb',
      error: '#cccccc',
      success: '#dddddd',
      focusRing: '#eeeeee',
    };

    applyThemeColorOverrides(colors, 'light');

    const root = document.documentElement.style;
    expect(root.getPropertyValue('--color-background')).toBe('#111111');
    expect(root.getPropertyValue('--color-text')).toBe('#222222');
    expect(root.getPropertyValue('--color-text-muted')).toBe('#333333');
    expect(root.getPropertyValue('--color-accent-primary')).toBe('#444444');
    expect(root.getPropertyValue('--color-accent-secondary')).toBe('#555555');
    expect(root.getPropertyValue('--color-accent-tertiary')).toBe('#666666');
    expect(root.getPropertyValue('--color-surface')).toBe('#777777');
    expect(root.getPropertyValue('--color-surface-elevated')).toBe('#888888');
    expect(root.getPropertyValue('--color-input')).toBe('#999999');
    expect(root.getPropertyValue('--color-border')).toBe('#aaaaaa');
    expect(root.getPropertyValue('--color-border-muted')).toBe('#bbbbbb');
    expect(root.getPropertyValue('--color-error')).toBe('#cccccc');
    expect(root.getPropertyValue('--color-success')).toBe('#dddddd');
    expect(root.getPropertyValue('--color-focus-ring')).toBe('#eeeeee');
  });

  const singlePropertyCases: Array<{
    property: keyof ThemeModeColors;
    cssVar: string;
    newValue: string;
  }> = [
    { property: 'background', cssVar: '--color-background', newValue: '#ffffff' },
    { property: 'text', cssVar: '--color-text', newValue: '#000000' },
    { property: 'textMuted', cssVar: '--color-text-muted', newValue: '#999999' },
    { property: 'accentPrimary', cssVar: '--color-accent-primary', newValue: '#ff0000' },
    { property: 'accentSecondary', cssVar: '--color-accent-secondary', newValue: '#ff00ff' },
    { property: 'accentTertiary', cssVar: '--color-accent-tertiary', newValue: '#00ff00' },
    { property: 'surface', cssVar: '--color-surface', newValue: 'rgba(255, 255, 255, 0.1)' },
    { property: 'surfaceElevated', cssVar: '--color-surface-elevated', newValue: 'rgba(100, 100, 100, 0.8)' },
    { property: 'input', cssVar: '--color-input', newValue: '#ffffff' },
    { property: 'border', cssVar: '--color-border', newValue: '#ff0000' },
    { property: 'borderMuted', cssVar: '--color-border-muted', newValue: '#00ff00' },
    { property: 'error', cssVar: '--color-error', newValue: '#ff1111' },
    { property: 'success', cssVar: '--color-success', newValue: '#00ff00' },
    { property: 'focusRing', cssVar: '--color-focus-ring', newValue: '#0000ff' },
  ];

  it.each(singlePropertyCases)('should apply changes when only %s changes', ({ property, cssVar, newValue }) => {
    applyThemeColorOverrides(testColors, 'dark');

    const newColors: Required<ThemeModeColors> = {
      ...testColors,
      [property]: newValue,
    };

    applyThemeColorOverrides(newColors, 'dark');

    const root = document.documentElement.style;
    expect(root.getPropertyValue(cssVar)).toBe(newValue);
  });

  it('should handle rapid successive calls with different colors', () => {
    const colors1: Required<ThemeModeColors> = {
      ...testColors,
      accentPrimary: '#111111',
    };
    const colors2: Required<ThemeModeColors> = {
      ...testColors,
      accentPrimary: '#222222',
    };
    const colors3: Required<ThemeModeColors> = {
      ...testColors,
      accentPrimary: '#333333',
    };

    applyThemeColorOverrides(colors1, 'dark');
    applyThemeColorOverrides(colors2, 'dark');
    applyThemeColorOverrides(colors3, 'dark');

    const root = document.documentElement.style;
    expect(root.getPropertyValue('--color-accent-primary')).toBe('#333333');
  });

  it('should apply all new structural colors correctly in light mode', () => {
    const lightColors: Required<ThemeModeColors> = {
      background: '#ffffff',
      text: '#1f2328',
      textMuted: '#656d76',
      accentPrimary: '#1a7f37',
      accentSecondary: '#0969da',
      accentTertiary: '#1a7f37',
      surface: 'rgba(255, 255, 255, 0.95)',
      surfaceElevated: 'rgba(246, 248, 250, 0.8)',
      input: 'rgba(255, 255, 255, 0.8)',
      border: '#d0d7de',
      borderMuted: '#d8dee4',
      error: '#cf222e',
      success: '#1a7f37',
      focusRing: '#0969da',
    };

    applyThemeColorOverrides(lightColors, 'light');

    const root = document.documentElement.style;
    expect(root.getPropertyValue('--color-surface')).toBe('rgba(255, 255, 255, 0.95)');
    expect(root.getPropertyValue('--color-surface-elevated')).toBe('rgba(246, 248, 250, 0.8)');
    expect(root.getPropertyValue('--color-input')).toBe('rgba(255, 255, 255, 0.8)');
    expect(root.getPropertyValue('--color-border')).toBe('#d0d7de');
    expect(root.getPropertyValue('--color-border-muted')).toBe('#d8dee4');
    expect(root.getPropertyValue('--color-error')).toBe('#cf222e');
    expect(root.getPropertyValue('--color-success')).toBe('#1a7f37');
    expect(root.getPropertyValue('--color-focus-ring')).toBe('#0969da');
  });

  describe('inline style priority (config over CSS files)', () => {
    it('should apply colors as inline styles on document.documentElement', () => {
      applyThemeColorOverrides(testColors, 'dark');

      // Inline styles are set directly on element.style, not via stylesheet
      // This ensures they have highest CSS specificity and override any CSS file
      const inlineStyle = document.documentElement.style.cssText;
      expect(inlineStyle).toContain('--color-accent-primary');
      expect(inlineStyle).toContain('--color-background');
    });

    it('should override CSS file values due to inline style specificity', () => {
      // Simulate a CSS file setting a value
      const styleSheet = document.createElement('style');
      styleSheet.textContent = ':root { --color-accent-primary: #ff0000; }';
      document.head.appendChild(styleSheet);

      // Apply colors via config (inline styles)
      applyThemeColorOverrides(testColors, 'dark');

      // getPropertyValue on style returns inline value which takes precedence
      const root = document.documentElement.style;
      expect(root.getPropertyValue('--color-accent-primary')).toBe('#39d353');

      // Cleanup
      document.head.removeChild(styleSheet);
    });

    it('should set colors via element.style.setProperty (inline)', () => {
      applyThemeColorOverrides(testColors, 'dark');

      // Verify it's truly inline (direct property on style object)
      const root = document.documentElement;
      expect(root.style.getPropertyValue('--color-accent-primary')).toBe('#39d353');
    });
  });
});
