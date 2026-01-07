/**
 * Fireworks Time Page Renderer
 *
 * Canvas-based fireworks that intensify as countdown approaches zero.
 */

import type { CelebrationOptions } from '@core/types';
import { shouldEnableAnimations } from '@themes/shared';
import type {
  AnimationStateContext,
  MountContext,
  ResourceTracker,
  TimePageRenderer,
  TimeRemaining,
} from '@themes/shared/types';

import { updateCountdown } from '../utils/dom';
import { updateFireworksIntensity } from '../utils/fireworks';
import {
  createRendererState,
  isRendererReady,
} from '../utils/state';
import {
  destroyFireworksCanvas,
  handleFireworksAnimationStateChange,
  reconnectFireworksCanvas,
  resetToCountdownDisplay,
  setupFireworksCanvas,
  showStaticCelebration,
  triggerMaximumFireworks,
} from '../utils/transitions';

/**
 * Creates a Fireworks time page renderer with state-managed canvas animations.
 *
 * @remarks
 * Uses modular state pattern (base-renderer-state, time-renderer-state) and
 * transition system (celebration.ts, lifecycle.ts) for clean lifecycle management.
 * Fireworks intensity scales based on time remaining via intensity controller.
 *
 * @param _targetDate - Target date for countdown (reserved for future use)
 * @returns TimePageRenderer instance with full lifecycle hooks
 *
 * @public
 */
export function fireworksTimePageRenderer(_targetDate: Date): TimePageRenderer {
  const state = createRendererState();

  return {
    mount(containerEl: HTMLElement, context?: MountContext): void {
      setupFireworksCanvas(state, containerEl, context);
    },

    updateContainer(newContainer: HTMLElement): void {
      reconnectFireworksCanvas(state, newContainer);
    },

    async destroy(): Promise<void> {
      destroyFireworksCanvas(state);
    },

    updateTime(time: TimeRemaining): void {
      if (!isRendererReady(state) || !state.countdownRefs) return;

      updateCountdown(state.countdownRefs, time.days, time.hours, time.minutes, time.seconds);

      if (shouldEnableAnimations(state.getAnimationState)) {
        const totalSeconds = Math.floor(time.total / 1000);
        const { prefersReducedMotion } = state.getAnimationState();
        updateFireworksIntensity(state.fireworksState, totalSeconds, prefersReducedMotion);
      }
    },

    onAnimationStateChange(context: AnimationStateContext): void {
      handleFireworksAnimationStateChange(state, context);
    },

    onCounting(): void {
      resetToCountdownDisplay(state);
    },

    onCelebrating(options?: CelebrationOptions): void {
      const message = options?.message?.forTextContent ?? options?.fullMessage ?? '';
      triggerMaximumFireworks(state, message);
    },

    onCelebrated(options?: CelebrationOptions): void {
      const message = options?.message?.forTextContent ?? options?.fullMessage ?? '';
      showStaticCelebration(state, message);
    },

    getResourceTracker(): ResourceTracker {
      return { ...state.resourceTracker };
    },
  };
}
