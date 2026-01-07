/**
 * Fireworks Theme Entry Point
 *
 * @remarks
 * Canvas-based theme with dynamic fireworks that intensify as countdown approaches zero.
 * Features starry sky, city silhouette, and state-managed fireworks controller.
 *
 * @see {@link fireworksTimePageRenderer} for time page implementation
 * @see {@link fireworksLandingPageRenderer} for landing page implementation
 * @public
 */

import './styles.scss';

// Theme configuration
export { FIREWORKS_CONFIG } from './config';

// Renderer factories (for registry integration)
export { fireworksLandingPageRenderer } from './renderers/landing-page-renderer';
export { fireworksTimePageRenderer } from './renderers/time-page-renderer';

