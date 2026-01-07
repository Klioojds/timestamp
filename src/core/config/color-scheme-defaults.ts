/** Default dark/light color schemes (themes can override). */

import type { ThemeModeColors } from '@core/types';

/** Color scheme defaults for both dark and light modes. @internal */
interface ColorSchemeDefaults {
  dark: Required<ThemeModeColors>;
  light: Required<ThemeModeColors>;
}

/** Maps ThemeModeColors properties to CSS custom properties (single source of truth). @public */
export const COLOR_VARIABLE_MAP = Object.freeze([
  { property: 'background' as const, cssVar: '--color-background' },
  { property: 'text' as const, cssVar: '--color-text' },
  { property: 'textMuted' as const, cssVar: '--color-text-muted' },
  { property: 'accentPrimary' as const, cssVar: '--color-accent-primary' },
  { property: 'textOnAccent' as const, cssVar: '--color-text-on-accent' },
  { property: 'accentSecondary' as const, cssVar: '--color-accent-secondary' },
  { property: 'accentTertiary' as const, cssVar: '--color-accent-tertiary' },
  { property: 'surface' as const, cssVar: '--color-surface' },
  { property: 'surfaceElevated' as const, cssVar: '--color-surface-elevated' },
  { property: 'input' as const, cssVar: '--color-input' },
  { property: 'border' as const, cssVar: '--color-border' },
  { property: 'borderMuted' as const, cssVar: '--color-border-muted' },
  { property: 'error' as const, cssVar: '--color-error' },
  { property: 'success' as const, cssVar: '--color-success' },
  { property: 'textOnSuccess' as const, cssVar: '--color-text-on-success' },
  { property: 'focusRing' as const, cssVar: '--color-focus-ring' },
] as const);

/** Default color scheme values for dark and light modes. @public */
export const COLOR_SCHEME_DEFAULTS: Readonly<ColorSchemeDefaults> = Object.freeze({
  dark: Object.freeze({
    background: '#0d1117',
    text: '#f0f6fc',
    textMuted: '#b1bac4', // Lighter for 4.5:1 contrast on dark surfaces
    accentPrimary: '#39d353',
    textOnAccent: '#ffffff',
    accentSecondary: '#58a6ff',
    accentTertiary: '#39d353',
    surface: 'rgba(13, 17, 23, 0.95)',
    surfaceElevated: 'rgba(22, 27, 34, 0.95)', // Darker, more opaque for text contrast
    input: 'rgba(13, 17, 23, 0.8)',
    border: '#6e7681', // Lighter gray for 3:1 contrast on #0d1117 background
    borderMuted: '#656c76', // Lighter for 3:1 contrast on dark surface
    error: '#ffa198', // Lighter coral for 4.5:1 contrast on dark input
    success: '#3fb950', // Brighter green for 4.5:1 contrast on dark surfaces
    textOnSuccess: '#ffffff',
    focusRing: '#58a6ff',
  }),
  light: Object.freeze({
    background: '#ffffff',
    text: '#1f2328',
    textMuted: '#656d76',
    accentPrimary: '#1a7f37',
    textOnAccent: '#ffffff',
    accentSecondary: '#0969da',
    accentTertiary: '#1a7f37',
    surface: 'rgba(255, 255, 255, 0.95)',
    surfaceElevated: 'rgba(246, 248, 250, 0.8)',
    input: 'rgba(255, 255, 255, 0.8)',
    border: '#8c959f', // Darker for 3:1 contrast on white background
    borderMuted: '#848d97', // Darker gray for 3:1 contrast on white surface
    error: '#cf222e',
    success: '#1a7f37',
    textOnSuccess: '#ffffff',
    focusRing: '#0969da',
  }),
});
