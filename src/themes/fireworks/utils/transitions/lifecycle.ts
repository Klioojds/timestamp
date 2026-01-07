/**
 * Fireworks Time Page Lifecycle
 *
 * Mount, destroy, and resize orchestration for the fireworks time page.
 * Coordinates DOM building, canvas setup, and resource cleanup.
 */

import type { AnimationStateContext, MountContext } from '@core/types';
import { cancelAll, DEFAULT_ANIMATION_STATE } from '@themes/shared';

import { buildThemeDOM, type CountdownDOMRefs } from '../dom';
import {
  destroyFireworks,
  recreateFireworksAfterContainerUpdate,
} from '../fireworks';
import type { FireworksTimePageRendererState } from '../state';
import {
  isCanvasReady,
  resetRendererState,
} from '../state';

/**
 * Mount fireworks canvas with DOM and responsive resize handling.
 * 
 * @param state - Renderer state to configure
 * @param containerEl - Container element to mount into
 * @param context - Mount context with animation state getter
 */
export function setupFireworksCanvas(
  state: FireworksTimePageRendererState,
  containerEl: HTMLElement,
  context?: MountContext
): void {
  state.container = containerEl;
  state.getAnimationState = context?.getAnimationState ?? (() => DEFAULT_ANIMATION_STATE);

  const elements = buildThemeDOM(containerEl);
  state.themeRoot = elements.root;
  state.fireworksState.canvas = elements.canvas;

  // PERF: Cache countdown DOM refs to avoid querySelector calls on every tick
  const separators = elements.countdown.querySelectorAll('.separator');
  state.countdownRefs = createCountdownRefs(elements, separators);

  // NOTE: Starts ResizeObserver for responsive canvas sizing
  setupCanvasResize(state);

  const { shouldAnimate } = state.getAnimationState();
  if (!shouldAnimate) {
    destroyFireworks(state.fireworksState);
  }
}

/**
 * Create countdown DOM refs from theme elements.
 * @internal
 */
function createCountdownRefs(
  elements: ReturnType<typeof buildThemeDOM>,
  separators: NodeListOf<Element>
): CountdownDOMRefs {
  return {
    daysUnit: elements.daysUnit,
    hoursUnit: elements.hoursUnit,
    minsValue: elements.minutesUnit.querySelector('.value') as HTMLElement,
    secsValue: elements.secondsUnit.querySelector('.value') as HTMLElement,
    daysSep: separators[0] as HTMLElement,
    hoursSep: separators[1] as HTMLElement,
    countdownEl: elements.countdown,
    celebrationEl: elements.celebration,
  };
}

/**
 * Reconnect canvas after theme transition container swap.
 * 
 * @param state - Renderer state
 * @param newContainer - New container element
 * 
 * @remarks Recreates fireworks instance with updated canvas reference.
 */
export function reconnectFireworksCanvas(
  state: FireworksTimePageRendererState,
  newContainer: HTMLElement
): void {
  state.container = newContainer;
  const newCanvas = newContainer.querySelector('.fireworks-canvas') as HTMLCanvasElement;
  recreateFireworksAfterContainerUpdate(state.fireworksState, newCanvas);
}

/**
 * Destroy fireworks canvas and clean up all resources.
 * 
 * @param state - Renderer state
 * 
 * @remarks Stops animations, clears observers, empties DOM, and resets state.
 */
export function destroyFireworksCanvas(
  state: FireworksTimePageRendererState
): void {
  destroyFireworks(state.fireworksState);
  cancelAll(state.resourceTracker);
  
  if (state.resizeRafId !== null) {
    cancelAnimationFrame(state.resizeRafId);
  }
  
  if (state.container) {
    state.container.innerHTML = '';
  }
  
  resetRendererState(state);
}

/**
 * Handle animation state changes from orchestrator.
 * 
 * @param state - Renderer state
 * @param context - Animation state (shouldAnimate, prefersReducedMotion, etc.)
 * 
 * @remarks Stops fireworks when animations disabled (reduced motion or tab hidden).
 */
export function handleFireworksAnimationStateChange(
  state: FireworksTimePageRendererState,
  context: AnimationStateContext
): void {
  const { shouldAnimate, prefersReducedMotion } = context;
  // NOTE: Destroy fireworks instance when animations should stop
  if (!shouldAnimate || prefersReducedMotion) {
    destroyFireworks(state.fireworksState);
  }
}

/**
 * Set up canvas ResizeObserver with RAF debouncing.
 * 
 * @param state - Renderer state
 * 
 * @remarks Prevents layout thrashing by batching resize updates in RAF.
 * @internal
 */
function setupCanvasResize(state: FireworksTimePageRendererState): void {
  if (!isCanvasReady(state)) return;

  const resizeCanvas = (width: number, height: number): void => {
    const canvas = state.fireworksState.canvas;
    if (!canvas) return;

    // NOTE: Use max() to handle mobile viewport vs container size edge cases
    const widthPx = Math.max(width, window.innerWidth);
    const heightPx = Math.max(height, window.innerHeight);
    const dpr = window.devicePixelRatio || 1;
    const renderWidth = Math.max(1, Math.round(widthPx * dpr));
    const renderHeight = Math.max(1, Math.round(heightPx * dpr));

    // PERF: Skip redundant resize operations
    if (renderWidth === state.lastCanvasWidth && renderHeight === state.lastCanvasHeight) return;

    state.lastCanvasWidth = renderWidth;
    state.lastCanvasHeight = renderHeight;
    canvas.width = renderWidth;
    canvas.height = renderHeight;
    canvas.style.width = `${widthPx}px`;
    canvas.style.height = `${heightPx}px`;

    state.fireworksState.fireworks?.updateSize({ width: widthPx, height: heightPx });
  };

  state.resizeObserver = new ResizeObserver((entries) => {
    const entry = entries[0];
    // PERF: RAF debouncing - ignore if already scheduled
    if (!entry || state.resizeRafId !== null) return;

    state.resizeRafId = requestAnimationFrame(() => {
      state.resizeRafId = null;
      resizeCanvas(entry.contentRect.width, entry.contentRect.height);
    });
  });

  state.resizeObserver.observe(state.themeRoot!);
  state.resourceTracker.observers.push(state.resizeObserver);
}
