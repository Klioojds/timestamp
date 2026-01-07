import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { startPeriodicCleanup, stopPeriodicCleanup } from './memory-management';
import type { ResourceTracker } from '@themes/shared/types';
import type { GridState, Square } from '../../types';

const FIVE_MINUTES_MS = 5 * 60 * 1000;

function createSquare(options: Partial<Square> = {}): Square {
  return {
    element: options.element ?? document.createElement('div'),
    isDigit: options.isDigit ?? false,
    col: options.col ?? 0,
    row: options.row ?? 0,
  };
}

function createGridState(): GridState {
  const digitSquare = createSquare({ isDigit: true, element: document.createElement('div') });
  const wallSquareElement = document.createElement('div');
  wallSquareElement.classList.add('is-wall');
  const wallSquare = createSquare({ element: wallSquareElement });
  const messageElement = document.createElement('div');
  messageElement.classList.add('is-message');
  const messageSquare = createSquare({ element: messageElement });
  const ambientSquare = createSquare({ element: document.createElement('div') });

  const squares = [digitSquare, wallSquare, messageSquare, ambientSquare];

  return {
    grid: document.createElement('div'),
    squares,
    cols: 2,
    rows: 2,
    lastTimeStr: 'cached',
    lastDigitIndices: new Set([1, 2]),
    digitBoundingBox: { minCol: 0, maxCol: 1, minRow: 0, maxRow: 1 },
    exclusionZone: null,
    ambientSquares: [...squares],
    activeAmbient: new Set([digitSquare, wallSquare, ambientSquare]),
    ambientSquaresDirty: true,
    cancelAnimation: false,
    wallPlacements: null,
    pendingCleanups: new WeakMap(),
    animatingSquares: new WeakSet([wallSquare]),
  };
}

function createHandles(): ResourceTracker {
  return {
    intervals: [101, 102, 103, 104, 105, 106],
    timeouts: Array.from({ length: 25 }, (_, i) => i + 1),
    rafs: [201, 202, 203, 204, 205, 206],
    observers: [],
    listeners: [],
  };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('startPeriodicCleanup', () => {
  it('should prune handles and rebuild ambient squares on interval', () => {
    const gridState = createGridState();
    const resourceTracker = createHandles();

    const intervalId = startPeriodicCleanup(gridState, resourceTracker);

    vi.advanceTimersByTime(FIVE_MINUTES_MS + 1);

    expect(resourceTracker.intervals).toEqual([103, 104, 105, 106, intervalId]);
    expect(resourceTracker.timeouts).toHaveLength(20);
    expect(resourceTracker.timeouts.at(-1)).toBe(25);
    expect(resourceTracker.rafs).toEqual([202, 203, 204, 205, 206]);

    expect(gridState.ambientSquares).toHaveLength(1);
    expect(gridState.ambientSquares[0].isDigit).toBe(false);
    expect(gridState.ambientSquaresDirty).toBe(false);
    expect(gridState.activeAmbient.has(gridState.ambientSquares[0])).toBe(true);
    expect(gridState.activeAmbient.size).toBe(1);
    expect(gridState.animatingSquares.has(gridState.ambientSquares[0])).toBe(false);
    expect(gridState.lastTimeStr).toBeNull();
    expect(gridState.lastDigitIndices.size).toBe(0);
    expect(gridState.digitBoundingBox).toBeNull();
  });
});

describe('stopPeriodicCleanup', () => {
  it('should clear interval when id is provided', () => {
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
    stopPeriodicCleanup(42);
    expect(clearIntervalSpy).toHaveBeenCalledWith(42);
  });

  it('should no-op when id is null', () => {
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
    stopPeriodicCleanup(null);
    expect(clearIntervalSpy).not.toHaveBeenCalled();
  });
});
