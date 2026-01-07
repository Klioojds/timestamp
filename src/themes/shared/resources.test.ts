import type { ResourceTracker } from '@themes/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    cancelAll,
    createResourceTracker,
    debounceTimeout,
    getTrackedTimerCount,
    safeSetInterval,
    safeSetTimeout,
} from './resources';

type TimerScenario = {
  label: 'safeSetInterval' | 'safeSetTimeout';
  schedule: (callback: () => void, tracker: ResourceTracker) => number;
  advance: () => void;
  expectedCalls: number;
  trackerKey: 'intervals' | 'timeouts';
  errorLabel: string;
};

const TIMER_SCENARIOS: TimerScenario[] = [
  {
    label: 'safeSetInterval',
    schedule: (callback, tracker) => safeSetInterval(callback, 100, tracker),
    advance: () => vi.advanceTimersByTime(250),
    expectedCalls: 2,
    trackerKey: 'intervals',
    errorLabel: '[safeSetInterval] Callback error:',
  },
  {
    label: 'safeSetTimeout',
    schedule: (callback, tracker) => safeSetTimeout(callback, 100, tracker),
    advance: () => vi.advanceTimersByTime(100),
    expectedCalls: 1,
    trackerKey: 'timeouts',
    errorLabel: '[safeSetTimeout] Callback error:',
  },
];

describe('createResourceTracker', () => {
  it('should return empty handle arrays when invoked', () => {
    // Act
    const handles = createResourceTracker();

    // Assert
    expect(handles.intervals).toEqual([]);
    expect(handles.timeouts).toEqual([]);
    expect(handles.rafs).toEqual([]);
    expect(handles.observers).toEqual([]);
    expect(handles.listeners).toEqual([]);
  });

  it('should return a fresh instance when called multiple times', () => {
    // Arrange & Act
    const handles1 = createResourceTracker();
    const handles2 = createResourceTracker();

    // Assert
    expect(handles1).not.toBe(handles2);
  });
});

describe('cancelAll', () => {
  let tracker: ResourceTracker;

  beforeEach(() => {
    tracker = createResourceTracker();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  interface TimerCase {
    name: string;
    property: 'intervals' | 'timeouts' | 'rafs';
    spyName: 'clearInterval' | 'clearTimeout' | 'cancelAnimationFrame';
    values: number[];
  }

  const timerCases: TimerCase[] = [
    {
      name: 'intervals',
      property: 'intervals',
      spyName: 'clearInterval',
      values: [1, 2, 3],
    },
    {
      name: 'timeouts',
      property: 'timeouts',
      spyName: 'clearTimeout',
      values: [1, 2],
    },
    {
      name: 'rafs',
      property: 'rafs',
      spyName: 'cancelAnimationFrame',
      values: [1, 2],
    },
  ];

  it.each(timerCases)('should clear $name when tracker contains entries', (testCase) => {
    // Arrange
    const spy = vi.spyOn(global, testCase.spyName);
    tracker[testCase.property] = [...testCase.values];

    // Act
    cancelAll(tracker);

    // Assert
    expect(spy).toHaveBeenCalledTimes(testCase.values.length);
    expect(tracker[testCase.property]).toEqual([]);
  });

  it('should clean observers when tracker contains registered resources', () => {
    // Arrange
    const mockObserver = { disconnect: vi.fn() };
    tracker.observers = [mockObserver];

    // Act
    cancelAll(tracker);

    // Assert
    expect(mockObserver.disconnect).toHaveBeenCalled();
    expect(tracker.observers).toEqual([]);
  });

  it('should clean listeners when tracker contains registered resources', () => {
    // Arrange
    const mockListener = { remove: vi.fn() };
    tracker.listeners = [mockListener];

    // Act
    cancelAll(tracker);

    // Assert
    expect(mockListener.remove).toHaveBeenCalled();
    expect(tracker.listeners).toEqual([]);
  });
});

describe.each(TIMER_SCENARIOS)('$label', (scenario) => {
  beforeEach(() => {
    vi.useFakeTimers();
    
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should execute callback for scheduled run', () => {
    const handles = createResourceTracker();
    const callback = vi.fn();

    scenario.schedule(callback, handles);
    scenario.advance();

    expect(callback).toHaveBeenCalledTimes(scenario.expectedCalls);
  });

  it('should register handle in handles array', () => {
    const handles = createResourceTracker();
    const callback = vi.fn();

    const id = scenario.schedule(callback, handles);

    expect(handles[scenario.trackerKey]).toContain(id);
  });

  it('should log callback errors without breaking scheduling', () => {
    const handles = createResourceTracker();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    let callCount = 0;
    const callback = vi.fn(() => {
      callCount++;
      if (callCount === 1) {
        throw new Error('Test error');
      }
    });

    scenario.schedule(callback, handles);
    scenario.advance();

    expect(callback).toHaveBeenCalledTimes(scenario.expectedCalls);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      scenario.errorLabel,
      expect.any(Error)
    );
  });

  it('should be cleared by cancelAll', () => {
    const handles = createResourceTracker();
    const callback = vi.fn();
    scenario.schedule(callback, handles);

    cancelAll(handles);
    scenario.advance();

    expect(callback).not.toHaveBeenCalled();
  });

  if (scenario.label === 'safeSetTimeout') {
    it('should not execute callback before delay', () => {
      const handles = createResourceTracker();
      const callback = vi.fn();

      scenario.schedule(callback, handles);
      vi.advanceTimersByTime(50);

      expect(callback).not.toHaveBeenCalled();
    });
  }
});

describe('getTrackedTimerCount', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return active timer count in development mode', () => {
    // Arrange
    const handles = createResourceTracker();

    // Act
    const initialCount = getTrackedTimerCount();
    safeSetInterval(() => {}, 100, handles);
    safeSetTimeout(() => {}, 100, handles);
    const afterCount = getTrackedTimerCount();

    // Assert - in test environment NODE_ENV is 'test', not 'production'
    // so __DEV__ is true and counter should work
    expect(afterCount).toBe(initialCount + 2);
  });

  it('should decrement count when handles are reset', () => {
    // Arrange
    const handles = createResourceTracker();
    safeSetInterval(() => {}, 100, handles);
    safeSetTimeout(() => {}, 100, handles);
    const beforeReset = getTrackedTimerCount();

    // Act
    cancelAll(handles);
    const afterReset = getTrackedTimerCount();

    // Assert
    expect(afterReset).toBe(beforeReset - 2);
  });
});

