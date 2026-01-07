import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GridState, Square, BoundingBox } from '../../../types';
import { CSS_CLASSES, buildSquareClass, getAmbientClass } from '../../../config';
import { activityTick, clearAmbientActivity } from './ambient-activity';
import { createResourceTracker } from '@themes/shared';

function createGridState(cols = 3, rows = 3, exclusionZone: BoundingBox | null = null): GridState {
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
    exclusionZone,
    ambientSquares: [...squares],
    activeAmbient: new Set(),
    ambientSquaresDirty: false,
    cancelAnimation: false,
    wallPlacements: null,
    pendingCleanups: new WeakMap(),
    animatingSquares: new WeakSet(),
  };
}

describe('ambient-activity', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0); // deterministic intensity and selection
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should activate ambient square and schedule cleanup when activity ticks', () => {
    const state = createGridState();
    const handles = createResourceTracker();

    activityTick(state, 'calm', handles);

    expect(state.activeAmbient.size).toBe(1);
    const [square] = Array.from(state.activeAmbient);
    expect(square.element.className).toBe(getAmbientClass(1, 'calm'));
    expect(handles.timeouts).toHaveLength(1);

    vi.runAllTimers();

    expect(square.element.className).toBe(buildSquareClass(0));
    expect(state.activeAmbient.size).toBe(0);
    expect(state.pendingCleanups.has(square)).toBe(false);
  });

  it('should skip squares inside exclusion zone when exclusion is defined', () => {
    const exclusionZone: BoundingBox = { minCol: 0, maxCol: 0, minRow: 0, maxRow: 0 };
    const state = createGridState(2, 2, exclusionZone);
    const handles = createResourceTracker();

    activityTick(state, 'calm', handles);

    const activatedSquare = Array.from(state.activeAmbient)[0];
    const isInsideZone =
      activatedSquare.col >= exclusionZone.minCol &&
      activatedSquare.col <= exclusionZone.maxCol &&
      activatedSquare.row >= exclusionZone.minRow &&
      activatedSquare.row <= exclusionZone.maxRow;

    expect(isInsideZone).toBe(false);
  });

  it('should clear ambient activity and cancel pending cleanups when requested', () => {
    const state = createGridState();
    const [first] = state.squares;
    first.element.className = getAmbientClass(2, 'calm');
    state.activeAmbient.add(first);
    const timeoutId = window.setTimeout(() => undefined, 1000);
    state.pendingCleanups.set(first, timeoutId);

    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

    clearAmbientActivity(state);

    expect(clearTimeoutSpy).toHaveBeenCalledWith(timeoutId);
    expect(state.activeAmbient.size).toBe(0);
    expect(first.element.className).toBe(buildSquareClass(0));
    expect(state.pendingCleanups.has(first)).toBe(false);
  });
});