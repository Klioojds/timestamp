/**
 * Fireworks Theme Landing Page Renderer
 *
 * Night sky with twinkling stars that pause when orchestrator says so.
 */

import type { AnimationStateContext, LandingPageRenderer, MountContext } from '@core/types';
import { DEFAULT_ANIMATION_STATE } from '@themes/shared';

import {
  buildStarfield,
  pauseStarAnimations,
  resumeStarAnimations,
} from '../utils/dom';
import {
  createLandingRendererState,
  getLandingElementCount,
} from '../utils/state';

/**
 * Creates a Fireworks landing page renderer with animated starfield.
 *
 * @remarks
 * Renders twinkling stars that pause/resume based on animation state from orchestrator.
 * Uses landing-renderer-state module for clean state management.
 *
 * @param _container - Container element (reserved for future use)
 * @returns LandingPageRenderer instance with animation control
 *
 * @public
 */
export function fireworksLandingPageRenderer(_container: HTMLElement): LandingPageRenderer {
  const state = createLandingRendererState();

  return {
    mount(targetContainer: HTMLElement, context?: MountContext): void {
      if (state.isDestroyed || state.starfield) return;

      state.getAnimationState = context?.getAnimationState ?? (() => DEFAULT_ANIMATION_STATE);

      const { shouldAnimate, prefersReducedMotion } = state.getAnimationState();
      const { starfield, stars } = buildStarfield(
        targetContainer,
        shouldAnimate && !prefersReducedMotion
      );

      state.starfield = starfield;
      state.stars = stars;
    },

    setSize(_width: number, _height: number): void {
      // Stars use percentage positioning, no resize handling needed
    },

    onAnimationStateChange(context: AnimationStateContext): void {
      if (!state.starfield) return;

      const { shouldAnimate, prefersReducedMotion } = context;
      if (shouldAnimate && !prefersReducedMotion) {
        resumeStarAnimations(state.starfield, state.stars);
      } else {
        pauseStarAnimations(state.starfield, state.stars);
      }
    },

    destroy(): void {
      state.isDestroyed = true;
      if (state.starfield) {
        state.starfield.remove();
        state.starfield = null;
      }
      state.stars = [];
    },

    getElementCount(): { total: number; animated: number } {
      return getLandingElementCount(state);
    },
  };
}
