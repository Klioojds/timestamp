/**
 * Shared utilities for share controls
 * Tests clipboard wrapper and icon factory.
 */
import { describe, it, expect } from 'vitest';
import { mockClipboard } from '@/test-utils/share-fixtures';
import { copyShareUrlToClipboard, createShareLinkIcon } from './share-utils';

describe('share-utils', () => {
  describe('copyShareUrlToClipboard', () => {
    it('should delegate to navigator.clipboard.writeText', async () => {
      const clipboard = mockClipboard();

      await copyShareUrlToClipboard('https://example.com');

      expect(clipboard.writeText).toHaveBeenCalledWith('https://example.com');
      clipboard.restore();
    });
  });

  describe('createShareLinkIcon', () => {
    it('should create an SVG icon with optional class', () => {
      const icon = createShareLinkIcon('custom-class');

      expect(icon.tagName).toBe('svg');
      expect(icon.classList.contains('custom-class')).toBe(true);
      expect(icon.getAttribute('aria-hidden')).toBe('true');
    });
  });
});
