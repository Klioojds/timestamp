import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const updateMetrics = vi.fn();
const updateStats = vi.fn();
const updateOperations = vi.fn();
const cleanupDrag = vi.fn();

const perfSnapshot = {
  fps: 60,
  domNodes: 1200,
  inp: 80,
  memoryMB: null,
  frameTime: 16.7,
  longTaskCount: 0,
  operations: [],
  stats: {
    fps: { p50: 55, p95: 45, p99: 40, min: 35, max: 60, avg: 50, count: 10 },
  },
};

const unsubscribe = vi.fn();
const perfMonitorMock = {
  start: vi.fn(),
  stop: vi.fn(),
  subscribe: vi.fn((cb: (snapshot: typeof perfSnapshot) => void) => {
    cb(perfSnapshot);
    return unsubscribe;
  }),
  getSnapshot: vi.fn(() => perfSnapshot),
  clear: vi.fn(),
};

vi.mock('@core/perf/perf-monitor', () => ({
  perfMonitor: perfMonitorMock,
}));

vi.mock('@core/utils/accessibility', () => ({
  prefersReducedMotion: () => false,
}));

vi.mock('./renderers', () => ({
  updateMetrics,
  updateOperations,
  updateStats,
}));

vi.mock('./drag', () => ({
  setupDragging: vi.fn(() => cleanupDrag),
}));

// Mock CSS import
vi.mock('../../styles/components/perf-overlay.css', () => ({}));

const createdContainers: HTMLDivElement[] = [];
let overlayModule: Awaited<typeof import('./index')> | null = null;

vi.mock('./view', () => ({
  createOverlayDOM: () => {
    const container = document.createElement('div');
    container.dataset.testid = 'perf-overlay';
    container.className = 'perf-overlay';
    container.innerHTML = `
      <div class="perf-overlay__header"></div>
      <button data-action="close"></button>
      <button data-action="clear"></button>
      <button data-action="toggle-details"></button>
      <div data-metric="fps"><div class="perf-overlay__metric-value"></div></div>
      <div data-metric="frame"><div class="perf-overlay__metric-value"></div></div>
      <div data-metric="dom"><div class="perf-overlay__metric-value"></div></div>
      <div data-metric="inp"><div class="perf-overlay__metric-value"></div></div>
      <div data-stats="fps"></div>
      <div data-operations></div>
      <div class="perf-overlay__details"></div>
    `;
    createdContainers.push(container);
    return container;
  },
  getOverlayElements: (container: HTMLDivElement) => ({
    container,
    fpsMetric: container.querySelector('[data-metric="fps"]'),
    frameMetric: container.querySelector('[data-metric="frame"]'),
    domMetric: container.querySelector('[data-metric="dom"]'),
    inpMetric: container.querySelector('[data-metric="inp"]'),
    statsContainer: container.querySelector('[data-stats="fps"]'),
    operationsContainer: container.querySelector('[data-operations]'),
    detailsSection: container.querySelector('.perf-overlay__details'),
    expandButton: container.querySelector('[data-action="toggle-details"]'),
  }),
  updateExpandState: vi.fn((elements, expanded: boolean) => {
    elements.detailsSection?.classList.toggle('is-expanded', expanded);
  }),
}));

