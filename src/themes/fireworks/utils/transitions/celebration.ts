/**
 * Fireworks Celebration Triggers
 *
 * Celebration state transitions for the fireworks theme.
 * Handles visual and animation changes when countdown reaches completion.
 */

import { showCelebration, showCountdown } from '../dom';
import { updateFireworksIntensity } from '../fireworks';
import type { FireworksTimePageRendererState } from '../state';
import { isRendererReady } from '../state';

/**
 * Trigger maximum intensity fireworks when countdown reaches zero.
 * 
 * @param state - Renderer state
 * @param message - Celebration message
 * 
 * @remarks Called by orchestrator's onCelebrating lifecycle hook.
 */
export function triggerMaximumFireworks(
  state: FireworksTimePageRendererState,
  message: string
): void {
  if (!isRendererReady(state) || !state.countdownRefs) return;
  
  if (message) {
    showCelebration(state.countdownRefs, message);
  }
  
  // Trigger maximum intensity (0 seconds = peak fireworks)
  const { prefersReducedMotion } = state.getAnimationState();
  updateFireworksIntensity(state.fireworksState, 0, prefersReducedMotion);
}

/**
 * Show static celebration for timezones already past target time.
 * 
 * @param state - Renderer state
 * @param message - Celebration message
 * 
 * @remarks Called by orchestrator's onCelebrated lifecycle hook.
 */
export function showStaticCelebration(
  state: FireworksTimePageRendererState,
  message: string
): void {
  if (!isRendererReady(state) || !state.countdownRefs) return;
  
  if (message) {
    showCelebration(state.countdownRefs, message);
  }
  
  const { prefersReducedMotion } = state.getAnimationState();
  updateFireworksIntensity(state.fireworksState, 0, prefersReducedMotion);
}

/**
 * Reset from celebration to countdown display.
 * 
 * @param state - Renderer state
 * 
 * @remarks Called by orchestrator's onCounting lifecycle hook when switching timezones.
 */
export function resetToCountdownDisplay(
  state: FireworksTimePageRendererState
): void {
  if (!isRendererReady(state) || !state.countdownRefs) return;
  showCountdown(state.countdownRefs);
}
