/**
 * Landing page renderer state and lifecycle management.
 *
 * Extends base renderer state with landing page-specific functionality:
 * - Exclusion zone for landing card
 * - Document height calculation for full-page coverage
 * - Simplified lifecycle (no celebration, no resize throttling)
 */

import type { AnimationStateContext, MountContext } from '@core/types';
import { cancelAll } from '@themes/shared';

import {
  handleRendererAnimationStateChange,
  startActivity,
  stopActivity,
} from '../animation';
import { calculateExclusionZone, createGrid, type GridLayoutParams } from '../grid-builder';
import {
  type BaseRendererState,
  createBaseRendererState,
  isRendererReady,
} from './base-renderer-state';

/**
 * Landing page renderer state.
 * Extends base state with landing page-specific fields.
 */
export interface LandingPageRendererState extends BaseRendererState {
  /** Element to exclude from ambient animations (e.g., landing page card). */
  exclusionElement: HTMLElement | null;
  /** Flag to prevent operations after destroy. */
  isDestroyed: boolean;
  /** Periodic cleanup timer ID (unused for landing page but required by base). */
  periodicCleanupId: number | null;
}

/**
 * Create initial landing page renderer state.
 *
 * @returns Fresh landing page renderer state
 * @internal
 */
export function createLandingRendererState(): LandingPageRendererState {
  return {
    ...createBaseRendererState(),
    exclusionElement: null,
    isDestroyed: false,
    periodicCleanupId: null, // Not used for landing page
  };
}

/**
 * Check if landing renderer is ready for operations.
 * Adds destroyed check to base readiness check.
 *
 * @param state - Landing page renderer state
 * @returns true if renderer is ready and not destroyed
 */
function isLandingReady(state: LandingPageRendererState): boolean {
  return !state.isDestroyed && isRendererReady(state);
}

/**
 * Calculate document height for full-page grid coverage.
 *
 * @param container - Container element
 * @returns Maximum height across document and container
 */
function getDocumentHeight(container: HTMLElement): number {
  // NOTE: Use max() because different browsers report scroll height differently
  return Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
    container.scrollHeight || 0
  );
}

/**
 * Calculate and apply exclusion zone to avoid animating behind landing card.
 *
 * @param state - Landing page renderer state
 */
function applyExclusionZone(state: LandingPageRendererState): void {
  // NOTE: Exclusion zone prevents ambient squares from animating under the card (distracting)
  if (!state.gridState || !state.exclusionElement) {
    if (state.gridState) state.gridState.exclusionZone = null;
    return;
  }

  const grid = state.gridState.grid;
  const squareSize = parseFloat(grid.style.getPropertyValue('--contribution-graph-square-size')) || 0;
  const gap = parseFloat(grid.style.getPropertyValue('--contribution-graph-gap')) || 0;

  if (squareSize === 0) {
    state.gridState.exclusionZone = null;
    return;
  }

  const layoutParams: GridLayoutParams = {
    squareSize,
    gap,
    cols: state.gridState.cols,
    rows: state.gridState.rows,
    gridRect: grid.getBoundingClientRect(),
  };

  state.gridState.exclusionZone = calculateExclusionZone(state.exclusionElement, layoutParams);
}

/**
 * Setup renderer mount (container, grid, exclusion zone).
 *
 * @param state - Landing page renderer state
 * @param container - Container element to mount into
 * @param context - Optional mount context with animation state and exclusion element
 * @internal
 */
export function setupLandingMount(
  state: LandingPageRendererState,
  container: HTMLElement,
  context?: MountContext
): void {
  if (state.isDestroyed || state.gridState) return;

  state.container = container;
  container.replaceChildren();
  container.classList.add('landing-theme-background--contribution-graph');
  container.setAttribute('aria-hidden', 'true');

  if (context?.getAnimationState) state.getAnimationState = context.getAnimationState;
  if (context?.exclusionElement) state.exclusionElement = context.exclusionElement;

  const containerWidth = container.scrollWidth || container.clientWidth || window.innerWidth;
  state.gridState = createGrid(container, {
    containerWidth,
    containerHeight: getDocumentHeight(container),
    testId: 'landing-grid',
  });

  applyExclusionZone(state);
}

/**
 * Start ambient activity for landing page.
 *
 * @param state - Landing page renderer state
 * @internal
 */
export function startLandingAmbient(state: LandingPageRendererState): void {
  if (!isLandingReady(state)) return;
  startActivity(state);
}

/**
 * Handle viewport resize - rebuild grid and restart activity.
 *
 * @param state - Landing page renderer state
 * @internal
 */
export function handleLandingResize(state: LandingPageRendererState): void {
  if (!isLandingReady(state)) return;

  stopActivity(state);

  state.container!.querySelector('.contribution-graph-grid')?.remove();
  const containerWidth = state.container!.scrollWidth || state.container!.clientWidth || window.innerWidth;
  state.gridState = createGrid(state.container!, {
    containerWidth,
    containerHeight: getDocumentHeight(state.container!),
    testId: 'landing-grid',
  });

  applyExclusionZone(state);
  startLandingAmbient(state);
}

/**
 * Handle animation state change for landing page.
 * Re-exports shared handler with landing-specific naming.
 *
 * @param state - Landing page renderer state
 * @param context - Animation state context
 * @internal
 */
export function handleLandingAnimationStateChange(
  state: LandingPageRendererState,
  context: AnimationStateContext
): void {
  handleRendererAnimationStateChange(state, context);
}

/**
 * Destroy renderer state and cleanup all resources.
 *
 * @param state - Landing page renderer state
 * @internal
 */
export function destroyLandingRenderer(state: LandingPageRendererState): void {
  state.isDestroyed = true;

  if (state.gridState) {
    stopActivity(state);
  }

  cancelAll(state.resourceTracker);

  if (state.container) {
    state.container.classList.remove('landing-theme-background--contribution-graph');
    state.container.replaceChildren();
    state.container = null;
  }
  state.gridState = null;
}

/**
 * Get element counts for performance testing.
 *
 * @param state - Landing page renderer state
 * @returns Object with total and animated element counts
 * @internal
 */
export function getLandingElementCount(state: LandingPageRendererState): { total: number; animated: number } {
  return {
    total: state.gridState?.squares.length ?? 0,
    animated: state.gridState?.activeAmbient.size ?? 0,
  };
}
