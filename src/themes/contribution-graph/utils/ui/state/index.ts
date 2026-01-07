/**
 * State management barrel export.
 *
 * Exports base renderer state utilities and specific renderer states
 * for time page and landing page.
 */

// Base renderer state
export {
  type BaseRendererState,
  createBaseRendererState,
  isRendererReady,
  updateRendererContainer,
} from './base-renderer-state';

// Time page renderer state
export {
  createTimePageRendererState,
  handleResize,
  setupRendererMount,
  type TimePageRendererState,
  updateActivityPhase,
  updateRendererContainer as updateTimeRendererContainer,
} from './time-renderer-state';

// Landing page renderer state
export {
  createLandingRendererState,
  destroyLandingRenderer,
  getLandingElementCount,
  handleLandingAnimationStateChange,
  handleLandingResize,
  type LandingPageRendererState,
  setupLandingMount,
  startLandingAmbient,
} from './landing-renderer-state';
