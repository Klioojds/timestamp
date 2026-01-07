/**
 * Time page renderer state for fireworks theme.
 *
 * @remarks
 * Manages countdown display state including canvas, resize observers, and cleanup handles.
 * Extends {@link BaseFireworksRendererState} with time page-specific fields.
 * Uses type guards ({@link isRendererReady}, {@link isCanvasReady}) for safe DOM access.
 *
 * @public
 */

import { createResourceTracker, DEFAULT_ANIMATION_STATE } from '@themes/shared';
import type { ResourceTracker } from '@themes/shared/types';

import { IntensityLevel } from '../../types';
import type { CountdownDOMRefs } from '../dom';
import { createFireworksState, type FireworksState } from '../fireworks';
import {
  type BaseFireworksRendererState,
  createBaseRendererState,
} from './base-renderer-state';

/**
 * Complete state for time page countdown renderer.
 *
 * @remarks
 * Extends {@link BaseFireworksRendererState} with canvas, fireworks state, resize tracking,
 * and cleanup handles. Use type guards before accessing nullable DOM references.
 */
export interface FireworksTimePageRendererState extends BaseFireworksRendererState {
  /** Main container (null until mount(), non-null while active, null after destroy()). */
  container: HTMLElement | null;
  /** Celebration message from countdown config. */
  completionMessage: string;
  /** Canvas state, particles, and intensity level. */
  fireworksState: FireworksState;
  /** Cached countdown DOM refs (null until mount(), non-null while active). */
  countdownRefs: CountdownDOMRefs | null;
  /** Tracks container size changes for canvas resize (null after cleanup). */
  resizeObserver: ResizeObserver | null;
  /** RAF handle for debounced resize (null when not pending). */
  resizeRafId: number | null;
  /** Previous canvas width, prevents unnecessary resize operations. */
  lastCanvasWidth: number;
  /** Previous canvas height, prevents unnecessary resize operations. */
  lastCanvasHeight: number;
  /** Theme root element for safe area measurement (null until mount()). */
  themeRoot: HTMLElement | null;
  /** Centralized cleanup tracking (intervals, observers, timers). */
  resourceTracker: ResourceTracker;
}

/**
 * Type-narrowed state after mount() succeeds.
 *
 * @remarks
 * Guarantees container and themeRoot are non-null. Use {@link isRendererReady} to narrow types.
 */
export interface ReadyRendererState extends FireworksTimePageRendererState {
  container: HTMLElement;
  themeRoot: HTMLElement;
}

/**
 * Type-narrowed state when canvas is available for rendering.
 *
 * @remarks
 * Guarantees fireworksState.canvas is non-null. Use {@link isCanvasReady} to narrow types.
 */
export interface CanvasReadyState extends ReadyRendererState {
  fireworksState: FireworksState & { canvas: HTMLCanvasElement };
}

/** Creates initial time page renderer state (all refs null, ready for mount). */
export function createRendererState(): FireworksTimePageRendererState {
  return {
    ...createBaseRendererState(),
    container: null,
    completionMessage: '',
    fireworksState: createFireworksState(),
    countdownRefs: null,
    resizeObserver: null,
    resizeRafId: null,
    lastCanvasWidth: 0,
    lastCanvasHeight: 0,
    themeRoot: null,
    resourceTracker: createResourceTracker(),
  };
}

/**
 * Type guard for DOM-ready state (container + themeRoot non-null).
 *
 * @param state - State to check
 * @returns True if ready, narrows to {@link ReadyRendererState}
 */
export function isRendererReady(
  state: FireworksTimePageRendererState
): state is ReadyRendererState {
  return !state.isDestroyed && state.container !== null && state.themeRoot !== null;
}

/**
 * Type guard for canvas-ready state (canvas non-null).
 *
 * @param state - State to check
 * @returns True if canvas available, narrows to {@link CanvasReadyState}
 */
export function isCanvasReady(
  state: FireworksTimePageRendererState
): state is CanvasReadyState {
  return isRendererReady(state) && state.fireworksState.canvas !== null;
}

/**
 * Resets renderer state to initial values during cleanup.
 *
 * @remarks
 * MUTATES state in place. Called after cleanup handlers run to prevent memory leaks.
 * Sets all DOM refs to null, resets flags to defaults.
 *
 * @param state - State to reset (mutated)
 */
export function resetRendererState(state: FireworksTimePageRendererState): void {
  state.container = null;
  state.completionMessage = '';
  state.getAnimationState = () => DEFAULT_ANIMATION_STATE;
  state.isDestroyed = false;
  state.countdownRefs = null;
  state.resizeObserver = null;
  state.resizeRafId = null;
  state.lastCanvasWidth = 0;
  state.lastCanvasHeight = 0;
  state.themeRoot = null;
  state.fireworksState.currentLevel = IntensityLevel.STARS_ONLY;
  state.fireworksState.isRunning = false;
}
