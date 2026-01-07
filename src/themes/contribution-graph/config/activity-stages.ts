/**
 * Activity stage configuration using the core stage scheduler.
 *
 * Defines intensity stages that control ambient activity behavior
 * as the countdown progresses toward zero.
 */

import {
    createStageScheduler,
    type StageDefinition,
    type StageScheduler,
} from '@core/scheduling/stage-scheduler';

// =============================================================================
// TYPES
// =============================================================================

/** Activity phase names. */
export type ActivityPhase = 'calm' | 'building' | 'intense' | 'final';

/** Configuration values for each activity phase. */
export interface ActivityPhaseValues {
  /** Target ambient coverage in per-mille (‰). Example: 8 =\> 0.8%. */
  readonly coveragePerMille: number;
  /** % of active squares to replace per tick (0-1). */
  readonly turnoverRatio: number;
  /** Time between activity ticks in milliseconds. */
  readonly tickIntervalMs: number;
}

// =============================================================================
// PHASE TIMING (Shared by JS and CSS)
// =============================================================================

/** Base ambient animation duration in milliseconds (matches CSS 3.2s). */
export const AMBIENT_BASE_DURATION_MS = 3200;

/** Phase multipliers must stay in sync with CSS phase variables. */
export const PHASE_DURATION_MULTIPLIERS: Record<ActivityPhase, number> = {
  calm: 1.8,
  building: 1.3,
  intense: 1.0,
  final: 0.7,
};

/** Compute animation duration for phase (base duration × phase multiplier). */
export function getPhaseDurationMs(phase: ActivityPhase): number {
  return AMBIENT_BASE_DURATION_MS * (PHASE_DURATION_MULTIPLIERS[phase] ?? 1);
}

// =============================================================================
// STAGE DEFINITIONS
// =============================================================================

/**
 * Activity stages ordered from earliest to latest.
 *
 * Uses absolute time thresholds ('60s', '3600s') so the final minute
 * is always intense regardless of total countdown duration.
 * This creates a consistent user experience whether counting down
 * 5 minutes or 5 days.
 *
 * @remarks
 * The scheduler will interpolate progress within each stage automatically.
 * Stages are processed in order; first matching threshold wins.
 */
const ACTIVITY_STAGES: readonly StageDefinition<ActivityPhaseValues>[] = [
  {
    name: 'calm',
    at: '86400s',  // > 1 day remaining
    values: { coveragePerMille: 2, turnoverRatio: 0.05, tickIntervalMs: 800 },
  },
  {
    name: 'building',
    at: '3600s',   // > 1 hour remaining
    values: { coveragePerMille: 2, turnoverRatio: 0.15, tickIntervalMs: 600 },
  },
  {
    name: 'intense',
    at: '60s',     // > 1 minute remaining
    values: { coveragePerMille: 4, turnoverRatio: 0.2, tickIntervalMs: 500 },
  },
  {
    name: 'final',
    at: '0s',      // Final minute
    values: { coveragePerMille: 8, turnoverRatio: 0.25, tickIntervalMs: 400 },
  },
];

// =============================================================================
// SCHEDULER INSTANCE
// =============================================================================

/**
 * Reference duration for threshold calculations.
 * Since we use absolute thresholds (seconds), this just needs to be
 * large enough to contain all threshold values.
 */
const REFERENCE_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 1 week

/** Memoized activity stage scheduler. */
const activityScheduler: StageScheduler<ActivityPhaseValues> =
  createStageScheduler(ACTIVITY_STAGES);

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Get the current activity phase based on time remaining.
 *
 * Uses absolute time thresholds so the experience is consistent
 * regardless of total countdown duration.
 *
 * @param msRemaining - Milliseconds remaining in countdown
 * @returns Current activity phase name
 */
export function getActivityPhase(msRemaining: number): ActivityPhase {
  const snapshot = activityScheduler.getStage(msRemaining, REFERENCE_DURATION_MS);
  return snapshot.name as ActivityPhase;
}

/**
 * Get the configuration for the current activity phase.
 *
 * @param msRemaining - Milliseconds remaining in countdown
 * @returns Phase configuration values
 */
export function getPhaseConfig(msRemaining: number): ActivityPhaseValues {
  const snapshot = activityScheduler.getStage(msRemaining, REFERENCE_DURATION_MS);
  return snapshot.values;
}

/**
 * Get configuration for a named phase.
 *
 * @param phase - Phase name
 * @returns Phase configuration values
 * @throws Error if phase is unknown
 */
export function getPhaseConfigByName(phase: ActivityPhase): ActivityPhaseValues {
  const stage = ACTIVITY_STAGES.find(s => s.name === phase);
  if (!stage) {
    throw new Error(`Unknown activity phase: ${phase}`);
  }
  return stage.values;
}

/**
 * Get the full stage snapshot including progress within current stage.
 *
 * @param msRemaining - Milliseconds remaining in countdown
 * @returns Full stage snapshot with progress information
 */
export function getActivityStageSnapshot(msRemaining: number) {
  return activityScheduler.getStage(msRemaining, REFERENCE_DURATION_MS);
}

/** Clear stage scheduler cache (rarely needed with fixed reference duration). */
export function clearActivityStageCache(): void {
  activityScheduler.clearCache();
}

