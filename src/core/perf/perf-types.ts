/** Performance Monitoring Types (dev-only, tree-shaken in production). */

export type MetricType =
  | 'fps' | 'inp' | 'longtask' | 'tick' | 'theme-switch'
  | 'grid-rebuild' | 'memory' | 'activity-active' | 'activity-pending' | 'activity-valid';

export interface OperationRecord { label: string; duration: number; timestamp: number; }

export interface MetricStats { p50: number; p95: number; p99: number; max: number; min: number; avg: number; count: number; }

export interface PerfSnapshot {
  fps: number; frameTime: number; domNodes: number; memoryMB: number | null;
  inp: number | null; longTaskCount: number;
  stats: Partial<Record<MetricType, MetricStats>>; operations: OperationRecord[];
}

export interface PerfMonitorConfig {
  fpsSampleMs: number; maxSamples: number; maxOperations: number; inpThreshold: number; longTaskThreshold: number;
}

export interface PerfMonitor {
  start(): void; stop(): void;
  record(metric: MetricType, value: number): void;
  recordOperation(label: string, duration: number): void;
  getStats(metric: MetricType): MetricStats | null;
  getSnapshot(): PerfSnapshot;
  clear(): void; isActive(): boolean;
  subscribe(callback: (snapshot: PerfSnapshot) => void): () => void;
}

declare global { const __PROFILING__: boolean; }
