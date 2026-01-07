/**
 * @file time-handlers.test.ts
 * @description Unit tests for the time event handlers module
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import type { TimeRemaining } from '@core/types';
import { createCountdownHandlersFixture } from '@/test-utils/orchestrator-fixtures';
import { createTimeEventHandlers, type TimeEventHandlerOptions } from './event-handlers';

// Mock theme-focus-preservation
vi.mock('../theme-manager/theme-focus-preservation', () => ({
  getCountdownAccessibleName: vi.fn((time, isComplete) => {
    if (isComplete || !time) return 'The countdown has completed.';
    return `${time.days} days, ${time.hours} hours remaining`;
  }),
}));

describe('createTimeEventHandlers', () => {
  const buildHandlers = (overrides?: Parameters<typeof createCountdownHandlersFixture>[0]) => {
    const builtFixture = createCountdownHandlersFixture(overrides ?? {});
    const handlers = createTimeEventHandlers(
      builtFixture.options as TimeEventHandlerOptions
    );

    return { ...builtFixture, handlers };
  };

  type Fixture = ReturnType<typeof buildHandlers>;

  let fixture: Fixture | null = null;

  afterEach(() => {
    fixture?.cleanup();
    fixture = null;
  });

  describe('handleTick', () => {
    it.each([
      { state: 'counting' as const, expectUpdate: true, label: 'update countdown while counting' },
      { state: 'celebrating' as const, expectUpdate: false, label: 'skip countdown updates during celebration' },
    ])('should $label', ({ state, expectUpdate }) => {
      fixture = buildHandlers({ celebrationState: state });

      const time = { days: 1, hours: 2, minutes: 3, seconds: 4, total: 100000 };
      fixture.handlers.handleTick(time as unknown as TimeRemaining);

      if (expectUpdate) {
        expect(fixture.mocks.theme.updateTime).toHaveBeenCalledWith(time);
      } else {
        expect(fixture.mocks.theme.updateTime).not.toHaveBeenCalled();
      }
      expect(fixture.mocks.accessibilityManager.announceCountdown).toHaveBeenCalledWith(time);
    });

    it('should update aria label when it changes', () => {
      fixture = buildHandlers();

      const time = { days: 1, hours: 2, minutes: 3, seconds: 4, total: 100000 };
      fixture.handlers.handleTick(time as unknown as TimeRemaining);

      expect(fixture.container.getAttribute('aria-label')).toBe('1 days, 2 hours remaining');
    });
  });

  describe('handleComplete', () => {
    it('should transition to celebration and notify dependents', () => {
      fixture = buildHandlers();

      fixture.handlers.handleComplete();

      expect(fixture.mocks.stateManager.setCelebrationState).toHaveBeenCalledWith('celebrating');
      expect(fixture.mocks.stateManager.markCelebrated).toHaveBeenCalled();
      expect(fixture.mocks.stateManager.setComplete).toHaveBeenCalledWith(true);
      // SafeMessage is passed - check structure
      expect(fixture.mocks.theme.onCelebrating).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.objectContaining({
            forTextContent: 'DONE!',
            forInnerHTML: expect.any(String),
          }),
          fullMessage: expect.any(String),
        })
      );
      expect(fixture.container.getAttribute('data-celebrating')).toBe('true');
      expect(fixture.container.getAttribute('aria-label')).toBe('The countdown has completed.');
    });
  });

  describe('aria label tracking', () => {
    it('should track last aria label', () => {
      fixture = buildHandlers();

      expect(fixture.handlers.getLastAriaLabel()).toBe('');

      fixture.handlers.setLastAriaLabel('Test label');
      expect(fixture.handlers.getLastAriaLabel()).toBe('Test label');
    });
  });
});
