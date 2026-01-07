/** Service Worker Registration Module */

import type { PWARegistrationResult } from './types';

/** Registers the service worker for PWA functionality. Defers until page load; skips if data saver mode is enabled. @public */
export async function registerServiceWorker(): Promise<PWARegistrationResult> {
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker) {
    return {
      success: false,
      registration: null,
      error: 'Service workers not supported in this browser',
    };
  }

  // NOTE: Respect data saver mode - skip registration if enabled to reduce bandwidth
  // NetworkInformation API is not fully standardized, so we use type assertion
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (connection?.saveData) {
    if (import.meta.env.DEV) {
      console.log('[PWA] Skipping service worker registration (data saver mode enabled)');
    }
    return {
      success: false,
      registration: null,
      error: 'Data saver mode enabled',
    };
  }

  try {
    // PERF: Wait for window load event to avoid blocking initial page load
    if (document.readyState !== 'complete') {
      await new Promise<void>((resolve) => {
        window.addEventListener('load', () => resolve(), { once: true });
      });
    }

    // NOTE: VitePWA uses different service worker paths in dev vs production:
    // - Dev: dev-sw.js?dev-sw (module type, for hot reload support)
    // - Production: sw.js (classic type)
    const base = import.meta.env.BASE_URL;
    const swPath = import.meta.env.DEV 
      ? `${base}dev-sw.js?dev-sw`
      : `${base}sw.js`;
    const swType = import.meta.env.DEV ? 'module' : 'classic';
    
    const registration = await navigator.serviceWorker.register(swPath, {
      scope: base,
      type: swType as WorkerType,
    });

    if (import.meta.env.DEV) {
      console.log('[PWA] Service worker registered:', registration);
    }

    return {
      success: true,
      registration,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (import.meta.env.DEV) {
      console.error('[PWA] Service worker registration failed:', errorMessage);
    }

    return {
      success: false,
      registration: null,
      error: errorMessage,
    };
  }
}

/** Gets the current service worker registration. Returns null if unsupported or not yet registered. @public */
export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker) {
    return null;
  }

  try {
    const base = import.meta.env.BASE_URL;
    const registration = await navigator.serviceWorker.getRegistration(base);
    return registration ?? null;
  } catch {
    return null;
  }
}