describe('debounceTimeout', () => {
  let tracker: ResourceTracker;

  beforeEach(() => {
    vi.useFakeTimers();
    tracker = createResourceTracker();
    
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should schedule a new timeout when previousId is null', () => {
    // Arrange
    const callback = vi.fn();

    // Act
    const id = debounceTimeout(null, callback, 1000, tracker);

    // Assert
    expect(id).toBeDefined();
    expect(tracker.timeouts).toHaveLength(1);
    expect(tracker.timeouts[0]).toBe(id);
  });

  it('should clear previous timeout before scheduling new one', () => {
    // Arrange
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
    const firstCallback = vi.fn();
    const secondCallback = vi.fn();

    // Act
    const firstId = debounceTimeout(null, firstCallback, 1000, tracker);
    const secondId = debounceTimeout(firstId, secondCallback, 1000, tracker);

    // Assert
    expect(clearTimeoutSpy).toHaveBeenCalledWith(firstId);
    expect(tracker.timeouts).toHaveLength(1);
    expect(tracker.timeouts[0]).toBe(secondId);
  });

  it('should prevent timer handle accumulation in recurring schedulers', () => {
    // Arrange
    let timeoutId: number | null = null;
    let callCount = 0;

    const recurringScheduler = (): void => {
      timeoutId = debounceTimeout(
        timeoutId,
        () => {
          callCount++;
          if (callCount < 5) {
            recurringScheduler();
          }
        },
        100,
        tracker
      );
    };

    // Act - Run 5 iterations
    recurringScheduler();
    vi.advanceTimersByTime(500);

    // Assert - Only 1 handle in array (not 5)
    expect(tracker.timeouts).toHaveLength(1);
    expect(callCount).toBe(5);
  });

  it('should handle replacing with the same callback', () => {
    // Arrange
    const callback = vi.fn();

    // Act
    const firstId = debounceTimeout(null, callback, 1000, tracker);
    const secondId = debounceTimeout(firstId, callback, 500, tracker);
    vi.advanceTimersByTime(500);

    // Assert
    expect(callback).toHaveBeenCalledTimes(1); // Only second timeout fires
    expect(tracker.timeouts).toHaveLength(1); // Still has the executed timeout ID
    expect(secondId).not.toBe(firstId);
  });

  it('should catch and log errors in callback', () => {
    // Arrange
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const errorCallback = (): void => {
      throw new Error('Test error');
    };

    // Act
    debounceTimeout(null, errorCallback, 100, tracker);
    vi.advanceTimersByTime(100);

    // Assert
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[safeSetTimeout] Callback error:',
      expect.any(Error)
    );
  });

  it('should handle invalid previousId gracefully', () => {
    // Arrange
    const callback = vi.fn();
    const invalidId = 99999;

    // Act & Assert - Should not throw
    expect(() => {
      debounceTimeout(invalidId, callback, 100, tracker);
    }).not.toThrow();
  });
});

