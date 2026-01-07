---
applyTo: "src/{app,components}/pwa/**/*.ts"
description: Progressive Web App development guidelines and best practices
---

# PWA Development Instructions

Guidelines for developing Progressive Web App features in the Timestamp project. These instructions ensure consistency, maintainability, and adherence to best practices.

## Key Concepts

PWA development in this project follows these principles:
- **Progressive Enhancement**: App works without service worker; SW adds offline capability
- **Controller Factory Pattern**: All components use consistent lifecycle API
- **Event-Based Decoupling**: Cross-module communication via custom events
- **Accessibility First**: All UI components meet Level AA standards

## Rules and Guidelines

### Architecture Patterns

### Controller Factory Pattern

All PWA components use the controller factory pattern for consistent API and lifecycle management:

```typescript
export interface ComponentController {
  /**
   * Initialize the component
   * Start event listeners, fetch data, etc.
   */
  init(): void;

  /**
   * Get the DOM element
   * @returns The root DOM element
   */
  getElement(): HTMLElement;

  /**
   * Clean up resources
   * Remove event listeners, clear timers, etc.
   */
  destroy(): void;
}

export function createComponent(): ComponentController {
  // Component state
  let isInitialized = false;
  
  // DOM elements
  const container = document.createElement('div');
  
  return {
    init() {
      if (isInitialized) return;
      isInitialized = true;
      // Setup logic
    },
    
    getElement() {
      return container;
    },
    
    destroy() {
      if (!isInitialized) return;
      isInitialized = false;
      // Cleanup logic
    },
  };
}
```

**Benefits:**
- Consistent API across components
- Prevents double initialization
- Ensures proper cleanup
- Testable (can mock DOM in unit tests)

### Event-Based Decoupling

Use custom events for cross-module communication:

```typescript
// Emitter (e.g., orchestrator)
window.dispatchEvent(new CustomEvent('countdown:complete', {
  detail: { 
    title: 'New Year 2026',
    targetTime: 1735689600000,
    themeId: 'contribution-graph' 
  }
}));

// Listener (e.g., PWA module)
window.addEventListener('countdown:complete', (event: CustomEvent) => {
  const { title, targetTime } = event.detail;
  scheduleNotification(title, targetTime);
});
```

**Benefits:**
- No direct coupling between modules
- Easy to add new listeners
- Testable (can dispatch synthetic events)

**Naming Convention:** `<module>:<action>` (e.g., `countdown:complete`, `pwa:update`)

## Service Worker Best Practices

### Strategy Selection

This project uses **injectManifest** mode for the service worker, which allows custom handlers:

```typescript
// vite.config.ts
VitePWA({
  strategies: 'injectManifest',
  srcDir: 'src',
  filename: 'sw.ts',
  registerType: 'prompt',
  injectManifest: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
    maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
  },
})
```

**When to use injectManifest vs generateSW:**

| Mode | Use When |
|------|----------|
| `generateSW` | Simple caching only; no custom handlers needed |
| `injectManifest` | Need custom handlers (notifications, background sync, etc.) |

The custom service worker at `src/sw.ts` includes:
- **Skip waiting message handling**: Immediate activation on update
- **Smart cache versioning**: Hashed assets cached permanently, mutable caches use build timestamp
- **Runtime caching strategies**: NetworkFirst for HTML, CacheFirst for hashed assets, StaleWhileRevalidate for images

### Registration Timing

**ALWAYS defer registration until after page load:**

```typescript
export async function registerServiceWorker(): Promise<PWARegistrationResult> {
  // Wait for window load event
  if (document.readyState !== 'complete') {
    await new Promise<void>((resolve) => {
      window.addEventListener('load', () => resolve(), { once: true });
    });
  }

  // Register service worker
  const registration = await navigator.serviceWorker.register('/timestamp/sw.js', {
    scope: '/timestamp/',
  });

  return { success: true, registration };
}
```

**Rationale:** Service worker registration can block the main thread. Deferring until after `load` ensures fast Time to Interactive (TTI).

### Data Saver Mode

**ALWAYS respect `navigator.connection.saveData`:**

