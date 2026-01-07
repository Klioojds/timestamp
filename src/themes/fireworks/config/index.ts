/**
 * Fireworks Theme Configuration
 * Centralized settings for fireworks visual effects and intensity levels.
 */

import type { ThemeConfig } from '@core/types';

import type { IntensityConfig, IntensityLevelType } from '../types';
import { IntensityLevel } from '../types';

/**
 * Fireworks theme configuration exported to theme registry.
 *
 * @remarks
 * Isolated in config.ts to enable registry imports without loading heavy canvas dependencies.
 * Contains theme metadata, color schemes, and optional component flags.
 *
 * @see THEME_REGISTRY in src/themes/registry
 * @public
 */
export const FIREWORKS_CONFIG: ThemeConfig = {
  id: 'fireworks',
  name: 'Fireworks Celebration',
  description: 'Countdown with fireworks that intensify as midnight approaches',
  publishedDate: '2026-01-07',
  author: 'chrisreddington',
  tags: ['celebration', 'fireworks', 'animation', 'new-year'],
  supportsWorldMap: true,
  availableInIssueTemplate: true,
  dependencies: [
    { name: 'fireworks-js', url: 'https://github.com/crashmax-dev/fireworks-js' },
  ],
  optionalComponents: {
    timezoneSelector: true,
    worldMap: true,
  },
  colors: {
    dark: {
      accentPrimary: '#fbbf24',  // Amber for dark backgrounds
      textOnAccent: '#000000',   // Black text on amber for contrast
      accentSecondary: '#58a6ff', // Blue for dark backgrounds
    },
    light: {
      accentPrimary: '#d97706',  // Darker amber for light backgrounds
      textOnAccent: '#ffffff',   // White text on darker amber for contrast
      accentSecondary: '#0969da', // Darker blue for light backgrounds
    },
  },
  themeStyles: {
    '--theme-tz-accent': '#fbbf24',
  },
};

/** Star count for time page starfield background. @public */
export const TIME_PAGE_STAR_COUNT = 40;

/** Star count for landing page starfield background. @public */
export const LANDING_PAGE_STAR_COUNT = 30;

/**
 * Layout constants for countdown display and city silhouette.
 * @public
 */
export const UI_CONSTANTS = {
  CITY_HEIGHT_PX: 128,
  COUNTDOWN_FONT_SIZE: 'clamp(2rem, calc(4rem * var(--font-scale, 1)), 4rem)',
  COUNTDOWN_GAP: 'clamp(8px, 2vw, 20px)',
  MESSAGE_FONT_SIZE: 'clamp(1rem, calc(1.5rem * var(--font-scale, 1)), 1.5rem)',
  MESSAGE_MARGIN_TOP: '2rem',
  LABEL_FONT_SIZE: 'clamp(0.7rem, calc(1rem * var(--font-scale, 1)), 1rem)',
} as const;

/**
 * SVG path data for city skyline silhouette rendered at bottom of canvas.
 * @public
 */
export const CITY_SILHOUETTE_PATH = `
  M0,100 L0,75 L8,75 L8,55 L16,55 L16,75
  L24,75 L24,45 L32,45 L32,75
  L40,75 L40,60 L48,60 L48,35 L56,35 L56,60 L64,60 L64,75
  L72,75 L72,50 L80,50 L80,25 L88,25 L88,50 L96,50 L96,75
  L104,75 L104,65 L112,65 L112,40 L120,40 L120,65 L128,65 L128,75
  L136,75 L136,55 L144,55 L144,30 L152,30 L152,55 L160,55 L160,75
  L168,75 L168,70 L176,70 L176,50 L184,50 L184,70 L192,70 L192,75
  L200,75 L200,45 L208,45 L208,20 L216,20 L216,45 L224,45 L224,75
  L232,75 L232,60 L240,60 L240,35 L248,35 L248,60 L256,60 L256,75
  L264,75 L264,55 L272,55 L272,75
  L280,75 L280,65 L288,65 L288,40 L296,40 L296,65 L304,65 L304,75
  L312,75 L312,50 L320,50 L320,28 L328,28 L328,50 L336,50 L336,75
  L344,75 L344,60 L352,60 L352,45 L360,45 L360,60 L368,60 L368,75
  L376,75 L376,70 L384,70 L384,55 L392,55 L392,75
  L400,75 L400,100 Z
`;

/**
 * Fireworks intensity configurations keyed by time-remaining thresholds.
 *
 * @remarks
 * STARS_ONLY has null config (no fireworks). Other levels scale from occasional to maximum
 * as countdown approaches zero. Used by fireworks controller to update canvas animations.
 *
 * @see updateFireworksIntensity in src/themes/fireworks/utils/fireworks.ts
 * @public
 */
export const INTENSITY_CONFIGS: Record<IntensityLevelType, IntensityConfig | null> = {
  [IntensityLevel.STARS_ONLY]: null, // No fireworks

  [IntensityLevel.OCCASIONAL]: {
    intensity: 1,
    particles: 50,
    explosion: 3,
    delay: { min: 25000, max: 35000 },
    hue: { min: 0, max: 360 },
    traceSpeed: 3,
    flickering: 30,
  },

  [IntensityLevel.MODERATE]: {
    intensity: 5,
    particles: 60,
    explosion: 4,
    delay: { min: 10000, max: 15000 },
    hue: { min: 0, max: 360 },
    traceSpeed: 5,
    flickering: 40,
  },

  [IntensityLevel.FREQUENT]: {
    intensity: 10,
    particles: 70,
    explosion: 5,
    delay: { min: 4000, max: 6000 },
    hue: { min: 0, max: 360 },
    traceSpeed: 6,
    flickering: 50,
  },

  [IntensityLevel.CONTINUOUS]: {
    intensity: 20,
    particles: 80,
    explosion: 6,
    delay: { min: 1000, max: 2000 },
    hue: { min: 0, max: 360 },
    traceSpeed: 8,
    flickering: 60,
  },

  [IntensityLevel.BUILDING]: {
    intensity: 30,
    particles: 90,
    explosion: 7,
    delay: { min: 500, max: 1000 },
    hue: { min: 0, max: 360 },
    traceSpeed: 10,
    flickering: 70,
  },

  [IntensityLevel.FINALE]: {
    intensity: 40,
    particles: 100,
    explosion: 8,
    delay: { min: 200, max: 500 },
    hue: { min: 0, max: 360 },
    traceSpeed: 12,
    flickering: 80,
  },

  [IntensityLevel.MAXIMUM]: {
    intensity: 50,
    particles: 150,
    explosion: 10,
    delay: { min: 50, max: 150 },
    hue: { min: 0, max: 360 },
    traceSpeed: 15,
    flickering: 100,
  },
};


