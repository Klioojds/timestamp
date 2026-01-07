/**
 * @fileoverview Unit tests for contrast calculation utilities.
 */

import { describe, it, expect } from 'vitest';
import {
  parseColor,
  getLuminance,
  getContrastRatio,
  meetsContrastRequirement,
  type RGBColor,
  type WCAGLevel,
} from './contrast';

describe('theme-colors/contrast', () => {
  describe('parseColor', () => {
    it.each([
      { input: '#ff0000', expected: { r: 255, g: 0, b: 0, a: 1 } },
      { input: '#f00', expected: { r: 255, g: 0, b: 0, a: 1 } },
      { input: 'rgb(255, 0, 0)', expected: { r: 255, g: 0, b: 0, a: 1 } },
      { input: 'rgba(255, 0, 0, 0.5)', expected: { r: 255, g: 0, b: 0, a: 0.5 } },
      { input: 'hsl(0, 100%, 50%)', expected: { r: 255, g: 0, b: 0, a: 1 } },
      { input: 'hsla(0, 100%, 50%, 0.5)', expected: { r: 255, g: 0, b: 0, a: 0.5 } },
      { input: 'RGB(255, 0, 0)', expected: { r: 255, g: 0, b: 0, a: 1 } },
      { input: 'rgb( 255 , 0 , 0 )', expected: { r: 255, g: 0, b: 0, a: 1 } },
    ])('should parse color format $input', ({ input, expected }) => {
      expect(parseColor(input)).toEqual(expected);
    });

    it('should parse 8-digit hex with alpha', () => {
      const result = parseColor('#ff000080');
      expect(result.r).toBe(255);
      expect(result.g).toBe(0);
      expect(result.b).toBe(0);
      expect(result.a).toBeCloseTo(0.5, 2);
    });

    it.each([
      { input: 'color-mix(in srgb, #ff0000 50%, #0000ff)', expected: { r: 128, g: 0, b: 128, a: 1 } },
      { input: 'color-mix(in srgb, #ff0000 25%, #0000ff)', expected: { r: 64, g: 0, b: 191, a: undefined } },
      { input: 'color-mix(in srgb, rgb(255, 0, 0) 50%, rgb(0, 0, 255))', expected: { r: 128, g: undefined, b: 128, a: undefined } },
    ])('should parse color-mix() input $input', ({ input, expected }) => {
      const result = parseColor(input);
      if (expected.r !== undefined) expect(result.r).toBe(expected.r);
      if (expected.g !== undefined) expect(result.g).toBe(expected.g);
      if (expected.b !== undefined) expect(result.b).toBe(expected.b);
      if (expected.a !== undefined) expect(result.a).toBe(expected.a);
    });

    it('should throw error for color-mix() with var() references', () => {
      expect(() => {
        parseColor('color-mix(in srgb, var(--color-error) 15%, var(--color-surface))');
      }).toThrow(/var\(\) references must be pre-resolved/);
    });

    it('should throw error for unsupported color format', () => {
      expect(() => {
        parseColor('invalidcolor');
      }).toThrow(/Unsupported color format/);
    });
  });

  describe('getLuminance', () => {
    it('should return 1 for white', () => {
      const white: RGBColor = { r: 255, g: 255, b: 255, a: 1 };
      expect(getLuminance(white)).toBe(1);
    });

    it('should return 0 for black', () => {
      const black: RGBColor = { r: 0, g: 0, b: 0, a: 1 };
      expect(getLuminance(black)).toBe(0);
    });

    it('should calculate luminance for gray', () => {
      const gray: RGBColor = { r: 128, g: 128, b: 128, a: 1 };
      const luminance = getLuminance(gray);
      expect(luminance).toBeGreaterThan(0);
      expect(luminance).toBeLessThan(1);
      // Gray should be close to middle luminance
      expect(luminance).toBeCloseTo(0.215, 2);
    });

    it('should calculate luminance for red', () => {
      const red: RGBColor = { r: 255, g: 0, b: 0, a: 1 };
      const luminance = getLuminance(red);
      expect(luminance).toBeCloseTo(0.2126, 4);
    });

    it('should ignore alpha channel', () => {
      const semiTransparent: RGBColor = { r: 255, g: 255, b: 255, a: 0.5 };
      expect(getLuminance(semiTransparent)).toBe(1);
    });
  });

  describe('getContrastRatio', () => {
    it('should return 21:1 for black on white', () => {
      const black = parseColor('#000000');
      const white = parseColor('#ffffff');
      const ratio = getContrastRatio(black, white);
      expect(ratio).toBeCloseTo(21, 1);
    });

    it('should return same ratio regardless of argument order', () => {
      const black = parseColor('#000000');
      const white = parseColor('#ffffff');
      expect(getContrastRatio(black, white)).toBe(getContrastRatio(white, black));
    });

    it('should return 1:1 for identical colors', () => {
      const color = parseColor('#ff0000');
      expect(getContrastRatio(color, color)).toBeCloseTo(1, 1);
    });

    it('should handle semi-transparent colors', () => {
      const semiTransparentBlack = parseColor('rgba(0, 0, 0, 0.5)');
      const white = parseColor('#ffffff');
      const ratio = getContrastRatio(semiTransparentBlack, white);
      // Semi-transparent black on white should have lower contrast than solid black
      expect(ratio).toBeLessThan(21);
      expect(ratio).toBeGreaterThan(1);
    });

    it.each([
      { background: '#0d1117', text: '#f0f6fc', scenario: 'GitHub dark background to text' },
      { background: '#ffffff', text: '#1f2328', scenario: 'GitHub light background to text' },
    ])('should calculate contrast for $scenario', ({ background, text }) => {
      const ratio = getContrastRatio(parseColor(background), parseColor(text));
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });

  describe('meetsContrastRequirement', () => {
    const testCases: Array<{
      ratio: number;
      level: WCAGLevel;
      expected: boolean;
      description: string;
    }> = [
      // Normal text (4.5:1 minimum)
      { ratio: 4.5, level: 'normal-text', expected: true, description: 'exact 4.5:1 passes normal text' },
      { ratio: 4.6, level: 'normal-text', expected: true, description: 'above 4.5:1 passes normal text' },
      { ratio: 4.4, level: 'normal-text', expected: false, description: 'below 4.5:1 fails normal text' },

      // Large text (3:1 minimum)
      { ratio: 3.0, level: 'large-text', expected: true, description: 'exact 3:1 passes large text' },
      { ratio: 3.1, level: 'large-text', expected: true, description: 'above 3:1 passes large text' },
      { ratio: 2.9, level: 'large-text', expected: false, description: 'below 3:1 fails large text' },

      // UI components (3:1 minimum)
      { ratio: 3.0, level: 'ui-component', expected: true, description: 'exact 3:1 passes UI component' },
      { ratio: 3.1, level: 'ui-component', expected: true, description: 'above 3:1 passes UI component' },
      { ratio: 2.9, level: 'ui-component', expected: false, description: 'below 3:1 fails UI component' },

      // Edge cases
      { ratio: 4.5, level: 'large-text', expected: true, description: 'normal text ratio passes large text' },
      { ratio: 3.0, level: 'normal-text', expected: false, description: 'large text ratio fails normal text' },
    ];

    testCases.forEach(({ ratio, level, expected, description }) => {
      it(description, () => {
        expect(meetsContrastRequirement(ratio, level)).toBe(expected);
      });
    });

    it('should throw error for unknown contrast level', () => {
      expect(() => {
        meetsContrastRequirement(4.5, 'invalid-level' as WCAGLevel);
      }).toThrow(/Unknown contrast level/);
    });
  });

  describe('integration: real theme colors', () => {
    it.each([
      { background: '#0d1117', text: '#f0f6fc', mode: 'dark' },
      { background: '#ffffff', text: '#1f2328', mode: 'light' },
    ])('should validate GitHub $mode theme text contrast', ({ background, text }) => {
      const ratio = getContrastRatio(parseColor(background), parseColor(text));
      expect(meetsContrastRequirement(ratio, 'normal-text')).toBe(true);
    });

    it('should validate error color on dark surface', () => {
      const surface = parseColor('rgba(13, 17, 23, 0.95)');
      const error = parseColor('#f85149');
      const ratio = getContrastRatio(surface, error);
      expect(meetsContrastRequirement(ratio, 'normal-text')).toBe(true);
    });

    it('should validate border on dark background', () => {
      const background = parseColor('#0d1117');
      const border = parseColor('#30363d');
      const ratio = getContrastRatio(background, border);
      // Note: This border actually fails 3:1 (ratio ~1.55) - this is a known accessibility debt
      // The test documents the actual contrast, not the ideal
      expect(ratio).toBeCloseTo(1.55, 1);
      expect(meetsContrastRequirement(ratio, 'ui-component')).toBe(false);
    });

    it('should validate focus ring on light surface', () => {
      const surface = parseColor('rgba(255, 255, 255, 0.95)');
      const focusRing = parseColor('#0969da');
      const ratio = getContrastRatio(surface, focusRing);
      expect(meetsContrastRequirement(ratio, 'ui-component')).toBe(true);
    });
  });
});
