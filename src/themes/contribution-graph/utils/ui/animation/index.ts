/**
 * Animation utilities barrel export.
 *
 * Activity loop management, ambient activity, state transition helpers,
 * and wall build animation for the contribution-graph theme.
 */

export {
  type ActivityLoopState,
  createActivityLoopState,
  scheduleActivityTick,
} from './activity-loop';
export { activityTick, clearAmbientActivity } from './ambient-activity';
export {
  abortCelebrationAnimation,
  type CelebrationController,
  clearAmbientTransitions,
  clearCelebrationVisuals,
  createCelebrationAbortSignal,
  createCelebrationController,
  destroyRendererState,
  executeAnimatedCelebration,
  handleRendererAnimationStateChange,
  prepareCelebration,
  type RendererState,
  resetToCounting,
  showCompletionMessageWithAmbient,
  startActivity,
  startCelebrationAmbient,
  startCountdownAmbient,
  stopActivity,
  updateAmbientSquaresForCelebration,
} from './state-transitions';
export { buildWall, clearWall,unbuildWall } from './wall-build';
