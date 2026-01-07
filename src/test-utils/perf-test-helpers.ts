import { vi } from 'vitest';
import type { PerfMonitorConfig } from '@core/perf/perf-types';
import { createOverlayDOM, getOverlayElements } from '@/components/perf-overlay/view';
import type { OverlayElements } from '@/components/perf-overlay/view';

const DEFAULT_PERF_CONFIG: PerfMonitorConfig = {
  fpsSampleMs: 1000,
  inpThreshold: 50,
  longTaskThreshold: 50,
  maxSamples: 256,
  maxOperations: 50,
};

export interface PerformanceObserverMockControls {
  mockCtor: typeof PerformanceObserver;
  observe: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  takeRecords: ReturnType<typeof vi.fn>;
  restore: () => void;
}

/** Build perf monitor config with test defaults. */
export function makePerfConfig(
  overrides: Partial<PerfMonitorConfig> = {}
): PerfMonitorConfig {
  return { ...DEFAULT_PERF_CONFIG, ...overrides };
}

/** Install mock PerformanceObserver and provide restore helper. */
export function installPerformanceObserverMock(): PerformanceObserverMockControls {
  const originalObserver = globalThis.PerformanceObserver;

  const observe = vi.fn();
  const disconnect = vi.fn();
  const takeRecords = vi.fn(() => [] as PerformanceEntry[]);

  const PerformanceObserverMock = vi.fn(function PerformanceObserverMock(this: any, callback: PerformanceObserverCallback) {
    this.callback = callback;
    this.observe = observe;
    this.disconnect = disconnect;
    this.takeRecords = takeRecords;
  }) as unknown as typeof PerformanceObserver;

  (globalThis as any).PerformanceObserver = PerformanceObserverMock;

  return {
    mockCtor: PerformanceObserverMock,
    observe,
    disconnect,
    takeRecords,
    restore: () => {
      (globalThis as any).PerformanceObserver = originalObserver;
    },
  };
}

/** Replace requestAnimationFrame with immediate timers for deterministic tests. */
export function stubRequestAnimationFrame(): () => void {
  const originalRaf = globalThis.requestAnimationFrame;
  const originalCancel = globalThis.cancelAnimationFrame;

  const rafSpy = vi
    .spyOn(globalThis, 'requestAnimationFrame')
    .mockImplementation((cb: FrameRequestCallback) => {
      const timeoutId = setTimeout(() => cb(performance.now()), 0);
      return Number(timeoutId);
    });

  const cancelSpy = vi
    .spyOn(globalThis, 'cancelAnimationFrame')
    .mockImplementation((handle: number) => {
      clearTimeout(handle);
    });

  return () => {
    rafSpy.mockRestore();
    cancelSpy.mockRestore();
    globalThis.requestAnimationFrame = originalRaf;
    globalThis.cancelAnimationFrame = originalCancel;
  };
}

/**
 * Render the performance overlay into the document for DOM-centric tests.
 * Provides the element refs and a cleanup helper to remove the container.
 */
export function renderPerfOverlay(): {
  container: HTMLDivElement;
  elements: OverlayElements;
  cleanup: () => void;
} {
  const container = createOverlayDOM();
  document.body.appendChild(container);
  const elements = getOverlayElements(container);

  return {
    container,
    elements,
    cleanup: () => container.remove(),
  };
}
