/**
 * Performance Overlay Renderers
 *
 * Data-driven metric rendering for the performance overlay.
 * Extracted from perf-overlay.ts for better separation of concerns.
 *
 * @remarks
 * Uses a configuration map to avoid duplicated threshold/formatting logic
 * across different metric types.
 */

import type { MetricStats, PerfSnapshot } from '@core/perf/perf-types';

import { INP_BUDGET_MS, type MetricKey } from './constants';
import type { OverlayElements } from './view';

const FPS_GOOD_THRESHOLD = 55;
const FPS_WARN_THRESHOLD = 45;
const FRAME_TIME_GOOD_THRESHOLD_MS = 14;
const FRAME_TIME_WARN_THRESHOLD_MS = 10;
const FRAME_DURATION_60FPS_MS = 16.7;
const DOM_NODE_GOOD_THRESHOLD = 5000;
const DOM_NODE_WARN_THRESHOLD = 2000;
const DOM_NODE_BUDGET = 10000;
const INP_GOOD_THRESHOLD_MS = 100;
const INP_WARN_THRESHOLD_MS = 50;
const MAX_OPERATION_RENDER_COUNT = 10;
const OPERATIONS_EMPTY_MESSAGE = 'No operations recorded';
const TIMING_GOOD_THRESHOLD_MS = 16;
const TIMING_WARN_THRESHOLD_MS = 100;
const ONE_THOUSAND = 1000;
const ONE_MILLION = 1000000;

const METRIC_STATUS_CLASS = {
  good: 'perf-overlay__metric--good',
  warn: 'perf-overlay__metric--warn',
  bad: 'perf-overlay__metric--bad',
} as const;

/**
 * Metric configuration for threshold-based coloring.
 */
interface MetricConfig {
  /** Good threshold (green) */
  good: number;
  /** Warning threshold (yellow) */
  warn: number;
  /** Calculate the comparison value from snapshot */
  getValue: (snapshot: PerfSnapshot) => number;
  /** Get the display value from snapshot */
  getDisplay: (snapshot: PerfSnapshot) => string;
}

/**
 * Metric configurations for threshold-based coloring.
 * Higher comparison value = better status.
 */
const METRIC_CONFIGS: Record<MetricKey, MetricConfig> = {
  fps: {
    good: FPS_GOOD_THRESHOLD,
    warn: FPS_WARN_THRESHOLD,
    getValue: (snapshot) => snapshot.fps,
    getDisplay: (snapshot) => snapshot.fps.toString(),
  },
  frame: {
    good: FRAME_TIME_GOOD_THRESHOLD_MS,
    warn: FRAME_TIME_WARN_THRESHOLD_MS,
    getValue: (snapshot) =>
      snapshot.fps > 0
        ? FRAME_DURATION_60FPS_MS - 1000 / snapshot.fps + FRAME_DURATION_60FPS_MS
        : 0,
    getDisplay: (snapshot) => (snapshot.fps > 0 ? (1000 / snapshot.fps).toFixed(1) : '--'),
  },
  dom: {
    good: DOM_NODE_GOOD_THRESHOLD,
    warn: DOM_NODE_WARN_THRESHOLD,
    getValue: (snapshot) => DOM_NODE_BUDGET - snapshot.domNodes,
    getDisplay: (snapshot) => formatNumber(snapshot.domNodes),
  },
  inp: {
    good: INP_GOOD_THRESHOLD_MS,
    warn: INP_WARN_THRESHOLD_MS,
    getValue: (snapshot) => INP_BUDGET_MS - (snapshot.inp ?? 0),
    getDisplay: (snapshot) => (snapshot.inp !== null ? snapshot.inp.toString() : '--'),
  },
};

/**
 * Get status class based on value thresholds.
 * Higher value = better.
 *
 * @param value - Comparison value
 * @param good - Good threshold
 * @param warn - Warning threshold
 * @returns CSS class name
 */
