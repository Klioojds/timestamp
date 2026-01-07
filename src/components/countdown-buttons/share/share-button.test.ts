/**
 * Share Button Tests
 * Unit tests for the simple share button component.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockClipboard } from '@/test-utils/share-fixtures';
import { createSimpleShareButton } from './share-button';
import type { ShareTargets } from './types';

describe('createSimpleShareButton', () => {
  const mockShareTargets: ShareTargets = {
    withSelectedTimezone: 'https://example.com/?mode=timer&tz=UTC',
    withLocalTimezone: 'https://example.com/?mode=timer&tz=America/Los_Angeles',
    withoutTimezone: 'https://example.com/?mode=timer',
  };

  const mockGetShareTargets = vi.fn(() => mockShareTargets);
  let clipboard: ReturnType<typeof mockClipboard>;

  beforeEach(() => {
    clipboard = mockClipboard();
    vi.useFakeTimers();
    mockGetShareTargets.mockClear();
  });

  afterEach(() => {
    clipboard.restore();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should create a button element', () => {
    const controller = createSimpleShareButton({ getShareTargets: mockGetShareTargets });
    const element = controller.getElement();

    expect(element.tagName).toBe('BUTTON');
    expect(element.getAttribute('data-testid')).toBe('share-button');
  });

  it('should have correct accessibility attributes', () => {
    const controller = createSimpleShareButton({ getShareTargets: mockGetShareTargets });
    const element = controller.getElement();

    expect(element.getAttribute('aria-label')).toBe('Copy countdown URL to clipboard');
    expect(element.getAttribute('type')).toBe('button');
    expect(element.tabIndex).toBe(0);
  });

  it('should copy URL with selected timezone on click', async () => {
    const controller = createSimpleShareButton({ getShareTargets: mockGetShareTargets });
    const element = controller.getElement();

    element.click();
    await vi.runAllTimersAsync();

    expect(mockGetShareTargets).toHaveBeenCalled();
    expect(clipboard.writeText).toHaveBeenCalledWith(mockShareTargets.withSelectedTimezone);
  });

  it('should call onCopy callback with URL', async () => {
    const onCopy = vi.fn();
    const controller = createSimpleShareButton({
      getShareTargets: mockGetShareTargets,
      onCopy,
    });
    const element = controller.getElement();

    element.click();
    await vi.runAllTimersAsync();

    expect(onCopy).toHaveBeenCalledWith(mockShareTargets.withSelectedTimezone);
  });

  it('should show success feedback after copy', async () => {
    const controller = createSimpleShareButton({ getShareTargets: mockGetShareTargets });
    const element = controller.getElement();

    element.click();
    // Need to wait for the async click handler to complete
    await vi.waitFor(() => {
      expect(element.dataset.feedback).toBe('success');
    });
    expect(element.querySelector('span')?.textContent).toBe('Copied!');
  });

  it('should reset feedback after 2 seconds', async () => {
    const controller = createSimpleShareButton({ getShareTargets: mockGetShareTargets });
    const element = controller.getElement();

    element.click();
    await vi.runAllTimersAsync();

    // Fast-forward 2 seconds
    vi.advanceTimersByTime(2000);

    expect(element.dataset.feedback).toBeUndefined();
    expect(element.querySelector('span')?.textContent).toBe('Copy');
  });

  it('should show error feedback on clipboard failure', async () => {
    clipboard.writeText.mockRejectedValueOnce(new Error('Permission denied'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const controller = createSimpleShareButton({ getShareTargets: mockGetShareTargets });
    const element = controller.getElement();

    element.click();
    // Need to wait for the async click handler to complete
    await vi.waitFor(() => {
      expect(element.dataset.feedback).toBe('error');
    });
    expect(element.querySelector('span')?.textContent).toBe('Failed');
    
    consoleErrorSpy.mockRestore();
  });

  it('should show error feedback when clipboard API is unavailable', async () => {
    clipboard.restore();
    Object.assign(navigator, { clipboard: undefined });
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const controller = createSimpleShareButton({ getShareTargets: mockGetShareTargets });
    const element = controller.getElement();

    element.click();
    await vi.waitFor(() => {
      expect(element.dataset.feedback).toBe('error');
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to copy URL to clipboard:', expect.any(Error));

    consoleErrorSpy.mockRestore();
  });

  it('should get fresh URLs on each click (on-demand computation)', async () => {
    const controller = createSimpleShareButton({ getShareTargets: mockGetShareTargets });
    const element = controller.getElement();

    // First click
    element.click();
    await vi.runAllTimersAsync();
    expect(mockGetShareTargets).toHaveBeenCalledTimes(1);

    // Second click - should call getter again
    element.click();
    await vi.runAllTimersAsync();
    expect(mockGetShareTargets).toHaveBeenCalledTimes(2);
  });

  it('should clean up on destroy', async () => {
    const controller = createSimpleShareButton({ getShareTargets: mockGetShareTargets });
    const element = controller.getElement();
    
    // First click works
    element.click();
    await vi.runAllTimersAsync();
    expect(mockGetShareTargets).toHaveBeenCalledTimes(1);
    
    // Destroy and verify click handler is removed
    controller.destroy();
    mockGetShareTargets.mockClear();
    element.click();
    await vi.runAllTimersAsync();
    expect(mockGetShareTargets).not.toHaveBeenCalled();
  });
});
