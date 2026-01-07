/** PWA Test Utilities - Shared mocks for Service Worker APIs */

import { vi } from 'vitest';

interface ServiceWorkerRegistrationMockOptions {
  workerState?: ServiceWorkerState;
  waiting?: ServiceWorker | null;
  installing?: ServiceWorker | null;
  updateImpl?: () => Promise<void>;
}

interface AttachServiceWorkerOptions {
  registration: ServiceWorkerRegistration;
  serviceWorker?: ServiceWorker | null;
  controller?: boolean;
}

/** Creates a mock ServiceWorkerContainer with register/getRegistration mocks. */
export function createServiceWorkerMock(): ServiceWorkerContainer {
  const mockRegistration: Partial<ServiceWorkerRegistration> = {
    active: null,
    installing: null,
    waiting: null,
    updateViaCache: 'imports',
    scope: '/',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };

  return {
    ready: Promise.resolve(mockRegistration as ServiceWorkerRegistration),
    controller: null,
    register: vi.fn().mockResolvedValue(mockRegistration),
    getRegistration: vi.fn().mockResolvedValue(mockRegistration),
    getRegistrations: vi.fn().mockResolvedValue([mockRegistration as ServiceWorkerRegistration]),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    startMessages: vi.fn(),
  } as unknown as ServiceWorkerContainer;
}

/** Mocks the Notification API constructor and requestPermission. */
export function mockNotificationApi(options?: {
  permission?: NotificationPermission;
  requestResult?: NotificationPermission | Promise<NotificationPermission>;
}): void {
  const permission = options?.permission ?? 'default';
  const requestResult = options?.requestResult ?? permission;

  global.Notification = vi.fn().mockImplementation((title: string, notificationOptions?: NotificationOptions) => ({
    title,
    body: notificationOptions?.body || '',
    icon: notificationOptions?.icon || '',
    tag: notificationOptions?.tag || '',
    data: notificationOptions?.data,
    close: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof Notification;

  (global.Notification as unknown as { requestPermission: typeof vi.fn; permission: NotificationPermission }).requestPermission = vi.fn().mockResolvedValue(requestResult);
  (global.Notification as unknown as { requestPermission: typeof vi.fn; permission: NotificationPermission }).permission = permission;
}

/** Creates a mock ServiceWorkerRegistration and backing ServiceWorker. */
export function createServiceWorkerRegistrationMock(
  options: ServiceWorkerRegistrationMockOptions = {}
): { registration: ServiceWorkerRegistration; serviceWorker: ServiceWorker } {
  const serviceWorker = {
    state: options.workerState ?? 'activated',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    postMessage: vi.fn(),
  } as unknown as ServiceWorker;

  const registration = {
    installing: options.installing ?? null,
    waiting: options.waiting ?? null,
    active: serviceWorker,
    scope: '/',
    update: vi.fn().mockImplementation(options.updateImpl ?? (() => Promise.resolve())),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } as unknown as ServiceWorkerRegistration;

  return { registration, serviceWorker };
}

/** Attaches service worker mocks to navigator.serviceWorker. */
export function attachServiceWorkerMocks(options: AttachServiceWorkerOptions): ServiceWorkerContainer {
  const { registration, serviceWorker = registration.active, controller = true } = options;

  const container = {
    controller: controller ? serviceWorker ?? null : null,
    ready: Promise.resolve(registration),
    getRegistration: vi.fn().mockResolvedValue(registration),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } as unknown as ServiceWorkerContainer;

  Object.defineProperty(navigator, 'serviceWorker', {
    value: container,
    configurable: true,
    writable: true,
  });

  return container;
}

/** Sets document.visibilityState for visibility change tests. */
export function setDocumentVisibilityState(state: DocumentVisibilityState): void {
  Object.defineProperty(document, 'visibilityState', {
    value: state,
    writable: true,
    configurable: true,
  });
}

/** Toggles navigator.onLine and dispatches online/offline event. */
export function toggleOnlineStatus(online: boolean): void {
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    configurable: true,
    value: online,
  });
  window.dispatchEvent(new Event(online ? 'online' : 'offline'));
}

/** Mocks navigator.connection with saveData property. */
export function mockConnection(saveData: boolean): void {
  Object.defineProperty(navigator, 'connection', {
    writable: true,
    configurable: true,
    value: { saveData, effectiveType: '4g', downlink: 10, rtt: 50 },
  });
}
