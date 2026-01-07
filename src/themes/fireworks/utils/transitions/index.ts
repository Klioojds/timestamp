/**
 * Fireworks theme transition system.
 * 
 * @remarks
 * Provides lifecycle management (mount/unmount/reconnect) and celebration
 * state transitions (counting → celebrating → celebrated) for the fireworks theme.
 * All transitions coordinate canvas state, DOM updates, and animation intensity.
 * 
 * @public
 */

export {
  resetToCountdownDisplay,
  showStaticCelebration,
  triggerMaximumFireworks,
} from './celebration';
export {
  destroyFireworksCanvas,
  handleFireworksAnimationStateChange,
  reconnectFireworksCanvas,
  setupFireworksCanvas,
} from './lifecycle';
