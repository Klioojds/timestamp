import { vi } from 'vitest';
import type { TimePageRenderer, TimeRemaining } from '@core/types';

// Re-export mockMatchMedia from accessibility for convenience
export { mockMatchMedia, type MatchMediaMockControls } from './accessibility';

/** Create DOM container for mounting themes in tests. */
export function createTestContainer(id = 'theme-test-container'): HTMLElement {
  const container = document.createElement('div');
  container.id = id;
  document.body.appendChild(container);
  return container;
}

/** Remove container appended during tests. */
export function removeTestContainer(container: HTMLElement | null): void {
  if (container && container.parentElement) {
    container.parentElement.removeChild(container);
  }
}

/** Build TimeRemaining object with defaults. */
export function createTimeRemaining(overrides: Partial<TimeRemaining> = {}): TimeRemaining {
  return {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0,
    ...overrides,
  };
}

/** Build mocked TimePageRenderer with spy functions. */
export function createMockTimePageRenderer(
  overrides: Partial<TimePageRenderer> = {}
): TimePageRenderer {
  const base: TimePageRenderer = {
    mount: vi.fn(),
    destroy: vi.fn(async () => undefined),
    updateTime: vi.fn(),
    onAnimationStateChange: vi.fn(),
    onCounting: vi.fn(),
    onCelebrating: vi.fn(),
    onCelebrated: vi.fn(),
    updateContainer: vi.fn(),
    getResourceTracker: vi.fn(() => ({
      intervals: [],
      timeouts: [],
      rafs: [],
      observers: [],
      listeners: [],
    })),
  };

  return { ...base, ...overrides };
}

/** Mock RAF/cancelAnimationFrame to run immediately. */
export function mockRequestAnimationFrame(): {
  restore: () => void;
  rafSpy: ReturnType<typeof vi.fn>;
  cancelSpy: ReturnType<typeof vi.fn>;
} {
  const originalRaf = globalThis.requestAnimationFrame;
  const originalCancel = globalThis.cancelAnimationFrame;
  let lastTime = performance.now();

  const rafSpy = vi.fn((cb: FrameRequestCallback) => {
    lastTime += 16;
    cb(lastTime);
    return 1;
  });
  const cancelSpy = vi.fn();

  globalThis.requestAnimationFrame = rafSpy as unknown as typeof globalThis.requestAnimationFrame;
  globalThis.cancelAnimationFrame = cancelSpy as unknown as typeof globalThis.cancelAnimationFrame;

  return {
    restore: () => {
      globalThis.requestAnimationFrame = originalRaf;
      globalThis.cancelAnimationFrame = originalCancel;
    },
    rafSpy,
    cancelSpy,
  };
}

/** Clean up orchestrator chrome to prevent test leaks. */
export function cleanupOrchestratorDom(): void {
  const selectorsToCleanup = [
    '.countdown-button-container',
    '.world-map-wrapper',
    '.timezone-selector-wrapper',
    '.back-button',
    '#sr-countdown',
    '#sr-status',
  ];

  selectorsToCleanup.forEach((selector) => {
    document.querySelectorAll(selector).forEach((el) => el.remove());
  });
}

/** Polyfill ResizeObserver for jsdom tests. */
export function mockResizeObserver(): () => void {
  const original = (globalThis as unknown as { ResizeObserver?: unknown }).ResizeObserver;

  class MockResizeObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }

  (globalThis as unknown as { ResizeObserver?: typeof ResizeObserver }).ResizeObserver =
    MockResizeObserver as unknown as typeof ResizeObserver;

  return () => {
    (globalThis as unknown as { ResizeObserver?: typeof ResizeObserver }).ResizeObserver =
      original as typeof ResizeObserver;
  };
}

/** Mock viewport dimensions for testing theme backgrounds. */
export function mockViewport(width: number, height: number): () => void {
  vi.stubGlobal('innerWidth', width);
  vi.stubGlobal('innerHeight', height);
  return () => vi.unstubAllGlobals();
}

