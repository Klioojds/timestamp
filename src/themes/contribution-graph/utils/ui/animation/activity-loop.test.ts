import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ResourceTracker, AnimationStateContext } from '@themes/shared/types';
import { createResourceTracker } from '@themes/shared';
import type { GridState, Square } from '../../../types';
import { createActivityLoopState, scheduleActivityTick, startActivity, stopActivity } from './activity-loop';
import * as ambientActivity from './ambient-activity';

function createGridState(cols = 3, rows = 3): GridState {
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
    ambientSquares: [...squares],
    activeAmbient: new Set(),
    ambientSquaresDirty: false,
    cancelAnimation: false,
    wallPlacements: null,
    pendingCleanups: new WeakMap(),
    animatingSquares: new WeakSet(),
  };
}

const defaultAnimationState: AnimationStateContext = {
  shouldAnimate: true,
  prefersReducedMotion: false,
};

describe('activity-loop', () => {
  let resourceTracker: ResourceTracker;

  beforeEach(() => {
    vi.useFakeTimers();
    resourceTracker = createResourceTracker();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should create loop state with defaults when initialized', () => {
    const state = createActivityLoopState();

    expect(state.currentPhase).toBe('calm');
    expect(state.isActivityRunning).toBe(false);
    expect(state.activityTimeoutId).toBeNull();
  });

  it('should schedule next tick when activity is running and animation is enabled', () => {
    const gridState = createGridState();
    const loopState = createActivityLoopState();
    loopState.isActivityRunning = true;

    const tickSpy = vi
      .spyOn(ambientActivity, 'activityTick')
      .mockImplementation(() => {
        loopState.isActivityRunning = false; // stop recursion after first call
      });

    scheduleActivityTick(gridState, loopState, () => defaultAnimationState, resourceTracker);
    vi.runAllTimers();

    expect(tickSpy).toHaveBeenCalledTimes(1);
    expect(loopState.activityTimeoutId).not.toBeNull();
  });

  it.each([
    { shouldAnimate: false, prefersReducedMotion: false, reason: 'animation disabled' },
    { shouldAnimate: true, prefersReducedMotion: true, reason: 'reduced motion preferred' },
  ])('should not schedule tick when $reason', ({ shouldAnimate, prefersReducedMotion }) => {
    const loopState = createActivityLoopState();
    loopState.isActivityRunning = true;
    const gridState = createGridState();

    const tickSpy = vi.spyOn(ambientActivity, 'activityTick').mockImplementation(() => {});

    scheduleActivityTick(
      gridState,
      loopState,
      () => ({ shouldAnimate, prefersReducedMotion, reason: 'test' }),
      resourceTracker
    );

    expect(tickSpy).not.toHaveBeenCalled();
    expect(loopState.activityTimeoutId).toBeNull();
  });

  it('should start activity with immediate tick and schedule follow-up when started', () => {
    const gridState = createGridState();
    const loopState = createActivityLoopState();
    const tickSpy = vi
      .spyOn(ambientActivity, 'activityTick')
      .mockImplementation(() => {
        expect(loopState.isActivityRunning).toBe(true);
        loopState.isActivityRunning = false;
      });

    startActivity(gridState, loopState, () => defaultAnimationState, resourceTracker);

    expect(loopState.isActivityRunning).toBe(false);
    expect(tickSpy).toHaveBeenCalledTimes(1);

    vi.runAllTimers();
    expect(loopState.activityTimeoutId).toBeNull();
  });

  it('should stop activity and clear timeout plus ambient squares when stopped', () => {
    const gridState = createGridState();
    const loopState = createActivityLoopState();
    loopState.isActivityRunning = true;
    loopState.activityTimeoutId = window.setTimeout(() => undefined, 1000);

    const clearAmbientSpy = vi.spyOn(ambientActivity, 'clearAmbientActivity').mockImplementation(() => {});

    stopActivity(gridState, loopState);

    expect(loopState.isActivityRunning).toBe(false);
    expect(loopState.activityTimeoutId).toBeNull();
    expect(clearAmbientSpy).toHaveBeenCalledWith(gridState);
  });
});