```typescript
const connection = (navigator as any).connection;
if (connection?.saveData) {
  console.log('[PWA] Skipping service worker registration (data saver mode)');
  return { success: false, error: 'Data saver mode enabled' };
}
```

**Rationale:** Users with data saver mode enabled want minimal data usage. Service workers cache assets, consuming data.

### Error Handling

**NEVER throw errors from service worker registration:**

```typescript
try {
  const registration = await navigator.serviceWorker.register('/timestamp/sw.js');
  return { success: true, registration };
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  
  if (import.meta.env.DEV) {
    console.error('[PWA] Service worker registration failed:', errorMessage);
  }

  return { success: false, registration: null, error: errorMessage };
}
```

**Rationale:** PWA features are enhancements. If registration fails, the app should still work as a regular web app.

## Caching Strategies

### Caching Strategy Decision Tree

```
Is the resource critical for app shell?
├─ YES → Precache with Workbox (install step)
└─ NO → Runtime caching
    ├─ HTML/Navigation? → NetworkFirst with 3s timeout
    ├─ Static assets (JS/CSS)? → CacheFirst with long TTL
    └─ Media/Images? → StaleWhileRevalidate
```

### Precache Configuration

**Keep precache small (≤1.5MB):**

```typescript
// vite.config.ts
VitePWA({
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
    globIgnores: ['**/preview.webp', '**/*.map'], // Exclude large files
    maximumFileSizeToCacheInBytes: 1.6 * 1024 * 1024,
  },
})
```

**What to precache:** HTML shell, critical JS/CSS, app icon, manifest
**What NOT to precache:** Theme previews, source maps, large media, API responses

### Runtime Caching

**Smart Cache Versioning Strategy:**
The service worker uses a smart versioning approach:
- **Hashed assets** (e.g., `main-abc123.js`): No version in cache name - the hash IS the version
- **Mutable content** (HTML, non-hashed assets): Use build timestamp in cache name

```typescript
// HTML - Network First with build version
registerRoute(
  ({ request }) => request.destination === 'document',
  new NetworkFirst({
    cacheName: `runtime-html-${BUILD_VERSION}`,
    networkTimeoutSeconds: 3,
    plugins: [new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 7 })],
  })
);

// Hashed assets - Cache First WITHOUT version (immutable)
registerRoute(
  ({ url }) => /\/assets\/.*-[A-Za-z0-9]{8,}\.(js|css)$/.test(url.pathname),
  new CacheFirst({
    cacheName: 'runtime-hashed-assets', // No version - hash IS version
    plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 365 })],
  })
);
```

**Cache Naming:**
- Hashed assets: `runtime-hashed-<type>` (no version suffix)
- Mutable content: `runtime-<type>-${BUILD_VERSION}` (e.g., `runtime-html-1a2b3c4`)

### Performance Requirements

- **Install time**: ≤3s at 4G speeds (keep precache under 1.5MB)
- **Network timeout**: HTML requests timeout to cache after 3s
- **Quota management**: Use `maxEntries`, `maxAgeSeconds`, `purgeOnQuotaError: true`

### Update Lifecycle

**Detecting updates:**
```typescript
async function checkForUpdates(registration: ServiceWorkerRegistration): Promise<void> {
  if (registration.waiting) { showUpdatePrompt(); return; }
  registration.addEventListener('updatefound', () => {
    const worker = registration.installing;
    worker?.addEventListener('statechange', () => {
      if (worker.state === 'installed' && navigator.serviceWorker.controller) {
        showUpdatePrompt();
      }
    });
  });
}
```

**Skip waiting flow:**
```typescript
function applyUpdate(registration: ServiceWorkerRegistration): void {
  if (!registration.waiting) return;
  registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}
```

## Accessibility Requirements

### ARIA Live Regions

**ALL dynamic status updates must use ARIA live regions:**
- `role="status"` with `aria-live="polite"` for background events
- `aria-live="assertive"` for urgent updates (critical errors)

### Dialog Components

**ALL modal dialogs must have:** `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`

### Focus Management

