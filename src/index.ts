import '@/styles/main.scss';

import { createOrchestrator, type Orchestrator } from '@app/orchestrator';
import { destroyPWA, initPWA } from '@app/pwa';
import { destroyPerfOverlay, initPerfOverlay } from '@components/perf-overlay';
import { showErrorToast, toastManager } from '@components/toast';
import type { CountdownConfig } from '@core/types';
import { parseDeepLink } from '@core/url';
import { pushCountdownToHistory, pushLandingPageState } from '@core/url';

/**
 * Hide the loading indicator after app initialization.
 * Sets the loading element to hidden with proper ARIA attributes.
 */
function hideLoading(): void {
  const loadingElement = document.getElementById('loading');
  if (loadingElement) {
    loadingElement.classList.add('hidden');
    loadingElement.setAttribute('aria-hidden', 'true');
    loadingElement.setAttribute('inert', 'true');
  }
}

// Store reference to current orchestrator for cleanup
let currentOrchestrator: Orchestrator | null = null;

// NOTE: Track if we're responding to browser back/forward navigation
// When true, skip pushing new history entries to avoid duplicates
let isRespondingToPopstate = false;

/**
 * Start the countdown with the given configuration.
 * Creates an orchestrator and handles cleanup.
 *
 * @param app - The container element for the countdown UI
 * @param config - Countdown configuration (target date, timezone, theme, etc.)
 * @returns Promise that resolves when the countdown is started and rendering
 */
async function startCountdown(app: HTMLElement, config: CountdownConfig): Promise<void> {
  // Clean up previous orchestrator if any
  if (currentOrchestrator) {
    await currentOrchestrator.destroy();
    currentOrchestrator = null;
  }

  currentOrchestrator = createOrchestrator({
    container: app,
    config,
    onBack: () => showLandingPage(app, config),
  });
  await currentOrchestrator.start();
}

/**
 * Show the landing page for countdown configuration.
 * Preserves previous configuration if provided.
 * 
 * @param app - The container element where the landing page will be mounted
 * @param previousConfig - Previous countdown configuration to pre-fill the form;
 *                         useful when returning from countdown view to preserve user settings
 * @param skipHistoryUpdate - If true, don't push a new history entry;
 *                            used during popstate to avoid duplicate entries
 */
async function showLandingPage(
  app: HTMLElement, 
  previousConfig?: CountdownConfig,
  skipHistoryUpdate = false
): Promise<void> {
  // Clean up current orchestrator if any
  if (currentOrchestrator) {
    await currentOrchestrator.destroy();
    currentOrchestrator = null;
  }

  // NOTE: Skip history update during popstate - URL is already correct
  if (!skipHistoryUpdate && !isRespondingToPopstate) {
    pushLandingPageState(previousConfig);
  }

  const { createLandingPage } = await import('@components/landing-page');

  const landingPage = createLandingPage({
    initialConfig: previousConfig,
    onStart: (config) => {
      pushCountdownToHistory(config);
      landingPage.destroy();
      startCountdown(app, config);
    },
  });

  landingPage.mount(app);
}

// CRITICAL: Prevent concurrent navigation operations that cause race conditions
let isNavigating = false;

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', async () => {
  const app = document.getElementById('app');
  if (!app) return;

  hideLoading();

  // Initialize performance overlay (dev only - tree-shaken in production)
  initPerfOverlay();

  // Initialize PWA features (service worker, offline indicator)
  initPWA().catch((error) => {
    // Log PWA initialization errors but don't block app startup
    if (import.meta.env.DEV) {
      console.error('[App] PWA initialization failed:', error);
    }
  });

  // Set up popstate handler BEFORE initial navigation
  // This ensures it's ready for back/forward button clicks
  window.addEventListener('popstate', async (event) => {
    // Guard against concurrent navigation
    if (isNavigating) return;
    isNavigating = true;
    isRespondingToPopstate = true;

    try {
      const deepLink = parseDeepLink(window.location.href);

      // Restore countdown config from history state if available
      const storedConfig = event.state?.config as CountdownConfig | undefined;
      const config = storedConfig ?? deepLink.config;

      // Check if we're navigating to landing page (no URL params or view is 'landing')
      const isLandingPage = event.state?.view === 'landing' || !window.location.search;

      if (isLandingPage) {
        // Show landing page, preserving config if available
        await showLandingPage(app, config);
      } else if (deepLink.isValid && !deepLink.shouldShowConfiguration && config) {
        // Valid deep link with countdown config
        await startCountdown(app, config);
      } else {
        // Fallback to landing page
        await showLandingPage(app, config);
      }
    } finally {
      isNavigating = false;
      isRespondingToPopstate = false;
    }
  });

  const deepLink = parseDeepLink(window.location.href);

  // Valid deep links go directly to countdown unless configure=true is specified
  if (deepLink.isValid && !deepLink.shouldShowConfiguration && deepLink.config) {
    performance.mark('dl-start');

    await startCountdown(app, deepLink.config);

    performance.mark('dl-end');
    performance.measure('dl', 'dl-start', 'dl-end');

    window.addEventListener('beforeunload', () => {
      currentOrchestrator?.destroy();
    });
    return;
  }

  const { createLandingPage } = await import('@components/landing-page');

  // Replace initial history state with proper landing page state
  // This ensures popstate handlers can identify this as the landing page
  window.history.replaceState({ view: 'landing' }, '', window.location.href);

  const landingPage = createLandingPage({
    initialConfig: deepLink.isValid ? deepLink.config : undefined,
    onStart: (config) => {
      // Update the landing page's history entry with the config before pushing countdown
      // This allows form values to be restored when navigating back
      window.history.replaceState({ view: 'landing', config }, '', window.location.href);
      pushCountdownToHistory(config);
      landingPage.destroy();
      startCountdown(app, config);
    },
  });

  landingPage.mount(app);

  // Show error toast for deep link parsing errors
  if (deepLink.errors && deepLink.errors.length > 0) {
    showErrorToast(deepLink.errors[0], {
      id: 'deep-link-error',
      duration: 8000, // Auto-dismiss after 8 seconds
    });
  }

  window.addEventListener('beforeunload', () => {
    currentOrchestrator?.destroy();
    toastManager.destroy();
    destroyPWA();
    destroyPerfOverlay();
  });
});
