import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createTimePageRendererState,
  handleResize,
  setupRendererMount,
  updateActivityPhase,
  updateRendererContainer,
} from './time-renderer-state';

const calculateGridDimensions = vi.fn(() => ({ cols: 6, rows: 6, squareSize: 10, gap: 2 }));
const formatCountdown = vi.fn(() => ['10:09']);
const renderDigits = vi.fn();
const showCompletionMessageWithAmbient = vi.fn();
const startCountdownAmbient = vi.fn();
const stopActivity = vi.fn();
const createActivityLoopState = vi.fn(() => ({
  currentPhase: 'calm',
  isActivityRunning: false,
  activityTimeoutId: null,
}));
const createCelebrationController = vi.fn(() => ({ abortController: null }));
const startPeriodicCleanup = vi.fn(() => 999);
const cancelCallbacks = vi.fn();
const createResourceTracker = vi.fn(() => ({
  intervals: [],
  timeouts: [],
  rafs: [],
  observers: [],
  listeners: [],
}));
const shouldEnableAnimations = vi.fn(() => true);
const getActivityPhase = vi.fn(() => 'intense');

const createGridStateStub = (container?: HTMLElement, cols = 5, rows = 5) => {
  const grid = document.createElement('div');
  grid.classList.add('contribution-graph-grid');
  grid.setAttribute('data-celebration-phase', 'counting');

  const gridState = {
    grid,
    squares: [],
    cols,
    rows,
    lastTimeStr: null,
    lastDigitIndices: new Set<number>(),
    digitBoundingBox: null,
    exclusionZone: null,
    ambientSquares: [],
    activeAmbient: new Set(),
    ambientSquaresDirty: false,
    cancelAnimation: false,
    wallPlacements: null,
    pendingCleanups: new WeakMap(),
    animatingSquares: new WeakSet(),
  } as const;

  if (container) {
    container.appendChild(grid);
  }

  return gridState;
};

const createGrid = vi.fn((container?: HTMLElement) => createGridStateStub(container));

vi.mock('../../grid', () => ({
  calculateGridDimensions: (...args: unknown[]) => calculateGridDimensions(...args),
  formatCountdown: (...args: unknown[]) => formatCountdown(...args),
}));

vi.mock('../grid-builder', () => ({
  createGrid: (...args: unknown[]) => createGrid(...args),
}));

vi.mock('../text-rendering', () => ({
  renderDigits: (...args: unknown[]) => renderDigits(...args),
}));

vi.mock('../memory-management', () => ({
  startPeriodicCleanup: (...args: unknown[]) => startPeriodicCleanup(...args),
}));

vi.mock('../animation', () => ({
  createActivityLoopState: (...args: unknown[]) => createActivityLoopState(...args),
  createCelebrationController: (...args: unknown[]) => createCelebrationController(...args),
  showCompletionMessageWithAmbient: (...args: unknown[]) => showCompletionMessageWithAmbient(...args),
  startCountdownAmbient: (...args: unknown[]) => startCountdownAmbient(...args),
  stopActivity: (...args: unknown[]) => stopActivity(...args),
}));

vi.mock('../../../config', () => ({
  getActivityPhase: (...args: unknown[]) => getActivityPhase(...args),
}));

vi.mock('@themes/shared', () => ({
  cancelCallbacks: (...args: unknown[]) => cancelCallbacks(...args),
  createResourceTracker: (...args: unknown[]) => createResourceTracker(...args),
  shouldEnableAnimations: (...args: unknown[]) => shouldEnableAnimations(...args),
}));

beforeAll(() => {
  class MockResizeObserver {
    private readonly cb: () => void;
    constructor(cb: () => void) {
      this.cb = cb;
    }
    observe = vi.fn();
    disconnect = vi.fn();
    trigger() {
      this.cb();
    }
  }

  // @ts-expect-error jsdom global augmentation for tests
  global.ResizeObserver = MockResizeObserver;
});

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('createTimePageRendererState', () => {
  it('should initialize with base defaults and celebration controller', () => {
    const state = createTimePageRendererState();

    expect(state.container).toBeNull();
    expect(state.gridState).toBeNull();
    expect(state.celebrationController).toEqual({ abortController: null });
    expect(state.lastTime).toBeNull();
    expect(state.periodicCleanupId).toBeNull();
  });
});

