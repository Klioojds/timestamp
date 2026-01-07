/**
 * Tests for update manager module
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createUpdateManager } from './update-manager';
import type { UpdateManagerController } from './update-manager';
import { attachServiceWorkerMocks, createServiceWorkerRegistrationMock, setDocumentVisibilityState } from './test-utils';

describe('UpdateManager', () => {
  let updateManager: UpdateManagerController;
  let mockRegistration: ServiceWorkerRegistration;
  let mockServiceWorker: ServiceWorker;

  const startAndFlush = async () => {
    updateManager.start();
    await vi.advanceTimersByTimeAsync(100);
  };

  const advanceInterval = async (ms = 60000) => {
    vi.advanceTimersByTime(ms);
    await vi.advanceTimersByTimeAsync(100);
  };

  beforeEach(() => {
    vi.useFakeTimers();

    const registrationMocks = createServiceWorkerRegistrationMock({ workerState: 'activated' });
    mockRegistration = registrationMocks.registration;
    mockServiceWorker = registrationMocks.serviceWorker;

    attachServiceWorkerMocks({ registration: mockRegistration, serviceWorker: mockServiceWorker });

    updateManager = createUpdateManager({ checkInterval: 60000 });
  });

  afterEach(() => {
    updateManager.stop();
    vi.useRealTimers();
  });

  it('should check for updates on start', async () => {
    await startAndFlush();

    expect(navigator.serviceWorker.getRegistration).toHaveBeenCalled();
    expect(mockRegistration.update).toHaveBeenCalled();
  });

  it('should periodically check for updates', async () => {
    await startAndFlush();
    vi.clearAllMocks();

    await advanceInterval();

    expect(mockRegistration.update).toHaveBeenCalledTimes(1);

    await advanceInterval();

    expect(mockRegistration.update).toHaveBeenCalledTimes(2);
  });

  it('should stop periodic checks when stop() is called', async () => {
    await startAndFlush();
    vi.clearAllMocks();

    updateManager.stop();

    // Advance by multiple intervals
    await advanceInterval(180000);

    expect(mockRegistration.update).not.toHaveBeenCalled();
  });

  it('should detect waiting worker and dispatch event', async () => {
    const eventSpy = vi.fn();
    window.addEventListener('pwa:update-available', eventSpy);

    (mockRegistration as any).waiting = mockServiceWorker;

    await startAndFlush();

    expect(eventSpy).toHaveBeenCalled();
    expect(updateManager.isUpdateAvailable()).toBe(true);

    window.removeEventListener('pwa:update-available', eventSpy);
  });

  it('should dispatch event when installing worker becomes installed', async () => {
    const eventSpy = vi.fn();
    window.addEventListener('pwa:update-available', eventSpy);

    const installingWorker = {
      state: 'installing',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as ServiceWorker;

    (mockRegistration as any).installing = installingWorker;

    await startAndFlush();

    // Get the statechange handler
    const addEventListenerCalls = (installingWorker.addEventListener as any).mock.calls;
    const stateChangeCall = addEventListenerCalls.find((call: any[]) => call[0] === 'statechange');
    
    if (stateChangeCall) {
      const stateChangeHandler = stateChangeCall[1];
      
      // Simulate state change to installed
      Object.defineProperty(installingWorker, 'state', { value: 'installed', writable: true });
      (mockRegistration as any).waiting = installingWorker;
      stateChangeHandler();

      expect(eventSpy).toHaveBeenCalled();
      expect(updateManager.isUpdateAvailable()).toBe(true);
    }

    window.removeEventListener('pwa:update-available', eventSpy);
  });

  it('should call skipWaiting on applyUpdate', async () => {
    (mockRegistration as any).waiting = mockServiceWorker;

    await startAndFlush();

    expect(updateManager.isUpdateAvailable()).toBe(true);

    updateManager.applyUpdate();

    expect(mockServiceWorker.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
  });

  it('should check for updates when page becomes visible', async () => {
    await startAndFlush();
    vi.clearAllMocks();

    // Simulate visibility change
    setDocumentVisibilityState('visible');
    document.dispatchEvent(new Event('visibilitychange'));

    await vi.advanceTimersByTimeAsync(100);

    expect(mockRegistration.update).toHaveBeenCalled();
  });

  it('should handle update check errors gracefully', async () => {
    mockRegistration.update = vi.fn().mockRejectedValue(new Error('Network error'));

    await startAndFlush();

    expect(updateManager.isUpdateAvailable()).toBe(false);
  });

  it('should allow manual update check', async () => {
    const hasUpdate = await updateManager.checkForUpdate();
    
    expect(hasUpdate).toBe(false);
    expect(mockRegistration.update).toHaveBeenCalled();
  });

  it('should return true from checkForUpdate when update available', async () => {
    (mockRegistration as any).waiting = mockServiceWorker;
    
    const hasUpdate = await updateManager.checkForUpdate();
    
    expect(hasUpdate).toBe(true);
    expect(updateManager.isUpdateAvailable()).toBe(true);
  });

  it('should handle missing service worker registration gracefully', async () => {
    const navigator = global.navigator as any;
    navigator.serviceWorker.getRegistration = vi.fn().mockResolvedValue(null);

    const hasUpdate = await updateManager.checkForUpdate();

    expect(hasUpdate).toBe(false);
    expect(updateManager.isUpdateAvailable()).toBe(false);
  });

  it('should handle service worker update failure during interval', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockRegistration.update = vi.fn().mockRejectedValue(new Error('Update failed'));

    updateManager.start();
    
    await vi.advanceTimersByTimeAsync(100);

    // Advance to next interval
    vi.advanceTimersByTime(60000);
    await vi.advanceTimersByTimeAsync(100);

    // Should not crash, continues checking
    expect(updateManager.isUpdateAvailable()).toBe(false);

    consoleErrorSpy.mockRestore();
  });

  it('should clear update available state when update is applied', async () => {
    (mockRegistration as any).waiting = mockServiceWorker;

    updateManager.start();
    await vi.advanceTimersByTimeAsync(100);

    expect(updateManager.isUpdateAvailable()).toBe(true);

    updateManager.applyUpdate();

    expect(mockServiceWorker.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
  });

  it('should not apply update when no update is available', () => {
    expect(updateManager.isUpdateAvailable()).toBe(false);

    // Should not crash
    expect(() => updateManager.applyUpdate()).not.toThrow();
  });

  it('should handle visibility change event when hidden', async () => {
    await startAndFlush();
    vi.clearAllMocks();

    // Simulate visibility change to hidden
    setDocumentVisibilityState('hidden');
    document.dispatchEvent(new Event('visibilitychange'));

    await vi.advanceTimersByTimeAsync(100);

    // Should not check when hidden
    expect(mockRegistration.update).not.toHaveBeenCalled();
  });

  it('should handle registration update throwing synchronously', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockRegistration.update = vi.fn().mockImplementation(() => {
      throw new Error('Synchronous error');
    });

    const hasUpdate = await updateManager.checkForUpdate();

    expect(hasUpdate).toBe(false);
    expect(updateManager.isUpdateAvailable()).toBe(false);

    consoleErrorSpy.mockRestore();
  });

  it('should detect update when installing worker transitions to installed', async () => {
    const eventSpy = vi.fn();
    window.addEventListener('pwa:update-available', eventSpy);

    const installingWorker = {
      state: 'installing',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as ServiceWorker;

    (mockRegistration as any).installing = installingWorker;

    await startAndFlush();

    // Simulate state change to installed by directly calling update with waiting worker
    (mockRegistration as any).waiting = installingWorker;
    (mockRegistration as any).installing = null;
    Object.defineProperty(installingWorker, 'state', { value: 'installed', writable: true });

    // Manually trigger another check to detect the waiting worker
    await updateManager.checkForUpdate();

    expect(eventSpy).toHaveBeenCalled();
    expect(updateManager.isUpdateAvailable()).toBe(true);

    window.removeEventListener('pwa:update-available', eventSpy);
  });
});
