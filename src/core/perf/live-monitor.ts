import type {
  MetricStats,
  MetricType,
  OperationRecord,
  PerfMonitor,
  PerfMonitorConfig,
  PerfSnapshot,
} from './perf-types';

const BYTES_PER_MB = 1024 * 1024;
const LONG_TASK_RESET_MS = 60_000;

type Buffers = Record<MetricType, number[]>;
type Subscriber = (snapshot: PerfSnapshot) => void;

interface MonitorState {
  active: boolean;
  fpsRafId: number | null;
  currentFps: number;
  lastFrameTime: number;
  longTaskCount: number;
  lastLongTaskReset: number;
}

function createBuffers(): Buffers {
  return {
    fps: [], inp: [], longtask: [], tick: [], 'theme-switch': [],
    'grid-rebuild': [], memory: [], 'activity-active': [],
    'activity-pending': [], 'activity-valid': [],
  };
}

function addToBuffer(buffers: Buffers, metric: MetricType, value: number, max: number): void {
  const buf = buffers[metric];
  buf.push(value);
  if (buf.length > max) buf.shift();
}

function calculateStats(samples: number[]): MetricStats {
  if (samples.length === 0) return { p50: 0, p95: 0, p99: 0, max: 0, min: 0, avg: 0, count: 0 };
  const sorted = [...samples].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  const percentile = (q: number) => sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * q))] ?? 0;
  return {
    p50: percentile(0.5), p95: percentile(0.95), p99: percentile(0.99),
    max: sorted[sorted.length - 1] ?? 0, min: sorted[0] ?? 0,
    avg: sum / sorted.length, count: sorted.length,
  };
}

function buildSnapshot(buffers: Buffers, state: MonitorState): PerfSnapshot {
  const stats: Partial<Record<MetricType, MetricStats>> = {};
  for (const [metric, buffer] of Object.entries(buffers)) {
    if (buffer.length > 0) stats[metric as MetricType] = calculateStats(buffer);
  }
  return {
    fps: state.currentFps, frameTime: state.lastFrameTime,
    domNodes: document.getElementsByTagName('*').length, memoryMB: null,
    inp: buffers.inp.length > 0 ? buffers.inp[buffers.inp.length - 1] ?? null : null,
    longTaskCount: state.longTaskCount, stats, operations: [],
  };
}

function createFpsProbe(
  config: PerfMonitorConfig, buffers: Buffers, state: MonitorState, notify: () => void
): (ts: number) => void {
  let sampleStart = 0, frameCount = 0;
  return function fpsProbe(timestamp: number): void {
    if (!state.active) return;
    if (state.lastFrameTime === 0) {
      state.lastFrameTime = timestamp;
      sampleStart = timestamp;
      state.fpsRafId = requestAnimationFrame(fpsProbe);
      return;
    }
    const frameTime = timestamp - state.lastFrameTime;
    state.lastFrameTime = timestamp;
    state.currentFps = frameTime > 0 ? Math.round(1000 / frameTime) : 0;
    frameCount++;
    const elapsed = timestamp - sampleStart;
    if (elapsed >= config.fpsSampleMs) {
      addToBuffer(buffers, 'fps', Math.round((frameCount * 1000) / elapsed), config.maxSamples);
      notify();
      sampleStart = timestamp;
      frameCount = 0;
    }
    state.fpsRafId = requestAnimationFrame(fpsProbe);
  };
}

function attachInpObserver(
  config: PerfMonitorConfig, buffers: Buffers, notify: () => void
): PerformanceObserver | null {
  if (typeof PerformanceObserver === 'undefined') return null;
  try {
    const obs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const dur = (entry as PerformanceEventTiming).duration;
        if (entry.entryType === 'event' && dur >= config.inpThreshold) {
          addToBuffer(buffers, 'inp', dur, config.maxSamples);
          notify();
        }
      }
    });
    obs.observe({ type: 'event', buffered: true } as PerformanceObserverInit);
    return obs;
  } catch { return null; }
}

