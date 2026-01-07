/**
 * Accessibility utilities tests
 * Verifies reduced motion manager and accessibility announcement helpers.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { reducedMotionManager, createAccessibilityManager } from './announcements';
import type { TimeRemaining } from '@core/types';
import { mockMatchMedia } from '@/test-utils/accessibility';

describe('reducedMotionManager', () => {
  let restoreMatchMedia: (() => void) | null = null;

  afterEach(() => {
    restoreMatchMedia?.();
    restoreMatchMedia = null;
    vi.restoreAllMocks();
  });

  describe('isActive', () => {
    it.each([
      { matches: false, expected: false, description: 'should return false when preference is not reduce' },
      { matches: true, expected: true, description: 'should return true when preference is reduce' },
    ])('$description', ({ matches, expected }) => {
      // Arrange
      const controls = mockMatchMedia(matches);
      restoreMatchMedia = controls.restore;

      // Act
      const result = reducedMotionManager.isActive();

      // Assert
      expect(result).toBe(expected);
    });
  });

  it('should notify subscribers when preference changes and unsubscribe correctly', () => {
    // Arrange
    const { restore, setMatches } = mockMatchMedia(false);
    restoreMatchMedia = restore;

    const callback = vi.fn();

    // Act
    const unsubscribe = reducedMotionManager.subscribe(callback);

    // Simulate change event
    setMatches(true);
    expect(callback).toHaveBeenCalledWith(true);

    // Unsubscribe
    unsubscribe();
  });
});

describe('AccessibilityManager', () => {
  let container: HTMLElement;
  let manager: ReturnType<typeof createAccessibilityManager>;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    manager = createAccessibilityManager();
    vi.useFakeTimers();
  });

  afterEach(() => {
    manager.destroy();
    container.remove();
    vi.useRealTimers();
  });

  describe('init', () => {
    it('should create live regions when initialized', () => {
      manager.init(container);

      const countdown = document.getElementById('sr-countdown');
      const status = document.getElementById('sr-status');

      expect(countdown).not.toBeNull();
      expect(countdown?.getAttribute('aria-live')).toBe('polite');
      expect(countdown?.getAttribute('aria-atomic')).toBe('true');
      expect(countdown?.classList.contains('sr-only')).toBe(true);

      expect(status).not.toBeNull();
      expect(status?.getAttribute('role')).toBe('status');
    });

    it('should reuse existing live regions when present', () => {
      const existing = document.createElement('div');
      existing.id = 'sr-countdown';
      document.body.appendChild(existing);

      manager.init(container);

      const regions = document.querySelectorAll('#sr-countdown');
      expect(regions.length).toBe(1);

      existing.remove();
    });
  });

  describe('announceCountdown', () => {
    it('should announce time remaining with full units when available', () => {
      manager.init(container);

      const time: TimeRemaining = {
        days: 1,
        hours: 5,
        minutes: 30,
        seconds: 15,
        total: 1000,
      };

      manager.announceCountdown(time);

      const region = document.getElementById('sr-countdown');
      expect(region?.textContent).toBe('Countdown: 1 day, 5 hours, 30 minutes, 15 seconds');
    });

    it('should throttle announcements when more than one hour remains', () => {
      manager.init(container);

      // >1 hour: 60 second interval
      const farTime: TimeRemaining = {
        days: 1,
        hours: 0,
        minutes: 0,
        seconds: 0,
        total: 24 * 60 * 60 * 1000,
      };

      manager.announceCountdown(farTime);
      const region = document.getElementById('sr-countdown');
      const firstAnnouncement = region?.textContent;

      // Try to announce again immediately - should be throttled
      vi.advanceTimersByTime(1000);
      manager.announceCountdown({ ...farTime, seconds: 59, total: farTime.total - 1000 });
      expect(region?.textContent).toBe(firstAnnouncement);

      // After 60 seconds, should announce with different content
      vi.advanceTimersByTime(60000);
      const laterTime: TimeRemaining = {
        days: 0,
        hours: 23,
        minutes: 58,
        seconds: 59,
        total: farTime.total - 61000,
      };
      manager.announceCountdown(laterTime);
      expect(region?.textContent).toContain('23 hours');
    });

    it('should announce every second during final ten seconds', () => {
      manager.init(container);

      const time1: TimeRemaining = {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 10,
        total: 10000,
      };

      manager.announceCountdown(time1);
      const region = document.getElementById('sr-countdown');
      expect(region?.textContent).toContain('10 seconds');

      vi.advanceTimersByTime(1000);
      const time2: TimeRemaining = { ...time1, seconds: 9, total: 9000 };
      manager.announceCountdown(time2);
      expect(region?.textContent).toContain('9 seconds');
    });
  });

  describe('announceThemeChange', () => {
    it('should announce theme change after debounce delay', () => {
      manager.init(container);
      manager.announceThemeChange('Fireworks');

      const region = document.getElementById('sr-status');
      vi.advanceTimersByTime(350);
      expect(region?.textContent).toBe('Theme changed to Fireworks');
    });
  });

  describe('announceCelebration', () => {
    it('should debounce celebration announcements to a single message', () => {
      manager.init(container);
      manager.announceCelebration();
      manager.announceCelebration();

      const region = document.getElementById('sr-status');
      vi.advanceTimersByTime(350);
      expect(region?.textContent).toBe('The countdown has completed.');
    });
  });

  describe('destroy', () => {
    it('should remove created live regions on destroy', () => {
      manager.init(container);
      expect(document.getElementById('sr-countdown')).not.toBeNull();

      manager.destroy();
      expect(document.getElementById('sr-countdown')).toBeNull();
      expect(document.getElementById('sr-status')).toBeNull();
    });

    it('should no-op safely when destroy is called before init', () => {
      expect(() => manager.destroy()).not.toThrow();
      expect(document.getElementById('sr-countdown')).toBeNull();
      expect(document.getElementById('sr-status')).toBeNull();
    });
  });
});
