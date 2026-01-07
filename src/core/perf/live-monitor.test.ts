/**
 * Live Monitor Unit Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { makePerfConfig, installPerformanceObserverMock, stubRequestAnimationFrame } from '@/test-utils/perf-test-helpers';
import { createLiveMonitor } from './live-monitor';
import type { PerfMonitorConfig } from './perf-types';

type LiveMonitor = ReturnType<typeof createLiveMonitor>;

const withStartedMonitor = (config: PerfMonitorConfig, run: (monitor: LiveMonitor) => void) => {
  const monitor = createLiveMonitor(config);
  monitor.start();
  try { run(monitor); } finally { monitor.stop(); }
};

const getStatsAfterRecording = (monitor: LiveMonitor, metric: 'fps' | 'inp', values: number[]) => {
  values.forEach(value => monitor.record(metric, value));
  return monitor.getStats(metric);
};

describe('createLiveMonitor - FPS tracking', () => {
  const defaultConfig: PerfMonitorConfig = makePerfConfig({ fpsSampleMs: 100 });
  let restoreRaf: () => void;
  
  beforeEach(() => {
    restoreRaf = stubRequestAnimationFrame();
  });

  afterEach(() => {
    restoreRaf();
    vi.restoreAllMocks();
  });

  it('should start monitoring when monitor.start() is called', () => {
    const monitor = createLiveMonitor(defaultConfig);

    expect(monitor.isActive()).toBe(false);
    
    monitor.start();
    expect(monitor.isActive()).toBe(true);
    
    monitor.stop();
    expect(monitor.isActive()).toBe(false);
  });

  it('should record FPS samples via manual recording', () => {
    withStartedMonitor(defaultConfig, monitor => {
      const stats = getStatsAfterRecording(monitor, 'fps', [60, 58, 62]);

      expect(stats).not.toBeNull();
      expect(stats?.count).toBe(3);
      expect(stats?.avg).toBeCloseTo(60, 0);
      expect(stats?.min).toBe(58);
      expect(stats?.max).toBe(62);
    });
  });

  it.each([
    {
      description: 'mixed FPS samples',
      values: [60, 60, 58, 55, 60, 62, 59, 60],
      expectedAvgRange: [57, 61],
      expectedCount: 8,
    },
    {
      description: 'low FPS values (30 FPS)',
      values: new Array(10).fill(30),
      expectedAvgRange: [29.5, 30.5],
      expectedCount: 10,
    },
    {
      description: 'high FPS values (120 FPS)',
      values: new Array(10).fill(120),
      expectedAvgRange: [119.5, 120.5],
      expectedCount: 10,
    },
  ])('should calculate stats for $description', ({ values, expectedAvgRange, expectedCount }) => {
    withStartedMonitor(defaultConfig, monitor => {
      const stats = getStatsAfterRecording(monitor, 'fps', values);

      expect(stats).not.toBeNull();
      expect(stats?.count).toBe(expectedCount);
      expect(stats?.avg).toBeGreaterThanOrEqual(expectedAvgRange[0]);
      expect(stats?.avg).toBeLessThanOrEqual(expectedAvgRange[1]);
    });
  });

  it('should limit buffer size to maxSamples', () => {
    withStartedMonitor(defaultConfig, monitor => {
      for (let i = 0; i < 300; i++) {
        monitor.record('fps', 60);
      }

      const stats = monitor.getStats('fps');
      expect(stats).not.toBeNull();
      expect(stats?.count).toBe(256);
    });
  });

  it('should clear all recorded data', () => {
    withStartedMonitor(defaultConfig, monitor => {
      monitor.record('fps', 60);
      monitor.record('tick', 10);

      expect(monitor.getStats('fps')).not.toBeNull();
      expect(monitor.getStats('tick')).not.toBeNull();

      monitor.clear();

      expect(monitor.getStats('fps')).toBeNull();
      expect(monitor.getStats('tick')).toBeNull();
    });
  });
});

describe('createLiveMonitor - INP tracking', () => {
  const defaultConfig: PerfMonitorConfig = makePerfConfig();
  let restoreObserver: () => void;
  let mockCtor: ReturnType<typeof installPerformanceObserverMock>['mockCtor'];
  let disconnectMock: ReturnType<typeof installPerformanceObserverMock>['disconnect'];

  beforeEach(() => {
    const controls = installPerformanceObserverMock();
    restoreObserver = controls.restore;
    mockCtor = controls.mockCtor;
    disconnectMock = controls.disconnect;
  });

  afterEach(() => {
    restoreObserver();
    vi.restoreAllMocks();
  });

  it('should observe events when monitor starts', () => {
    const monitor = createLiveMonitor(defaultConfig);
    
    monitor.start();
    
    // PerformanceObserver should be created
    expect(mockCtor).toHaveBeenCalled();
    
    monitor.stop();
  });

  it('should record INP events above threshold via manual recording', () => {
    withStartedMonitor(defaultConfig, monitor => {
      const stats = getStatsAfterRecording(monitor, 'inp', [100, 75, 120]);

      expect(stats).not.toBeNull();
      expect(stats?.count).toBe(3);
      expect(stats?.avg).toBeCloseTo(98.33, 0);
      expect(stats?.max).toBe(120);
      expect(stats?.min).toBe(75);
    });
  });

  it('should handle multiple metric types simultaneously', () => {
    withStartedMonitor(defaultConfig, monitor => {
      monitor.record('fps', 60);
      monitor.record('inp', 100);
      monitor.record('longtask', 80);
      monitor.record('tick', 15);

      expect(monitor.getStats('fps')).not.toBeNull();
      expect(monitor.getStats('inp')).not.toBeNull();
      expect(monitor.getStats('longtask')).not.toBeNull();
      expect(monitor.getStats('tick')).not.toBeNull();
    });
  });

  it('should disconnect observers when monitor is stopped', () => {
    const monitor = createLiveMonitor(defaultConfig);

    monitor.start();
    
    monitor.stop();

    // Disconnect should be called if observer was created
    expect(disconnectMock).toHaveBeenCalled();
  });

  it('should provide snapshot with all metrics', () => {
    withStartedMonitor(defaultConfig, monitor => {
      monitor.record('fps', 60);
      monitor.record('inp', 100);
      monitor.recordOperation('test-op', 42.5);

      const snapshot = monitor.getSnapshot();

      expect(snapshot.fps).toBeDefined();
      expect(snapshot.frameTime).toBeDefined();
      expect(snapshot.domNodes).toBeGreaterThan(0);
      expect(snapshot.stats.fps).toBeDefined();
      expect(snapshot.stats.inp).toBeDefined();
      expect(snapshot.operations.length).toBe(1);
      expect(snapshot.operations[0].label).toBe('test-op');
      expect(snapshot.operations[0].duration).toBe(42.5);
    });
  });
});

describe('createLiveMonitor - Observer fallbacks', () => {
  const defaultConfig: PerfMonitorConfig = {
    fpsSampleMs: 1000,
    inpThreshold: 50,
    longTaskThreshold: 50,
    maxSamples: 256,
    maxOperations: 50,
  };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should handle missing PerformanceObserver gracefully', () => {
    // Arrange - Remove PerformanceObserver
    const originalObserver = global.PerformanceObserver;
    (global as any).PerformanceObserver = undefined;

    // Act
    const monitor = createLiveMonitor(defaultConfig);
    monitor.start();

    // Assert - Should not crash, manual recording should still work
    expect(() => monitor.record('fps', 60)).not.toThrow();
    expect(monitor.getStats('fps')?.count).toBe(1);

    // Cleanup
    monitor.stop();
    global.PerformanceObserver = originalObserver;
  });

  it('should handle PerformanceObserver.observe() throwing', () => {
    // Arrange - Mock observer that throws on observe
    global.PerformanceObserver = vi.fn(() => ({
      observe: vi.fn(() => {
        throw new Error('observe() not supported');
      }),
      disconnect: vi.fn(),
      takeRecords: vi.fn(() => []),
    })) as any;

    // Act - Should not crash
    const monitor = createLiveMonitor(defaultConfig);
    expect(() => monitor.start()).not.toThrow();

    // Manual recording should still work
    monitor.record('fps', 60);
    expect(monitor.getStats('fps')?.count).toBe(1);

    // Cleanup
    monitor.stop();
  });

  it('should handle subscribe and unsubscribe correctly', () => {
    // Arrange
    const monitor = createLiveMonitor(defaultConfig);
    const callback = vi.fn();

    // Act - Don't call start() to avoid RAF issues
    const unsubscribe = monitor.subscribe(callback);

    monitor.recordOperation('test', 10);
    expect(callback).toHaveBeenCalledTimes(1);

    unsubscribe();
    monitor.recordOperation('test2', 20);

    // Assert - Should not be called after unsubscribe
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple subscribers', () => {
    // Arrange
    const monitor = createLiveMonitor(defaultConfig);
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    // Act - Don't call start() to avoid RAF issues
    const unsub1 = monitor.subscribe(callback1);
    const unsub2 = monitor.subscribe(callback2);

    monitor.recordOperation('test', 10);

    // Assert - Both should be called
    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(1);

    // Unsubscribe one
    unsub1();
    monitor.recordOperation('test2', 20);

    // Assert - Only callback2 should be called
    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(2);

    // Cleanup
    unsub2();
  });

  it('should handle empty stats for metrics with no data', () => {
    // Arrange
    const monitor = createLiveMonitor(defaultConfig);

    // Act - Don't call start() to avoid RAF issues
    // Test with a real metric name that exists but has no data
    const stats = monitor.getStats('fps');

    // Assert
    expect(stats).toBeNull();
  });

  it('should record operations with timestamp', () => {
    // Arrange
    const monitor = createLiveMonitor(defaultConfig);
    
    // Act - Don't call start() to avoid RAF issues
    monitor.recordOperation('test-op', 42);

    const snapshot = monitor.getSnapshot();

    // Assert
    expect(snapshot.operations).toHaveLength(1);
    expect(snapshot.operations[0].label).toBe('test-op');
    expect(snapshot.operations[0].duration).toBe(42);
    // Just verify timestamp exists and is a number
    expect(typeof snapshot.operations[0].timestamp).toBe('number');
    expect(snapshot.operations[0].timestamp).toBeGreaterThan(0);
  });

  it('should maintain operations log size limit', () => {
    // Arrange
    const monitor = createLiveMonitor({ ...defaultConfig, maxOperations: 5 });
    
    // Act - Don't call start() to avoid RAF issues
    for (let i = 0; i < 10; i++) {
      monitor.recordOperation(`op-${i}`, i);
    }

    const snapshot = monitor.getSnapshot();

    // Assert - Should be limited to 5
    expect(snapshot.operations.length).toBeLessThanOrEqual(5);
  });
});