**ALL dialogs must implement focus trap:** trap Tab key between first/last focusable elements, focus first element on show, return focus on dismiss.

### Reduced Motion

**ALWAYS respect `prefers-reduced-motion`** — check `window.matchMedia('(prefers-reduced-motion: reduce)').matches` and disable animations when true.

## iOS Detection Utilities

### Platform Detection

**Create reusable utilities in `src/core/pwa/platform.ts`:**

```typescript
/**
 * Detect if device is running iOS Safari
 */
export function isIOSSafari(): boolean {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
}

/**
 * Get iOS version number (returns null if not iOS)
 */
export function getIOSVersion(): number | null {
  const ua = navigator.userAgent;
  const match = ua.match(/OS (\d+)_(\d+)/);
  if (!match) return null;
  return parseFloat(`${match[1]}.${match[2]}`);
}

/**
 * Check if iOS version supports push notifications for PWAs
 */
export function isiOSPushSupported(): boolean {
  const version = getIOSVersion();
  return version !== null && version >= 16.4;
}

/**
 * Check if app is running as installed PWA
 */
export function isInstalledPWA(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (navigator as any).standalone === true;
}
```

**Usage:**

```typescript
import { isIOSSafari, isiOSPushSupported, isInstalledPWA } from '@core/pwa/platform';

if (isIOSSafari()) {
  if (!isiOSPushSupported()) {
    showMessage('Push notifications require iOS 16.4 or later');
  } else if (!isInstalledPWA()) {
    showMessage('Install to home screen to enable notifications');
  } else {
    requestNotificationPermission();
  }
}
```

## Testing Patterns

PWA testing follows the same patterns as the main application. See [testing.instructions.md](.github/instructions/testing.instructions.md) for general testing guidelines.

**PWA-specific test utilities:**
- `createServiceWorkerMock()` from `@/pwa/test-utils` - Mock service worker for unit tests
- Test custom events with `vi.fn()` and `dispatchEvent()`
- Always `await` async service worker operations
- Validate ARIA attributes for accessibility

## Performance Requirements

See Caching Strategies section above for service worker install time, network-first timeout, and cache quota management.

## Security Considerations

### HTTPS Requirement

Service workers require secure context (HTTPS or localhost):

```typescript
if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
  console.warn('[PWA] Service workers require HTTPS');
  return { success: false, error: 'HTTPS required' };
}
```

### Manifest Configuration

The app manifest is configured in `vite.config.ts` (not a separate `manifest.json` file):

```typescript
VitePWA({
  manifest: {
    name: 'Timestamp',
    short_name: 'Timestamp',
    description: 'A customizable time tracking app with countdowns, timers, and world clocks',
    theme_color: '#0d1117',
    background_color: '#0d1117',
    display: 'standalone',
    start_url: './',
    scope: './',
    icons: [ /* ... */ ],
  },
})
```

The manifest is generated at build time by vite-plugin-pwa.

### Content Security Policy

Ensure manifest and service worker are served with correct CSP headers:

```http
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
```

## Notifications - Not Currently Implemented

### Why Notifications Are Disabled

Push notifications were investigated but not implemented due to platform limitations on macOS and iOS:

**Local notifications** (via `new Notification()`) only work when the app is open and actively running. Since countdown timers often complete when the user has closed the app or locked their device, local notifications would not provide as useful an experience.

**Web Push** (server-pushed notifications via APNs/FCM) would work in the background but requires:
- A push server infrastructure with VAPID keys
- Server-side scheduling to send notifications at countdown completion
- Additional complexity for a countdown timer app

This is a known limitation. For future reference, if background notifications are needed:
- See [Apple Web Push Documentation](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers)
- See [WebKit Web Push Blog](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)

The platform utilities (`isIOSSafari`, `isiOSPushSupported`, `isInstalledPWA`) are retained in `src/core/pwa/platform.ts` for potential future use.

## PWA Components

The project includes PWA UI components in `src/components/pwa/`:

### Install Prompt
**Module**: `src/components/pwa/install-prompt/`

Displays a native-like prompt when the app can be installed (via `beforeinstallprompt` event).

