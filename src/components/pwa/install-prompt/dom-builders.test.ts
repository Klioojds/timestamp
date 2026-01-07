/**
 * DOM Builders Module - Unit Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isIOS,
  createOverlay,
  createDialog,
  createInstallButton,
  createDismissButton,
} from './dom-builders';

describe('dom-builders', () => {
  describe('isIOS', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it.each([
      {
        label: 'iPhone user agent',
        ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15',
        expected: true,
      },
      {
        label: 'iPad user agent',
        ua: 'Mozilla/5.0 (iPad; CPU OS 16_6 like Mac OS X) AppleWebKit/605.1.15',
        expected: true,
      },
      {
        label: 'Android user agent',
        ua: 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36',
        expected: false,
      },
      {
        label: 'desktop Chrome user agent',
        ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        expected: false,
      },
    ])('should return $expected for $label', ({ ua, expected }) => {
      vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(ua);
      expect(isIOS()).toBe(expected);
    });
  });

  describe('createOverlay', () => {
    it('should create overlay with correct class', () => {
      const overlay = createOverlay(false);
      expect(overlay.className).toBe('install-prompt-overlay');
    });

    it('should be hidden by default', () => {
      const overlay = createOverlay(false);
      expect(overlay.hidden).toBe(true);
    });

    it('should not have data-reduced-motion attribute when reduced motion is false', () => {
      const overlay = createOverlay(false);
      expect(overlay.hasAttribute('data-reduced-motion')).toBe(false);
    });

    it('should have data-reduced-motion attribute when reduced motion is true', () => {
      const overlay = createOverlay(true);
      expect(overlay.getAttribute('data-reduced-motion')).toBe('true');
    });
  });

  describe('createDialog', () => {
    it('should create dialog with correct ARIA attributes', () => {
      const dialog = createDialog(false, false);
      expect(dialog.getAttribute('role')).toBe('dialog');
      expect(dialog.getAttribute('aria-modal')).toBe('true');
      expect(dialog.getAttribute('aria-labelledby')).toBe('install-prompt-title');
      expect(dialog.getAttribute('aria-describedby')).toBe('install-prompt-description');
    });

    it('should include title element', () => {
      const dialog = createDialog(false, false);
      const title = dialog.querySelector('#install-prompt-title');
      expect(title).not.toBeNull();
      expect(title?.textContent).toContain('Install');
    });

    it('should include description element', () => {
      const dialog = createDialog(false, false);
      const description = dialog.querySelector('#install-prompt-description');
      expect(description).not.toBeNull();
    });

    it('should show iOS-specific instructions when iOS is true', () => {
      const dialog = createDialog(false, true);
      const description = dialog.querySelector('#install-prompt-description');
      expect(description?.innerHTML).toContain('Share button');
      expect(description?.innerHTML).toContain('Add to Home Screen');
    });

    it('should show standard message when iOS is false', () => {
      const dialog = createDialog(false, false);
      const description = dialog.querySelector('#install-prompt-description');
      expect(description?.textContent).toContain('offline access');
    });

    it('should include install button when iOS is false', () => {
      const dialog = createDialog(false, false);
      const buttons = dialog.querySelectorAll('button');
      const installButton = Array.from(buttons).find(
        (btn) => btn.textContent === 'Install'
      );
      expect(installButton).not.toBeUndefined();
    });

    it('should not include install button when iOS is true', () => {
      const dialog = createDialog(false, true);
      const buttons = dialog.querySelectorAll('button');
      const installButton = Array.from(buttons).find(
        (btn) => btn.textContent === 'Install'
      );
      expect(installButton).toBeUndefined();
    });
  });

  describe('createInstallButton', () => {
    it('should create button with Install text', () => {
      const button = createInstallButton();
      expect(button.textContent).toBe('Install');
    });

    it('should have primary class', () => {
      const button = createInstallButton();
      expect(button.className).toContain('install-prompt-primary');
    });
  });

  describe('createDismissButton', () => {
    it('should say "Got it" on iOS', () => {
      const button = createDismissButton(true);
      expect(button.textContent).toBe('Got it');
    });

    it('should say "Not now" on non-iOS', () => {
      const button = createDismissButton(false);
      expect(button.textContent).toBe('Not now');
    });

    it('should have accessible label', () => {
      const button = createDismissButton(false);
      expect(button.getAttribute('aria-label')).toBe('Dismiss install prompt');
    });
  });
});
