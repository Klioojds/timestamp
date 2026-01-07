/**
 * Theme Registry Loaders
 *
 * Async utilities for loading theme code and factories.
 */

import type { LandingPageRendererFactory, ThemeConfig, TimePageRenderer } from '@core/types';

import { DEFAULT_THEME_ID, THEME_REGISTRY, type ThemeId } from './registry-core';

/**
 * Safely load a theme with fallback to default on failure.
 * @throws Only if the default theme fails to load (critical failure)
 */
export async function loadThemeSafe(themeId: ThemeId): Promise<{
  timePageRenderer: (targetDate: Date) => TimePageRenderer;
  landingPageRenderer: LandingPageRendererFactory;
  config: ThemeConfig;
}> {
  try {
    return await THEME_REGISTRY[themeId].loadTheme();
  } catch (error) {
    console.error(`Failed to load theme "${themeId}", falling back to default:`, error);
    // CRITICAL: Prevent infinite recursion if default theme fails
    if (themeId === DEFAULT_THEME_ID) {
      throw new Error('Failed to load default theme. Application cannot continue.');
    }
    return loadThemeSafe(DEFAULT_THEME_ID);
  }
}

/** Get theme landing page renderer factory (async, loads theme code). */
export async function getLandingPageRendererFactory(themeId: ThemeId): Promise<LandingPageRendererFactory> {
  const { landingPageRenderer } = await loadThemeSafe(themeId);
  return landingPageRenderer;
}
