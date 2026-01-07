/**
 * Allowed metric identifiers displayed in the performance overlay.
 *
 * @remarks
 * Keep in sync with metric rendering configurations and dataset attributes
 * in the overlay DOM so metric updates remain data-driven.
 */
export type MetricKey = 'fps' | 'frame' | 'dom' | 'inp';

interface MetricDefinition {
  key: MetricKey;
  label: string;
}

/** Metric labels shown in the overlay header row. */
export const METRIC_DEFINITIONS: ReadonlyArray<MetricDefinition> = [
  { key: 'fps', label: 'FPS' },
  { key: 'frame', label: 'Frame (ms)' },
  { key: 'dom', label: 'DOM Nodes' },
  { key: 'inp', label: 'INP (ms)' },
];

interface StatDefinition {
  key: 'p50' | 'p95' | 'min' | 'max';
  label: string;
}

/** Stat labels for the expanded FPS statistics section. */
export const STAT_DEFINITIONS: ReadonlyArray<StatDefinition> = [
  { key: 'p50', label: 'p50' },
  { key: 'p95', label: 'p95' },
  { key: 'min', label: 'min' },
  { key: 'max', label: 'max' },
];

export const OVERLAY_ACTIONS = {
  close: 'close',
  clear: 'clear',
  toggleDetails: 'toggle-details',
} as const;

/** INP budget in milliseconds used for threshold comparison. */
export const INP_BUDGET_MS = 200;
