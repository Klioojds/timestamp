/**
 * Landing page renderer state for fireworks theme.
 *
 * @remarks
 * Manages starfield container and star elements for landing page background.
 * Extends {@link BaseFireworksRendererState} with landing page-specific fields.
 * Simpler than time page state - no canvas or resize observers needed.
 *
 * @public
 */

import {
  type BaseFireworksRendererState,
  createBaseRendererState,
} from './base-renderer-state';

/**
 * Complete state for landing page starfield renderer.
 *
 * @remarks
 * Extends {@link BaseFireworksRendererState} with starfield container and star elements.
 * Simpler than {@link FireworksTimePageRendererState} - no canvas or observers.
 */
export interface FireworksLandingPageRendererState extends BaseFireworksRendererState {
  /** Starfield container (null until mount(), non-null while active). */
  starfield: HTMLElement | null;
  /** Generated star elements (empty until mount(), cleared on destroy()). */
  stars: HTMLElement[];
}

/** Creates initial landing page renderer state (starfield null, stars empty). */
export function createLandingRendererState(): FireworksLandingPageRendererState {
  return {
    ...createBaseRendererState(),
    starfield: null,
    stars: [],
  };
}

/**
 * Type guard for landing page DOM-ready state (starfield non-null).
 *
 * @param state - State to check
 * @returns True if starfield mounted
 */
export function isLandingRendererReady(
  state: FireworksLandingPageRendererState
): boolean {
  return !state.isDestroyed && state.starfield !== null;
}

/**
 * Calculates element counts for performance monitoring.
 *
 * @remarks
 * Checks starfield pause state to determine animated element count.
 * Used by perf tools to track DOM overhead.
 *
 * @param state - Landing page state
 * @returns Total and animated element counts
 */
export function getLandingElementCount(
  state: FireworksLandingPageRendererState
): { total: number; animated: number } {
  const isPaused = state.starfield?.classList.contains('is-paused') ?? false;
  return {
    total: state.stars.length,
    animated: isPaused ? 0 : state.stars.length,
  };
}
