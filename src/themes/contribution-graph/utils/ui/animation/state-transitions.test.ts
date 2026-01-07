import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ResourceTracker, AnimationStateContext } from '@themes/shared/types';
import { CSS_CLASSES, buildSquareClass } from '../../../config';
import type { GridState, Square, BoundingBox } from '../../../types';

vi.mock('./activity-loop', () => ({
  startActivity: vi.fn(),
  stopActivity: vi.fn(),
}));

vi.mock('../text-rendering/celebration-renderer', () => ({
  renderCelebrationText: vi.fn(),
  clearCelebrationText: vi.fn(),
}));

vi.mock('./wall-build', () => ({
  buildWall: vi.fn(() => Promise.resolve()),
  unbuildWall: vi.fn(() => Promise.resolve()),
  clearWall: vi.fn(),
}));

vi.mock('../memory-management', () => ({
  stopPeriodicCleanup: vi.fn(),
}));

vi.mock('@themes/shared', async () => {
  const actual = await vi.importActual<typeof import('@themes/shared')>('@themes/shared');
  return {
    ...actual,
    cancelAll: vi.fn(),
  };
});

import { startActivity as startActivityLoop, stopActivity as stopActivityLoop } from './activity-loop';
import { renderCelebrationText, clearCelebrationText } from '../text-rendering/celebration-renderer';
import { buildWall, clearWall, unbuildWall } from './wall-build';
import { stopPeriodicCleanup } from '../memory-management';
import { cancelAll } from '@themes/shared';
import {
  abortCelebrationAnimation,
  clearAmbientTransitions,
  clearCelebrationVisuals,
  createCelebrationAbortSignal,
  createCelebrationController,
  destroyRendererState,
  executeAnimatedCelebration,
  handleRendererAnimationStateChange,
  prepareCelebration,
  resetToCounting,
  showCompletionMessageWithAmbient,
  startActivity,
  startCelebrationAmbient,
  startCountdownAmbient,
  updateAmbientSquaresForCelebration,
} from './state-transitions';

function createSquares(cols: number, rows: number): Square[] {
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
  return squares;
}

