/**
 * Contrast calculation utilities for color accessibility validation.
 * Supports hex, rgb(a), hsl(a), and CSS color-mix() syntax.
 *
 * @packageDocumentation
 */

/**
 * Parsed RGB color with alpha channel.
 */
export interface RGBColor {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
  a: number; // 0-1
}

/**
 * Contrast level for different text sizes and UI components.
 */
export type WCAGLevel = 'normal-text' | 'large-text' | 'ui-component';

/**
 * Parses a CSS color string into RGB components.
 *
 * Supports:
 * - Hex: #rgb, #rrggbb, #rrggbbaa
 * - RGB: rgb(r, g, b), rgba(r, g, b, a)
 * - RGBA: rgba(r, g, b, a)
 * - HSL: hsl(h, s%, l%), hsla(h, s%, l%, a)
 * - color-mix(): color-mix(in srgb, color1 percentage%, color2)
 *
 * @param color - CSS color string
 * @returns Parsed RGB color with alpha
 * @throws Error if color format is unsupported
 *
 * @example
 * ```typescript
 * parseColor('#ff0000'); // { r: 255, g: 0, b: 0, a: 1 }
 * parseColor('rgba(255, 0, 0, 0.5)'); // { r: 255, g: 0, b: 0, a: 0.5 }
 * parseColor('hsl(0, 100%, 50%)'); // { r: 255, g: 0, b: 0, a: 1 }
 * parseColor('color-mix(in srgb, #ff0000 50%, #0000ff)'); // Blended color
 * ```
 */
export function parseColor(color: string): RGBColor {
  const trimmed = color.trim().toLowerCase();

  // Hex format
  if (trimmed.startsWith('#')) {
    return parseHex(trimmed);
  }

  // RGB/RGBA format
  if (trimmed.startsWith('rgb')) {
    return parseRgb(trimmed);
  }

  // HSL/HSLA format
  if (trimmed.startsWith('hsl')) {
    return parseHsl(trimmed);
  }

  // color-mix() format
  if (trimmed.startsWith('color-mix')) {
    return parseColorMix(trimmed);
  }

  throw new Error(`Unsupported color format: ${color}`);
}

/**
 * Parses hex color format.
 */
function parseHex(hex: string): RGBColor {
  let cleaned = hex.slice(1); // Remove #

  // Expand shorthand (e.g., #rgb -> #rrggbb)
  if (cleaned.length === 3) {
    cleaned = cleaned
      .split('')
      .map((c) => c + c)
      .join('');
  }

  // Parse RRGGBB or RRGGBBAA
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  const a = cleaned.length === 8 ? parseInt(cleaned.slice(6, 8), 16) / 255 : 1;

  return { r, g, b, a };
}

/**
 * Parses rgb() or rgba() format.
 */
function parseRgb(rgb: string): RGBColor {
  const match = rgb.match(/rgba?\(([^)]+)\)/);
  if (!match) {
    throw new Error(`Invalid RGB format: ${rgb}`);
  }

  const parts = match[1].split(',').map((p) => p.trim());
  const r = parseFloat(parts[0]);
  const g = parseFloat(parts[1]);
  const b = parseFloat(parts[2]);
  const a = parts.length === 4 ? parseFloat(parts[3]) : 1;

  return { r, g, b, a };
}

/**
 * Parses hsl() or hsla() format and converts to RGB.
 */
function parseHsl(hsl: string): RGBColor {
  const match = hsl.match(/hsla?\(([^)]+)\)/);
  if (!match) {
    throw new Error(`Invalid HSL format: ${hsl}`);
  }

  const parts = match[1].split(',').map((p) => p.trim());
  const h = parseFloat(parts[0]) / 360; // Normalize to 0-1
  const s = parseFloat(parts[1]) / 100; // Remove %
  const l = parseFloat(parts[2]) / 100; // Remove %
  const a = parts.length === 4 ? parseFloat(parts[3]) : 1;

  // Convert HSL to RGB using standard algorithm
  const { r, g, b } = hslToRgb(h, s, l);

  return { r, g, b, a };
}

/**
 * Converts HSL to RGB.
 * @param h - Hue (0-1)
 * @param s - Saturation (0-1)
 * @param l - Lightness (0-1)
 */
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l; // Achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

/**
 * Parses color-mix() format and blends colors.
 *
 * @example
 * ```
 * color-mix(in srgb, #ff0000 50%, #0000ff)
 * color-mix(in srgb, var(--color-error) 15%, var(--color-surface))
 * ```
 */
