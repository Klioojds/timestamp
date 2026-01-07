/**
 * Loads theme color palettes from the theme registry for validation.
 * Provides access to complete color schemes for both dark and light modes.
 *
 * @packageDocumentation
 */

import type { ThemeId } from '../../src/themes/registry';
import type { ResolvedColorMode, ThemeModeColors } from '../../src/core/types';
import { getThemePalette } from '../../src/themes/registry/registry-metadata';
import { THEME_REGISTRY } from '../../src/themes/registry/registry-core';

/**
 * Complete theme color palette with both dark and light modes.
 */
export interface ThemeColorPalette {
  /** Theme identifier */
  themeId: ThemeId;
  /** Dark mode colors (all 14 properties) */
  dark: Required<ThemeModeColors>;
  /** Light mode colors (all 14 properties) */
  light: Required<ThemeModeColors>;
}

/**
 * Loads color palette for a specific theme.
 *
 * Returns complete color schemes for both dark and light modes,
 * with all 14 color properties defined (merged with defaults).
 *
 * @param themeId - Theme identifier
 * @returns Complete color palette for both modes
 *
 * @example
 * ```typescript
 * const palette = loadThemePalette('contribution-graph');
 * console.log(palette.dark.background);  // '#0d1117'
 * console.log(palette.light.background); // '#ffffff'
 * ```
 */
export function loadThemePalette(themeId: ThemeId): ThemeColorPalette {
  return {
    themeId,
    dark: getThemePalette(themeId, 'dark'),
    light: getThemePalette(themeId, 'light'),
  };
}

/**
 * Loads color palettes for all registered themes.
 *
 * @returns Array of color palettes, one per theme
 *
 * @example
 * ```typescript
 * const allPalettes = loadAllThemePalettes();
 * allPalettes.forEach(palette => {
 *   console.log(`${palette.themeId}: ${palette.dark.accentPrimary}`);
 * });
 * ```
 */
export function loadAllThemePalettes(): ThemeColorPalette[] {
  const themeIds = Object.keys(THEME_REGISTRY) as ThemeId[];
  return themeIds.map(loadThemePalette);
}

/**
 * Loads colors for a specific theme and mode.
 *
 * @param themeId - Theme identifier
 * @param mode - Color mode ('dark' or 'light')
 * @returns Complete color scheme with all 14 properties
 *
 * @example
 * ```typescript
 * const darkColors = loadThemeColors('fireworks', 'dark');
 * console.log(darkColors.accentPrimary); // Theme's primary accent
 * ```
 */
export function loadThemeColors(
  themeId: ThemeId,
  mode: ResolvedColorMode
): Required<ThemeModeColors> {
  return getThemePalette(themeId, mode);
}
