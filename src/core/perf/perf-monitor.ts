/**
 * Performance Monitor Module
 *
 * Dev-only performance monitoring infrastructure.
 * Gated by `__PROFILING__` build flag and tree-shaken in production.
 */

import { createLiveMonitor } from './live-monitor';
import type {
  MetricStats,
  MetricType,
  OperationRecord,
  PerfMonitor,
  PerfMonitorConfig,
  PerfSnapshot,
} from './perf-types';

/** Checks if profiling is enabled (requires __PROFILING__ and DEV mode). @internal */
export function isProfilingEnabled(profilingFlag?: boolean, devFlag?: boolean): boolean {
  const profiling = profilingFlag ?? (typeof __PROFILING__ !== 'undefined' && __PROFILING__ === true);
  const dev = devFlag ?? import.meta.env?.DEV === true;
  return profiling && dev;
}

const ENABLE_PROFILING = isProfilingEnabled();

const DEFAULT_CONFIG: PerfMonitorConfig = {
  fpsSampleMs: 2000, maxSamples: 256, maxOperations: 50, inpThreshold: 40, longTaskThreshold: 50,
};

function createNullMonitor(): PerfMonitor {
  const emptyStats: MetricStats = { p50: 0, p95: 0, p99: 0, max: 0, min: 0, avg: 0, count: 0 };
  const emptySnapshot: PerfSnapshot = {
    fps: 0, frameTime: 0, domNodes: 0, memoryMB: null,
    inp: null, longTaskCount: 0, stats: {}, operations: [],
  };
  return {
    start: () => {}, stop: () => {}, record: () => {}, recordOperation: () => {},
    getStats: () => emptyStats, getSnapshot: () => emptySnapshot,
    clear: () => {}, isActive: () => false, subscribe: () => () => {},
  };
}

/** Global performance monitor (live in dev with __PROFILING__, null-object in prod). @public */
export const perfMonitor: PerfMonitor = ENABLE_PROFILING
  ? createLiveMonitor(DEFAULT_CONFIG)
  : createNullMonitor();

/** Measure execution time of sync or async function. @public */
export async function measureAsync<T>(
  label: string, action: () => Promise<T> | T
): Promise<{ result: T; duration: number }> {
  const start = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const result = await action();
  const duration = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - start;
  if (import.meta.env?.DEV) console.log(`${label}: ${duration.toFixed(1)}ms`);
  return { result, duration };
}

export type { MetricStats, MetricType, OperationRecord, PerfMonitor, PerfSnapshot };
