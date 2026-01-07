/**
 * Theme Color Manager - applies theme color overrides and manages color mode changes.
 * Consolidates low-level color application with high-level color mode orchestration.
 * COLOR PRIORITY (lowest to highest): 1. app-shell.css defaults, 2. Theme's styles.css, 3. ThemeConfig.colors (highest).
 */

import { COLOR_MODE_CHANGE_EVENT, type ColorModeChangeDetail } from '@components/color-mode-toggle';
import { getResolvedColorMode } from '@core/preferences/color-mode';
import type { ResolvedColorMode, ThemeId, ThemeModeColors } from '@core/types';
import { getThemeColorOverrides } from '@themes/registry';

import { COLOR_VARIABLE_MAP } from '@/core/config/color-scheme-defaults';

/** Theme color overrides - only explicitly set colors. Undefined properties cascade from CSS. */
type ThemeColorOverrides = Partial<ThemeModeColors>;

/** Cached state of last application to prevent redundant DOM updates. */
interface ColorCache {
  colors: ThemeColorOverrides;
  mode: ResolvedColorMode;
}

let lastApplied: ColorCache | null = null;

/** Attribute applied during color mode switch to disable CSS transitions. */
const SWITCHING_ATTRIBUTE = 'data-switching-color-mode';

/**
 * Applies theme color overrides as inline CSS custom properties.
 * Only applies explicitly provided colors; undefined properties cascade from CSS.
 * Sets data-color-mode attribute on <html> for CSS cascade.
 * Temporarily disables transitions during the switch to prevent visual artifacts.
 */
export function applyThemeColorOverrides(colors: ThemeColorOverrides, mode: ResolvedColorMode): void {
  const root = document.documentElement;
  const isModeChange = lastApplied !== null && lastApplied.mode !== mode;

  // Disable transitions during color mode switch to prevent artifacts
  if (isModeChange) {
    root.setAttribute(SWITCHING_ATTRIBUTE, '');
  }

  // Always set data-color-mode for CSS cascade (even if no color overrides)
  root.setAttribute('data-color-mode', mode);

  // Guard: Skip CSS property updates if colors and mode unchanged
  if (lastApplied && areColorsEqual(lastApplied.colors, colors) && lastApplied.mode === mode) {
    return;
  }

  // Clear previously applied inline color styles to allow CSS cascade
  // This is important when switching themes - old theme's colors should not persist
  for (const { cssVar } of COLOR_VARIABLE_MAP) {
    root.style.removeProperty(cssVar);
  }
  root.style.removeProperty('--color-accent-primary-rgb');
  root.style.removeProperty('--color-accent-secondary-rgb');

  // Apply ONLY the colors that are explicitly defined in the theme config
  for (const { property, cssVar } of COLOR_VARIABLE_MAP) {
    const value = colors[property as keyof ThemeColorOverrides];
    if (value !== undefined) {
      root.style.setProperty(cssVar, value);
    }
  }

  // Apply RGB variants if accent colors are provided
  if (colors.accentPrimary) {
    root.style.setProperty('--color-accent-primary-rgb', hexToRgb(colors.accentPrimary));
  }
  if (colors.accentSecondary) {
    root.style.setProperty('--color-accent-secondary-rgb', hexToRgb(colors.accentSecondary));
  }

  // Cache for future redundancy checks (shallow clone)
  lastApplied = {
    colors: { ...colors },
    mode,
  };

  // Re-enable transitions after the paint (double rAF ensures styles have applied)
  if (isModeChange) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        root.removeAttribute(SWITCHING_ATTRIBUTE);
      });
    });
  }
}

function areColorsEqual(a: ThemeColorOverrides, b: ThemeColorOverrides): boolean {
  return COLOR_VARIABLE_MAP.every(({ property }) => {
    const key = property as keyof ThemeColorOverrides;
    return a[key] === b[key];
  });
}

function hexToRgb(hex: string): string {
  const cleanHex = hex.replace(/^#/, '');
  const bigint = parseInt(cleanHex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r}, ${g}, ${b}`;
}

/**
 * Clears the color cache. Used in testing to reset state between tests.
 * @internal
 */
export function __clearColorCache(): void {
  lastApplied = null;
}

/**
 * Applies theme colors for the current color mode.
 * High-level wrapper that fetches color overrides from registry and applies them.
 * 
 * @param themeId - The theme to apply colors for
 * @param mode - The color mode ('dark' or 'light'), defaults to 'dark'
 * 
 * @example
 * ```typescript
 * applyThemeColors('contribution-graph', 'dark');
 * ```
 */
export function applyThemeColors(themeId: ThemeId, mode: 'dark' | 'light' = 'dark'): void {
  const colors = getThemeColorOverrides(themeId, mode);
  applyThemeColorOverrides(colors, mode);
}

/**
 * Sets up color mode change listener for a color mode toggle component.
 * Listens for COLOR_MODE_CHANGE_EVENT and applies colors when mode changes.
 * 
 * @param toggle - The color mode toggle element
 * @param getCurrentThemeId - Function to get the current theme ID
 * @returns Cleanup function to remove the listener
 * 
 * @example
 * ```typescript
 * const cleanup = setupColorModeListener(toggleElement, () => currentThemeId);
 * // Later: cleanup();
 * ```
 */
export function setupColorModeListener(
  toggle: HTMLElement,
  getCurrentThemeId: () => ThemeId
): () => void {
  const handleColorModeChange = ((event: CustomEvent<ColorModeChangeDetail>) => {
    const resolvedMode = getResolvedColorMode(event.detail.mode);
    applyThemeColors(getCurrentThemeId(), resolvedMode);
  }) as EventListener;

  toggle.addEventListener(COLOR_MODE_CHANGE_EVENT, handleColorModeChange);

  return () => {
    toggle.removeEventListener(COLOR_MODE_CHANGE_EVENT, handleColorModeChange);
  };
}

/**
 * Initializes color mode for a theme.
 * Applies colors based on current resolved color mode (respects user preference).
 * 
 * @param themeId - The theme to initialize colors for
 * 
 * @example
 * ```typescript
 * initializeColorMode('fireworks');
 * ```
 */
export function initializeColorMode(themeId: ThemeId): void {
  const resolvedMode = getResolvedColorMode();
  applyThemeColors(themeId, resolvedMode);
}
