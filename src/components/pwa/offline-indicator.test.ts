/**
 * Offline Indicator Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createOfflineIndicator } from './offline-indicator';
import { toggleOnlineStatus } from '@/app/pwa/test-utils';

describe('createOfflineIndicator', () => {
  let originalOnLine: boolean;

  beforeEach(() => {
    originalOnLine = navigator.onLine;
    vi.useFakeTimers();
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: originalOnLine,
    });
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('creates indicator with correct accessibility attributes', () => {
    const indicator = createOfflineIndicator();
    const element = indicator.getElement();

    expect(element.getAttribute('role')).toBe('status');
    expect(element.getAttribute('aria-live')).toBe('polite');
    expect(element.getAttribute('aria-atomic')).toBe('true');
  });

  it('has data-testid attribute for E2E testing', () => {
    const indicator = createOfflineIndicator();
    const element = indicator.getElement();

    expect(element.getAttribute('data-testid')).toBe('offline-indicator');
  });

  it('shows offline message when offline', () => {
    toggleOnlineStatus(false);

    const indicator = createOfflineIndicator();
    indicator.init();
    const element = indicator.getElement();

    // CSS class controls display, check for the class instead
    expect(element.classList.contains('offline-indicator--offline')).toBe(true);
    expect(element.textContent).toContain('Offline');
  });

  it('hides indicator when online initially', () => {
    toggleOnlineStatus(true);

    const indicator = createOfflineIndicator();
    indicator.init();
    const element = indicator.getElement();

    // Initially online, should only have base class (which has display: none)
    expect(element.classList.contains('offline-indicator--offline')).toBe(false);
    expect(element.classList.contains('offline-indicator--online')).toBe(false);
  });

  it('updates UI when going offline', () => {
    toggleOnlineStatus(true);

    const indicator = createOfflineIndicator();
    indicator.init();
    const element = indicator.getElement();

    // Initially hidden (online)
    expect(element.classList.contains('offline-indicator--offline')).toBe(false);

    // Go offline
    toggleOnlineStatus(false);

    // Should now show offline message
    expect(element.classList.contains('offline-indicator--offline')).toBe(true);
    expect(element.textContent).toContain('Offline');
  });

  it('shows temporary online message when reconnecting', () => {
    // Start offline
    toggleOnlineStatus(false);

    const indicator = createOfflineIndicator();
    indicator.init();
    const element = indicator.getElement();

    // Should show offline
    expect(element.textContent).toContain('Offline');

    // Go back online
    toggleOnlineStatus(true);

    // Should show back online message
    expect(element.textContent).toContain('Online');
    // Should have the online CSS class
    expect(element.classList.contains('offline-indicator--online')).toBe(true);

    // Fast-forward time
    vi.advanceTimersByTime(3000);

    // Should revert to base class only (hidden)
    expect(element.classList.contains('offline-indicator--online')).toBe(false);
    expect(element.classList.contains('offline-indicator--offline')).toBe(false);
  });

  it('removes event listeners on destroy', () => {
    const indicator = createOfflineIndicator();
    indicator.init();

    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    indicator.destroy();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
  });

  it('clears pending timeout on destroy', () => {
    // Start offline
    toggleOnlineStatus(false);

    const indicator = createOfflineIndicator();
    indicator.init();

    // Go back online (starts 3s hide timeout)
    toggleOnlineStatus(true);
    expect(indicator.getElement().classList.contains('offline-indicator--online')).toBe(true);

    // Destroy before timeout completes
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');
    indicator.destroy();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it('removes element from DOM on destroy', () => {
    const indicator = createOfflineIndicator();
    indicator.init();
    const element = indicator.getElement();
    document.body.appendChild(element);

    expect(document.body.contains(element)).toBe(true);

    indicator.destroy();

    expect(document.body.contains(element)).toBe(false);
  });

  it('respects prefers-reduced-motion', () => {
    // Mock matchMedia to return reduced motion preference
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });

    const indicator = createOfflineIndicator();
    const element = indicator.getElement();

    // Should not have transition when reduced motion is preferred
    expect(element.style.transition).toBe('');
  });

  it('includes SVG icon with aria-hidden attribute', () => {
    toggleOnlineStatus(false);

    const indicator = createOfflineIndicator();
    indicator.init();
    const element = indicator.getElement();

    // Should have icon wrapper element with aria-hidden
    const iconWrapper = element.querySelector('[aria-hidden="true"]');
    expect(iconWrapper).toBeTruthy();
    
    // Should contain SVG element
    const svg = iconWrapper?.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });

  it('includes text message for accessibility', () => {
    toggleOnlineStatus(false);

    const indicator = createOfflineIndicator();
    indicator.init();
    const element = indicator.getElement();

    // Should have text message
    const message = element.querySelector('span:not([aria-hidden])');
    expect(message).toBeTruthy();
    expect(message?.textContent).toBe('Offline');
  });

  it('uses compact inline design without fixed positioning', () => {
    const indicator = createOfflineIndicator();
    const element = indicator.getElement();

    // Should NOT have fixed positioning (inline styles)
    expect(element.style.position).not.toBe('fixed');
    
    // Should NOT have z-index (parent container controls this)
    expect(element.style.zIndex).toBe('');
    
    // Should have offline-indicator class which defines the styling
    expect(element.classList.contains('offline-indicator')).toBe(true);
  });
});
