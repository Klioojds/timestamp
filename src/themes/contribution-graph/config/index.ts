/**
 * Contribution Graph Theme Configuration
 *
 * IMPORTANT: The ThemeConfig here is the source of truth for theme metadata.
 * The registry imports from this file to avoid duplication.
 */

import type { ThemeConfig } from '@core/types';

// =============================================================================
// THEME CONFIGURATION
// =============================================================================

/**
 * Theme configuration for Contribution Graph.
 *
 * Features pixel-art digits on a GitHub-style contribution grid.
 */
export const CONTRIBUTION_GRAPH_CONFIG: ThemeConfig = {
  id: 'contribution-graph',
  name: 'Contribution Graph',
  description: 'GitHub contribution graph aesthetic with pixel-art digits',
  publishedDate: '2026-01-07',
  author: 'chrisreddington',
  tags: ['github', 'pixel-art', 'grid', 'green'],
  dependencies: [],
  supportsWorldMap: true,
  availableInIssueTemplate: true,
  optionalComponents: {
    timezoneSelector: true,
    worldMap: true,
  },
  colors: {
    dark: {
      accentPrimary: '#39d353',   // GitHub green
      accentSecondary: '#26a641',
    },
    light: {
      accentPrimary: '#1a7f37',   // Darker green for light mode
      accentSecondary: '#116329',
    },
  },
};

// =============================================================================
// GRID CONFIGURATION
// =============================================================================

/**
 * Grid rendering configuration.
 * Controls square sizing, spacing, and performance limits.
 */
export const GRID_CONFIG = {
  minSquareSize: 4,
  maxSquareSize: 16,
  gapRatio: 0.2,
  edgePadding: 4,
} as const;

/**
 * Maximum number of grid squares to prevent performance issues.
 * If calculated grid exceeds this, dimensions are scaled down.
 */
export const MAX_NODES = 5000;

// =============================================================================
// LAYOUT CONFIGURATION
// =============================================================================

/** Character spacing in grid columns. */
export const CHAR_SPACING = 1;

/** Gap between lines in multi-line mode. */
export const LINE_SPACING = 3;

/** Margin around digits for bounding box. */
export const BOUNDING_BOX_MARGIN = 2;

// =============================================================================
// CSS CLASS CONSTANTS
// =============================================================================

/**
 * CSS class names used throughout the theme.
 * Centralized to prevent string duplication and typos.
 */
export const CSS_CLASSES = {
  /** Base class for all grid squares. */
  SQUARE: 'contribution-graph-square',
  /** Grid container class. */
  GRID: 'contribution-graph-grid',
  /** Ambient animation class (CSS handles full lifecycle). */
  AMBIENT: 'is-ambient',
  /** Digit square class. */
  DIGIT: 'is-digit',
  /** Pulse animation class for digits. */
  PULSE: 'pulse-digit',
  /** Wall build animation class. */
  WALL: 'is-wall',
  /** Celebration message class. */
  MESSAGE: 'is-message',
  /** Phase classes for animation timing. */
  PHASE_CALM: 'phase-calm',
  PHASE_BUILDING: 'phase-building',
  PHASE_INTENSE: 'phase-intense',
  PHASE_FINAL: 'phase-final',
} as const;

// =============================================================================
// PRE-COMPUTED CLASS STRINGS (PERF)
// =============================================================================

/** Map phase names to CSS class names. */
const PHASE_CLASS_MAP: Record<string, string> = {
  calm: CSS_CLASSES.PHASE_CALM,
  building: CSS_CLASSES.PHASE_BUILDING,
  intense: CSS_CLASSES.PHASE_INTENSE,
  final: CSS_CLASSES.PHASE_FINAL,
};

/** Get CSS class for activity phase. */
export function getPhaseClass(phase: string): string {
  return PHASE_CLASS_MAP[phase] ?? CSS_CLASSES.PHASE_CALM;
}

/** Pre-computed base class strings for each intensity (0-4). */
const BASE_CLASS_STRINGS: readonly string[] = [
  `${CSS_CLASSES.SQUARE} intensity-0`,
  `${CSS_CLASSES.SQUARE} intensity-1`,
  `${CSS_CLASSES.SQUARE} intensity-2`,
  `${CSS_CLASSES.SQUARE} intensity-3`,
  `${CSS_CLASSES.SQUARE} intensity-4`,
];

/** Pre-computed ambient class strings keyed by `${phase}-${intensity}`. */
const AMBIENT_CLASS_STRINGS: Record<string, string> = {};
for (const phase of ['calm', 'building', 'intense', 'final']) {
  for (let intensity = 0; intensity <= 4; intensity++) {
    const key = `${phase}-${intensity}`;
    AMBIENT_CLASS_STRINGS[key] = `${CSS_CLASSES.SQUARE} intensity-${intensity} ${CSS_CLASSES.AMBIENT} ${getPhaseClass(phase)}`;
  }
}

/** Build square class string with intensity and optional additional classes. */
export function buildSquareClass(intensity: number, ...additionalClasses: string[]): string {
  const classes = [CSS_CLASSES.SQUARE, `intensity-${intensity}`, ...additionalClasses];
  return classes.join(' ');
}

/** Get pre-computed base class for intensity. O(1), zero allocation. */
export function getBaseClass(intensity: number): string {
  return BASE_CLASS_STRINGS[intensity] ?? BASE_CLASS_STRINGS[0];
}

/** Get pre-computed ambient class for intensity and phase. O(1), zero allocation. */
export function getAmbientClass(intensity: number, phase: string): string {
  return AMBIENT_CLASS_STRINGS[`${phase}-${intensity}`] ?? getBaseClass(intensity);
}

// =============================================================================
// VISUAL CONFIGURATION
// =============================================================================

/**
 * Weighted intensity distribution (favor lower intensities).
 * intensity-1: 50%, intensity-2: 30%, intensity-3: 15%, intensity-4: 5%
 */
export const INTENSITY_WEIGHTS = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 4] as const;

/** Get random weighted intensity (1-4, favors lower values). */
export function getWeightedIntensity(): number {
  return INTENSITY_WEIGHTS[Math.floor(Math.random() * INTENSITY_WEIGHTS.length)];
}

// =============================================================================
// ACTIVITY STAGES
// =============================================================================

export {
type ActivityPhase,
  type ActivityPhaseValues,
  clearActivityStageCache,
  getActivityPhase,
  getActivityStageSnapshot,
  getPhaseConfig,
  getPhaseConfigByName} from './activity-stages';

