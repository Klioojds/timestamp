/**
 * Type definitions for the contribution-graph theme.
 */

// =============================================================================
// GRID TYPES
// =============================================================================

/** Minimal square representation - element, state, and position. */
export interface Square {
  element: HTMLElement;
  isDigit: boolean;
  col: number;
  row: number;
}

/** Bounding box for digit area (with margin). */
export interface BoundingBox {
  minCol: number;
  maxCol: number;
  minRow: number;
  maxRow: number;
}

/** Grid state with ambient activity support. */
export interface GridState {
  grid: HTMLElement;
  squares: Square[];  // Flat array, access via getSquare()
  cols: number;
  rows: number;
  lastTimeStr: string | null;
  // PERF: Track digit positions for differential updates
  lastDigitIndices: Set<number>;  // Grid indices of previous frame's digit squares
  // Ambient activity
  digitBoundingBox: BoundingBox | null;
  /** UI exclusion zone (e.g., landing page card). Squares in this zone are skipped for ambient activity. */
  exclusionZone: BoundingBox | null;
  ambientSquares: Square[];  // Squares outside digit bounding box
  activeAmbient: Set<Square>;  // Currently lit ambient squares
  /** Dirty flag - set true when bounding box changes, triggers ambientSquares rebuild. */
  ambientSquaresDirty: boolean;
  // Animation cancellation
  cancelAnimation: boolean;
  /** Wall build placements - stored for unbuild to use reverse order. */
  wallPlacements: number[] | null;
  /** Pending cleanup timeouts for ambient squares (tracked for proper disposal). */
  pendingCleanups: WeakMap<Square, number>;
  /** Squares currently animating (prevents re-activation during CSS animation). */
  animatingSquares: WeakSet<Square>;
}
