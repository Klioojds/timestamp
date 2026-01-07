import { describe, expect, it } from 'vitest';
import { CSS_CLASSES, BOUNDING_BOX_MARGIN } from '../../../config';
import type { GridState, Square } from '../../../types';
import { renderDigits } from './digit-renderer';

function createGridState(cols = 30, rows = 15): GridState {
  const squares: Square[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      squares.push({
        element: document.createElement('div'),
        isDigit: false,
        col,
        row,
      });
    }
  }

  return {
    grid: document.createElement('div'),
    squares,
    cols,
    rows,
    lastTimeStr: null,
    lastDigitIndices: new Set(),
    digitBoundingBox: null,
    exclusionZone: null,
    ambientSquares: [],
    activeAmbient: new Set(),
    ambientSquaresDirty: false,
    cancelAnimation: false,
    wallPlacements: null,
    pendingCleanups: new WeakMap(),
    animatingSquares: new WeakSet(),
  };
}

/** Tests for digit rendering and differential updates. */
describe('digit-renderer', () => {
  it('should render digit classes and bounding box when digits are provided', () => {
    const state = createGridState();

    renderDigits(state, ['12'], false);

    const digitSquares = state.squares.filter((sq) => sq.element.classList.contains(CSS_CLASSES.DIGIT));
    expect(digitSquares.length).toBeGreaterThan(0);
    expect(state.digitBoundingBox).not.toBeNull();
    expect(state.ambientSquares.length).toBeGreaterThan(0);

    const box = state.digitBoundingBox!;
    expect(box.minCol).toBeGreaterThanOrEqual(0);
    expect(box.maxCol).toBeLessThan(state.cols + BOUNDING_BOX_MARGIN);
  });

  it('should skip rerender when time string remains unchanged', () => {
    const state = createGridState();
    renderDigits(state, ['00:01'], false);

    const firstDigitIndex = Array.from(state.lastDigitIndices)[0];
    const digitSquare = state.squares[firstDigitIndex];
    digitSquare.element.className = 'sentinel';

    renderDigits(state, ['00:01'], false);

    expect(digitSquare.element.className).toBe('sentinel');
  });

  it('should clear squares that are no longer digits when time changes', () => {
    const state = createGridState();
    renderDigits(state, ['1234'], false);
    const previousIndices = new Set(state.lastDigitIndices);

    renderDigits(state, ['1'], false);

    const removedIndices = Array.from(previousIndices).filter((idx) => !state.lastDigitIndices.has(idx));
    expect(removedIndices.length).toBeGreaterThan(0);

    removedIndices.forEach((idx) => {
      const square = state.squares[idx];
      expect(square.element.classList.contains(CSS_CLASSES.DIGIT)).toBe(false);
    });
  });

  it('should apply pulse class when shouldPulse is true and remove when cache resets with pulse disabled', () => {
    const state = createGridState();
    renderDigits(state, ['00'], true);

    const pulsingSquares = state.squares.filter((sq) => sq.element.classList.contains(CSS_CLASSES.PULSE));
    expect(pulsingSquares.length).toBeGreaterThan(0);

    state.lastDigitIndices = new Set();
    state.lastTimeStr = null;
    state.squares.forEach((square) => {
      square.element.className = `${CSS_CLASSES.SQUARE} intensity-0`;
    });

    renderDigits(state, ['01'], false);
    const remainingPulse = state.squares.filter((sq) => sq.element.classList.contains(CSS_CLASSES.PULSE));
    expect(remainingPulse.length).toBe(0);
  });
});