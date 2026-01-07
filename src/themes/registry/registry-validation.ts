/**
 * Theme Registry Validation Utilities
 *
 * Type guards and validation utilities for theme IDs and loaded theme modules.
 */

import type { LandingPageRenderer, TimePageRenderer } from '@core/types';

import { DEFAULT_THEME_ID, THEME_REGISTRY, type ThemeId } from './registry-core';

/** Get all valid theme IDs from the registry. */
export function getThemeIds(): ThemeId[] {
  return Object.keys(THEME_REGISTRY) as ThemeId[];
}

/** Get all valid theme IDs as a Set (convenience for membership checks). */
export function getValidThemes(): Set<ThemeId> {
  return new Set(getThemeIds());
}

/** Type guard: check if a value is a valid theme ID. */
export function isValidThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && value in THEME_REGISTRY;
}

/** Validate and return a safe theme ID (falls back to DEFAULT_THEME_ID). */
export function validateThemeId(value: unknown): ThemeId {
  return isValidThemeId(value) ? value : DEFAULT_THEME_ID;
}

// ============================================================================
// Runtime Validation for Loaded Theme Renderers
// ============================================================================

/** Required hooks for TimePageRenderer. */
const TIME_PAGE_RENDERER_HOOKS = [
  'onAnimationStateChange',
  'mount',
  'destroy',
  'updateTime',
  'onCounting',
  'onCelebrating',
  'onCelebrated',
  'updateContainer',
  'getResourceTracker',
] as const;

/** Required hooks for LandingPageRenderer. */
const LANDING_PAGE_RENDERER_HOOKS = [
  'onAnimationStateChange',
  'mount',
  'destroy',
  'setSize',
  'getElementCount',
] as const;

/**
 * Generic renderer hook validator.
 * @internal
 */
function validateRendererHooks<T extends object>(
  renderer: T,
  hooks: readonly string[],
  rendererType: string,
  themeId: string
): void {
  for (const hook of hooks) {
    if (typeof (renderer as Record<string, unknown>)[hook] !== 'function') {
      throw new Error(
        `Theme "${themeId}" ${rendererType} is missing required hook: ${hook}.`
      );
    }
  }
}

/**
 * Validate that a TimePageRenderer implements all required hooks.
 * @throws Error if required hooks are missing
 * @internal
 */
export function validateTimePageRenderer(
  renderer: TimePageRenderer,
  themeId: string
): void {
  validateRendererHooks(renderer, TIME_PAGE_RENDERER_HOOKS, 'TimePageRenderer', themeId);
}

/**
 * Validate that a LandingPageRenderer implements all required hooks.
 * @throws Error if required hooks are missing
 * @internal
 */
export function validateLandingPageRenderer(
  renderer: LandingPageRenderer,
  themeId: string
): void {
  validateRendererHooks(renderer, LANDING_PAGE_RENDERER_HOOKS, 'LandingPageRenderer', themeId);
}
