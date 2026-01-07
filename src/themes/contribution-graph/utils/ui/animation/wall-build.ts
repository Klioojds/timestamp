/**
 * Wall build animation for celebration.
 *
 * Uses RAF batching with gravity-constrained placement for organic brick-laying effect.
 * Builds wall bottom-to-top with shuffled columns.
 * Unbuild uses the exact same placements in reverse for visual symmetry.
 */

import { buildSquareClass, CSS_CLASSES } from '../../../config';
import type { GridState } from '../../../types';

/** Wall build configuration. */
const WALL_CONFIG = {
  /** Target animation duration in milliseconds. */
  targetDurationMs: 1800,
  /** Throttle interval between RAF frames. */
  throttleIntervalMs: 100,
  /** Maximum squares to process per frame. */
  maxSquaresPerFrame: 100,
  /** Hold wall visible after build completes. */
  holdDurationMs: 120,
} as const;

/** Shuffle array in place using Fisher-Yates algorithm. @returns Same array mutated */
function shuffleArray<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Compute gravity-constrained placement order (bottom-to-top, shuffled columns). @returns Indices into flat squares array */
function computeWallPlacements(state: GridState): number[] {
  const placements: number[] = [];
  const columnHeights = new Array<number>(state.cols).fill(state.rows);

  // Bottom-to-top creates gravity physics effect
  for (let row = state.rows - 1; row >= 0; row--) {
    const colsArray = Array.from({ length: state.cols }, (_, i) => i);
    shuffleArray(colsArray);

    for (const col of colsArray) {
      if (columnHeights[col] > row) {
        placements.push(row * state.cols + col);
        columnHeights[col] = row;
      }
    }
  }

  return placements;
}

/** Build wall using RAF batching for controlled style recalc. @returns Promise resolving when wall complete */
function buildWallRAF(state: GridState, placements: number[]): Promise<void> {
  return new Promise((resolve) => {
    const totalFrames = Math.ceil(WALL_CONFIG.targetDurationMs / WALL_CONFIG.throttleIntervalMs);
    const batchSize = Math.max(1, Math.min(WALL_CONFIG.maxSquaresPerFrame, Math.ceil(placements.length / totalFrames)));

    let placementIndex = 0;
    let lastTime = 0;

    state.grid.setAttribute('data-celebration-phase', 'wall-building');

    const animationFrame = (timestamp: number): void => {
      if (state.cancelAnimation) {
        resolve();
        return;
      }
      
      if (timestamp - lastTime < WALL_CONFIG.throttleIntervalMs) {
        requestAnimationFrame(animationFrame);
        return;
      }
      lastTime = timestamp;

      const endIndex = Math.min(placementIndex + batchSize, placements.length);
      for (let i = placementIndex; i < endIndex; i++) {
        const idx = placements[i];
        const square = state.squares[idx];
        if (square) {
          square.element.className = `${CSS_CLASSES.SQUARE} ${CSS_CLASSES.WALL}`;
        }
      }
      placementIndex = endIndex;

      if (placementIndex < placements.length) {
        requestAnimationFrame(animationFrame);
      } else {
        state.grid.setAttribute('data-celebration-phase', 'wall-complete');
        setTimeout(() => resolve(), WALL_CONFIG.holdDurationMs);
      }
    };

    requestAnimationFrame(animationFrame);
  });
}

/** Build wall animation using RAF batching. @returns Promise resolving when complete */
export function buildWall(state: GridState): Promise<void> {
  state.cancelAnimation = false;
  const placements = computeWallPlacements(state);
  state.wallPlacements = placements;
  
  return buildWallRAF(state, placements);
}

/** Unbuild wall using RAF batching. @returns Promise resolving when unbuild complete */
function unbuildWallRAF(state: GridState, placements: number[]): Promise<void> {
  return new Promise((resolve) => {
    const totalFrames = Math.ceil(WALL_CONFIG.targetDurationMs / WALL_CONFIG.throttleIntervalMs);
    const batchSize = Math.max(1, Math.min(WALL_CONFIG.maxSquaresPerFrame, Math.ceil(placements.length / totalFrames)));

    let placementIndex = 0;
    let lastTime = 0;

    state.grid.setAttribute('data-celebration-phase', 'wall-unbuilding');

    const animationFrame = (timestamp: number): void => {
      if (state.cancelAnimation) {
        resolve();
        return;
      }
      
      if (timestamp - lastTime < WALL_CONFIG.throttleIntervalMs) {
        requestAnimationFrame(animationFrame);
        return;
      }
      lastTime = timestamp;

      const endIndex = Math.min(placementIndex + batchSize, placements.length);
      for (let i = placementIndex; i < endIndex; i++) {
        const idx = placements[i];
        const square = state.squares[idx];
        if (square) {
          square.element.className = buildSquareClass(0);
        }
      }
      placementIndex = endIndex;

      if (placementIndex < placements.length) {
        requestAnimationFrame(animationFrame);
      } else {
        state.grid.setAttribute('data-celebration-phase', 'celebrated');
        resolve();
      }
    };

    requestAnimationFrame(animationFrame);
  });
}

/** Unbuild wall animation using RAF batching. @returns Promise resolving when complete */
export function unbuildWall(state: GridState, textSquareIndices: Set<number>): Promise<void> {
  const storedPlacements = state.wallPlacements ?? [];
  const placements = storedPlacements
    .slice()
    .reverse()
    .filter(idx => !textSquareIndices.has(idx));
  
  return unbuildWallRAF(state, placements);
}

/**
 * Cancel any running wall animation and reset all squares.
 */
export function clearWall(state: GridState): void {
  state.cancelAnimation = true;
  
  for (const square of state.squares) {
    square.element.className = buildSquareClass(0);
    square.element.classList.remove(CSS_CLASSES.WALL);
    square.isDigit = false;
  }
  
  state.grid.removeAttribute('data-celebration-phase');
  state.wallPlacements = null;
}
