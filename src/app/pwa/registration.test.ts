/**
 * Service Worker Registration Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { registerServiceWorker, getServiceWorkerRegistration } from './registration';
import { createServiceWorkerMock, mockConnection } from './test-utils';

describe('registerServiceWorker', () => {
  let originalServiceWorker: any;
  let originalReadyState: DocumentReadyState;
  let originalConnection: any;

  beforeEach(() => {
    // Store originals
    originalServiceWorker = (navigator as any).serviceWorker;
    originalReadyState = document.readyState;
    originalConnection = (navigator as any).connection;

    // Mock complete document state by default
    Object.defineProperty(document, 'readyState', {
      writable: true,
      configurable: true,
      value: 'complete',
    });

    // Clear connection mock
    Object.defineProperty(navigator, 'connection', {
      writable: true,
      configurable: true,
      value: undefined,
    });
  });

  afterEach(() => {
    // Restore originals
    Object.defineProperty(navigator, 'serviceWorker', {
      writable: true,
      configurable: true,
      value: originalServiceWorker,
    });

    Object.defineProperty(navigator, 'connection', {
      writable: true,
      configurable: true,
      value: originalConnection,
    });

    Object.defineProperty(document, 'readyState', {
      writable: true,
      configurable: true,
      value: originalReadyState,
    });

    vi.clearAllMocks();
  });

  it('returns error when service workers are not supported', async () => {
    // Remove service worker support
    Object.defineProperty(navigator, 'serviceWorker', {
      writable: true,
      configurable: true,
      value: undefined,
    });

    const result = await registerServiceWorker();

    expect(result.success).toBe(false);
    expect(result.registration).toBeNull();
    expect(result.error).toContain('not supported');
  });

  it('skips registration when data saver mode is enabled', async () => {
    Object.defineProperty(navigator, 'serviceWorker', {
      writable: true,
      configurable: true,
      value: createServiceWorkerMock(),
    });

    mockConnection(true); // Enable data saver

    const result = await registerServiceWorker();

    expect(result.success).toBe(false);
    expect(result.registration).toBeNull();
    expect(result.error).toContain('Data saver');
    expect(navigator.serviceWorker.register).not.toHaveBeenCalled();
  });

  it('registers service worker successfully', async () => {
    const mockSW = createServiceWorkerMock();
    Object.defineProperty(navigator, 'serviceWorker', {
      writable: true,
      configurable: true,
      value: mockSW,
    });

    const result = await registerServiceWorker();

    expect(result.success).toBe(true);
    expect(result.registration).toBeTruthy();
    
    // BASE_URL from Vite env (default is '/' in test environment)
    const expectedBase = import.meta.env.BASE_URL || '/';
    
    // VitePWA uses different paths and types in dev vs production
    if (import.meta.env.DEV) {
      expect(mockSW.register).toHaveBeenCalledWith(`${expectedBase}dev-sw.js?dev-sw`, {
        scope: expectedBase,
        type: 'module',
      });
    } else {
      expect(mockSW.register).toHaveBeenCalledWith(`${expectedBase}sw.js`, {
        scope: expectedBase,
        type: 'classic',
      });
    }
  });

  it('waits for page load before registering', async () => {
    const mockSW = createServiceWorkerMock();
    Object.defineProperty(navigator, 'serviceWorker', {
      writable: true,
      configurable: true,
      value: mockSW,
    });

    // Simulate loading state
    Object.defineProperty(document, 'readyState', {
      writable: true,
      configurable: true,
      value: 'loading',
    });

    const registrationPromise = registerServiceWorker();

    // Registration should not happen yet
    expect(mockSW.register).not.toHaveBeenCalled();

    // Simulate load event
    Object.defineProperty(document, 'readyState', {
      writable: true,
      configurable: true,
      value: 'complete',
    });
    window.dispatchEvent(new Event('load'));

    await registrationPromise;

    expect(mockSW.register).toHaveBeenCalled();
  });

  it('handles registration errors gracefully', async () => {
    const mockError = new Error('Registration failed');
    const mockSW = createServiceWorkerMock();
    mockSW.register = vi.fn().mockRejectedValue(mockError);

    Object.defineProperty(navigator, 'serviceWorker', {
      writable: true,
      configurable: true,
      value: mockSW,
    });

    const result = await registerServiceWorker();

    expect(result.success).toBe(false);
    expect(result.registration).toBeNull();
    expect(result.error).toBe('Registration failed');
  });
});

describe('getServiceWorkerRegistration', () => {
  let originalServiceWorker: any;

  beforeEach(() => {
    originalServiceWorker = (navigator as any).serviceWorker;
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'serviceWorker', {
      writable: true,
      configurable: true,
      value: originalServiceWorker,
    });
    vi.clearAllMocks();
  });

  it('returns null when service workers are not supported', async () => {
    Object.defineProperty(navigator, 'serviceWorker', {
      writable: true,
      configurable: true,
      value: undefined,
    });

    const result = await getServiceWorkerRegistration();

    expect(result).toBeNull();
  });

  it('returns existing registration', async () => {
    const mockSW = createServiceWorkerMock();
    Object.defineProperty(navigator, 'serviceWorker', {
      writable: true,
      configurable: true,
      value: mockSW,
    });

    const result = await getServiceWorkerRegistration();

    expect(result).toBeTruthy();
    // BASE_URL from Vite env (default is '/' in test environment)
    const expectedBase = import.meta.env.BASE_URL || '/';
    expect(mockSW.getRegistration).toHaveBeenCalledWith(expectedBase);
  });

  it('returns null on error', async () => {
    const mockSW = createServiceWorkerMock();
    mockSW.getRegistration = vi.fn().mockRejectedValue(new Error('Failed'));

    Object.defineProperty(navigator, 'serviceWorker', {
      writable: true,
      configurable: true,
      value: mockSW,
    });

    const result = await getServiceWorkerRegistration();

    expect(result).toBeNull();
  });
});
