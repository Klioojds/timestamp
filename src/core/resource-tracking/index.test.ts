import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';

const loadModule = async () => {
  vi.resetModules();
  return import('./index');
};

describe('resource-tracking', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('tracks timers and resets counts when callbacks are cancelled', async () => {
    const mod = await loadModule();
    const tracker = mod.createResourceTracker();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(mod.getTrackedTimerCount()).toBe(0);
    mod.safeSetTimeout(() => {}, 25, tracker);

    expect(tracker.timeouts).toHaveLength(1);
    expect(mod.getTrackedTimerCount()).toBe(1);

    mod.cancelCallbacks(tracker);

    expect(tracker.timeouts).toHaveLength(0);
    expect(mod.getTrackedTimerCount()).toBe(0);

    consoleSpy.mockRestore();
  });

  it('preserves observers and listeners when cancelling callbacks', async () => {
    const mod = await loadModule();
    const tracker = mod.createResourceTracker();
    const observer = { disconnect: vi.fn() };
    const listener = vi.fn();

    mod.trackObserver(observer, tracker);
    mod.trackListener(listener, tracker);
    mod.safeSetTimeout(() => {}, 10, tracker);

    mod.cancelCallbacks(tracker);

    expect(observer.disconnect).not.toHaveBeenCalled();
    expect(listener).not.toHaveBeenCalled();
    expect(tracker.observers).toHaveLength(1);
    expect(tracker.listeners).toHaveLength(1);
    expect(tracker.timeouts).toHaveLength(0);
  });

  it('debounceTimeout replaces existing timeout and updates tracker', async () => {
    const mod = await loadModule();
    const tracker = mod.createResourceTracker();

    const firstId = mod.safeSetTimeout(() => {}, 5, tracker);
    const nextId = mod.debounceTimeout(firstId, () => {}, 10, tracker);

    expect(firstId).not.toBe(nextId);
    expect(tracker.timeouts).toEqual([nextId]);
  });

  it('cancelTimeout clears tracked entry and returns null', async () => {
    const mod = await loadModule();
    const tracker = mod.createResourceTracker();
    const timeoutId = mod.safeSetTimeout(() => {}, 5, tracker);

    const result = mod.cancelTimeout(timeoutId, tracker);

    expect(result).toBeNull();
    expect(tracker.timeouts).toHaveLength(0);
  });

  it('scheduleSafeTimeout registers timeout on state tracker', async () => {
    const mod = await loadModule();
    const tracker = mod.createResourceTracker();
    const state = { resourceTracker: tracker } satisfies mod.StateWithResourceTracker;

    const timeoutId = mod.scheduleSafeTimeout(state, () => {}, 15);

    expect(tracker.timeouts).toContain(timeoutId);
  });

  it('safeSetInterval logs errors without throwing', async () => {
    const mod = await loadModule();
    const tracker = mod.createResourceTracker();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    mod.safeSetInterval(() => {
      throw new Error('boom');
    }, 20, tracker);

    vi.runOnlyPendingTimers();

    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(tracker.intervals).toHaveLength(1);

    mod.cancelCallbacks(tracker);
    errorSpy.mockRestore();
  });
});