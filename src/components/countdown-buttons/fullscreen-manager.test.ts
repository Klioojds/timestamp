/**
 * Fullscreen manager utilities
 * Covers API availability, request fallbacks, UI behavior, and cleanup.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  initFullscreenManager,
  isFullscreenApiAvailable,
  requestFullscreen,
} from './fullscreen-manager';
import { EXIT_BUTTON_HIDE_DELAY_MS } from './constants';

vi.mock('@core/utils/dom', () => ({
  createIcon: vi.fn(() => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('aria-hidden', 'true');
    return svg;
  }),
  createIconButton: vi.fn((options: { testId?: string; className?: string; label: string }) => {
    const button = document.createElement('button');
    if (options.testId) button.dataset.testid = options.testId;
    if (options.className) button.className = options.className;
    button.setAttribute('aria-label', options.label);
    button.type = 'button';
    return button;
  }),
  ICON_SIZES: { LG: 24 },
}));

vi.mock('@/core/resource-tracking', () => {
  const createResourceTracker = () => new Set<number>();
  const cancelAll = (tracker: Set<number>) => {
    tracker.forEach((id) => clearTimeout(id));
    tracker.clear();
  };
  const safeSetTimeout = (fn: () => void, ms: number, tracker: Set<number>) => {
    const id = setTimeout(fn, ms) as unknown as number;
    tracker.add(id);
    return id;
  };
  return { createResourceTracker, cancelAll, safeSetTimeout };
});

describe('fullscreen-manager', () => {
  const originalFullscreenEnabled = (document as Document & { fullscreenEnabled?: boolean }).fullscreenEnabled;

  beforeEach(() => {
    vi.useFakeTimers();
    document.body.className = '';
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
    (document as Document & { fullscreenEnabled?: boolean }).fullscreenEnabled = originalFullscreenEnabled;
    delete (document as Document & { fullscreenElement?: Element }).fullscreenElement;
    delete (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement;
    vi.restoreAllMocks();
  });

  describe('isFullscreenApiAvailable', () => {
    it('should return false when any vendor flag is explicitly false', () => {
      (document as Document & { fullscreenEnabled?: boolean }).fullscreenEnabled = false;
      expect(isFullscreenApiAvailable()).toBe(false);
    });

    it('should return true when flags are undefined/true', () => {
      (document as Document & { fullscreenEnabled?: boolean }).fullscreenEnabled = true;
      expect(isFullscreenApiAvailable()).toBe(true);
    });
  });

  describe('requestFullscreen', () => {
    it('should call standard requestFullscreen when available', async () => {
      const original = document.documentElement.requestFullscreen;
      const spy = vi.fn().mockResolvedValue(undefined);
      document.documentElement.requestFullscreen = spy;

      await requestFullscreen();

      expect(spy).toHaveBeenCalledTimes(1);
      document.documentElement.requestFullscreen = original;
    });

    it('should fallback to webkitRequestFullscreen', async () => {
      const elem = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> };
      const originalRequest = elem.requestFullscreen;
      const originalWebkit = elem.webkitRequestFullscreen;
      elem.requestFullscreen = undefined as unknown as typeof elem.requestFullscreen;
      const spy = vi.fn().mockResolvedValue(undefined);
      elem.webkitRequestFullscreen = spy;

      await requestFullscreen();

      expect(spy).toHaveBeenCalledTimes(1);
      elem.requestFullscreen = originalRequest;
      elem.webkitRequestFullscreen = originalWebkit;
    });
  });

  describe('initFullscreenManager', () => {
    it('should append exit button and toggle classes on fullscreen change', () => {
      document.querySelectorAll('.countdown-button-container').forEach((el) => el.remove());
      const container = document.createElement('div');
      container.id = 'app';
      const chrome = document.createElement('div');
      chrome.className = 'countdown-button-container';
      document.body.appendChild(chrome);
      document.body.appendChild(container);
      const cleanup = initFullscreenManager({ container });

      const exitButton = document.getElementById('exit-fullscreen-button');
      expect(exitButton).not.toBeNull();
      expect(exitButton?.getAttribute('data-visible')).toBe('false');
      expect(exitButton?.getAttribute('aria-hidden')).toBe('true');

      (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement = container;
      document.dispatchEvent(new Event('fullscreenchange'));

      expect(document.body.classList.contains('fullscreen-mode')).toBe(true);
      expect(container.classList.contains('fullscreen-mode')).toBe(true);
      expect(container.hasAttribute('data-fullscreen')).toBe(true);

      cleanup();
      expect(document.getElementById('exit-fullscreen-button')).toBeNull();
    });

    it('should reveal and hide exit button on mouse movement while fullscreen', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      const cleanup = initFullscreenManager({ container });
      const exitButton = document.getElementById('exit-fullscreen-button') as HTMLButtonElement;

      (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement = container;
      document.dispatchEvent(new Event('fullscreenchange'));

      document.dispatchEvent(new Event('mousemove'));
      expect(exitButton.dataset.visible).toBe('true');
      expect(exitButton.getAttribute('aria-hidden')).toBe('false');

      vi.advanceTimersByTime(EXIT_BUTTON_HIDE_DELAY_MS + 10);
      expect(exitButton.dataset.visible).toBe('false');
      expect(exitButton.getAttribute('aria-hidden')).toBe('true');

      cleanup();
    });
  });
});
