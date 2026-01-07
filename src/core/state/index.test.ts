/**
 * App State Unit Tests
 *
 * Note: validateThemeId is tested in registry-validation.test.ts since it's
 * imported from @themes/registry.
 */

import { describe, it, expect, vi } from 'vitest';
import { withFakeTimers } from '@/test-utils/time-helpers';
import { createStateManager } from '.';

describe('createStateManager', () => {
  const runWithTimers = async (fn: () => void | Promise<void>) => {
    await withFakeTimers(async () => {
      localStorage.clear();
      try {
        await fn();
      } finally {
        localStorage.clear();
        vi.restoreAllMocks();
      }
    });
  };

  const withManager = async (
    options: Parameters<typeof createStateManager>[0] = {},
    run: (manager: ReturnType<typeof createStateManager>) => void | Promise<void>,
  ) =>
    runWithTimers(async () => {
      const manager = createStateManager(options);
      try {
        await run(manager);
      } finally {
        manager.destroy();
      }
    });

  it('should initialize with default values when no options provided', async () => {
    await withManager({}, manager => {
      const state = manager.getState();

      expect(state.selectedTheme).toBe('contribution-graph');
      expect(state.isComplete).toBe(false);
      expect(state.countdownMode).toBe('wall-clock');
      expect(state.completionMessage).toBe("Time's up!");
      expect(state.durationSeconds).toBeUndefined();
    });
  });

  it('should initialize with provided values when options supplied', async () => {
    const targetDate = new Date('2025-01-01');
    await withManager(
      {
        initialTheme: 'fireworks',
        initialTimezone: 'America/New_York',
        targetDate,
        countdownMode: 'timer',
        completionMessage: 'Custom!',
        durationSeconds: 120,
      },
      manager => {
        const state = manager.getState();
        expect(state.selectedTheme).toBe('fireworks');
        expect(state.selectedTimezone).toBe('America/New_York');
        expect(state.targetDate).toEqual(targetDate);
        expect(state.countdownMode).toBe('timer');
        expect(state.completionMessage).toBe('Custom!');
        expect(state.durationSeconds).toBe(120);
      },
    );
  });

  describe('setTheme', () => {
    it('should update theme and notify subscribers when value changes', async () => {
      await withManager({}, manager => {
        const callback = vi.fn();
        manager.subscribe(callback);

        manager.setTheme('fireworks');

        expect(manager.getState().selectedTheme).toBe('fireworks');
        expect(callback).toHaveBeenCalledWith(
          expect.objectContaining({ selectedTheme: 'fireworks' }),
          expect.objectContaining({ selectedTheme: 'contribution-graph' })
        );
      });
    });

    it('should not notify subscribers when theme remains unchanged', async () => {
      await withManager({ initialTheme: 'contribution-graph' }, manager => {
        const callback = vi.fn();
        manager.subscribe(callback);

        manager.setTheme('contribution-graph');
        expect(callback).not.toHaveBeenCalled();
      });
    });

    it('should validate theme and fallback when value is invalid', async () => {
      await withManager({}, manager => {
        manager.setTheme('invalid' as any);

        expect(manager.getState().selectedTheme).toBe('contribution-graph');
      });
    });
  });

  describe('setCountdownMode', () => {
    it('should update countdown mode and notify subscribers when value changes', async () => {
      await withManager({ countdownMode: 'wall-clock' }, manager => {
        const callback = vi.fn();
        manager.subscribe(callback);

        manager.setCountdownMode('timer');

        expect(manager.getState().countdownMode).toBe('timer');
        expect(callback).toHaveBeenCalledWith(
          expect.objectContaining({ countdownMode: 'timer' }),
          expect.objectContaining({ countdownMode: 'wall-clock' })
        );
      });
    });
  });

  describe('setCompletionMessage', () => {
    it('should update completion message and notify subscribers when value changes', async () => {
      await withManager({ completionMessage: 'Initial' }, manager => {
        const callback = vi.fn();
        manager.subscribe(callback);

        manager.setCompletionMessage('Updated');

        expect(manager.getState().completionMessage).toBe('Updated');
        expect(callback).toHaveBeenCalledWith(
          expect.objectContaining({ completionMessage: 'Updated' }),
          expect.objectContaining({ completionMessage: 'Initial' })
        );
      });
    });
  });

  describe('setDurationSeconds', () => {
    it('should update duration and notify subscribers when value changes', async () => {
      await withManager({ durationSeconds: 60 }, manager => {
        const callback = vi.fn();
        manager.subscribe(callback);

        manager.setDurationSeconds(120);

        expect(manager.getState().durationSeconds).toBe(120);
        expect(callback).toHaveBeenCalledWith(
          expect.objectContaining({ durationSeconds: 120 }),
          expect.objectContaining({ durationSeconds: 60 })
        );
      });
    });

    it('should skip notification when duration is unchanged', async () => {
      await withManager({}, manager => {
        const callback = vi.fn();
        manager.subscribe(callback);

        manager.setDurationSeconds(undefined);

        expect(callback).not.toHaveBeenCalled();
      });
    });
  });

  describe('setTimezone', () => {
    it('should update timezone and notify subscribers when value changes', async () => {
      await withManager({ initialTimezone: 'America/New_York' }, manager => {
        const callback = vi.fn();
        manager.subscribe(callback);

        manager.setTimezone('Europe/London');

        expect(manager.getState().selectedTimezone).toBe('Europe/London');
        expect(callback).toHaveBeenCalled();
      });
    });

    it('should not notify subscribers when timezone remains unchanged', async () => {
      await withManager({ initialTimezone: 'UTC' }, manager => {
        const callback = vi.fn();
        manager.subscribe(callback);

        manager.setTimezone('UTC');

        expect(callback).not.toHaveBeenCalled();
      });
    });
  });

  describe('setComplete', () => {
    it('should update completion flag and notify subscribers when value changes', () => {
      const manager = createStateManager();
      const callback = vi.fn();
      manager.subscribe(callback);

      manager.setComplete(true);

      expect(manager.getState().isComplete).toBe(true);
      expect(callback).toHaveBeenCalled();
      manager.destroy();
    });
  });

  describe('subscribe', () => {
    it('should stop notifications when unsubscribe is called', () => {
      const manager = createStateManager();
      const callback = vi.fn();
      const unsubscribe = manager.subscribe(callback);

      unsubscribe();
      manager.setTheme('fireworks');

      expect(callback).not.toHaveBeenCalled();
      manager.destroy();
    });
  });

  describe('destroy', () => {
    it('should stop delivering updates after destroy', () => {
      const manager = createStateManager();
      const callback = vi.fn();
      manager.subscribe(callback);

      manager.destroy();
      manager.setTheme('fireworks');

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('subscriber isolation', () => {
    it('should continue notifying remaining subscribers when one throws', async () => {
      await withManager({}, manager => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const throwingSubscriber = vi.fn(() => {
          throw new Error('boom');
        });
        const healthySubscriber = vi.fn();

        manager.subscribe(throwingSubscriber);
        manager.subscribe(healthySubscriber);

        manager.setTheme('fireworks');

        expect(healthySubscriber).toHaveBeenCalled();
        expect(errorSpy).toHaveBeenCalled();
      });
    });
  });
});