function getStatusClass(value: number, good: number, warn: number): string {
  if (value >= good) return METRIC_STATUS_CLASS.good;
  if (value >= warn) return METRIC_STATUS_CLASS.warn;
  return METRIC_STATUS_CLASS.bad;
}

/**
 * Get timing color class for operations.
 * @param duration - Operation duration in ms
 * @returns CSS class name
 */
export function getTimingClass(duration: number): string {
  if (duration < TIMING_GOOD_THRESHOLD_MS) return METRIC_STATUS_CLASS.good;
  if (duration < TIMING_WARN_THRESHOLD_MS) return METRIC_STATUS_CLASS.warn;
  return METRIC_STATUS_CLASS.bad;
}

/**
 * Format large numbers with K/M suffix.
 * @param n - Number to format
 * @returns Formatted string
 */
export function formatNumber(n: number): string {
  if (n >= ONE_MILLION) return `${(n / ONE_MILLION).toFixed(1)}M`;
  if (n >= ONE_THOUSAND) return `${(n / ONE_THOUSAND).toFixed(1)}K`;
  return n.toString();
}

/**
 * Update a single metric element.
 *
 * @param element - Metric container element
 * @param metricKey - Key for the metric config
 * @param snapshot - Current performance snapshot
 */
function updateMetric(
  element: HTMLElement | null,
  metricKey: keyof typeof METRIC_CONFIGS,
  snapshot: PerfSnapshot
): void {
  if (!element) return;

  const config = METRIC_CONFIGS[metricKey];
  if (!config) return;

  const valueElement = element.querySelector('.perf-overlay__metric-value');
  if (valueElement) {
    valueElement.textContent = config.getDisplay(snapshot);
  }

  const comparisonValue = config.getValue(snapshot);
  element.className = `perf-overlay__metric ${getStatusClass(comparisonValue, config.good, config.warn)}`;
}

/**
 * Update all metrics in the overlay.
 *
 * @param elements - Overlay element references
 * @param snapshot - Current performance snapshot
 */
export function updateMetrics(elements: OverlayElements, snapshot: PerfSnapshot): void {
  updateMetric(elements.fpsMetric, 'fps', snapshot);
  updateMetric(elements.frameMetric, 'frame', snapshot);
  updateMetric(elements.domMetric, 'dom', snapshot);
  updateMetric(elements.inpMetric, 'inp', snapshot);
}

/**
 * Update the FPS statistics section.
 *
 * @param statsContainer - Stats container element
 * @param stats - FPS statistics
 */
export function updateStats(
  statsContainer: HTMLElement | null,
  stats: MetricStats | undefined
): void {
  if (!statsContainer || !stats) return;

  const setStatValue = (statKey: string, value: number): void => {
    const statElement = statsContainer.querySelector(`[data-stat="${statKey}"]`);
    if (statElement) statElement.textContent = Math.round(value).toString();
  };

  setStatValue('p50', stats.p50);
  setStatValue('p95', stats.p95);
  setStatValue('min', stats.min);
  setStatValue('max', stats.max);
}

/**
 * Update the operations log.
 *
 * @param container - Operations container element
 * @param operations - Array of recent operations
 */
export function updateOperations(
  container: HTMLElement | null,
  operations: PerfSnapshot['operations']
): void {
  if (!container) return;

  if (operations.length === 0) {
    container.textContent = OPERATIONS_EMPTY_MESSAGE;
    container.classList.add('perf-overlay__operations--empty');
    return;
  }

  // Show most recent 10 operations
  const recentOps = operations.slice(-MAX_OPERATION_RENDER_COUNT).reverse();
  container.classList.remove('perf-overlay__operations--empty');
  container.innerHTML = recentOps
    .map(
      (operation) => `
        <div class="perf-overlay__op">
          <span class="perf-overlay__op-label">${operation.label}</span>
          <span class="perf-overlay__op-time ${getTimingClass(operation.duration)}">${operation.duration.toFixed(1)}ms</span>
        </div>
      `
    )
    .join('');
}
