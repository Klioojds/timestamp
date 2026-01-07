/**
 * Timezone Handler Tests
 * Tests for timezone computation and celebration state sync.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { ThemeController, WallClockTime, CelebrationState } from '@core/types';
import { createTimezoneManager, type TimezoneManagerOptions, type TimezoneManagerCallbacks } from './timezone-state-manager';
import { createMockTimePageRenderer, createTestContainer, removeTestContainer } from '@/test-utils/theme-test-helpers';
import { cleanupDOM } from '@/test-utils/dom-helpers';
import { createSafeMessageFromText } from '@core/utils/text';

// Mock the wall-clock conversion utilities (new location after refactor)
vi.mock('@core/time/wall-clock-conversion', () => ({
  convertWallClockToAbsolute: vi.fn((wallClock: WallClockTime, tz: string) => {
    // Create a Date from wall-clock for most timezones
    const baseDate = new Date(
      wallClock.year,
      wallClock.month,
      wallClock.day,
      wallClock.hours,
      wallClock.minutes,
      wallClock.seconds
    );
    // For 'Asia/Tokyo', return a time 9 hours earlier (ahead of UTC)
    if (tz === 'Asia/Tokyo') {
      return new Date(baseDate.getTime() - 9 * 60 * 60 * 1000);
    }
    // For 'America/Los_Angeles', return a time 8 hours later (behind UTC)
    if (tz === 'America/Los_Angeles') {
      return new Date(baseDate.getTime() + 8 * 60 * 60 * 1000);
    }
    return baseDate;
  }),
  hasWallClockTimeReached: vi.fn((_wallClock: WallClockTime, tz: string) => {
    // Mock: Tokyo has already reached the target, LA hasn't
    if (tz === 'Asia/Tokyo') return true;
    if (tz === 'already-celebrated') return true;
    return false;
  }),
}));

vi.mock('@core/url', () => ({
  syncTimezoneToUrl: vi.fn(),
}));

describe('TimezoneHandler', () => {
  let container: HTMLElement;
  let mockCallbacks: TimezoneManagerCallbacks;
  let mockStateManager: {
    setTimezone: ReturnType<typeof vi.fn>;
    getCelebrationState: ReturnType<typeof vi.fn<[], CelebrationState>>;
    setCelebrationState: ReturnType<typeof vi.fn>;
    markCelebrated: ReturnType<typeof vi.fn>;
    resetCelebration: ReturnType<typeof vi.fn>;
    setComplete: ReturnType<typeof vi.fn>;
  };
  let mockTheme: ThemeController;

  beforeEach(() => {
    container = createTestContainer('timezone-manager-container');

    mockTheme = createMockTimePageRenderer({
      onCelebrated: vi.fn(),
      onCounting: vi.fn(),
    });

    mockCallbacks = {
      getCurrentTheme: vi.fn(() => mockTheme),
      getCelebrationDisplay: vi.fn(() => ({
        message: createSafeMessageFromText('2026'),
        fullMessage: 'Happy New Year 2026!',
      })),
      getTargetDate: vi.fn(() => new Date(2026, 0, 1, 0, 0, 0)),
      setTargetDate: vi.fn(),
      setComplete: vi.fn(),
      triggerCountdownUpdate: vi.fn(),
      getLastTime: vi.fn(() => ({ days: 5, hours: 3, minutes: 30, seconds: 15, total: 500000000 })),
      isComplete: vi.fn(() => false),
      updateWorldMap: vi.fn(),
    };

    mockStateManager = {
      setTimezone: vi.fn(),
      getCelebrationState: vi.fn(() => 'counting'),
      setCelebrationState: vi.fn(),
      markCelebrated: vi.fn(),
      hasCelebrated: vi.fn(() => false),
      resetCelebration: vi.fn(),
      setComplete: vi.fn(),
    };

    vi.clearAllMocks();
  });

  afterEach(() => {
    removeTestContainer(container);
    cleanupDOM();
    vi.restoreAllMocks();
  });

  function createDefaultOptions(overrides?: Partial<TimezoneManagerOptions>): TimezoneManagerOptions {
    const defaultWallClock: WallClockTime = {
      year: 2026,
      month: 0, // January
      day: 1,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
    return {
      initialTimezone: 'America/New_York',
      wallClockTarget: defaultWallClock,
      mode: 'wall-clock',
      getCurrentThemeId: () => 'contribution-graph',
      config: {
        mode: 'wall-clock',
        targetDate: new Date(2026, 0, 1, 0, 0, 0),
        wallClockTarget: defaultWallClock,
        theme: 'contribution-graph',
        timezone: 'America/New_York',
        completionMessage: '',
      },
      container,
      stateManager: mockStateManager,
      callbacks: mockCallbacks,
      ...overrides,
    };
  }

  describe('createTimezoneManager', () => {
    it('should create a timezone manager with initial timezone', () => {
      const manager = createTimezoneManager(createDefaultOptions());

      expect(manager.getCurrentTimezone()).toBe('America/New_York');
    });

    it('should expose wall clock target', () => {
      const wallClock: WallClockTime = {
        year: 2026,
        month: 0,
        day: 1,
        hours: 0,
        minutes: 0,
        seconds: 0,
      };
      const manager = createTimezoneManager(createDefaultOptions({ wallClockTarget: wallClock }));

      expect(manager.getWallClockTarget()).toEqual(wallClock);
    });

    it('should calculate target date from wall clock and timezone', () => {
      const manager = createTimezoneManager(createDefaultOptions());

      expect(manager.getTargetDate()).toBeDefined();
      expect(manager.getTargetDate() instanceof Date).toBe(true);
    });
  });

  describe('setTimezone - date mode', () => {
    it('should update current timezone', () => {
      const manager = createTimezoneManager(createDefaultOptions());

      manager.setTimezone('Europe/London');

      expect(manager.getCurrentTimezone()).toBe('Europe/London');
    });

    it('should call stateManager.setTimezone', () => {
      const manager = createTimezoneManager(createDefaultOptions());

      manager.setTimezone('Europe/London');

      expect(mockStateManager.setTimezone).toHaveBeenCalledWith('Europe/London');
    });

    it('should trigger countdown update', () => {
      const manager = createTimezoneManager(createDefaultOptions());

      manager.setTimezone('Europe/London');

      expect(mockCallbacks.triggerCountdownUpdate).toHaveBeenCalled();
    });

    it('should update world map', () => {
      const manager = createTimezoneManager(createDefaultOptions());

      manager.setTimezone('Europe/London');

      expect(mockCallbacks.updateWorldMap).toHaveBeenCalledWith('Europe/London');
    });

    it.each([
      {
        timezone: 'Asia/Tokyo',
        expectedState: 'celebrated',
        expectedComplete: true,
        expectedCelebratingAttr: 'true',
        description: 'transition to celebrated when target already reached',
        setupCelebrated: false,
      },
      {
        timezone: 'America/Los_Angeles',
        expectedState: 'counting',
        expectedComplete: false,
        expectedCelebratingAttr: null,
        description: 'transition back to counting when target not reached',
        setupCelebrated: true,
      },
    ])('should $description', ({
      timezone,
      expectedState,
      expectedComplete,
      expectedCelebratingAttr,
      setupCelebrated,
    }) => {
      if (setupCelebrated) {
        mockStateManager.getCelebrationState = vi.fn(() => 'celebrated');
      }

      const manager = createTimezoneManager(createDefaultOptions());

      manager.setTimezone(timezone);

      if (expectedState === 'celebrated') {
        expect(mockStateManager.setCelebrationState).toHaveBeenCalledWith('celebrated');
      } else if (setupCelebrated) {
        expect(mockStateManager.resetCelebration).toHaveBeenCalled();
      }
      expect(mockStateManager.setComplete).toHaveBeenCalledWith(expectedComplete);
      expect(container.getAttribute('data-celebrating')).toBe(expectedCelebratingAttr);
    });

    it('should call onCelebrated hook when transitioning to celebrated', () => {
      const onCelebratedMock = vi.fn();
      const theme = createMockTimePageRenderer({
        onCelebrated: onCelebratedMock,
        onCounting: vi.fn(),
      });
      mockCallbacks.getCurrentTheme = vi.fn(() => theme);

      const manager = createTimezoneManager(createDefaultOptions());

      manager.setTimezone('Asia/Tokyo');

      // SafeMessage is passed - check structure
      expect(onCelebratedMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.objectContaining({
            forTextContent: '2026',
            forInnerHTML: expect.any(String),
          }),
          fullMessage: 'Happy New Year 2026!',
        })
      );
    });

    it('should call onCounting hook when transitioning from celebrating to counting', () => {
      const onCountingMock = vi.fn();
      const theme = createMockTimePageRenderer({
        onCelebrated: vi.fn(),
        onCounting: onCountingMock,
      });
      mockCallbacks.getCurrentTheme = vi.fn(() => theme);

      mockStateManager.getCelebrationState = vi.fn(() => 'celebrated'); // Start celebrated

      const manager = createTimezoneManager(createDefaultOptions());

      manager.setTimezone('America/Los_Angeles');

      expect(onCountingMock).toHaveBeenCalled();
    });

    it('should not call onCounting hook when already counting', () => {
      const onCountingMock = vi.fn();
      const theme = createMockTimePageRenderer({
        onCelebrated: vi.fn(),
        onCounting: onCountingMock,
      });
      mockCallbacks.getCurrentTheme = vi.fn(() => theme);

      // Machine starts in counting state (default)

      const manager = createTimezoneManager(createDefaultOptions());

      manager.setTimezone('America/Los_Angeles');

      expect(onCountingMock).not.toHaveBeenCalled();
    });
  });

  describe('setTimezone - timer mode', () => {
    it('should not change target date in timer mode', () => {
      const fixedTarget = new Date(2026, 0, 1, 0, 0, 0);
      const manager = createTimezoneManager(createDefaultOptions({
        mode: 'timer',
        wallClockTarget: fixedTarget,
      }));

      const initialTarget = manager.getTargetDate();
      manager.setTimezone('Asia/Tokyo');

      // Target should remain unchanged in timer mode
      expect(mockCallbacks.setTargetDate).not.toHaveBeenCalled();
      expect(manager.getTargetDate().getTime()).toBe(initialTarget.getTime());
    });

    it('should still update timezone in state manager for timer mode', () => {
      const manager = createTimezoneManager(createDefaultOptions({
        mode: 'timer',
      }));

      manager.setTimezone('Europe/London');

      expect(mockStateManager.setTimezone).toHaveBeenCalledWith('Europe/London');
      expect(manager.getCurrentTimezone()).toBe('Europe/London');
    });

    it('should still sync world map in timer mode', () => {
      const manager = createTimezoneManager(createDefaultOptions({
        mode: 'timer',
      }));

      manager.setTimezone('Europe/London');

      expect(mockCallbacks.updateWorldMap).toHaveBeenCalledWith('Europe/London');
    });
  });

  describe('aria-label updates', () => {
    it('should update aria-label to completion message when celebrated', () => {
      // Track completion state for this test
      let isComplete = false;
      mockStateManager.setComplete = vi.fn((complete: boolean) => {
        isComplete = complete;
      });
      mockCallbacks.isComplete = vi.fn(() => isComplete);

      const manager = createTimezoneManager(createDefaultOptions());

      manager.setTimezone('Asia/Tokyo');

      expect(container.getAttribute('aria-label')).toBe('The countdown has completed.');
    });

    it('should update aria-label with time when counting', () => {
      mockCallbacks.isComplete = vi.fn(() => false);
      mockCallbacks.getLastTime = vi.fn(() => ({
        days: 5,
        hours: 3,
        minutes: 30,
        seconds: 15,
        total: 500000000,
      }));

      const manager = createTimezoneManager(createDefaultOptions());

      manager.setTimezone('America/Los_Angeles');

      expect(container.getAttribute('aria-label')).toContain('5 days');
      expect(container.getAttribute('aria-label')).toContain('3 hours');
    });
  });

  describe('URL sync', () => {
    it('should sync timezone to URL', async () => {
      const { syncTimezoneToUrl } = await import('@core/url');
      const manager = createTimezoneManager(createDefaultOptions());

      manager.setTimezone('Europe/Paris');

      expect(syncTimezoneToUrl).toHaveBeenCalledWith(
        'Europe/Paris',
        expect.objectContaining({
          timezone: 'Europe/Paris',
          theme: 'contribution-graph',
        })
      );
    });
  });
});