**Key Features:**
- Tracks install prompt state via `BeforeInstallPromptEvent`
- Shows install UI when prompt is deferrable
- Hides after successful installation
- Uses controller factory pattern for lifecycle management

### Offline Indicator
**Module**: `src/components/pwa/offline-indicator.ts`

Shows a visual indicator when the app goes offline/online.

**Key Features:**
- Listens to `online`/`offline` events
- Displays toast notification on state changes
- Auto-hides after 3 seconds when back online
- Accessible with ARIA live region

## Update Prompt Patterns

See Update Lifecycle in Caching Strategies section above for update detection and skip-waiting flow patterns.

## Documentation Requirements

### TSDoc Comments

**ALL exported functions must have TSDoc comments:**

```typescript
/**
 * Registers the service worker for PWA functionality
 * 
 * Registration is deferred until after the page load event to avoid
 * impacting initial page performance. Skips registration when the user
 * has data saver mode enabled.
 * 
 * @returns Promise resolving to registration result
 * 
 * @example
 * ```typescript
 * const result = await registerServiceWorker();
 * if (result.success) {
 *   console.log('Service worker registered:', result.registration);
 * }
 * ```
 */
export async function registerServiceWorker(): Promise<PWARegistrationResult> {
  // Implementation
}
```

### File Headers

**ALL PWA module files must have descriptive headers:**

```typescript
/**
 * Service Worker Registration Module
 * Handles registration and lifecycle of the service worker
 */
```

## Anti-Patterns

| Anti-Pattern | Why It's Bad | Correct Approach |
|--------------|--------------|------------------|
| Requesting notifications on load | Annoying, likely denied | Request after user action |
| Throwing errors from SW registration | Breaks app for users without SW support | Return error result, log only |
| Hardcoding user agent checks | Brittle, hard to test | Use platform detection utilities |
| Not respecting data saver mode | Wastes user's limited data | Skip SW registration when enabled |
| Forgetting to cleanup event listeners | Memory leaks | Always remove listeners in `destroy()` |
| Precaching everything | Slow install; wastes bandwidth | Precache only critical shell |
| No cache eviction limits | Storage fills up; quota exceeded | Use `maxEntries` and `maxAgeSeconds` |
| Missing network timeout | Stuck waiting on slow network | Set `networkTimeoutSeconds: 3` |
| Not testing on real iOS devices | Simulators don't support push | Use physical device for notification testing |
| Ignoring `prefers-reduced-motion` | Accessibility failure | Disable animations when set |

## Checklist for New PWA Features

Before implementing a new PWA feature:

- [ ] Read iOS Limitations guide to understand platform constraints
- [ ] Design graceful degradation for unsupported platforms
- [ ] Plan event-based architecture (avoid tight coupling)
- [ ] Create platform detection utilities if needed
- [ ] Write TSDoc comments for all public APIs
- [ ] Implement accessibility features (ARIA, focus management)
- [ ] Add unit tests with service worker mocks
- [ ] Add E2E tests with Playwright
- [ ] Test on real iOS device (if feature affects iOS)
- [ ] Update user guide with feature documentation
- [ ] Verify Lighthouse PWA score remains 100

## References

### Related Instructions
- [typescript.instructions.md](.github/instructions/typescript.instructions.md) - TypeScript coding standards
- [testing.instructions.md](.github/instructions/testing.instructions.md) - Unit and E2E testing patterns
- [perf-analysis.instructions.md](.github/instructions/perf-analysis.instructions.md) - Performance monitoring


### External Documentation
- [Service Worker API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Workbox (Google)](https://developers.google.com/web/tools/workbox)
- [Workbox Strategies](https://developers.google.com/web/tools/workbox/modules/workbox-strategies) - Caching strategy reference
- [Web App Manifest (W3C)](https://www.w3.org/TR/appmanifest/)
- [Push API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Web Content Accessibility Guidelines (W3C)](https://www.w3.org/WAI/WCAG22/quickref/)
- [PWA Patterns (web.dev)](https://web.dev/patterns/web-app-patterns/)