describe('updateActivityPhase', () => {
  it('should update loop state when phase changes', () => {
    getActivityPhase.mockReturnValueOnce('building');
    const state = createTimePageRendererState();

    updateActivityPhase(state, { days: 0, hours: 1, minutes: 0, seconds: 0, total: 1_000_000 });

    expect(state.loopState.currentPhase).toBe('building');
  });
});

describe('updateRendererContainer', () => {
  it('should replace container reference', () => {
    const state = createTimePageRendererState();
    const container = document.createElement('div');
    updateRendererContainer(state, container);
    expect(state.container).toBe(container);
  });
});

describe('handleResize', () => {
  it('should no-op when container or grid state is missing', () => {
    const state = createTimePageRendererState();
    handleResize(state);
    expect(stopActivity).not.toHaveBeenCalled();
  });

  it('should rebuild grid and show celebration message when celebrating', () => {
    const state = createTimePageRendererState();
    const container = document.createElement('div');
    state.container = container;
    state.gridState = createGridStateStub(container, 4, 4);
    state.gridState.grid.setAttribute('data-celebration-phase', 'celebrated');
    state.completionMessage = 'Done';

    calculateGridDimensions.mockReturnValue({ cols: 6, rows: 6, squareSize: 10, gap: 2 });

    handleResize(state);

    expect(stopActivity).toHaveBeenCalledWith(state);
    expect(cancelCallbacks).toHaveBeenCalledWith(state.resourceTracker);
    expect(createGrid).toHaveBeenCalledTimes(1);
    expect(showCompletionMessageWithAmbient).toHaveBeenCalledWith(state, 'Done');
    expect(renderDigits).not.toHaveBeenCalled();
    expect(startCountdownAmbient).not.toHaveBeenCalled();
  });

  it('should rebuild grid and render last time when not celebrating', () => {
    const state = createTimePageRendererState();
    const container = document.createElement('div');
    state.container = container;
    state.gridState = createGridStateStub(container, 4, 4);
    state.lastTime = { days: 0, hours: 1, minutes: 2, seconds: 3, total: 0 };

    calculateGridDimensions.mockReturnValue({ cols: 7, rows: 7, squareSize: 10, gap: 2 });
    formatCountdown.mockReturnValue(['01:02:03']);

    handleResize(state);

    expect(stopActivity).toHaveBeenCalledWith(state);
    expect(cancelCallbacks).toHaveBeenCalledWith(state.resourceTracker);
    expect(renderDigits).toHaveBeenCalledWith(expect.objectContaining({ cols: 5, rows: 5 }), ['01:02:03'], true);
    expect(startCountdownAmbient).toHaveBeenCalledWith(state);
  });

  it('should skip rebuild when dimensions are unchanged', () => {
    const state = createTimePageRendererState();
    const container = document.createElement('div');
    state.container = container;
    state.gridState = createGridStateStub(container, 6, 6);

    calculateGridDimensions.mockReturnValue({ cols: 6, rows: 6, squareSize: 10, gap: 2 });

    handleResize(state);

    expect(stopActivity).not.toHaveBeenCalled();
    expect(createGrid).not.toHaveBeenCalled();
  });
});

describe('setupRendererMount', () => {
  it('should mount grid, wire observer, and start periodic cleanup', () => {
    const state = createTimePageRendererState();
    const container = document.createElement('div');
    const getAnimationState = vi.fn(() => ({ shouldAnimate: true, prefersReducedMotion: false }));

    setupRendererMount(state, container, { getAnimationState });

    expect(state.container).toBe(container);
    expect(state.gridState).toBeTruthy();
    expect(state.container?.getAttribute('data-testid')).toBe('theme-container');
    expect(state.getAnimationState).toBe(getAnimationState);
    expect(state.resourceTracker.observers).toHaveLength(1);
    expect(startPeriodicCleanup).toHaveBeenCalledWith(state.gridState, state.resourceTracker);
    expect(state.periodicCleanupId).toBe(999);
  });
});
