/**
 * Theme Registry Metadata Utilities
 *
 * Synchronous, lightweight utilities for accessing theme metadata
 * without loading the full theme code.
 */

import type { ResolvedColorMode, ThemeDependency, ThemeModeColors } from '@core/types';

import { COLOR_SCHEME_DEFAULTS } from '../../core/config/color-scheme-defaults';
import { THEME_REGISTRY, type ThemeId, type ThemeMetadata } from './registry-core';

const NEW_THEME_WINDOW_DAYS = 30;

/** Get human-readable theme name from registry. */
export function getThemeDisplayName(themeId: ThemeId): string {
  return THEME_REGISTRY[themeId].name;
}

/** Get theme metadata from registry (sync, lightweight). */
export function getThemeMetadata(themeId: ThemeId): ThemeMetadata {
  const entry = THEME_REGISTRY[themeId];
  return {
    id: entry.id,
    name: entry.name,
    description: entry.description,
    publishedDate: entry.publishedDate,
    tags: entry.tags,
    author: entry.author,
  };
}

/** Get theme published date in ISO 8601 format (YYYY-MM-DD). */
export function getThemePublishedDate(themeId: ThemeId): string {
  return THEME_REGISTRY[themeId].publishedDate;
}

/** Check if a theme is "new" (published within 30 days). */
export function isNewTheme(themeId: ThemeId): boolean {
  const publishedDate = new Date(getThemePublishedDate(themeId));
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - NEW_THEME_WINDOW_DAYS);
  return publishedDate > thirtyDaysAgo;
}

/** Get theme author GitHub username (without \@ prefix), or null if uncredited. */
export function getThemeAuthor(themeId: ThemeId): string | null {
  return THEME_REGISTRY[themeId].author;
}

/** Get theme tags for search/filtering (empty array if none). */
export function getThemeTags(themeId: ThemeId): string[] {
  return THEME_REGISTRY[themeId].tags ?? [];
}

/** Get theme external dependencies (empty array if none). */
export function getThemeDependencies(themeId: ThemeId): ThemeDependency[] {
  return THEME_REGISTRY[themeId].dependencies ?? [];
}

/**
 * Get theme color overrides for a specific mode.
 *
 * Returns ONLY colors explicitly defined in ThemeConfig.colors.
 * Does NOT merge with defaults - that's handled by CSS cascade.
 */
export function getThemeColorOverrides(
  themeId: ThemeId,
  mode: ResolvedColorMode = 'dark'
): Partial<ThemeModeColors> {
  const entry = THEME_REGISTRY[themeId];
  return { ...(entry.colors?.[mode] ?? {}) };
}

/**
 * Get complete theme color palette with defaults merged in.
 *
 * Merges theme's colors with COLOR_SCHEME_DEFAULTS for the specified mode.
 * Used by validation scripts that need all 14 color properties.
 */
export function getThemePalette(
  themeId: ThemeId,
  mode: ResolvedColorMode = 'dark'
): Required<ThemeModeColors> {
  const entry = THEME_REGISTRY[themeId];
  const themeColors = entry.colors;

  const merged = {
    ...COLOR_SCHEME_DEFAULTS[mode],
    ...(themeColors?.[mode] ?? {}),
  };

  // Fall back accentTertiary to accentPrimary if not specified
  if (merged.accentTertiary === undefined) {
    merged.accentTertiary = merged.accentPrimary;
  }

  return merged;
}
