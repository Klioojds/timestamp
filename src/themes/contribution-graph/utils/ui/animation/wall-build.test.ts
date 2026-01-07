import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockRequestAnimationFrame } from '@/test-utils/theme-test-helpers';
import type { GridState, Square } from '../../../types';
import { CSS_CLASSES, buildSquareClass } from '../../../config';
import { buildWall, clearWall, unbuildWall } from './wall-build';

function createGridState(cols: number, rows: number): GridState {
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

describe('wall-build', () => {
  let restoreRaf: () => void;

  beforeEach(() => {
    vi.useFakeTimers();
    ({ restore: restoreRaf } = mockRequestAnimationFrame());
  });

  afterEach(() => {
    restoreRaf();
    vi.useRealTimers();
  });

  it('should build wall and mark squares as wall when animation runs', async () => {
    const state = createGridState(2, 2);

    const promise = buildWall(state);
    vi.runAllTimers();
    await promise;

    expect(state.grid.getAttribute('data-celebration-phase')).toBe('wall-complete');
    state.squares.forEach((sq) => {
      expect(sq.element.classList.contains(CSS_CLASSES.WALL)).toBe(true);
    });
    expect(state.wallPlacements).not.toBeNull();
  });

  it('should unbuild wall and restore base classes excluding message indices when unbuild completes', async () => {
    const state = createGridState(2, 1);
    state.wallPlacements = [0, 1];
    state.squares.forEach((sq) => {
      sq.element.className = `${CSS_CLASSES.SQUARE} ${CSS_CLASSES.WALL}`;
    });
    const textIndices = new Set<number>([1]);

    const promise = unbuildWall(state, textIndices);
    vi.runAllTimers();
    await promise;

    expect(state.grid.getAttribute('data-celebration-phase')).toBe('celebrated');
    expect(state.squares[0].element.className).toBe(buildSquareClass(0));
    expect(state.squares[1].element.classList.contains(CSS_CLASSES.WALL)).toBe(true);
  });

  it('should clear wall and reset squares when clearWall is called', () => {
    const state = createGridState(1, 1);
    const [square] = state.squares;
    square.isDigit = true;
    square.element.className = `${CSS_CLASSES.SQUARE} ${CSS_CLASSES.WALL}`;

    clearWall(state);

    expect(square.isDigit).toBe(false);
    expect(square.element.className).toBe(buildSquareClass(0));
    expect(state.grid.getAttribute('data-celebration-phase')).toBeNull();
    expect(state.wallPlacements).toBeNull();
  });
});