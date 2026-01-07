/**
 * Time Loop Tests
 * Tests for interval scheduling and countdown state transitions.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTimeLoop } from './tick-scheduler';
import type { TimeRemaining } from '@core/types';

describe('TimeLoop', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('createTimeLoop', () => {
    it('should create a time loop that is not running initially', () => {
      const loop = createTimeLoop({
        getTargetDate: () => new Date(Date.now() + 10000),
        onTick: vi.fn(),
        onComplete: vi.fn(),
        isComplete: () => false,
      });

      expect(loop.isRunning()).toBe(false);
    });

    it('should have null lastTime before first tick', () => {
      const loop = createTimeLoop({
        getTargetDate: () => new Date(Date.now() + 10000),
        onTick: vi.fn(),
        onComplete: vi.fn(),
        isComplete: () => false,
      });

      expect(loop.getLastTime()).toBeNull();
    });
  });

  describe('start', () => {
    it('should invoke onTick immediately when started', () => {
      const onTick = vi.fn();
      const targetDate = new Date(Date.now() + 10000);

      const loop = createTimeLoop({
        getTargetDate: () => targetDate,
        onTick,
        onComplete: vi.fn(),
        isComplete: () => false,
      });

      loop.start();

      expect(onTick).toHaveBeenCalledTimes(1);
      expect(onTick).toHaveBeenCalledWith(expect.objectContaining({
        total: expect.any(Number),
        days: expect.any(Number),
        hours: expect.any(Number),
        minutes: expect.any(Number),
        seconds: expect.any(Number),
      }));
    });

    it('should set isRunning to true after starting', () => {
      const loop = createTimeLoop({
        getTargetDate: () => new Date(Date.now() + 10000),
        onTick: vi.fn(),
        onComplete: vi.fn(),
        isComplete: () => false,
      });

      loop.start();

      expect(loop.isRunning()).toBe(true);
    });

    it('should invoke onTick on each interval', () => {
      const onTick = vi.fn();

      const loop = createTimeLoop({
        getTargetDate: () => new Date(Date.now() + 10000),
        onTick,
        onComplete: vi.fn(),
        isComplete: () => false,
      });

      loop.start();
      expect(onTick).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(1000);
      expect(onTick).toHaveBeenCalledTimes(2);

      vi.advanceTimersByTime(1000);
      expect(onTick).toHaveBeenCalledTimes(3);

      loop.stop();
    });

    it('should not start multiple intervals if called multiple times', () => {
      const onTick = vi.fn();

      const loop = createTimeLoop({
        getTargetDate: () => new Date(Date.now() + 10000),
        onTick,
        onComplete: vi.fn(),
        isComplete: () => false,
      });

      loop.start();
      loop.start(); // Second call should be ignored
      loop.start(); // Third call should be ignored

      expect(onTick).toHaveBeenCalledTimes(1); // Only one immediate tick

      vi.advanceTimersByTime(1000);
      expect(onTick).toHaveBeenCalledTimes(2); // Only one interval running

      loop.stop();
    });
  });

  describe('stop', () => {
    it('should stop the interval', () => {
      const onTick = vi.fn();

      const loop = createTimeLoop({
        getTargetDate: () => new Date(Date.now() + 10000),
        onTick,
        onComplete: vi.fn(),
        isComplete: () => false,
      });

      loop.start();
      loop.stop();

      const callsAfterStop = onTick.mock.calls.length;

      vi.advanceTimersByTime(5000);
      expect(onTick).toHaveBeenCalledTimes(callsAfterStop); // No new calls
    });

    it('should set isRunning to false after stopping', () => {
      const loop = createTimeLoop({
        getTargetDate: () => new Date(Date.now() + 10000),
        onTick: vi.fn(),
        onComplete: vi.fn(),
        isComplete: () => false,
      });

      loop.start();
      expect(loop.isRunning()).toBe(true);

      loop.stop();
      expect(loop.isRunning()).toBe(false);
    });

    it('should be safe to call stop when not running', () => {
      const loop = createTimeLoop({
        getTargetDate: () => new Date(Date.now() + 10000),
        onTick: vi.fn(),
        onComplete: vi.fn(),
        isComplete: () => false,
      });

      // Should not throw
      expect(() => loop.stop()).not.toThrow();
    });
  });

  describe('tick', () => {
    it('should invoke onTick manually without starting interval', () => {
      const onTick = vi.fn();

      const loop = createTimeLoop({
        getTargetDate: () => new Date(Date.now() + 10000),
        onTick,
        onComplete: vi.fn(),
        isComplete: () => false,
      });

      loop.tick();

      expect(onTick).toHaveBeenCalledTimes(1);
      expect(loop.isRunning()).toBe(false);
    });

    it('should update lastTime on manual tick', () => {
      const loop = createTimeLoop({
        getTargetDate: () => new Date(Date.now() + 10000),
        onTick: vi.fn(),
        onComplete: vi.fn(),
        isComplete: () => false,
      });

      expect(loop.getLastTime()).toBeNull();

      loop.tick();

      expect(loop.getLastTime()).not.toBeNull();
      expect(loop.getLastTime()?.total).toBeGreaterThan(0);
    });
  });

  describe('completion detection', () => {
    it('should invoke onComplete when countdown reaches zero', () => {
      const onComplete = vi.fn();
      const onTick = vi.fn();
      
      // Start with target in the past - completion should be detected immediately
      const loop = createTimeLoop({
        getTargetDate: () => new Date(Date.now() - 1000), // Already past
        onTick,
        onComplete,
        isComplete: () => false,
      });

      loop.start();

      // Completion should be detected on the initial tick
      expect(onComplete).toHaveBeenCalledTimes(1);
      
      loop.stop();
    });

    it('should invoke onComplete when countdown transitions from counting to zero', () => {
      const onComplete = vi.fn();
      const onTick = vi.fn();

      // Start with target 1.5s in the future
      const startTime = Date.now();
      const loop = createTimeLoop({
        getTargetDate: () => new Date(startTime + 1500),
        onTick,
        onComplete,
        isComplete: () => false,
      });

      loop.start();
      expect(onTick).toHaveBeenCalledTimes(1); // Initial tick

      // Advance 1s - still counting
      vi.advanceTimersByTime(1000);
      expect(onTick).toHaveBeenCalledTimes(2);
      expect(onComplete).not.toHaveBeenCalled();

      // Advance another 1s - should trigger complete
      vi.advanceTimersByTime(1000);
      expect(onComplete).toHaveBeenCalledTimes(1);

      loop.stop();
    });

    it('should not invoke onTick after completion', () => {
      const onComplete = vi.fn();
      const onTick = vi.fn();
      let complete = false;

      // Start with target already passed
      const loop = createTimeLoop({
        getTargetDate: () => new Date(Date.now() - 1000), // Already past
        onTick,
        onComplete: () => {
          complete = true;
          onComplete();
        },
        isComplete: () => complete,
      });

      loop.start();
      // Should have called onComplete, not onTick (since time.total <= 0)
      expect(onComplete).toHaveBeenCalled();
      expect(onTick).not.toHaveBeenCalled(); // onTick is not called when completing

      // Additional time should not trigger more ticks or completions
      vi.advanceTimersByTime(5000);
      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(onTick).not.toHaveBeenCalled();

      loop.stop();
    });

    it('should skip processing if already complete', () => {
      const onComplete = vi.fn();
      const onTick = vi.fn();

      const loop = createTimeLoop({
        getTargetDate: () => new Date(Date.now() + 10000),
        onTick,
        onComplete,
        isComplete: () => true, // Already complete
      });

      loop.start();
      vi.advanceTimersByTime(3000);

      expect(onTick).not.toHaveBeenCalled();
      expect(onComplete).not.toHaveBeenCalled();

      loop.stop();
    });
  });

  describe('lastTime tracking', () => {
    it('should track the last calculated time', () => {
      let tickCount = 0;
      let capturedTimes: TimeRemaining[] = [];

      const loop = createTimeLoop({
        getTargetDate: () => new Date(Date.now() + 10000),
        onTick: (time) => {
          tickCount++;
          capturedTimes.push(time);
        },
        onComplete: vi.fn(),
        isComplete: () => false,
      });

      loop.start();
      vi.advanceTimersByTime(2000);

      expect(capturedTimes.length).toBe(3); // Initial + 2 intervals
      expect(loop.getLastTime()).toEqual(capturedTimes[capturedTimes.length - 1]);

      loop.stop();
    });
  });

  describe('custom tick interval', () => {
    it('should respect custom tick interval', () => {
      const onTick = vi.fn();

      const loop = createTimeLoop({
        getTargetDate: () => new Date(Date.now() + 60000),
        onTick,
        onComplete: vi.fn(),
        isComplete: () => false,
        tickInterval: 500, // 500ms interval
      });

      loop.start();
      expect(onTick).toHaveBeenCalledTimes(1); // Immediate tick

      vi.advanceTimersByTime(500);
      expect(onTick).toHaveBeenCalledTimes(2);

      vi.advanceTimersByTime(500);
      expect(onTick).toHaveBeenCalledTimes(3);

      // At 1000ms with default interval, we'd only have 2 ticks
      // But with 500ms interval, we have 3 ticks
      loop.stop();
    });
  });

  describe('dynamic target date', () => {
    it('should recalculate using getTargetDate on each tick', () => {
      let targetOffset = 10000;
      const capturedTimes: TimeRemaining[] = [];

      const loop = createTimeLoop({
        getTargetDate: () => new Date(Date.now() + targetOffset),
        onTick: (time) => capturedTimes.push({ ...time }),
        onComplete: vi.fn(),
        isComplete: () => false,
      });

      loop.start();
      
      // Change target while running
      targetOffset = 60000;
      vi.advanceTimersByTime(1000);

      // The second tick should use the new target
      expect(capturedTimes.length).toBe(2);
      // Second tick should have more time remaining
      expect(capturedTimes[1].total).toBeGreaterThan(capturedTimes[0].total);

      loop.stop();
    });
  });

  describe('pause and resume', () => {
    it('should not be paused initially', () => {
      const loop = createTimeLoop({
        getTargetDate: () => new Date(Date.now() + 10000),
        onTick: vi.fn(),
        onComplete: vi.fn(),
        isComplete: () => false,
      });

      expect(loop.isPaused()).toBe(false);
    });

    it('should set isPaused to true after pausing', () => {
      const loop = createTimeLoop({
        getTargetDate: () => new Date(Date.now() + 10000),
        onTick: vi.fn(),
        onComplete: vi.fn(),
        isComplete: () => false,
      });

      loop.start();
      loop.pause();

      expect(loop.isPaused()).toBe(true);
    });

    it('should stop ticks when paused', () => {
      const onTick = vi.fn();

      const loop = createTimeLoop({
        getTargetDate: () => new Date(Date.now() + 10000),
        onTick,
        onComplete: vi.fn(),
        isComplete: () => false,
      });

      loop.start();
      expect(onTick).toHaveBeenCalledTimes(1);

      loop.pause();
      const callsAfterPause = onTick.mock.calls.length;

      vi.advanceTimersByTime(5000);
      expect(onTick).toHaveBeenCalledTimes(callsAfterPause);

      loop.stop();
    });

    it('should store remaining time on pause', () => {
      const loop = createTimeLoop({
        getTargetDate: () => new Date(Date.now() + 10000),
        onTick: vi.fn(),
        onComplete: vi.fn(),
        isComplete: () => false,
      });

      loop.start();
      loop.pause();

      const remainingMs = loop.getPausedRemainingMs();
      expect(remainingMs).not.toBeNull();
      expect(remainingMs).toBeGreaterThan(0);
      expect(remainingMs).toBeLessThanOrEqual(10000);
    });

    it('should resume ticks after resuming', () => {
      const onTick = vi.fn();

      const loop = createTimeLoop({
        getTargetDate: () => new Date(Date.now() + 10000),
        onTick,
        onComplete: vi.fn(),
        isComplete: () => false,
      });

      loop.start();
      loop.pause();
      
      const callsAfterPause = onTick.mock.calls.length;
      
      loop.resume();
      expect(loop.isPaused()).toBe(false);

      // Resume triggers immediate tick
      expect(onTick).toHaveBeenCalledTimes(callsAfterPause + 1);

      // Continue ticking
      vi.advanceTimersByTime(1000);
      expect(onTick).toHaveBeenCalledTimes(callsAfterPause + 2);

      loop.stop();
    });

    it('should handle rapid pause/resume cycles', () => {
      const onTick = vi.fn();

      const loop = createTimeLoop({
        getTargetDate: () => new Date(Date.now() + 10000),
        onTick,
        onComplete: vi.fn(),
        isComplete: () => false,
      });

      loop.start();
      expect(onTick).toHaveBeenCalledTimes(1);

      // Rapid pause/resume
      loop.pause();
      loop.resume();
      loop.pause();
      loop.resume();

      expect(loop.isPaused()).toBe(false);
      expect(loop.isRunning()).toBe(true);

      vi.advanceTimersByTime(1000);
      // Should still be ticking normally
      expect(onTick.mock.calls.length).toBeGreaterThan(1);

      loop.stop();
    });

    it('should not pause if already paused', () => {
      const loop = createTimeLoop({
        getTargetDate: () => new Date(Date.now() + 10000),
        onTick: vi.fn(),
        onComplete: vi.fn(),
        isComplete: () => false,
      });

      loop.start();
      loop.pause();
      const firstPausedMs = loop.getPausedRemainingMs();

      // Wait a bit and pause again
      vi.advanceTimersByTime(1000);
      loop.pause();
      
      // Should still have the original paused time
      expect(loop.getPausedRemainingMs()).toBe(firstPausedMs);
    });

    it('should not resume if not paused', () => {
      const onTick = vi.fn();

      const loop = createTimeLoop({
        getTargetDate: () => new Date(Date.now() + 10000),
        onTick,
        onComplete: vi.fn(),
        isComplete: () => false,
      });

      loop.start();
      const callsAfterStart = onTick.mock.calls.length;

      // Resume without pause should do nothing
      loop.resume();

      expect(onTick).toHaveBeenCalledTimes(callsAfterStart);
      loop.stop();
    });

    it('should not pause during celebration (when complete)', () => {
      let complete = false;

      const loop = createTimeLoop({
        getTargetDate: () => new Date(Date.now() - 1000), // Already complete
        onTick: vi.fn(),
        onComplete: () => { complete = true; },
        isComplete: () => complete,
      });

      loop.start();
      expect(complete).toBe(true);

      // Try to pause - should be ignored
      loop.pause();
      expect(loop.isPaused()).toBe(false);
      expect(loop.getPausedRemainingMs()).toBeNull();
    });

    it('should return null for getPausedRemainingMs when never paused', () => {
      const loop = createTimeLoop({
        getTargetDate: () => new Date(Date.now() + 10000),
        onTick: vi.fn(),
        onComplete: vi.fn(),
        isComplete: () => false,
      });

      expect(loop.getPausedRemainingMs()).toBeNull();

      loop.start();
      expect(loop.getPausedRemainingMs()).toBeNull();

      loop.stop();
    });

    it('should stop interval on pause but maintain paused state', () => {
      const loop = createTimeLoop({
        getTargetDate: () => new Date(Date.now() + 10000),
        onTick: vi.fn(),
        onComplete: vi.fn(),
        isComplete: () => false,
      });

      loop.start();
      expect(loop.isRunning()).toBe(true);

      loop.pause();
      expect(loop.isRunning()).toBe(false);
      expect(loop.isPaused()).toBe(true);
    });

    it('should update paused remaining time via setPausedRemainingMs when paused', () => {
      const loop = createTimeLoop({
        getTargetDate: () => new Date(Date.now() + 60000),
        onTick: vi.fn(),
        onComplete: vi.fn(),
        isComplete: () => false,
      });

      loop.start();
      loop.pause();

      // Initial paused time should be around 60000ms
      expect(loop.getPausedRemainingMs()).toBeGreaterThan(50000);

      // Update to a different value (e.g., reset to 2 minutes)
      loop.setPausedRemainingMs(120000);
      expect(loop.getPausedRemainingMs()).toBe(120000);

      loop.stop();
    });

    it('should not update paused remaining time when not paused', () => {
      const loop = createTimeLoop({
        getTargetDate: () => new Date(Date.now() + 60000),
        onTick: vi.fn(),
        onComplete: vi.fn(),
        isComplete: () => false,
      });

      loop.start();

      // Not paused, so setPausedRemainingMs should have no effect
      loop.setPausedRemainingMs(120000);
      
      // pausedRemainingMs should still be null since never paused
      expect(loop.getPausedRemainingMs()).toBeNull();

      loop.stop();
    });

    it('should update display via forceUpdate even when paused', () => {
      const onTick = vi.fn();
      const loop = createTimeLoop({
        getTargetDate: () => new Date(Date.now() + 60000),
        onTick,
        onComplete: vi.fn(),
        isComplete: () => false,
      });

      loop.start();
      onTick.mockClear(); // Clear the initial tick call

      loop.pause();
      
      // Normal tick should not call onTick when paused
      loop.tick();
      expect(onTick).not.toHaveBeenCalled();
      
      // forceUpdate should call onTick even when paused
      loop.forceUpdate();
      expect(onTick).toHaveBeenCalledTimes(1);

      loop.stop();
    });

    it('should update display via forceUpdate when not paused', () => {
      const onTick = vi.fn();
      const loop = createTimeLoop({
        getTargetDate: () => new Date(Date.now() + 60000),
        onTick,
        onComplete: vi.fn(),
        isComplete: () => false,
      });

      loop.start();
      onTick.mockClear();

      loop.forceUpdate();
      expect(onTick).toHaveBeenCalledTimes(1);

      loop.stop();
    });

    it('should preserve paused remaining time value after resuming', () => {
      const loop = createTimeLoop({
        getTargetDate: () => new Date(Date.now() + 20000),
        onTick: vi.fn(),
        onComplete: vi.fn(),
        isComplete: () => false,
      });

      loop.start();
      loop.pause();

      const capturedPausedMs = loop.getPausedRemainingMs();
      expect(capturedPausedMs).not.toBeNull();

      loop.resume();

      expect(loop.isPaused()).toBe(false);
      expect(loop.getPausedRemainingMs()).toBe(capturedPausedMs);

      loop.stop();
    });
  });
});
