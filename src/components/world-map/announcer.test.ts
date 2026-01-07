import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createAnnouncer } from './announcer';
import { ANNOUNCEMENT_CLEAR_DELAY_MS } from './constants';

const cancelAllSpy = vi.fn();

vi.mock('@/core/resource-tracking', () => {
  const trackedTimeouts = new WeakMap();

  return {
    createResourceTracker: () => {
      const tracker = {} as Record<string, unknown>;
      trackedTimeouts.set(tracker, [] as number[]);
      return tracker;
    },
    cancelAll: (...args: Parameters<typeof cancelAllSpy>) => {
      cancelAllSpy(...args);
      const tracker = args[0];
      const ids = (trackedTimeouts.get(tracker) ?? []) as number[];
      ids.forEach((id) => clearTimeout(id));
    },
    safeSetTimeout: (callback: () => void, delay: number, tracker: object) => {
      const id = window.setTimeout(callback, delay);
      const ids = trackedTimeouts.get(tracker) as number[];
      ids.push(id);
      return id;
    },
  };
});

describe('world-map/announcer', () => {
  let container: HTMLElement;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    vi.useRealTimers();
    cancelAllSpy.mockClear();
    container.remove();
  });

  it('should create live region with proper attributes', () => {
    const announcer = createAnnouncer(container);
    const liveRegion = announcer.getElement();

    expect(container.contains(liveRegion)).toBe(true);
    expect(liveRegion.getAttribute('role')).toBe('status');
    expect(liveRegion.getAttribute('aria-live')).toBe('polite');
    expect(liveRegion.getAttribute('aria-atomic')).toBe('true');
  });

  it('should announce celebrations and clear message after delay', () => {
    const announcer = createAnnouncer(container);
    const liveRegion = announcer.getElement();

    announcer.announceCelebration('Tokyo');
    expect(liveRegion.textContent).toContain('Tokyo');

    vi.advanceTimersByTime(ANNOUNCEMENT_CLEAR_DELAY_MS + 1);
    expect(liveRegion.textContent).toBe('');
  });

  it('should skip duplicate announcements for same city', () => {
    const announcer = createAnnouncer(container);
    const liveRegion = announcer.getElement();

    announcer.announceCelebration('London');
    const firstMessage = liveRegion.textContent;

    announcer.announceCelebration('London');

    expect(liveRegion.textContent).toBe(firstMessage);
    expect(cancelAllSpy).toHaveBeenCalledTimes(1);
  });

  it('should clear pending timeouts and text on destroy', () => {
    const announcer = createAnnouncer(container);
    announcer.announceCelebration('Sydney');

    announcer.destroy();

    const liveRegion = announcer.getElement();
    expect(liveRegion.textContent).toBe('');
    expect(cancelAllSpy).toHaveBeenCalled();
  });
});
