/**
 * Fireworks Animation System
 *
 * Manages the fireworks-js library integration for countdown visual effects.
 * Provides intensity scaling, lifecycle management, and configuration options.
 *
 * @remarks
 * This module encapsulates all fireworks-js interactions. The system
 * automatically scales fireworks intensity based on time remaining:
 * - \>12h: Stars only (no fireworks)
 * - \<1h: Occasional bursts
 * - \<1m: Continuous fireworks
 * - \<5s: Maximum intensity for finale
 *
 * @see {@link https://fireworks-js.org/} - Upstream fireworks-js library
 */

export {
    createFireworksState,
    destroyFireworks, type FireworksState,
recreateFireworksAfterContainerUpdate,
    startFireworks,
    stopFireworks,
    updateFireworksIntensity} from './controller';
export { getIntensityConfig, getIntensityLevel } from './intensity';
export { getFireworksOptions } from './options';