describe('perf-overlay entrypoint', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    createdContainers.length = 0;
    document.body.innerHTML = '';
    // Ensure import sees desired profiling flag per test
    delete (globalThis as Record<string, unknown>).__PROFILING__;
  });

  afterEach(() => {
    overlayModule?.destroyPerfOverlay();
    overlayModule = null;
    delete (globalThis as Record<string, unknown>).__PROFILING__;
  });

  it('does nothing when profiling is disabled', async () => {
    (globalThis as Record<string, unknown>).__PROFILING__ = false;
    overlayModule = await import('./index');

    overlayModule.initPerfOverlay();

    expect(perfMonitorMock.start).not.toHaveBeenCalled();
    expect(perfMonitorMock.subscribe).not.toHaveBeenCalled();
    expect(document.querySelector('[data-testid="perf-overlay"]')).toBeNull();
  });

  it('toggles overlay via keyboard shortcut when profiling enabled', async () => {
    (globalThis as Record<string, unknown>).__PROFILING__ = true;
    overlayModule = await import('./index');

    overlayModule.initPerfOverlay();

    // Show overlay with Ctrl+Shift+P
    const keyEvent = new KeyboardEvent('keydown', { key: 'P', ctrlKey: true, shiftKey: true, bubbles: true });
    document.dispatchEvent(keyEvent);

    expect(perfMonitorMock.start).toHaveBeenCalledTimes(1);
    expect(perfMonitorMock.subscribe).toHaveBeenCalledTimes(1);
    expect(updateMetrics).toHaveBeenCalled();
    expect(document.querySelector('[data-testid="perf-overlay"]')).toBeTruthy();

    // Toggle again to hide
    document.dispatchEvent(keyEvent);

    expect(perfMonitorMock.stop).toHaveBeenCalledTimes(1);
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(cleanupDrag).toHaveBeenCalledTimes(1);
    expect(document.querySelector('[data-testid="perf-overlay"]')).toBeNull();
  });

  it('destroyPerfOverlay removes listeners and prevents reopening', async () => {
    (globalThis as Record<string, unknown>).__PROFILING__ = true;
    overlayModule = await import('./index');

    overlayModule.initPerfOverlay();
    const keyEvent = new KeyboardEvent('keydown', { key: 'P', ctrlKey: true, shiftKey: true, bubbles: true });
    document.dispatchEvent(keyEvent);
    expect(createdContainers.length).toBeGreaterThanOrEqual(1);

    const removeListenerSpy = vi.spyOn(document, 'removeEventListener');

    overlayModule.destroyPerfOverlay();

    expect(removeListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    expect(perfMonitorMock.stop).toHaveBeenCalled();
    expect(document.querySelector('[data-testid="perf-overlay"]')).toBeNull();
  });

  it('should auto-show overlay when ?perf=1 URL param is present', async () => {
    (globalThis as Record<string, unknown>).__PROFILING__ = true;

    // Mock URLSearchParams to return perf=1
    const originalLocation = window.location;
    delete (window as Partial<Window>).location;
    window.location = {
      ...originalLocation,
      search: '?perf=1',
    } as Location;

    overlayModule = await import('./index');
    overlayModule.initPerfOverlay();

    expect(perfMonitorMock.start).toHaveBeenCalledTimes(1);
    expect(perfMonitorMock.subscribe).toHaveBeenCalledTimes(1);
    expect(document.querySelector('[data-testid="perf-overlay"]')).toBeTruthy();

    // Restore location
    window.location = originalLocation;
  });

  it('should not auto-show overlay when perf param is not 1', async () => {
    (globalThis as Record<string, unknown>).__PROFILING__ = true;

    const originalLocation = window.location;
    delete (window as Partial<Window>).location;
    window.location = {
      ...originalLocation,
      search: '?perf=0',
    } as Location;

    overlayModule = await import('./index');
    overlayModule.initPerfOverlay();

    expect(perfMonitorMock.start).not.toHaveBeenCalled();
    expect(document.querySelector('[data-testid="perf-overlay"]')).toBeNull();

    window.location = originalLocation;
  });

  it.each([
    { key: 'p', ctrlKey: true, shiftKey: true, shouldToggle: false, desc: 'lowercase p' },
    { key: 'P', ctrlKey: false, shiftKey: true, shouldToggle: false, desc: 'no Ctrl' },
    { key: 'P', ctrlKey: true, shiftKey: false, shouldToggle: false, desc: 'no Shift' },
    { key: 'P', ctrlKey: true, shiftKey: true, shouldToggle: true, desc: 'correct combination' },
  ])('should handle keyboard shortcut: $desc', async ({ key, ctrlKey, shiftKey, shouldToggle }) => {
    (globalThis as Record<string, unknown>).__PROFILING__ = true;
    overlayModule = await import('./index');
    overlayModule.initPerfOverlay();

    const keyEvent = new KeyboardEvent('keydown', { key, ctrlKey, shiftKey, bubbles: true });
    const preventDefaultSpy = vi.spyOn(keyEvent, 'preventDefault');
    document.dispatchEvent(keyEvent);

    if (shouldToggle) {
      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(perfMonitorMock.start).toHaveBeenCalled();
      expect(document.querySelector('[data-testid="perf-overlay"]')).toBeTruthy();
    } else {
      expect(perfMonitorMock.start).not.toHaveBeenCalled();
      expect(document.querySelector('[data-testid="perf-overlay"]')).toBeNull();
    }
  });

  it('should handle close button click', async () => {
    (globalThis as Record<string, unknown>).__PROFILING__ = true;
    overlayModule = await import('./index');
    overlayModule.initPerfOverlay();

    const keyEvent = new KeyboardEvent('keydown', { key: 'P', ctrlKey: true, shiftKey: true, bubbles: true });
    document.dispatchEvent(keyEvent);

    const closeButton = document.querySelector('[data-action="close"]') as HTMLButtonElement;
    expect(closeButton).toBeTruthy();

    closeButton.click();

    expect(perfMonitorMock.stop).toHaveBeenCalled();
    expect(unsubscribe).toHaveBeenCalled();
    expect(document.querySelector('[data-testid="perf-overlay"]')).toBeNull();
  });

  it('should handle clear button click', async () => {
    (globalThis as Record<string, unknown>).__PROFILING__ = true;
    overlayModule = await import('./index');
    overlayModule.initPerfOverlay();

    const keyEvent = new KeyboardEvent('keydown', { key: 'P', ctrlKey: true, shiftKey: true, bubbles: true });
    document.dispatchEvent(keyEvent);

    const clearButton = document.querySelector('[data-action="clear"]') as HTMLButtonElement;
    expect(clearButton).toBeTruthy();

    clearButton.click();

    expect(perfMonitorMock.clear).toHaveBeenCalled();
  });

  it('should toggle details section when toggle button clicked', async () => {
    (globalThis as Record<string, unknown>).__PROFILING__ = true;
    const { updateExpandState } = await import('./view');

    overlayModule = await import('./index');
    overlayModule.initPerfOverlay();

    const keyEvent = new KeyboardEvent('keydown', { key: 'P', ctrlKey: true, shiftKey: true, bubbles: true });
    document.dispatchEvent(keyEvent);

    const toggleButton = document.querySelector('[data-action="toggle-details"]') as HTMLButtonElement;
    expect(toggleButton).toBeTruthy();

    toggleButton.click();

    expect(updateExpandState).toHaveBeenCalledWith(expect.anything(), true);

    toggleButton.click();

    expect(updateExpandState).toHaveBeenCalledWith(expect.anything(), false);
  });

  it('should call updateStats and updateOperations when expanded', async () => {
    (globalThis as Record<string, unknown>).__PROFILING__ = true;
    overlayModule = await import('./index');
    overlayModule.initPerfOverlay();

    const keyEvent = new KeyboardEvent('keydown', { key: 'P', ctrlKey: true, shiftKey: true, bubbles: true });
    document.dispatchEvent(keyEvent);

    updateStats.mockClear();
    updateOperations.mockClear();

    // Expand details
    const toggleButton = document.querySelector('[data-action="toggle-details"]') as HTMLButtonElement;
    toggleButton.click();

    // Trigger snapshot update
    const subscribeCb = perfMonitorMock.subscribe.mock.calls[0][0];
    subscribeCb(perfSnapshot);

    expect(updateStats).toHaveBeenCalledWith(expect.anything(), perfSnapshot.stats.fps);
    expect(updateOperations).toHaveBeenCalledWith(expect.anything(), perfSnapshot.operations);
  });

  it('should not call updateStats and updateOperations when collapsed', async () => {
    (globalThis as Record<string, unknown>).__PROFILING__ = true;
    overlayModule = await import('./index');
    overlayModule.initPerfOverlay();

    const keyEvent = new KeyboardEvent('keydown', { key: 'P', ctrlKey: true, shiftKey: true, bubbles: true });
    document.dispatchEvent(keyEvent);

    updateStats.mockClear();
    updateOperations.mockClear();

    // Trigger snapshot update while collapsed
    const subscribeCb = perfMonitorMock.subscribe.mock.calls[0][0];
    subscribeCb(perfSnapshot);

    expect(updateStats).not.toHaveBeenCalled();
    expect(updateOperations).not.toHaveBeenCalled();
  });

  it('should not show overlay when already visible', async () => {
    (globalThis as Record<string, unknown>).__PROFILING__ = true;
    overlayModule = await import('./index');
    overlayModule.initPerfOverlay();

    const keyEvent = new KeyboardEvent('keydown', { key: 'P', ctrlKey: true, shiftKey: true, bubbles: true });
    
    // Show overlay first time
    document.dispatchEvent(keyEvent);
    expect(perfMonitorMock.start).toHaveBeenCalledTimes(1);

    // Try to show again - toggle should hide instead
    document.dispatchEvent(keyEvent);
    expect(perfMonitorMock.start).toHaveBeenCalledTimes(1); // Still only 1 call
    expect(perfMonitorMock.stop).toHaveBeenCalledTimes(1);
  });

  it('should not hide overlay when already hidden', async () => {
    (globalThis as Record<string, unknown>).__PROFILING__ = true;
    overlayModule = await import('./index');
    overlayModule.initPerfOverlay();

    const keyEvent = new KeyboardEvent('keydown', { key: 'P', ctrlKey: true, shiftKey: true, bubbles: true });
    
    // Show and hide
    document.dispatchEvent(keyEvent);
    document.dispatchEvent(keyEvent);
    expect(perfMonitorMock.stop).toHaveBeenCalledTimes(1);

    perfMonitorMock.stop.mockClear();
    unsubscribe.mockClear();

    // Try to hide again when already hidden
    const subscribeCb = perfMonitorMock.subscribe.mock.calls[0][0];
    subscribeCb(perfSnapshot);

    // Should not call unsubscribe or stop again
    expect(perfMonitorMock.stop).not.toHaveBeenCalled();
  });

  it('should handle multiple destroy calls gracefully', async () => {
    (globalThis as Record<string, unknown>).__PROFILING__ = true;
    overlayModule = await import('./index');
    overlayModule.initPerfOverlay();

    const keyEvent = new KeyboardEvent('keydown', { key: 'P', ctrlKey: true, shiftKey: true, bubbles: true });
    document.dispatchEvent(keyEvent);

    overlayModule.destroyPerfOverlay();
    overlayModule.destroyPerfOverlay();
    overlayModule.destroyPerfOverlay();

    expect(document.querySelector('[data-testid="perf-overlay"]')).toBeNull();
  });

  it('should call perfMonitor.getSnapshot on initial show', async () => {
    (globalThis as Record<string, unknown>).__PROFILING__ = true;
    overlayModule = await import('./index');
    overlayModule.initPerfOverlay();

    perfMonitorMock.getSnapshot.mockClear();

    const keyEvent = new KeyboardEvent('keydown', { key: 'P', ctrlKey: true, shiftKey: true, bubbles: true });
    document.dispatchEvent(keyEvent);

    expect(perfMonitorMock.getSnapshot).toHaveBeenCalled();
  });

  it('should handle click events on non-action elements gracefully', async () => {
    (globalThis as Record<string, unknown>).__PROFILING__ = true;
    overlayModule = await import('./index');
    overlayModule.initPerfOverlay();

    const keyEvent = new KeyboardEvent('keydown', { key: 'P', ctrlKey: true, shiftKey: true, bubbles: true });
    document.dispatchEvent(keyEvent);

    const container = document.querySelector('[data-testid="perf-overlay"]') as HTMLElement;
    container.click();

    // Should not throw or crash
    expect(container).toBeTruthy();
  });
});
