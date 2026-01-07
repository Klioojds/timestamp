/**
 * PWA Module Types
 */

/** Service Worker registration result. */
export interface PWARegistrationResult {
  registration: ServiceWorkerRegistration | null;
  success: boolean;
  error?: string;
}

/** BeforeInstallPromptEvent for PWA installation. */
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

/** Install prompt state for tracking user interactions. @internal */
export interface InstallPromptState {
  visible: boolean;
  dismissed: boolean;
  visitCount: number;
}

/** Update check configuration (checkInterval in ms, autoReload boolean). */
export interface UpdateCheckConfig {
  checkInterval?: number;
  autoReload?: boolean;
}
