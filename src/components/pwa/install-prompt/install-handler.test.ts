/**
 * Install Handler Module - Unit Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getPromptState,
  incrementVisitCount,
  markDismissed,
  handleNativeInstall,
  shouldShowPrompt,
  createBeforeInstallPromptHandler,
} from './install-handler';
import type { BeforeInstallPromptEvent } from './types';
import { createLocalStorageStub, type LocalStorageStub } from '@/test-utils/pwa-install-fixtures';

// Mock the platform utilities
vi.mock('@core/pwa/platform', () => ({
  isInstalledPWA: vi.fn(() => false),
}));

import { isInstalledPWA } from '@core/pwa/platform';

describe('install-handler', () => {
  let localStorageStub: LocalStorageStub;

  beforeEach(() => {
    localStorageStub = createLocalStorageStub();
    // Reset isInstalledPWA mock to return false by default
    vi.mocked(isInstalledPWA).mockReturnValue(false);
  });

  afterEach(() => {
    localStorageStub.restore();
    vi.clearAllMocks();
  });

  describe('getPromptState', () => {
    it('should return default state when empty', () => {
      const state = getPromptState();
      expect(state.visible).toBe(false);
      expect(state.dismissed).toBe(false);
      expect(state.visitCount).toBe(0);
    });

    it('should read visit count from localStorage', () => {
      localStorageStub.store['pwa-install-visit-count'] = '5';
      const state = getPromptState();
      expect(state.visitCount).toBe(5);
    });

    it('should read dismissed from localStorage', () => {
      localStorageStub.store['pwa-install-dismissed'] = 'true';
      const state = getPromptState();
      expect(state.dismissed).toBe(true);
    });
  });

  describe('incrementVisitCount', () => {
    it('should increment visit count', () => {
      const count = incrementVisitCount();
      expect(count).toBe(1);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'pwa-install-visit-count',
        '1'
      );
    });

    it('should increment existing count', () => {
      localStorageStub.store['pwa-install-visit-count'] = '2';
      const count = incrementVisitCount();
      expect(count).toBe(3);
    });
  });

  describe('markDismissed', () => {
    it('should set dismissed flag', () => {
      markDismissed();
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'pwa-install-dismissed',
        'true'
      );
    });
  });

  describe('handleNativeInstall', () => {
    it('should return false when no deferred prompt', async () => {
      const result = await handleNativeInstall(null);
      expect(result).toBe(false);
    });

    it('should call prompt and return true when accepted', async () => {
      const mockPrompt: Partial<BeforeInstallPromptEvent> = {
        prompt: vi.fn().mockResolvedValue(undefined),
        userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
      };

      const result = await handleNativeInstall(
        mockPrompt as BeforeInstallPromptEvent
      );
      expect(mockPrompt.prompt).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false when dismissed', async () => {
      const mockPrompt: Partial<BeforeInstallPromptEvent> = {
        prompt: vi.fn().mockResolvedValue(undefined),
        userChoice: Promise.resolve({ outcome: 'dismissed', platform: 'web' }),
      };

      const result = await handleNativeInstall(
        mockPrompt as BeforeInstallPromptEvent
      );
      expect(result).toBe(false);
    });
  });

  describe('shouldShowPrompt', () => {
    it('should return false when running as installed PWA', () => {
      vi.mocked(isInstalledPWA).mockReturnValue(true);
      localStorageStub.store['pwa-install-visit-count'] = '5';
      
      expect(shouldShowPrompt(true)).toBe(false);
      expect(shouldShowPrompt(false)).toBe(false);
    });

    it.each([
      {
        description: 'should return false when dismissed regardless of platform',
        store: { 'pwa-install-dismissed': 'true', 'pwa-install-visit-count': '2' },
        isIOS: false,
        expected: false,
      },
      {
        description: 'should return true on iOS after 1 visit',
        store: { 'pwa-install-visit-count': '1' },
        isIOS: true,
        expected: true,
      },
      {
        description: 'should return false on iOS on first visit',
        store: { 'pwa-install-visit-count': '0' },
        isIOS: true,
        expected: false,
      },
      {
        description: 'should return true on non-iOS after 2 visits',
        store: { 'pwa-install-visit-count': '2' },
        isIOS: false,
        expected: true,
      },
      {
        description: 'should return false on non-iOS with only 1 visit',
        store: { 'pwa-install-visit-count': '1' },
        isIOS: false,
        expected: false,
      },
    ])('$description', ({ store, isIOS, expected }) => {
      Object.assign(localStorageStub.store, store);

      expect(shouldShowPrompt(isIOS)).toBe(expected);
    });
  });

  describe('createBeforeInstallPromptHandler', () => {
    it('should not do anything when running as installed PWA', () => {
      vi.mocked(isInstalledPWA).mockReturnValue(true);
      localStorageStub.store['pwa-install-visit-count'] = '2';

      const setDeferredPrompt = vi.fn();
      const showPrompt = vi.fn();
      const handler = createBeforeInstallPromptHandler(
        setDeferredPrompt,
        showPrompt
      );

      const mockEvent = { preventDefault: vi.fn() } as unknown as Event;
      handler(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(setDeferredPrompt).not.toHaveBeenCalled();
      expect(showPrompt).not.toHaveBeenCalled();
    });

    it('should prevent default and store prompt', () => {
      const setDeferredPrompt = vi.fn();
      const showPrompt = vi.fn();
      const handler = createBeforeInstallPromptHandler(
        setDeferredPrompt,
        showPrompt
      );

      const mockEvent = {
        preventDefault: vi.fn(),
      } as unknown as Event;

      handler(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(setDeferredPrompt).toHaveBeenCalledWith(mockEvent);
    });

    it('should show prompt when conditions are met', () => {
      localStorageStub.store['pwa-install-visit-count'] = '2';

      const setDeferredPrompt = vi.fn();
      const showPrompt = vi.fn();
      const handler = createBeforeInstallPromptHandler(
        setDeferredPrompt,
        showPrompt
      );

      const mockEvent = { preventDefault: vi.fn() } as unknown as Event;
      handler(mockEvent);

      expect(showPrompt).toHaveBeenCalled();
    });

    it('should not show prompt when dismissed', () => {
      localStorageStub.store['pwa-install-visit-count'] = '2';
      localStorageStub.store['pwa-install-dismissed'] = 'true';

      const setDeferredPrompt = vi.fn();
      const showPrompt = vi.fn();
      const handler = createBeforeInstallPromptHandler(
        setDeferredPrompt,
        showPrompt
      );

      const mockEvent = { preventDefault: vi.fn() } as unknown as Event;
      handler(mockEvent);

      expect(showPrompt).not.toHaveBeenCalled();
    });

    it('should defer prompt but not show when visit count below threshold', () => {
      localStorageStub.store['pwa-install-visit-count'] = '1';

      const setDeferredPrompt = vi.fn();
      const showPrompt = vi.fn();
      const handler = createBeforeInstallPromptHandler(
        setDeferredPrompt,
        showPrompt
      );

      const mockEvent = { preventDefault: vi.fn() } as unknown as Event;
      handler(mockEvent);

      expect(setDeferredPrompt).toHaveBeenCalledWith(mockEvent);
      expect(showPrompt).not.toHaveBeenCalled();
    });
  });
});
