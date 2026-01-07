/**
 * Tests for Fullscreen Button Component
 * Verifies creation, accessibility, and desktop-only behavior for fullscreen toggle.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { createFullscreenButton } from './fullscreen-button';
import { isFullscreenApiAvailable } from './fullscreen-manager';

vi.mock('./fullscreen-manager', () => ({
  isFullscreenApiAvailable: vi.fn(() => true),
  initFullscreenManager: vi.fn(),
  requestFullscreen: vi.fn(),
}));

describe('Fullscreen Button', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    container.remove();
  });

  it('should create a fullscreen toggle button on desktop viewports', () => {
    const onToggle = vi.fn();
    const button = createFullscreenButton({ isMobile: false, isFullscreen: false, onToggle });
    container.appendChild(button);

    const element = container.querySelector('[data-testid="fullscreen-button"]');
    expect(element).toBeTruthy();
    expect(element?.tagName).toBe('BUTTON');
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('should set an accessible aria-label for entering fullscreen', () => {
    const onToggle = vi.fn();
    const button = createFullscreenButton({ isMobile: false, isFullscreen: false, onToggle });
    container.appendChild(button);

    const element = container.querySelector('[data-testid="fullscreen-button"]');
    expect(element?.getAttribute('aria-label')).toBe('Enter fullscreen');
    expect(element?.getAttribute('type')).toBe('button');
  });

  it('should render an icon for the fullscreen button', () => {
    const button = createFullscreenButton({ isMobile: false, isFullscreen: false, onToggle: vi.fn() });
    container.appendChild(button);

    const icon = container.querySelector('[data-testid="fullscreen-button"] svg');
    expect(icon).toBeTruthy();
    expect(icon?.getAttribute('aria-hidden')).toBe('true');
  });

  it('should return null when Fullscreen API is unavailable', () => {
    vi.mocked(isFullscreenApiAvailable).mockReturnValue(false);

    const button = createFullscreenButton({ isMobile: false, isFullscreen: false, onToggle: vi.fn() });

    expect(button).toBeNull();
    expect(container.querySelector('[data-testid="fullscreen-button"]')).toBeNull();
  });

  it('should not render the fullscreen button on mobile viewports', () => {
    const onToggle = vi.fn();
    const button = createFullscreenButton({ isMobile: true, isFullscreen: false, onToggle });

    expect(button).toBeNull();
    expect(container.querySelector('[data-testid="fullscreen-button"]')).toBeNull();
  });
});