function attachLongTaskObserver(
  config: PerfMonitorConfig, buffers: Buffers, state: MonitorState, notify: () => void
): PerformanceObserver | null {
  if (typeof PerformanceObserver === 'undefined') return null;
  try {
    const obs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration >= config.longTaskThreshold) {
          addToBuffer(buffers, 'longtask', entry.duration, config.maxSamples);
          state.longTaskCount += 1;
          notify();
        }
      }
    });
    obs.observe({ type: 'longtask', buffered: true });
    return obs;
  } catch { return null; }
}

async function getMemoryUsage(): Promise<number | null> {
  if ('measureUserAgentSpecificMemory' in performance) {
    try {
      const r = await (performance as Performance & { measureUserAgentSpecificMemory: () => Promise<{ bytes: number }> }).measureUserAgentSpecificMemory();
      return r.bytes / BYTES_PER_MB;
    } catch { /* Not available */ }
  }
  const mem = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
  return mem ? mem.usedJSHeapSize / BYTES_PER_MB : null;
}

/** Create a live performance monitor (dev-only). @public */
export function createLiveMonitor(config: PerfMonitorConfig): PerfMonitor {
  const buffers = createBuffers();
  const operations: OperationRecord[] = [];
  const subscribers = new Set<Subscriber>();
  const state: MonitorState = {
    active: false, fpsRafId: null, currentFps: 60,
    lastFrameTime: 0, longTaskCount: 0, lastLongTaskReset: Date.now(),
  };
  let inpObs: PerformanceObserver | null = null;
  let longTaskObs: PerformanceObserver | null = null;

  const notify = (): void => {
    if (subscribers.size === 0) return;
    const snap = monitor.getSnapshot();
    subscribers.forEach((cb) => cb(snap));
  };
  const fpsProbe = createFpsProbe(config, buffers, state, notify);

  const monitor: PerfMonitor = {
    start(): void {
      if (state.active) return;
      state.active = true;
      state.fpsRafId = requestAnimationFrame(fpsProbe);
      state.longTaskCount = 0;
      state.lastLongTaskReset = Date.now();
      void getMemoryUsage();
      inpObs = attachInpObserver(config, buffers, notify);
      longTaskObs = attachLongTaskObserver(config, buffers, state, notify);
      if (typeof window !== 'undefined') {
        (window as Window & { __perfMonitor?: PerfMonitor }).__perfMonitor = monitor;
      }
    },
    stop(): void {
      if (!state.active) return;
      state.active = false;
      if (state.fpsRafId !== null) { cancelAnimationFrame(state.fpsRafId); state.fpsRafId = null; }
      inpObs?.disconnect(); longTaskObs?.disconnect();
      inpObs = null; longTaskObs = null;
      if (typeof window !== 'undefined') {
        delete (window as Window & { __perfMonitor?: PerfMonitor }).__perfMonitor;
      }
    },
    record(metric: MetricType, value: number): void {
      addToBuffer(buffers, metric, value, config.maxSamples);
    },
    recordOperation(label: string, duration: number): void {
      operations.push({ label, duration, timestamp: Date.now() });
      while (operations.length > config.maxOperations) operations.shift();
      if (import.meta.env?.DEV) console.log(`[PerfMonitor] ${label}: ${duration.toFixed(1)}ms`);
      notify();
    },
    getStats(metric: MetricType): MetricStats | null {
      const buf = buffers[metric];
      return buf.length === 0 ? null : calculateStats(buf);
    },
    getSnapshot(): PerfSnapshot {
      const now = Date.now();
      if (now - state.lastLongTaskReset > LONG_TASK_RESET_MS) {
        state.longTaskCount = 0; state.lastLongTaskReset = now;
      }
      const snap = buildSnapshot(buffers, state);
      snap.operations = [...operations];
      return snap;
    },
    clear(): void {
      for (const buf of Object.values(buffers)) buf.length = 0;
      operations.length = 0;
      state.longTaskCount = 0;
    },
    isActive: () => state.active,
    subscribe(callback: Subscriber): () => void {
      subscribers.add(callback);
      return () => subscribers.delete(callback);
    },
  };
  return monitor;
}

// Exports for testing only
export { type Buffers as _Buffers, calculateStats as _calculateStats, type MonitorState as _MonitorState };
