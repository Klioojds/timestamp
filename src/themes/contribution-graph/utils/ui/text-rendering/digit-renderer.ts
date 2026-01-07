/**
 * Digit rendering for countdown display.
 *
 * Renders countdown digits onto the grid using differential updates
 * for optimal performance.
 */

import { buildSquareClass, CSS_CLASSES } from '../../../config';
import type { BoundingBox, GridState } from '../../../types';
import { DIGIT_HEIGHT, DIGIT_PATTERNS, DIGIT_WIDTH } from '../patterns';
import {
  BOUNDING_BOX_MARGIN,
  calculateDigitLineWidth,
  CHAR_SPACING,
  LINE_SPACING,
} from './text-layout';

// =============================================================================
// INDEX COMPUTATION
// =============================================================================

/** Compute grid indices for a line of text (no DOM access). @returns void (mutates outIndices) */
function computeLineIndices(
  cols: number,
  totalCols: number,
  text: string,
  centerRow: number,
  outIndices: Set<number>
): void {
  const width = calculateDigitLineWidth(text);
  const startCol = Math.floor((totalCols - width) / 2);

  let currentCol = startCol;
  for (const char of text) {
    const pattern = DIGIT_PATTERNS[char];
    if (!pattern) continue;

    const charWidth = char === ':' ? 3 : DIGIT_WIDTH;
    const colOffset = char === ':' ? 1 : 0;

    for (let row = 0; row < DIGIT_HEIGHT; row++) {
      for (let col = 0; col < charWidth; col++) {
        const patternCol = col + colOffset;
        if (pattern[row][patternCol] === 1) {
          const gridRow = centerRow + row;
          const gridCol = currentCol + col;
          if (gridCol >= 0 && gridCol < totalCols && gridRow >= 0) {
            outIndices.add(gridRow * cols + gridCol);
          }
        }
      }
    }

    currentCol += charWidth + CHAR_SPACING;
  }
}

/**
 * Compute all digit indices for given lines layout.
 * @returns Set of grid indices where digit pixels should be placed
 */
function computeDigitIndices(state: GridState, lines: string[]): Set<number> {
  // PERF: Pure computation - no DOM access
  const newIndices = new Set<number>();
  const totalHeight = lines.length * DIGIT_HEIGHT + (lines.length - 1) * LINE_SPACING;
  const startRow = Math.floor((state.rows - totalHeight) / 2);

  for (let i = 0; i < lines.length; i++) {
    const lineRow = startRow + i * (DIGIT_HEIGHT + LINE_SPACING);
    computeLineIndices(state.cols, state.cols, lines[i], lineRow, newIndices);
  }

  return newIndices;
}

// =============================================================================
// AMBIENT SQUARES
// =============================================================================

/** Check if two bounding boxes are equal. @returns true if boxes are structurally equal */
function boundingBoxEquals(a: BoundingBox | null, b: BoundingBox | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.minCol === b.minCol && a.maxCol === b.maxCol &&
         a.minRow === b.minRow && a.maxRow === b.maxRow;
}

/** Update squares available for ambient activity (skips rebuild if bounding box unchanged via dirty flag). */
function updateAmbientSquares(state: GridState, newBox: BoundingBox): void {
  // Skip rebuild if bounding box unchanged
  if (!state.ambientSquaresDirty && boundingBoxEquals(state.digitBoundingBox, newBox)) {
    return;
  }

  state.ambientSquares = state.squares.filter((square) => {
    return (
      square.col < newBox.minCol ||
      square.col > newBox.maxCol ||
      square.row < newBox.minRow ||
      square.row > newBox.maxRow
    );
  });

  // PERF: Use Set for O(1) lookup instead of Array.includes() which is O(n)
  const ambientSet = new Set(state.ambientSquares);

  // Clear any active ambient that's now inside the bounding box
  for (const square of state.activeAmbient) {
    if (!ambientSet.has(square)) {
      state.activeAmbient.delete(square);
      if (!square.isDigit) {
        square.element.className = buildSquareClass(0);
      }
    }
  }

  state.ambientSquaresDirty = false;
}

// =============================================================================
// DIGIT RENDERING
// =============================================================================

/**
 * Render digits using differential updates - only modifies changed squares.
 * @example 10:01:36:54 → 10:01:36:55 changes 1 digit (35 DOM ops vs 280)
 */
export function renderDigits(state: GridState, lines: string[], shouldPulse: boolean): void {
  const cacheKey = lines.join('|');
  if (state.lastTimeStr === cacheKey) {
    return;
  }

  state.lastTimeStr = cacheKey;

  const newIndices = computeDigitIndices(state, lines);

  // PERF: Differential update - only modify changed squares
  const digitClass = shouldPulse
    ? `${CSS_CLASSES.SQUARE} ${CSS_CLASSES.DIGIT} ${CSS_CLASSES.PULSE}`
    : `${CSS_CLASSES.SQUARE} ${CSS_CLASSES.DIGIT}`;

  // Clear old digit positions not in new set
  for (const idx of state.lastDigitIndices) {
    if (!newIndices.has(idx)) {
      const square = state.squares[idx];
      if (square) {
        square.isDigit = false;
        if (!state.activeAmbient.has(square)) {
          square.element.className = buildSquareClass(0);
        }
      }
    }
  }

  // Set new digit positions not in old set
  for (const idx of newIndices) {
    if (!state.lastDigitIndices.has(idx)) {
      const square = state.squares[idx];
      if (square) {
        square.isDigit = true;
        square.element.className = digitClass;
      }
    }
  }

  state.lastDigitIndices = newIndices;

  // Track bounding box for ambient activity
  let minCol = state.cols;
  let maxCol = 0;
  let minRow = state.rows;
  let maxRow = 0;

  const totalHeight = lines.length * DIGIT_HEIGHT + (lines.length - 1) * LINE_SPACING;
  const startRow = Math.floor((state.rows - totalHeight) / 2);

  for (let i = 0; i < lines.length; i++) {
    const lineRow = startRow + i * (DIGIT_HEIGHT + LINE_SPACING);
    const lineW = calculateDigitLineWidth(lines[i]);
    const lineStartCol = Math.floor((state.cols - lineW) / 2);

    minCol = Math.min(minCol, lineStartCol);
    maxCol = Math.max(maxCol, lineStartCol + lineW - 1);
    minRow = Math.min(minRow, lineRow);
    maxRow = Math.max(maxRow, lineRow + DIGIT_HEIGHT - 1);
  }

  const newBox: BoundingBox = {
    minCol: Math.max(0, minCol - BOUNDING_BOX_MARGIN),
    maxCol: Math.min(state.cols - 1, maxCol + BOUNDING_BOX_MARGIN),
    minRow: Math.max(0, minRow - BOUNDING_BOX_MARGIN),
    maxRow: Math.min(state.rows - 1, maxRow + BOUNDING_BOX_MARGIN),
  };

  updateAmbientSquares(state, newBox);
  state.digitBoundingBox = newBox;
}
