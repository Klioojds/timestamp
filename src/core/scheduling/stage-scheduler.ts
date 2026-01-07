/**
 * Stage scheduling utilities for countdown intensity animations.
 * Generic factory for creating stage schedulers with percentage or absolute time thresholds.
 * @packageDocumentation
 */

/** Threshold formats: '50%' (percentage of duration) or '60s' (absolute seconds) */
export type StageThreshold = `${number}%` | `${number}s`;

/** Configuration for a single intensity stage. */
export interface StageDefinition<T = Record<string, unknown>> {
  /** Unique identifier for this stage */
  readonly name: string;
  /** When this stage activates (e.g., '50%' or '60s') */
  readonly at: StageThreshold;
  /** Stage-specific configuration values */
  readonly values: T;
}

/** Result of a stage lookup at a specific time. */
export interface StageSnapshot<T = Record<string, unknown>> {
  /** Current stage name */
  readonly name: string;
  /** Stage-specific values */
  readonly values: T;
  /** Progress within current stage (0-1, for interpolation) */
  readonly progress: number;
  /** Index of current stage in the sorted stages array */
  readonly stageIndex: number;
}

/** A stage scheduler instance for a specific set of stage definitions. */
export interface StageScheduler<T = Record<string, unknown>> {
  /** Get the stage snapshot for a given time remaining. */
  getStage(msRemaining: number, totalDurationMs: number): StageSnapshot<T>;
  /** Clear any cached computations. */
  clearCache(): void;
}

/** Options for creating a stage scheduler. */
export interface StageSchedulerOptions {
  /** Size of memoization time buckets in ms. @defaultValue 50 */
  readonly memoizationBucketMs?: number;
}

/**
 * Parse a stage threshold string into milliseconds remaining.
 * @param threshold - Stage threshold ('50%' or '60s')
 * @param totalDurationMs - Total countdown duration
 * @returns Milliseconds remaining when threshold triggers
 * @throws If threshold format is invalid
 * @public
 */
export function parseThreshold(threshold: StageThreshold, totalDurationMs: number): number {
  if (threshold.endsWith('%')) {
    const percent = parseFloat(threshold.slice(0, -1));
    if (isNaN(percent) || percent < 0) {
      throw new Error(`Invalid percentage threshold: ${threshold}`);
    }
    return (percent / 100) * totalDurationMs;
  }
  if (threshold.endsWith('s')) {
    const seconds = parseFloat(threshold.slice(0, -1));
    if (isNaN(seconds) || seconds < 0) {
      throw new Error(`Invalid seconds threshold: ${threshold}`);
    }
    return seconds * 1000;
  }
  throw new Error(`Invalid threshold format: ${threshold}. Expected 'N%' or 'Ns'.`);
}

/** Stage with pre-computed threshold in milliseconds */
interface ComputedStage<T> {
  readonly name: string;
  readonly values: T;
  readonly thresholdMs: number;
}

/** Cache key for memoization */
interface CacheKey {
  bucket: number;
  duration: number;
}

/**
 * Create a stage scheduler for the given stage definitions.
 * Stages are sorted by threshold (highest first). Memoized by time buckets.
 * @typeParam T - Type of values associated with each stage
 * @param stages - Array of stage definitions
 * @param options - Optional scheduler configuration
 * @returns A scheduler instance
 * @public
 */
export function createStageScheduler<T>(
  stages: readonly StageDefinition<T>[],
  options: StageSchedulerOptions = {}
): StageScheduler<T> {
  const { memoizationBucketMs = 50 } = options;
  const stageCache = new Map<number, ComputedStage<T>[]>();
  let lastCache: CacheKey & { result: StageSnapshot<T> | null } = {
    bucket: -1,
    duration: -1,
    result: null,
  };

  function getComputedStages(totalDurationMs: number): ComputedStage<T>[] {
    const cached = stageCache.get(totalDurationMs);
    if (cached) return cached;

    const computed: ComputedStage<T>[] = stages.map(stage => ({
      name: stage.name,
      values: stage.values,
      thresholdMs: parseThreshold(stage.at, totalDurationMs),
    }));

    computed.sort((a, b) => b.thresholdMs - a.thresholdMs);

    // PERF: LRU-style eviction prevents unbounded cache growth
    if (stageCache.size > 10) {
      const firstKey = stageCache.keys().next().value;
      if (firstKey !== undefined) stageCache.delete(firstKey);
    }
    stageCache.set(totalDurationMs, computed);

    return computed;
  }

  function computeStage(msRemaining: number, totalDurationMs: number): StageSnapshot<T> {
    const computedStages = getComputedStages(totalDurationMs);

    if (computedStages.length === 0) {
      throw new Error('No stages defined');
    }

    if (msRemaining <= 0) {
      const lastStage = computedStages[computedStages.length - 1];
      return {
        name: lastStage.name,
        values: lastStage.values,
        progress: 1,
        stageIndex: computedStages.length - 1,
      };
    }

    for (let i = 0; i < computedStages.length - 1; i++) {
      const upper = computedStages[i];
      const lower = computedStages[i + 1];

      if (msRemaining <= upper.thresholdMs && msRemaining > lower.thresholdMs) {
        const range = upper.thresholdMs - lower.thresholdMs;
        const progress = range > 0 ? (upper.thresholdMs - msRemaining) / range : 0;

        return {
          name: upper.name,
          values: upper.values,
          progress,
          stageIndex: i,
        };
      }
    }

    const lastStage = computedStages[computedStages.length - 1];
    if (msRemaining <= lastStage.thresholdMs) {
      const progress =
        lastStage.thresholdMs > 0
          ? (lastStage.thresholdMs - msRemaining) / lastStage.thresholdMs
          : 1;

      return {
        name: lastStage.name,
        values: lastStage.values,
        progress,
        stageIndex: computedStages.length - 1,
      };
    }

    const firstStage = computedStages[0];
    return {
      name: firstStage.name,
      values: firstStage.values,
      progress: 0,
      stageIndex: 0,
    };
  }

  return {
    getStage(msRemaining: number, totalDurationMs: number): StageSnapshot<T> {
      const bucket = Math.floor(msRemaining / memoizationBucketMs);
      if (
        lastCache.bucket === bucket &&
        lastCache.duration === totalDurationMs &&
        lastCache.result !== null
      ) {
        return lastCache.result;
      }

      const result = computeStage(msRemaining, totalDurationMs);
      lastCache = { bucket, duration: totalDurationMs, result };

      return result;
    },

    clearCache(): void {
      stageCache.clear();
      lastCache = { bucket: -1, duration: -1, result: null };
    },
  };
}
