import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
  getIOSVersion,
  getMinimumIOSPushVersion,
  isInstalledPWA,
  isIOSSafari,
  isiOSPushSupported,
} from './platform';

const originalUserAgent = navigator.userAgent;
const originalMatchMedia = window.matchMedia;

const setUserAgent = (ua: string) => {
  Object.defineProperty(navigator, 'userAgent', {
    value: ua,
    configurable: true,
  });
};

const setStandalone = (standalone: boolean | undefined) => {
  Object.defineProperty(navigator, 'standalone', {
    value: standalone,
    configurable: true,
  });
};

describe('platform detection', () => {
  beforeEach(() => {
    setUserAgent(originalUserAgent);
    setStandalone(undefined);
    window.matchMedia = originalMatchMedia;
  });

  afterEach(() => {
    setUserAgent(originalUserAgent);
    setStandalone(undefined);
    window.matchMedia = originalMatchMedia;
  });

  it('detects iOS Safari user agents', () => {
    setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_4 like Mac OS X) AppleWebKit/605.1.15');
    expect(isIOSSafari()).toBe(true);

    setUserAgent('Mozilla/5.0 (Linux; Android 13; Pixel) AppleWebKit/537.36');
    expect(isIOSSafari()).toBe(false);
  });

  it('parses iOS version or returns null on non-iOS', () => {
    setUserAgent('Mozilla/5.0 (iPad; CPU OS 16_3 like Mac OS X) AppleWebKit/605.1.15');
    expect(getIOSVersion()).toBe(16.3);

    setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    expect(getIOSVersion()).toBeNull();
  });

  it('reports push support only for iOS 16.4 or later', () => {
    setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_3 like Mac OS X) AppleWebKit/605.1.15');
    expect(isiOSPushSupported()).toBe(false);

    setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15');
    expect(isiOSPushSupported()).toBe(true);
  });

  it('detects installed PWA via display-mode or standalone flag', () => {
    const matchMediaMock = vi.fn().mockReturnValue({
      matches: true,
      media: '(display-mode: standalone)',
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    });
    window.matchMedia = matchMediaMock as unknown as typeof window.matchMedia;

    expect(isInstalledPWA()).toBe(true);

    matchMediaMock.mockReturnValue({
      matches: false,
      media: '(display-mode: standalone)',
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    });
    window.matchMedia = matchMediaMock as unknown as typeof window.matchMedia;
    setStandalone(true);

    expect(isInstalledPWA()).toBe(true);
  });

  it('returns configured minimum iOS push version', () => {
    expect(getMinimumIOSPushVersion()).toBe(16.4);
  });
});