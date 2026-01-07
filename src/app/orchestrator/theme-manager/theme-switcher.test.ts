/**
 * Theme Transition Manager Tests
 * Tests for theme switching with abort handling and focus preservation.
 */
import { describe, it, expect, afterEach, vi, type Mock } from 'vitest';
import { createThemeTransitionFixture } from '@/test-utils/orchestrator-fixtures';
import { createThemeTransitionManager } from './theme-switcher';

// Mock external dependencies
vi.mock('@core/perf/perf-monitor', () => ({
  measureAsync: vi.fn(async (_name: string, fn: () => Promise<void>) => {
    await fn();
    return { duration: 10 };
  }),
}));

vi.mock('@core/url', () => ({
  syncThemeToUrl: vi.fn(),
}));

vi.mock('@themes/registry', () => ({
  getThemeDisplayName: vi.fn((themeId: string) => themeId),
}));

vi.mock('./theme-focus-preservation', () => ({
  setupThemeContainer: vi.fn(),
  preserveFocusWithin: vi.fn(() => null),
  restoreFocusWithin: vi.fn(),
  getCountdownAccessibleName: vi.fn(() => 'Countdown: 5 days'),
}));

describe('ThemeTransitionManager', () => {
  const buildManager = (
    overrides?: Parameters<typeof createThemeTransitionFixture>[0]
  ) => {
    const fixture = createThemeTransitionFixture(overrides);
    const manager = createThemeTransitionManager(fixture.options);
    return { ...fixture, manager };
  };

  type Fixture = ReturnType<typeof buildManager>;

  let fixture: Fixture | null = null;

  afterEach(() => {
    fixture?.cleanup();
    fixture = null;
  });

  describe('createThemeTransitionManager', () => {
    it('should initially have no pending switch', () => {
      fixture = buildManager();

      expect(fixture.manager.getPendingSwitch()).toBeNull();
    });

    it('should initially allow switching', () => {
      fixture = buildManager();

      expect(fixture.manager.canSwitch()).toBe(true);
    });
  });

  describe('switchTheme', () => {
    it('should skip if switching to the same theme', async () => {
      fixture = buildManager();

      await fixture.manager.switchTheme('contribution-graph');

      expect(fixture.options.loadTheme).not.toHaveBeenCalled();
    });

    it('should load new theme when switching to different theme', async () => {
      fixture = buildManager();

      await fixture.manager.switchTheme('fireworks');

      expect(fixture.options.loadTheme).toHaveBeenCalledWith('fireworks');
    });

    it('should mount new theme in temp container first', async () => {
      fixture = buildManager();

      await fixture.manager.switchTheme('fireworks');

      expect(fixture.mocks.newTheme.mount).toHaveBeenCalled();
      const mountCall = (fixture.mocks.newTheme.mount as Mock).mock.calls[0];
      expect(mountCall[0]).not.toBe(fixture.container);
    });

    it('should destroy old theme before swapping', async () => {
      fixture = buildManager();

      await fixture.manager.switchTheme('fireworks');

      expect(fixture.mocks.currentTheme.destroy).toHaveBeenCalled();
    });

    it('should call setCurrentTheme with new theme', async () => {
      fixture = buildManager();

      await fixture.manager.switchTheme('fireworks');

      expect(fixture.mocks.setCurrentTheme).toHaveBeenCalledWith(fixture.mocks.newTheme, 'fireworks');
    });

    it('should update container on new theme', async () => {
      fixture = buildManager();

      await fixture.manager.switchTheme('fireworks');

      expect(fixture.mocks.newTheme.updateContainer).toHaveBeenCalledWith(fixture.container);
    });

    it('should announce theme change', async () => {
      fixture = buildManager();

      await fixture.manager.switchTheme('fireworks');

      expect(fixture.options.announceThemeChange).toHaveBeenCalledWith('fireworks');
    });

    it('should sync theme to URL', async () => {
      const { syncThemeToUrl } = await import('@core/url');
      fixture = buildManager();

      await fixture.manager.switchTheme('fireworks');

      expect(syncThemeToUrl).toHaveBeenCalledWith(
        'fireworks',
        expect.objectContaining({
          theme: 'fireworks',
          timezone: 'America/New_York',
        })
      );
    });

    it('should update countdown on new theme if not complete', async () => {
      fixture = buildManager();

      await fixture.manager.switchTheme('fireworks');

      expect(fixture.mocks.newTheme.updateTime).toHaveBeenCalledWith(
        expect.objectContaining({
          days: 5,
          hours: 3,
          minutes: 30,
        })
      );
    });

    it('should call onCelebrated on new theme if complete', async () => {
      fixture = buildManager({ isComplete: () => true });

      await fixture.manager.switchTheme('fireworks');

      // SafeMessage is passed - check structure
      expect(fixture.mocks.newTheme.onCelebrated).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.objectContaining({
            forTextContent: '2026',
            forInnerHTML: expect.any(String),
          }),
          fullMessage: 'Happy New Year 2026!',
        })
      );
    });

    it('should call onThemeSwitchComplete callback', async () => {
      fixture = buildManager();

      await fixture.manager.switchTheme('fireworks');

      expect(fixture.options.onThemeSwitchComplete).toHaveBeenCalledWith(
        'fireworks',
        expect.objectContaining({ id: 'fireworks' })
      );
    });
  });

  describe('focus preservation', () => {
    it('should preserve focus before switching', async () => {
      const { preserveFocusWithin } = await import('./theme-focus-preservation');
      fixture = buildManager();

      await fixture.manager.switchTheme('fireworks');

      expect(preserveFocusWithin).toHaveBeenCalledWith(fixture.container);
    });

    it('should restore focus after switching', async () => {
      const { restoreFocusWithin } = await import('./theme-focus-preservation');
      fixture = buildManager();

      await fixture.manager.switchTheme('fireworks');

      expect(restoreFocusWithin).toHaveBeenCalledWith(fixture.container, null);
    });

    it('should restore preserved focus element when available', async () => {
      const { preserveFocusWithin, restoreFocusWithin } = await import('./theme-focus-preservation');
      const focusTarget = document.createElement('button');
      vi.mocked(preserveFocusWithin).mockReturnValue(focusTarget);
      fixture = buildManager();

      await fixture.manager.switchTheme('fireworks');

      expect(restoreFocusWithin).toHaveBeenCalledWith(fixture.container, focusTarget);
    });
  });

  describe('rate limiting', () => {
    it('should enforce minimum switch interval', async () => {
      vi.useFakeTimers();
      fixture = buildManager();

      // First switch
      const firstSwitch = fixture.manager.switchTheme('fireworks');
      await vi.runAllTimersAsync();
      await firstSwitch;

      // Immediate second switch should be blocked
      vi.mocked(fixture.options.loadTheme).mockClear();

      await fixture.manager.switchTheme('contribution-graph');

      // Should not have loaded since interval not passed
      expect(fixture.manager.canSwitch()).toBe(false);
      expect(fixture.options.loadTheme).not.toHaveBeenCalled();
    });
  });

  describe('abort handling', () => {
    it('should abort pending switch when abort is called', async () => {
      fixture = buildManager();

      const switchPromise = fixture.manager.switchTheme('fireworks');
      fixture.manager.abort();

      await switchPromise;

      // Abort was called, manager should handle gracefully
      expect(fixture.manager.getPendingSwitch()).toBeNull();
    });

    it('should track pending switch while in progress', async () => {
      fixture = buildManager();

      // Start switch but don't await yet
      const switchPromise = fixture.manager.switchTheme('fireworks');

      // During the switch, getPendingSwitch should return the promise
      expect(fixture.manager.getPendingSwitch()).not.toBeNull();

      await switchPromise;

      // After completion, should be null
      expect(fixture.manager.getPendingSwitch()).toBeNull();
    });
  });

  describe('state updates', () => {
    it('should set theme in state manager', async () => {
      fixture = buildManager();

      await fixture.manager.switchTheme('fireworks');

      expect(fixture.options.setThemeInState).toHaveBeenCalledWith('fireworks');
    });

    it('should set last aria label', async () => {
      fixture = buildManager();

      await fixture.manager.switchTheme('fireworks');

      expect(fixture.options.setLastAriaLabel).toHaveBeenCalled();
    });
  });
});
