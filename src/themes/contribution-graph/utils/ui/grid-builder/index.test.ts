/**
 * Grid builder unit tests.
 * Tests exclusion zone calculation and ambient square filtering.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateExclusionZone,
  isSquareInExclusionZone,
  filterAmbientSquares,
  type GridLayoutParams,
} from './index';
import type { Square, BoundingBox } from '../../../types';

/**
 * Create a mock Square for testing.
 */
function createMockSquare(col: number, row: number): Square {
  const element = document.createElement('div');
  return { element, isDigit: false, col, row };
}

/**
 * Create standard grid layout params for testing.
 * Simulates a 10x10 grid with 20px squares and 4px gaps.
 */
function createTestLayoutParams(overrides?: Partial<GridLayoutParams>): GridLayoutParams {
  return {
    squareSize: 20,
    gap: 4,
    cols: 10,
    rows: 10,
    gridRect: new DOMRect(0, 0, 236, 236), // 10*20 + 9*4 = 236
    ...overrides,
  };
}

describe('calculateExclusionZone', () => {
  let exclusionElement: HTMLElement;

  beforeEach(() => {
    exclusionElement = document.createElement('div');
    document.body.appendChild(exclusionElement);
  });

  it('returns null when element has zero dimensions', () => {
    // Mock getBoundingClientRect for zero-size element
    exclusionElement.getBoundingClientRect = () => new DOMRect(0, 0, 0, 0);
    
    const layoutParams = createTestLayoutParams();
    const result = calculateExclusionZone(exclusionElement, layoutParams);
    
    expect(result).toBeNull();
  });

  it('calculates correct exclusion zone for centered element', () => {
    // Element centered in grid: positioned at (48, 48) to (188, 188)
    // This spans roughly columns 2-8 and rows 2-8 (with margin)
    exclusionElement.getBoundingClientRect = () => new DOMRect(48, 48, 140, 140);
    
    const layoutParams = createTestLayoutParams();
    const result = calculateExclusionZone(exclusionElement, layoutParams);
    
    expect(result).not.toBeNull();
    // With 1-square margin, zone should be expanded
    expect(result!.minCol).toBeLessThanOrEqual(2);
    expect(result!.maxCol).toBeGreaterThanOrEqual(7);
    expect(result!.minRow).toBeLessThanOrEqual(2);
    expect(result!.maxRow).toBeGreaterThanOrEqual(7);
  });

  it('clamps exclusion zone to grid boundaries', () => {
    // Element extends beyond grid on all sides
    exclusionElement.getBoundingClientRect = () => new DOMRect(-50, -50, 400, 400);
    
    const layoutParams = createTestLayoutParams();
    const result = calculateExclusionZone(exclusionElement, layoutParams);
    
    expect(result).not.toBeNull();
    expect(result!.minCol).toBe(0);
    expect(result!.maxCol).toBe(9); // cols - 1
    expect(result!.minRow).toBe(0);
    expect(result!.maxRow).toBe(9); // rows - 1
  });

  it('returns null when element is completely outside grid', () => {
    // Element is far to the right of the grid
    exclusionElement.getBoundingClientRect = () => new DOMRect(500, 500, 100, 100);
    
    const layoutParams = createTestLayoutParams();
    const result = calculateExclusionZone(exclusionElement, layoutParams);
    
    // With margin calculation, if minCol > maxCol after clamping, returns null
    // In this case the element is way outside, so zone should be invalid
    expect(result).toBeNull();
  });
});

describe('isSquareInExclusionZone', () => {
  const exclusion: BoundingBox = {
    minCol: 2,
    maxCol: 7,
    minRow: 3,
    maxRow: 6,
  };

  it('returns true for square inside exclusion zone', () => {
    const square = createMockSquare(4, 4);
    expect(isSquareInExclusionZone(square, exclusion)).toBe(true);
  });

  it('returns true for square on exclusion zone boundary', () => {
    const squareMinMin = createMockSquare(2, 3);
    const squareMaxMax = createMockSquare(7, 6);
    
    expect(isSquareInExclusionZone(squareMinMin, exclusion)).toBe(true);
    expect(isSquareInExclusionZone(squareMaxMax, exclusion)).toBe(true);
  });

  it('returns false for square outside exclusion zone', () => {
    const squareLeft = createMockSquare(1, 4);
    const squareRight = createMockSquare(8, 4);
    const squareAbove = createMockSquare(4, 2);
    const squareBelow = createMockSquare(4, 7);
    
    expect(isSquareInExclusionZone(squareLeft, exclusion)).toBe(false);
    expect(isSquareInExclusionZone(squareRight, exclusion)).toBe(false);
    expect(isSquareInExclusionZone(squareAbove, exclusion)).toBe(false);
    expect(isSquareInExclusionZone(squareBelow, exclusion)).toBe(false);
  });

  it('returns false for corner squares outside zone', () => {
    const squareTopLeft = createMockSquare(1, 2);
    const squareBottomRight = createMockSquare(8, 7);
    
    expect(isSquareInExclusionZone(squareTopLeft, exclusion)).toBe(false);
    expect(isSquareInExclusionZone(squareBottomRight, exclusion)).toBe(false);
  });
});

describe('filterAmbientSquares', () => {
  it('returns all squares when no exclusion zone', () => {
    const squares = [
      createMockSquare(0, 0),
      createMockSquare(5, 5),
      createMockSquare(9, 9),
    ];
    
    const result = filterAmbientSquares(squares, null);
    
    expect(result).toHaveLength(3);
  });

  it('filters out squares inside exclusion zone', () => {
    const exclusion: BoundingBox = {
      minCol: 3,
      maxCol: 6,
      minRow: 3,
      maxRow: 6,
    };
    
    const squares = [
      createMockSquare(0, 0), // outside
      createMockSquare(4, 4), // inside
      createMockSquare(5, 5), // inside
      createMockSquare(9, 9), // outside
    ];
    
    const result = filterAmbientSquares(squares, exclusion);
    
    expect(result).toHaveLength(2);
    expect(result.find(s => s.col === 0 && s.row === 0)).toBeDefined();
    expect(result.find(s => s.col === 9 && s.row === 9)).toBeDefined();
    expect(result.find(s => s.col === 4 && s.row === 4)).toBeUndefined();
    expect(result.find(s => s.col === 5 && s.row === 5)).toBeUndefined();
  });

  it('returns copy of array, not original reference', () => {
    const squares = [createMockSquare(0, 0)];
    
    const result = filterAmbientSquares(squares, null);
    
    expect(result).not.toBe(squares);
    expect(result).toEqual(squares);
  });

  it('handles empty squares array', () => {
    const exclusion: BoundingBox = { minCol: 0, maxCol: 5, minRow: 0, maxRow: 5 };
    
    const result = filterAmbientSquares([], exclusion);
    
    expect(result).toHaveLength(0);
  });
});
