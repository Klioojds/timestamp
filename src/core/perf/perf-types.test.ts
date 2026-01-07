import { describe, it, expectTypeOf } from 'vitest';

import type {
  MetricStats,
  MetricType,
  PerfMonitor,
  PerfMonitorConfig,
  PerfSnapshot,
} from './perf-types';

describe('perf-types', () => {
  it('defines MetricType union for supported metrics', () => {
    expectTypeOf<MetricType>().toEqualTypeOf<
      | 'fps'
      | 'inp'
      | 'longtask'
      | 'tick'
      | 'theme-switch'
      | 'grid-rebuild'
      | 'memory'
      | 'activity-active'
      | 'activity-pending'
      | 'activity-valid'
    >();
  });

  it('exposes perf monitor interface shape', () => {
    expectTypeOf<PerfMonitor>().toMatchTypeOf<{
      start: () => void;
      stop: () => void;
      record: (metric: MetricType, value: number) => void;
      recordOperation: (label: string, duration: number) => void;
      getStats: (metric: MetricType) => MetricStats | null;
      getSnapshot: () => PerfSnapshot;
      clear: () => void;
      isActive: () => boolean;
      subscribe: (callback: (snapshot: PerfSnapshot) => void) => () => void;
    }>();
  });

  it('captures snapshot and config structures', () => {
    expectTypeOf<PerfSnapshot['stats']>().toMatchTypeOf<Partial<Record<MetricType, MetricStats>>>();
    expectTypeOf<PerfMonitorConfig>().toMatchTypeOf<{
      fpsSampleMs: number;
      maxSamples: number;
      maxOperations: number;
      inpThreshold: number;
      longTaskThreshold: number;
    }>();
  });
});