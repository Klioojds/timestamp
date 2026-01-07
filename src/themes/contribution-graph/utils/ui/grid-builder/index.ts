/**
 * Grid DOM construction for contribution-graph theme.
 *
 * Creates the grid element and square array for rendering.
 * Supports both time page (viewport-filling) and landing page (container-filling) modes.
 */

import { buildSquareClass, CSS_CLASSES } from '../../../config';
import type { BoundingBox, GridState, Square } from '../../../types';
import { calculateGridDimensions } from '../../grid';

/** Options for grid creation. */
export interface GridOptions {
  /** Container width to fill with squares. If not provided, uses viewport width. */
  containerWidth?: number;
  /** Container height to fill with squares. If not provided, uses viewport height. */
  containerHeight?: number;
  /** Test ID for the grid element. */
  testId?: string;
}

/** Parameters needed to calculate square positions for exclusion zone filtering. */
export interface GridLayoutParams {
  squareSize: number;
  gap: number;
  cols: number;
  rows: number;
  gridRect: DOMRect;
}

const DEFAULT_OPTIONS: GridOptions = {
  testId: 'countdown-display',
};

/**
 * Create contribution grid (fills container or viewport).
 * @returns Initialized grid state with squares and layout params
 */
export function createGrid(container: HTMLElement, options: GridOptions = {}): GridState {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Always use viewport dimensions for square/gap calculation (ensures consistency)
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // Calculate grid dimensions based on viewport (same sizing for all contexts)
  const { cols: viewportCols, rows: viewportRows, squareSize, gap } = calculateGridDimensions(
    viewportWidth,
    viewportHeight
  );
  
  // Determine how much area to fill with squares
  // If container dimensions provided, fill that area; otherwise fill viewport
  const targetWidth = opts.containerWidth ?? viewportWidth;
  const targetHeight = opts.containerHeight ?? viewportHeight;
  
  // Calculate how many cols/rows needed to fill the target area
  const cellSize = squareSize + gap;
  const cols = Math.max(viewportCols, Math.ceil(targetWidth / cellSize));
  const rows = Math.max(viewportRows, Math.ceil(targetHeight / cellSize));
  
  // Use the same gap as calculated for viewport (ensures visual consistency)
  const actualGap = gap;

  const gridWidth = cols * squareSize + (cols - 1) * actualGap;
  const gridHeight = rows * squareSize + (rows - 1) * actualGap;

  const grid = document.createElement('div');
  grid.className = CSS_CLASSES.GRID;
  if (opts.testId) {
    grid.setAttribute('data-testid', opts.testId);
  }
  grid.setAttribute('aria-hidden', 'true');

  // PERF: Use CSS custom properties instead of inline styles
  const borderRadius = Math.max(1, squareSize / 7);
  grid.style.setProperty('--contribution-graph-cols', cols.toString());
  grid.style.setProperty('--contribution-graph-rows', rows.toString());
  grid.style.setProperty('--contribution-graph-square-size', `${squareSize}px`);
  grid.style.setProperty('--contribution-graph-gap', `${actualGap}px`);
  grid.style.setProperty('--contribution-graph-grid-width', `${gridWidth}px`);
  grid.style.setProperty('--contribution-graph-grid-height', `${gridHeight}px`);
  grid.style.setProperty('--contribution-graph-border-radius', `${borderRadius}px`);

  const squares: Square[] = [];
  const fragment = document.createDocumentFragment();

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const element = document.createElement('div');
      element.className = buildSquareClass(0);

      squares.push({ element, isDigit: false, col, row });
      fragment.appendChild(element);
    }
  }

  grid.appendChild(fragment);
  container.appendChild(grid);

  return {
    grid,
    squares,
    cols,
    rows,
    lastTimeStr: null,
    lastDigitIndices: new Set(),
    digitBoundingBox: null,
    exclusionZone: null,
    ambientSquares: [...squares],
    activeAmbient: new Set(),
    ambientSquaresDirty: false,
    cancelAnimation: false,
    wallPlacements: null,
    pendingCleanups: new WeakMap(),
    animatingSquares: new WeakSet(),
  };
}

/**
 * Calculate exclusion zone to prevent ambient animations behind UI elements.
 * @returns Bounding box in grid coordinates, or null if element not measurable
 */
export function calculateExclusionZone(
  exclusionElement: HTMLElement,
  layoutParams: GridLayoutParams
): BoundingBox | null {
  const { squareSize, gap, cols, rows, gridRect } = layoutParams;

  const elementRect = exclusionElement.getBoundingClientRect();
  
  // Element not visible or has no size
  if (elementRect.width === 0 || elementRect.height === 0) {
    return null;
  }

  // Convert pixel positions to grid coordinates
  // Add margin around exclusion zone for visual breathing room
  const margin = 1; // 1 square margin
  
  const cellSize = squareSize + gap;
  
  // Calculate element bounds relative to grid origin
  const relativeLeft = elementRect.left - gridRect.left;
  const relativeTop = elementRect.top - gridRect.top;
  const relativeRight = elementRect.right - gridRect.left;
  const relativeBottom = elementRect.bottom - gridRect.top;
  
  // Convert to grid column/row coordinates
  const minCol = Math.max(0, Math.floor(relativeLeft / cellSize) - margin);
  const maxCol = Math.min(cols - 1, Math.ceil(relativeRight / cellSize) + margin);
  const minRow = Math.max(0, Math.floor(relativeTop / cellSize) - margin);
  const maxRow = Math.min(rows - 1, Math.ceil(relativeBottom / cellSize) + margin);

  // No valid exclusion zone
  if (minCol > maxCol || minRow > maxRow) {
    return null;
  }

  return { minCol, maxCol, minRow, maxRow };
}

/** Check if square is within exclusion bounding box. @returns true if square should be excluded */
export function isSquareInExclusionZone(square: Square, exclusion: BoundingBox): boolean {
  return (
    square.col >= exclusion.minCol &&
    square.col <= exclusion.maxCol &&
    square.row >= exclusion.minRow &&
    square.row <= exclusion.maxRow
  );
}

/** Filter ambient squares to exclude those within an exclusion zone. @returns Squares safe for ambient */
export function filterAmbientSquares(squares: Square[], exclusion: BoundingBox | null): Square[] {
  if (!exclusion) {
    return [...squares];
  }
  return squares.filter(square => !isSquareInExclusionZone(square, exclusion));
}
