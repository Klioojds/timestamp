/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handlePlayPause, handleReset } from './timer-playback-controls';
import type { TimerControlDependencies } from './timer-playback-controls';
import type { TimeLoop } from './tick-scheduler';
import type { StateManager } from '@core/state';

describe('timer-controls', () => {
  describe('handlePlayPause', () => {
    it('should resume timer and recalculate target date when playing', () => {
      const updateTargetDate = vi.fn();
      const timeLoop = {
        isPaused: vi.fn(() => true),
        getPausedRemainingMs: vi.fn(() => 5000),
        resume: vi.fn(),
        pause: vi.fn(),
      } as unknown as TimeLoop;

      handlePlayPause(true, {
        mode: 'timer',
        timeLoop,
        updateTargetDate,
      });

      expect(timeLoop.getPausedRemainingMs).toHaveBeenCalled();
      expect(updateTargetDate).toHaveBeenCalledWith(expect.any(Date));
      expect(timeLoop.resume).toHaveBeenCalled();
    });

    it('should pause timer when stopping', () => {
      const updateTargetDate = vi.fn();
      const timeLoop = {
        pause: vi.fn(),
        resume: vi.fn(),
      } as unknown as TimeLoop;

      handlePlayPause(false, {
        mode: 'timer',
        timeLoop,
        updateTargetDate,
      });

      expect(timeLoop.pause).toHaveBeenCalled();
      expect(timeLoop.resume).not.toHaveBeenCalled();
    });

    it('should do nothing if mode is not timer', () => {
      const timeLoop = {
        pause: vi.fn(),
        resume: vi.fn(),
      } as unknown as TimeLoop;

      handlePlayPause(true, {
        mode: 'wall-clock',
        timeLoop,
        updateTargetDate: vi.fn(),
      });

      expect(timeLoop.pause).not.toHaveBeenCalled();
      expect(timeLoop.resume).not.toHaveBeenCalled();
    });
  });

  describe('handleReset', () => {
    let container: HTMLElement;
    let stateManager: StateManager;
    let timeLoop: TimeLoop;

    beforeEach(() => {
      container = document.createElement('div');
      stateManager = {
        getCelebrationState: vi.fn(() => 'counting'),
        resetCelebration: vi.fn(),
        setComplete: vi.fn(),
      } as unknown as StateManager;
      timeLoop = {
        isPaused: vi.fn(() => false),
        isRunning: vi.fn(() => true),
        setPausedRemainingMs: vi.fn(),
        forceUpdate: vi.fn(),
        start: vi.fn(),
      } as unknown as TimeLoop;
    });

    it('should reset timer to original duration', () => {
      const updateTargetDate = vi.fn();
      const deps: TimerControlDependencies = {
        mode: 'timer',
        originalDurationMs: 60000,
        timeLoop,
        stateManager,
        container,
        uiComponents: null,
        currentTheme: null,
        getTargetDate: () => new Date(),
        updateTargetDate,
      };

      handleReset(deps);

      expect(updateTargetDate).toHaveBeenCalledWith(expect.any(Date));
      expect(timeLoop.forceUpdate).toHaveBeenCalled();
    });

    it('should reset from celebrating state', () => {
      stateManager.getCelebrationState = vi.fn(() => 'celebrating');
      container.setAttribute('data-celebrating', 'true');
      const currentTheme = { onCounting: vi.fn() };
      const uiComponents = { timerControls: { setPlaying: vi.fn() } };

      const deps: TimerControlDependencies = {
        mode: 'timer',
        originalDurationMs: 60000,
        timeLoop,
        stateManager,
        container,
        uiComponents: uiComponents as any,
        currentTheme: currentTheme as any,
        getTargetDate: () => new Date(),
        updateTargetDate: vi.fn(),
      };

      handleReset(deps);

      expect(stateManager.resetCelebration).toHaveBeenCalled();
      expect(stateManager.setComplete).toHaveBeenCalledWith(false);
      expect(container.hasAttribute('data-celebrating')).toBe(false);
      expect(currentTheme.onCounting).toHaveBeenCalled();
      expect(uiComponents.timerControls.setPlaying).toHaveBeenCalledWith(true);
    });

    it('should update paused remaining time if paused', () => {
      timeLoop.isPaused = vi.fn(() => true);
      const deps: TimerControlDependencies = {
        mode: 'timer',
        originalDurationMs: 60000,
        timeLoop,
        stateManager,
        container,
        uiComponents: null,
        currentTheme: null,
        getTargetDate: () => new Date(),
        updateTargetDate: vi.fn(),
      };

      handleReset(deps);

      expect(timeLoop.setPausedRemainingMs).toHaveBeenCalledWith(60000);
    });

    it('should do nothing if mode is not timer', () => {
      const deps: TimerControlDependencies = {
        mode: 'wall-clock',
        originalDurationMs: 60000,
        timeLoop,
        stateManager,
        container,
        uiComponents: null,
        currentTheme: null,
        getTargetDate: () => new Date(),
        updateTargetDate: vi.fn(),
      };

      handleReset(deps);

      expect(timeLoop.forceUpdate).not.toHaveBeenCalled();
    });
  });
});
