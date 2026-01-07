import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createLandingRendererState,
  destroyLandingRenderer,
  getLandingElementCount,
  handleLandingAnimationStateChange,
  handleLandingResize,
  setupLandingMount,
  startLandingAmbient,
} from './landing-renderer-state';

const startActivity = vi.fn();
const stopActivity = vi.fn();
const handleRendererAnimationStateChange = vi.fn();
const cancelAll = vi.fn();
const calculateExclusionZone = vi.fn(() => ({ minCol: 0, maxCol: 1, minRow: 0, maxRow: 1 }));
const createActivityLoopState = vi.fn(() => ({
  currentPhase: 'calm',
  isActivityRunning: false,
  activityTimeoutId: null,
}));
const createResourceTracker = vi.fn(() => ({
  intervals: [],
  timeouts: [],
  rafs: [],
  observers: [],
  listeners: [],
}));

const createGrid = vi.fn((container?: HTMLElement) => {
  const grid = document.createElement('div');
  grid.classList.add('contribution-graph-grid');
  grid.style.setProperty('--contribution-graph-square-size', '10');
  grid.style.setProperty('--contribution-graph-gap', '2');
  grid.getBoundingClientRect = () => ({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    top: 0,
    left: 0,
    right: 100,
    bottom: 100,
    toJSON: () => ({}),
  });

  const gridState = {
    grid,
    squares: [],
    cols: 5,
    rows: 5,
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
});

vi.mock('../grid-builder', () => ({
  createGrid: (...args: unknown[]) => createGrid(...args),
  calculateExclusionZone: (...args: unknown[]) => calculateExclusionZone(...args),
}));

vi.mock('../animation', () => ({
  createActivityLoopState: (...args: unknown[]) => createActivityLoopState(...args),
  startActivity: (...args: unknown[]) => startActivity(...args),
  stopActivity: (...args: unknown[]) => stopActivity(...args),
  handleRendererAnimationStateChange: (...args: unknown[]) => handleRendererAnimationStateChange(...args),
}));

vi.mock('@themes/shared', () => ({
  createResourceTracker: (...args: unknown[]) => createResourceTracker(...args),
  cancelAll: (...args: unknown[]) => cancelAll(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createLandingRendererState', () => {
  it('should initialize landing state with defaults', () => {
    const state = createLandingRendererState();
    expect(state.container).toBeNull();
    expect(state.gridState).toBeNull();
    expect(state.exclusionElement).toBeNull();
    expect(state.isDestroyed).toBe(false);
  });
});

describe('setupLandingMount', () => {
  it('should mount grid, set attributes, and apply exclusion zone', () => {
    const state = createLandingRendererState();
    const container = document.createElement('div');
    Object.defineProperty(container, 'scrollWidth', { value: 200, configurable: true });
    const exclusionElement = document.createElement('div');

    const getAnimationState = vi.fn(() => ({ shouldAnimate: true, prefersReducedMotion: false }));

    setupLandingMount(state, container, { getAnimationState, exclusionElement });

    expect(state.container).toBe(container);
    expect(container.classList.contains('landing-theme-background--contribution-graph')).toBe(true);
    expect(container.getAttribute('aria-hidden')).toBe('true');
    expect(state.getAnimationState).toBe(getAnimationState);
    expect(state.exclusionElement).toBe(exclusionElement);
    expect(state.gridState?.exclusionZone).toEqual({ minCol: 0, maxCol: 1, minRow: 0, maxRow: 1 });
    expect(createGrid).toHaveBeenCalled();
  });
});

describe('startLandingAmbient', () => {
  it('should start activity when renderer is ready', () => {
    const state = createLandingRendererState();
    state.container = document.createElement('div');
    state.gridState = createGrid();

    startLandingAmbient(state);
    expect(startActivity).toHaveBeenCalledWith(state);
  });

  it('should not start when destroyed', () => {
    const state = createLandingRendererState();
    state.isDestroyed = true;
    state.container = document.createElement('div');
    state.gridState = createGrid();

    startLandingAmbient(state);
    expect(startActivity).not.toHaveBeenCalled();
  });
});

describe('handleLandingResize', () => {
  it('should rebuild grid and restart activity', () => {
    const state = createLandingRendererState();
    const container = document.createElement('div');
    state.container = container;
    state.gridState = createGrid(container);

    handleLandingResize(state);

    expect(stopActivity).toHaveBeenCalledWith(state);
    expect(createGrid).toHaveBeenCalledTimes(2);
    expect(startActivity).toHaveBeenCalledWith(state);
  });
});

describe('handleLandingAnimationStateChange', () => {
  it('should proxy animation state change to shared handler', () => {
    const state = createLandingRendererState();
    const context = { shouldAnimate: false, prefersReducedMotion: true } as const;

    handleLandingAnimationStateChange(state, context);
    expect(handleRendererAnimationStateChange).toHaveBeenCalledWith(state, context);
  });
});

describe('destroyLandingRenderer', () => {
  it('should stop activity, reset handles, and clear container', () => {
    const state = createLandingRendererState();
    const container = document.createElement('div');
    container.classList.add('landing-theme-background--contribution-graph');
    container.appendChild(document.createElement('span'));
    state.container = container;
    state.gridState = createGrid();

    destroyLandingRenderer(state);

    expect(state.isDestroyed).toBe(true);
    expect(stopActivity).toHaveBeenCalledWith(state);
    expect(cancelAll).toHaveBeenCalledWith(state.resourceTracker);
    expect(container.classList.contains('landing-theme-background--contribution-graph')).toBe(false);
    expect(container.childElementCount).toBe(0);
    expect(state.gridState).toBeNull();
    expect(state.container).toBeNull();
  });
});

describe('getLandingElementCount', () => {
  it('should return total and animated counts', () => {
    const state = createLandingRendererState();
    const gridState = createGrid();
    gridState.squares.push({}, {} as never); // mimic filled squares
    gridState.activeAmbient.add({} as never);
    state.gridState = gridState;

    expect(getLandingElementCount(state)).toEqual({ total: 2, animated: 1 });
  });
});
