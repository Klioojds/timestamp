/**
 * Fireworks theme state management module.
 *
 * @remarks
 * Provides state types, factories, and type guards for fireworks renderers.
 * Uses inheritance pattern: BaseFireworksRendererState → TimePageRendererState/LandingPageRendererState.
 * State modules are pure - no lifecycle orchestration or DOM manipulation.
 *
 * @public
 */

// Base renderer state
export {
  type BaseFireworksRendererState,
  createBaseRendererState,
} from './base-renderer-state';

// Time page renderer state
export {
  type CanvasReadyState,
  createRendererState,
  type FireworksTimePageRendererState,
  isCanvasReady,
  isRendererReady,
  type ReadyRendererState,
  resetRendererState,
} from './time-renderer-state';

// Landing page renderer state
export {
  createLandingRendererState,
  type FireworksLandingPageRendererState,
  getLandingElementCount,
  isLandingRendererReady,
} from './landing-renderer-state';
