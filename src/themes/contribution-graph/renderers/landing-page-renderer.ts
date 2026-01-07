/**
 * Contribution Graph Theme - Landing Page Renderer
 *
 * GitHub contribution graph style animated background for the landing page.
 * State and utilities live in utils/ui/state/landing-renderer-state.ts.
 */

import type { AnimationStateContext, LandingPageRenderer, MountContext } from '@core/types';

import {
  createLandingRendererState,
  destroyLandingRenderer,
  getLandingElementCount,
  handleLandingAnimationStateChange,
  handleLandingResize,
  setupLandingMount,
  startLandingAmbient,
} from '../utils/ui/state';

/** Create a Contribution Graph landing page renderer. */
export function contributionGraphLandingPageRenderer(_container: HTMLElement): LandingPageRenderer {
  const state = createLandingRendererState();

  return {
    mount(container: HTMLElement, context?: MountContext): void {
      setupLandingMount(state, container, context);
      startLandingAmbient(state);
    },

    setSize(_width: number, _height: number): void {
      handleLandingResize(state);
    },

    onAnimationStateChange(context: AnimationStateContext): void {
      handleLandingAnimationStateChange(state, context);
    },

    destroy(): void {
      destroyLandingRenderer(state);
    },

    getElementCount(): { total: number; animated: number } {
      return getLandingElementCount(state);
    },
  };
}