function parseColorMix(colorMix: string): RGBColor {
  // Match: color-mix(in srgb, <color1> <percentage>%, <color2>)
  // More flexible regex to handle various color formats including rgb()
  const match = colorMix.match(/color-mix\(in\s+srgb,\s*([^)]+\)?[^,]*?)\s+(\d+(?:\.\d+)?)%,\s*(.+)\)/);

  if (!match) {
    throw new Error(`Invalid color-mix format: ${colorMix}`);
  }

  const color1Str = match[1].trim();
  const percentage = parseFloat(match[2]) / 100;
  const color2Str = match[3].trim();

  // For var() references, we can't resolve them here - caller must pre-resolve
  if (color1Str.startsWith('var(') || color2Str.startsWith('var(')) {
    throw new Error(
      'color-mix() with var() references must be pre-resolved. Use computed styles to get actual values.'
    );
  }

  const color1 = parseColor(color1Str);
  const color2 = parseColor(color2Str);

  // Blend colors using percentage
  return blendColors(color1, color2, percentage);
}

/**
 * Blends two colors using alpha compositing.
 *
 * @param color1 - First color
 * @param color2 - Second color
 * @param t - Blend factor (0 = all color2, 1 = all color1)
 */
function blendColors(color1: RGBColor, color2: RGBColor, t: number): RGBColor {
  return {
    r: Math.round(color1.r * t + color2.r * (1 - t)),
    g: Math.round(color1.g * t + color2.g * (1 - t)),
    b: Math.round(color1.b * t + color2.b * (1 - t)),
    a: color1.a * t + color2.a * (1 - t),
  };
}

/**
 * Calculates relative luminance.
 *
 * Formula: L = 0.2126 * R + 0.7152 * G + 0.0722 * B
 * where R, G, B are the linearized RGB values.
 *
 * @param rgb - RGB color (alpha ignored for luminance)
 * @returns Relative luminance (0-1)
 *
 * @example
 * ```typescript
 * getLuminance({ r: 255, g: 255, b: 255, a: 1 }); // 1 (white)
 * getLuminance({ r: 0, g: 0, b: 0, a: 1 }); // 0 (black)
 * ```
 */
export function getLuminance(rgb: RGBColor): number {
  // Normalize to 0-1
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  // Apply sRGB gamma correction
  const linearize = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

  const R = linearize(r);
  const G = linearize(g);
  const B = linearize(b);

  // Calculate relative luminance
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Calculates contrast ratio between two colors.
 *
 * Formula: (L1 + 0.05) / (L2 + 0.05)
 * where L1 is the lighter color's luminance and L2 is the darker.
 *
 * Handles semi-transparent colors by compositing them over white background.
 *
 * @param color1 - First color (can be semi-transparent)
 * @param color2 - Second color (can be semi-transparent)
 * @returns Contrast ratio (1:1 to 21:1)
 *
 * @example
 * ```typescript
 * const white = parseColor('#ffffff');
 * const black = parseColor('#000000');
 * getContrastRatio(white, black); // 21 (maximum contrast)
 * ```
 */
export function getContrastRatio(color1: RGBColor, color2: RGBColor): number {
  // Composite semi-transparent colors over white background
  const c1 = color1.a < 1 ? compositeOverWhite(color1) : color1;
  const c2 = color2.a < 1 ? compositeOverWhite(color2) : color2;

  const l1 = getLuminance(c1);
  const l2 = getLuminance(c2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Composites a semi-transparent color over white background.
 */
function compositeOverWhite(color: RGBColor): RGBColor {
  const { r, g, b, a } = color;
  return {
    r: Math.round(r * a + 255 * (1 - a)),
    g: Math.round(g * a + 255 * (1 - a)),
    b: Math.round(b * a + 255 * (1 - a)),
    a: 1,
  };
}

/**
 * Checks if contrast ratio meets accessibility requirements.
 *
 * Requirements:
 * - Normal text (under 18pt or under 14pt bold): 4.5:1
 * - Large text (18pt+ or 14pt+ bold): 3:1
 * - UI components (borders, icons, focus indicators): 3:1
 *
 * @param ratio - Contrast ratio from getContrastRatio()
 * @param level - Contrast level to check against
 * @returns True if ratio meets requirement
 *
 * @example
 * ```typescript
 * meetsContrastRequirement(4.6, 'normal-text'); // true
 * meetsContrastRequirement(3.2, 'normal-text'); // false
 * meetsContrastRequirement(3.2, 'ui-component'); // true
 * ```
 */
export function meetsContrastRequirement(ratio: number, level: WCAGLevel): boolean {
  switch (level) {
    case 'normal-text':
      return ratio >= 4.5;
    case 'large-text':
    case 'ui-component':
      return ratio >= 3.0;
    default:
      throw new Error(`Unknown contrast level: ${level}`);
  }
}
