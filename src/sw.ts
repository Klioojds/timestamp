/**
 * Custom Service Worker
 *
 * Extends Workbox-generated service worker with custom handlers for:
 * - Skip waiting message handling for immediate activation
 * - Client claims on activation
 *
 * @remarks
 * This file is used with vite-plugin-pwa's `injectManifest` mode.
 * Workbox will inject the precache manifest at the `self.__WB_MANIFEST` placeholder.
 */

/// <reference lib="webworker" />

import { ExpirationPlugin } from 'workbox-expiration';
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';

declare let self: ServiceWorkerGlobalScope;

// Declare build-time constant injected by Vite
declare const __BUILD_TIMESTAMP__: string;

/**
 * Smart cache versioning strategy:
 * - Hashed assets (e.g., main-abc123.js): No version needed - hash IS the version
 * - Mutable caches (HTML, non-hashed assets): Use build timestamp
 *
 * This ensures:
 * 1. Hashed assets are cached permanently (immutable by content hash)
 * 2. Mutable content is refreshed on each deploy
 * 3. Users don't re-download unchanged hashed assets
 */
const BUILD_VERSION = typeof __BUILD_TIMESTAMP__ !== 'undefined' ? __BUILD_TIMESTAMP__ : 'dev';

// ============================================================================
// Precaching Setup
// ============================================================================

/**
 * Precache and route all assets from the Workbox manifest.
 * The `self.__WB_MANIFEST` placeholder is replaced at build time.
 */
precacheAndRoute(self.__WB_MANIFEST);

/**
 * Clean up any outdated precaches from previous versions.
 */
cleanupOutdatedCaches();

// ============================================================================
// Runtime Caching Strategies
// ============================================================================

/**
 * HTML pages - Network First with fallback to cache.
 * Ensures users get fresh content when online.
 * Uses build version since HTML changes on each deploy.
 */
registerRoute(
  ({ request }) => request.destination === 'document',
  new NetworkFirst({
    cacheName: `runtime-html-${BUILD_VERSION}`,
    networkTimeoutSeconds: 3,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
      }),
    ],
  })
);

/**
 * Hashed assets (JS/CSS with content hash) - Cache First.
 * @remarks Immutable since hash changes when content changes.
 * NO version in cache name - the content hash IS the version.
 * This allows unchanged assets to persist across deploys.
 */
registerRoute(
  // NOTE: Matches Vite's hashed filename pattern (8+ char hash)
  ({ url }) => /\/assets\/.*-[A-Za-z0-9]{8,}\.(js|css)$/.test(url.pathname),
  new CacheFirst({
    cacheName: 'runtime-hashed-assets',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year (immutable)
      }),
    ],
  })
);

/**
 * Non-hashed JS and CSS assets - Network First for freshness.
 * Uses build version since these may change between deploys.
 */
registerRoute(
  ({ request }) =>
    request.destination === 'script' || request.destination === 'style',
  new NetworkFirst({
    cacheName: `runtime-assets-${BUILD_VERSION}`,
    networkTimeoutSeconds: 3,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
      }),
    ],
  })
);

/**
 * Hashed images - Cache First (immutable).
 * NO version in cache name - the content hash IS the version.
 * This allows unchanged images to persist across deploys.
 */
registerRoute(
  ({ url }) => /\/assets\/.*-[A-Za-z0-9]{8,}\.(webp|png|jpg|jpeg|gif|svg)$/.test(url.pathname),
  new CacheFirst({
    cacheName: 'runtime-hashed-media',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year (immutable)
      }),
    ],
  })
);

/**
 * Non-hashed images - Stale While Revalidate for balance.
 * Uses build version since non-hashed images may change.
 */
registerRoute(
  ({ request }) => request.destination === 'image',
  new StaleWhileRevalidate({
    cacheName: `runtime-media-${BUILD_VERSION}`,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
      }),
    ],
  })
);

// ============================================================================
// Skip Waiting Handler
// ============================================================================

/**
 * Handles the SKIP_WAITING message from the update prompt.
 *
 * When a new service worker is waiting to activate, the update prompt
 * sends this message to immediately activate the new version.
 *
 * @param event - The message event
 */
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ============================================================================
// Activation Handler
// ============================================================================

/**
 * On activation, claim all clients immediately.
 * This ensures the new service worker takes control right away.
 */
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(self.clients.claim());
});
