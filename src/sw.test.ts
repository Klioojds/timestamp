import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

type MockServiceWorkerScope = {
  __WB_MANIFEST: unknown[];
  skipWaiting: ReturnType<typeof vi.fn>;
  clients: { claim: ReturnType<typeof vi.fn> };
  addEventListener: ReturnType<typeof vi.fn>;
};

const listeners = new Map<string, (event: unknown) => void>();

const registerRoute = vi.fn();

vi.mock('workbox-precaching', () => ({
  precacheAndRoute: vi.fn(),
  cleanupOutdatedCaches: vi.fn(),
}));

vi.mock('workbox-routing', () => ({
  registerRoute,
}));

class MockExpirationPlugin {
  options: unknown;

  constructor(options: unknown) {
    this.options = options;
  }
}

class MockNetworkFirst {
  options: { cacheName?: string };

  constructor(options: { cacheName?: string }) {
    this.options = options;
  }
}

class MockCacheFirst {
  options: { cacheName?: string };

  constructor(options: { cacheName?: string }) {
    this.options = options;
  }
}

class MockStaleWhileRevalidate {
  options: { cacheName?: string };

  constructor(options: { cacheName?: string }) {
    this.options = options;
  }
}

vi.mock('workbox-strategies', () => ({
  NetworkFirst: MockNetworkFirst,
  CacheFirst: MockCacheFirst,
  StaleWhileRevalidate: MockStaleWhileRevalidate,
}));

vi.mock('workbox-expiration', () => ({
  ExpirationPlugin: MockExpirationPlugin,
}));

const setMockServiceWorkerScope = () => {
  listeners.clear();

  (globalThis as unknown as { self?: unknown }).self = {
    __WB_MANIFEST: [],
    skipWaiting: vi.fn(),
    clients: {
      claim: vi.fn().mockResolvedValue(undefined),
    },
    addEventListener: vi.fn((event: string, handler: (event: unknown) => void) => {
      listeners.set(event, handler);
    }),
  } satisfies MockServiceWorkerScope;
};

const importSw = async () => {
  setMockServiceWorkerScope();
  await import('./sw');
};

const getListener = (event: string) => listeners.get(event) as ((event: any) => void) | undefined;

describe('service worker', () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    listeners.clear();
    await importSw();
  });

  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete (globalThis as Record<string, unknown>).self;
  });

  it('should call skipWaiting when SKIP_WAITING message is received', () => {
    const messageHandler = getListener('message');
    const mockSelf = (globalThis as { self: MockServiceWorkerScope }).self;

    messageHandler?.({ data: { type: 'SKIP_WAITING' } });

    expect(mockSelf.skipWaiting).toHaveBeenCalledTimes(1);
  });

  it('should not call skipWaiting for non-matching message types', () => {
    const messageHandler = getListener('message');
    const mockSelf = (globalThis as { self: MockServiceWorkerScope }).self;

    messageHandler?.({ data: { type: 'IGNORED' } });

    expect(mockSelf.skipWaiting).not.toHaveBeenCalled();
  });

  it('should claim clients during activation via waitUntil', async () => {
    const activateHandler = getListener('activate');
    const mockSelf = (globalThis as { self: MockServiceWorkerScope }).self;
    const waitUntil = vi.fn();

    await activateHandler?.({ waitUntil });

    expect(mockSelf.clients.claim).toHaveBeenCalledTimes(1);
    expect(waitUntil).toHaveBeenCalledTimes(1);
    await expect(waitUntil.mock.calls[0][0]).resolves.toBeUndefined();
  });

  it('should register runtime caching routes with expected strategies', async () => {
    const { registerRoute: mockedRegisterRoute } = await import('workbox-routing');
    const { NetworkFirst, CacheFirst, StaleWhileRevalidate } = await import('workbox-strategies');

    expect(mockedRegisterRoute).toHaveBeenCalledTimes(5);

    const routeExpectations = [
      {
        description: 'HTML documents use NetworkFirst',
        Strategy: NetworkFirst,
        cacheKey: 'runtime-html',
        matcher: (predicate: (args: { request: { destination: string } }) => boolean) =>
          predicate({ request: { destination: 'document' } }),
      },
      {
        description: 'Hashed JS/CSS assets use CacheFirst',
        Strategy: CacheFirst,
        cacheKey: 'runtime-hashed-assets',
        matcher: (predicate: (args: { url: URL }) => boolean) =>
          predicate({ url: new URL('https://example.com/assets/app-abc12345.js') }),
      },
      {
        description: 'Non-hashed assets use NetworkFirst',
        Strategy: NetworkFirst,
        cacheKey: 'runtime-assets',
        matcher: (predicate: (args: { request: { destination: string } }) => boolean) =>
          predicate({ request: { destination: 'script' } }),
      },
      {
        description: 'Hashed images use CacheFirst',
        Strategy: CacheFirst,
        cacheKey: 'runtime-hashed-media',
        matcher: (predicate: (args: { url: URL }) => boolean) =>
          predicate({ url: new URL('https://example.com/assets/pic-abc12345.webp') }),
      },
      {
        description: 'Non-hashed images use StaleWhileRevalidate',
        Strategy: StaleWhileRevalidate,
        cacheKey: 'runtime-media',
        matcher: (predicate: (args: { request: { destination: string } }) => boolean) =>
          predicate({ request: { destination: 'image' } }),
      },
    ];

    routeExpectations.forEach(({ description, Strategy, cacheKey, matcher }) => {
      const call = mockedRegisterRoute.mock.calls.find(([, strategy]) =>
        strategy instanceof Strategy && strategy.options?.cacheName?.includes(cacheKey)
      );

      expect(call, description).toBeTruthy();

      const [predicate, strategy] = call!;

      expect(matcher(predicate as any), `${description} predicate`).toBe(true);
      expect((strategy as { options?: { cacheName?: string } }).options?.cacheName).toContain(cacheKey);
    });
  });

  it('should precache manifest and clean outdated caches on install', async () => {
    const { precacheAndRoute, cleanupOutdatedCaches } = await import('workbox-precaching');

    expect(precacheAndRoute).toHaveBeenCalledTimes(1);
    expect(precacheAndRoute).toHaveBeenCalledWith([]);
    expect(cleanupOutdatedCaches).toHaveBeenCalledTimes(1);
  });
});