function createGridState(cols = 3, rows = 3, exclusionZone: BoundingBox | null = null): GridState {
  const squares = createSquares(cols, rows);
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

function createRendererState(gridState: GridState | null = createGridState()) {
  const resourceTracker: ResourceTracker = {
    intervals: [],
    timeouts: [],
    rafs: [],
    observers: [],
    listeners: [],
  };

  const animationState: AnimationStateContext = {
    shouldAnimate: true,
    prefersReducedMotion: false,
  };

  return {
    container: document.createElement('div'),
    gridState,
    loopState: { currentPhase: 'calm', isActivityRunning: false, activityTimeoutId: null },
    resourceTracker,
    getAnimationState: () => animationState,
    resizeRafId: null,
    periodicCleanupId: null,
    celebrationController: createCelebrationController(),
    lastTime: null,
    resizeObserver: null as ResizeObserver | null,
    completionMessage: '',
  };
}

describe('state-transitions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should rebuild ambient squares outside celebration bounding box when celebration text is rendered', () => {
    const state = createGridState(2, 2);
    const [first, second] = state.squares;
    first.element.classList.add(CSS_CLASSES.MESSAGE);
    state.digitBoundingBox = { minCol: 0, maxCol: 0, minRow: 0, maxRow: 1 };

    updateAmbientSquaresForCelebration(state);

    expect(state.ambientSquares.every((sq) => sq.col !== 0)).toBe(true);
    expect(state.ambientSquares).not.toContain(first);
    expect(state.ambientSquares).toContain(second);
    expect(state.ambientSquaresDirty).toBe(false);
  });

  it('should include all squares when no bounding box exists', () => {
    const state = createGridState(2, 2);
    state.digitBoundingBox = null;

    updateAmbientSquaresForCelebration(state);

    expect(state.ambientSquares.length).toBe(state.squares.length);
    expect(state.ambientSquaresDirty).toBe(false);
  });

  it('should clear ambient transitions and active ambient set when animation state changes', () => {
    const state = createGridState(1, 2);
    const [first, second] = state.squares;
    first.element.classList.add(CSS_CLASSES.AMBIENT);
    second.element.classList.add(CSS_CLASSES.WALL);
    state.activeAmbient.add(first);

    clearAmbientTransitions(state);

    expect(first.element.className).toBe(buildSquareClass(0));
    expect(second.element.classList.contains(CSS_CLASSES.WALL)).toBe(true);
    expect(state.activeAmbient.size).toBe(0);
  });

  it.each([
    { shouldAnimate: true, prefersReducedMotion: false, startCalled: true },
    { shouldAnimate: false, prefersReducedMotion: false, startCalled: false },
  ])('should handle animation state changes when shouldAnimate=$shouldAnimate', ({ shouldAnimate, prefersReducedMotion, startCalled }) => {
    const state = createRendererState();

    handleRendererAnimationStateChange(state, { shouldAnimate, prefersReducedMotion, reason: 'test' });

    expect(startActivityLoop).toHaveBeenCalledTimes(startCalled ? 1 : 0);
    expect(stopActivityLoop).toHaveBeenCalledTimes(startCalled ? 0 : 1);
  });

  it('should show completion message and start ambient when animations enabled', () => {
    const state = createRendererState();
    const boundingBox = { minCol: 0, maxCol: 1, minRow: 0, maxRow: 1 };
    (renderCelebrationText as unknown as vi.Mock).mockReturnValue({
      messageSquares: [],
      messageIndices: new Set<number>(),
      boundingBox,
    });

    showCompletionMessageWithAmbient(state, 'Done');

    expect(renderCelebrationText).toHaveBeenCalledWith(state.gridState, 'Done');
    expect(state.gridState?.digitBoundingBox).toEqual(boundingBox);
    expect(state.gridState?.grid.getAttribute('data-celebration-phase')).toBe('celebrated');
    expect(startActivityLoop).toHaveBeenCalled();
  });

  it('should start celebration ambient when animations allowed', () => {
    const state = createRendererState();
    startCelebrationAmbient(state);
    expect(startActivityLoop).toHaveBeenCalled();
  });

  it('should start countdown ambient when animations allowed', () => {
    const state = createRendererState();
    startCountdownAmbient(state);
    expect(startActivityLoop).toHaveBeenCalled();
  });

  it('should reset grid to counting state when counting resumes', () => {
    const state = createGridState();
    state.activeAmbient.add(state.squares[0]);
    state.ambientSquares = [];
    state.digitBoundingBox = { minCol: 0, maxCol: 0, minRow: 0, maxRow: 0 };

    resetToCounting(state);

    expect(clearWall).toHaveBeenCalledWith(state);
    expect(clearCelebrationText).toHaveBeenCalledWith(state);
    expect(state.activeAmbient.size).toBe(0);
    expect(state.ambientSquares.length).toBe(state.squares.length);
    expect(state.digitBoundingBox).toBeNull();
  });

  it('should create abort signal when preparing celebration', () => {
    const state = createRendererState();
    const signal = prepareCelebration(state as any);

    expect(signal.aborted).toBe(false);
    expect(state.celebrationController.abortController).not.toBeNull();
  });

  it('should execute animated celebration and start ambient after unbuild', async () => {
    const state = createRendererState();
    const boundingBox = { minCol: 0, maxCol: 1, minRow: 0, maxRow: 1 };
    (renderCelebrationText as unknown as vi.Mock).mockReturnValue({
      messageSquares: [],
      messageIndices: new Set<number>(),
      boundingBox,
    });

    state.gridState?.grid && document.body.appendChild(state.gridState.grid);
    const signal = createCelebrationAbortSignal(state.celebrationController);
    await executeAnimatedCelebration(state as any, 'Yay', signal);

    expect(buildWall).toHaveBeenCalled();
    expect(unbuildWall).toHaveBeenCalled();
    expect(startActivityLoop).toHaveBeenCalled();
    expect(state.completionMessage).toBe('Yay');
  });

  it('should stop when celebration signal already aborted', async () => {
    const state = createRendererState();
    const controller = new AbortController();
    controller.abort();

    await executeAnimatedCelebration(state as any, 'Stop', controller.signal);

    expect(unbuildWall).not.toHaveBeenCalled();
  });

  it('should clear celebration visuals and reset digit flags when clearing celebration state', () => {
    const state = createGridState(1, 1);
    const [square] = state.squares;
    square.isDigit = true;
    square.element.className = `${CSS_CLASSES.SQUARE} ${CSS_CLASSES.DIGIT}`;

    clearCelebrationVisuals(state);

    expect(square.isDigit).toBe(false);
    expect(square.element.className).toBe(buildSquareClass(0));
  });

  it('should destroy renderer state and clean resources when destroy is invoked', async () => {
    const state = {
      ...createRendererState(createGridState()),
      resizeObserver: { disconnect: vi.fn() } as unknown as ResizeObserver,
      resizeRafId: 1,
      periodicCleanupId: 2,
    } as any;

    const cancelSpy = vi.spyOn(globalThis, 'cancelAnimationFrame');

    await destroyRendererState(state);

    expect(stopActivityLoop).toHaveBeenCalled();
    expect(stopPeriodicCleanup).toHaveBeenCalledWith(2);
    expect(clearWall).toHaveBeenCalled();
    expect(clearCelebrationText).toHaveBeenCalled();
    expect(cancelAll).toHaveBeenCalledWith(state.resourceTracker);
    expect(cancelSpy).toHaveBeenCalledWith(1);
    expect(state.gridState).toBeNull();
    expect(state.container).toBeNull();
  });
});