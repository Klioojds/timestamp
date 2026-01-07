/**
 * Application Entry Point - Unit Tests
 * Tests for the main application initialization and navigation logic.
 */
import type { CountdownConfig } from '@core/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock all external dependencies
const mockOrchestrator = {
  start: vi.fn().mockResolvedValue(undefined),
  destroy: vi.fn().mockResolvedValue(undefined),
};

const mockLandingPage = {
  mount: vi.fn(),
  destroy: vi.fn(),
};

let landingPageOnStart: ((config: CountdownConfig) => void) | null = null;

vi.mock('@app/orchestrator', () => ({
  createOrchestrator: vi.fn(() => mockOrchestrator),
}));

vi.mock('@components/landing-page', () => ({
  createLandingPage: vi.fn((options: { onStart: (config: CountdownConfig) => void }) => {
    landingPageOnStart = options.onStart;
    return mockLandingPage;
  }),
}));

vi.mock('@app/pwa', () => ({
  initPWA: vi.fn().mockResolvedValue(undefined),
  destroyPWA: vi.fn(),
}));

vi.mock('@components/perf-overlay', () => ({
  initPerfOverlay: vi.fn(),
  destroyPerfOverlay: vi.fn(),
}));

vi.mock('@components/toast', () => ({
  showErrorToast: vi.fn(),
  toastManager: {
    destroy: vi.fn(),
  },
}));

vi.mock('@core/url', () => ({
  parseDeepLink: vi.fn(() => ({
    isValid: false,
    shouldShowConfiguration: false,
    config: null,
    errors: null,
  })),
  pushCountdownToHistory: vi.fn(),
  pushLandingPageState: vi.fn(),
}));

vi.mock('@/styles/main.scss', () => ({}));

describe('app entry point', () => {
  let container: HTMLElement;

  beforeEach(async () => {
    vi.clearAllMocks();
    landingPageOnStart = null;

    // Reset parseDeepLink mock to default
    const { parseDeepLink } = await import('@core/url');
    vi.mocked(parseDeepLink).mockReturnValue({
      isValid: false,
      shouldShowConfiguration: false,
      config: null,
      errors: null,
    });

    // Create app container
    container = document.createElement('div');
    container.id = 'app';
    document.body.appendChild(container);

    // Create loading element
    const loading = document.createElement('div');
    loading.id = 'loading';
    document.body.appendChild(loading);

    // Reset location
    window.history.replaceState(null, '', '/');
  });

  afterEach(() => {
    if (container && document.body.contains(container)) {
      container.remove();
    }
    const loading = document.getElementById('loading');
    if (loading) {
      loading.remove();
    }
    vi.resetModules();
  });

  describe('DOMContentLoaded', () => {
    it('should hide loading indicator on initialization', async () => {
      const { default: init } = await import('./index');

      const loading = document.getElementById('loading');
      expect(loading).toBeTruthy();

      document.dispatchEvent(new Event('DOMContentLoaded'));

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(loading?.classList.contains('hidden')).toBe(true);
      expect(loading?.getAttribute('aria-hidden')).toBe('true');
      expect(loading?.getAttribute('inert')).toBe('true');
    });

    it('should return early if app container is missing', async () => {
      container.remove();

      const { default: init } = await import('./index');
      document.dispatchEvent(new Event('DOMContentLoaded'));

      await new Promise(resolve => setTimeout(resolve, 50));

      const { createLandingPage } = await import('@components/landing-page');
      expect(createLandingPage).not.toHaveBeenCalled();
    });

    it('should initialize PWA features', async () => {
      const { initPWA } = await import('@app/pwa');
      const { default: init } = await import('./index');

      document.dispatchEvent(new Event('DOMContentLoaded'));

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(initPWA).toHaveBeenCalled();
    });

    it('should initialize performance overlay', async () => {
      const { initPerfOverlay } = await import('@components/perf-overlay');
      const { default: init } = await import('./index');

      document.dispatchEvent(new Event('DOMContentLoaded'));

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(initPerfOverlay).toHaveBeenCalled();
    });

    it('should handle PWA initialization errors without blocking', async () => {
      const { initPWA } = await import('@app/pwa');
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      vi.mocked(initPWA).mockRejectedValueOnce(new Error('PWA init failed'));

      const { default: init } = await import('./index');
      document.dispatchEvent(new Event('DOMContentLoaded'));

      await new Promise(resolve => setTimeout(resolve, 50));

      // App should still load despite PWA error
      const { createLandingPage } = await import('@components/landing-page');
      expect(createLandingPage).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('landing page', () => {
    it('should mount landing page when no deep link present', async () => {
      const { createLandingPage } = await import('@components/landing-page');

      const { default: init } = await import('./index');
      document.dispatchEvent(new Event('DOMContentLoaded'));

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(createLandingPage).toHaveBeenCalled();
      expect(mockLandingPage.mount).toHaveBeenCalledWith(container);
    });

    it('should replace history state with landing page marker', async () => {
      const replaceStateSpy = vi.spyOn(window.history, 'replaceState');

      const { default: init } = await import('./index');
      document.dispatchEvent(new Event('DOMContentLoaded'));

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(replaceStateSpy).toHaveBeenCalledWith(
        { view: 'landing' },
        '',
        window.location.href
      );
    });

    it('should show error toast when deep link has parsing errors', async () => {
      const { parseDeepLink } = await import('@core/url');
      const { showErrorToast } = await import('@components/toast');

      vi.mocked(parseDeepLink).mockReturnValue({
        isValid: false,
        shouldShowConfiguration: false,
        config: null,
        errors: ['Invalid timezone'],
      });

      const { default: init } = await import('./index');
      document.dispatchEvent(new Event('DOMContentLoaded'));

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(showErrorToast).toHaveBeenCalledWith('Invalid timezone', {
        id: 'deep-link-error',
        duration: 8000,
      });
    });

    it('should not show error toast when deep link has no errors', async () => {
      const { parseDeepLink } = await import('@core/url');
      const { showErrorToast } = await import('@components/toast');

      // Explicitly set no errors for this test
      vi.mocked(parseDeepLink).mockReturnValue({
        isValid: false,
        shouldShowConfiguration: false,
        config: null,
        errors: null,
      });

      vi.mocked(showErrorToast).mockClear();

      const { default: init } = await import('./index');
      document.dispatchEvent(new Event('DOMContentLoaded'));

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(showErrorToast).not.toHaveBeenCalled();
    });
  });

  describe('deep links', () => {
    it('should start countdown directly for valid deep link without configure=true', async () => {
      const mockConfig: CountdownConfig = {
        mode: 'wall-clock',
        targetDate: new Date('2025-12-31T23:59:59Z'),
        timezone: 'UTC',
        theme: 'contribution-graph',
        showWorldMap: true,
      };

      const { parseDeepLink } = await import('@core/url');
      const { createOrchestrator } = await import('@app/orchestrator');

      vi.mocked(parseDeepLink).mockReturnValue({
        isValid: true,
        shouldShowConfiguration: false,
        config: mockConfig,
        errors: null,
      });

      const { default: init } = await import('./index');
      document.dispatchEvent(new Event('DOMContentLoaded'));

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(createOrchestrator).toHaveBeenCalledWith({
        container,
        config: mockConfig,
        onBack: expect.any(Function),
      });
      expect(mockOrchestrator.start).toHaveBeenCalled();
    });

    it('should show landing page for valid deep link with configure=true', async () => {
      const mockConfig: CountdownConfig = {
        mode: 'timer',
        targetDate: new Date(),
        durationSeconds: 300,
        timezone: 'UTC',
        theme: 'fireworks',
        showWorldMap: false,
      };

      const { parseDeepLink } = await import('@core/url');
      const { createLandingPage } = await import('@components/landing-page');

      vi.mocked(parseDeepLink).mockReturnValue({
        isValid: true,
        shouldShowConfiguration: true,
        config: mockConfig,
        errors: null,
      });

      const { default: init } = await import('./index');
      document.dispatchEvent(new Event('DOMContentLoaded'));

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(createLandingPage).toHaveBeenCalledWith({
        initialConfig: mockConfig,
        onStart: expect.any(Function),
      });
      expect(mockLandingPage.mount).toHaveBeenCalled();
    });

    it('should measure deep link performance', async () => {
      const markSpy = vi.spyOn(performance, 'mark');
      const measureSpy = vi.spyOn(performance, 'measure');

      const mockConfig: CountdownConfig = {
        mode: 'absolute',
        targetDate: new Date('2025-06-01T12:00:00Z'),
        timezone: 'America/New_York',
        theme: 'contribution-graph',
        showWorldMap: false,
      };

      const { parseDeepLink } = await import('@core/url');

      vi.mocked(parseDeepLink).mockReturnValue({
        isValid: true,
        shouldShowConfiguration: false,
        config: mockConfig,
        errors: null,
      });

      const { default: init } = await import('./index');
      document.dispatchEvent(new Event('DOMContentLoaded'));

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(markSpy).toHaveBeenCalledWith('dl-start');
      expect(markSpy).toHaveBeenCalledWith('dl-end');
      expect(measureSpy).toHaveBeenCalledWith('dl', 'dl-start', 'dl-end');
    });
  });

  describe('countdown start', () => {
    it('should destroy previous orchestrator before starting new countdown', async () => {
      const { createOrchestrator } = await import('@app/orchestrator');
      const { default: init } = await import('./index');

      document.dispatchEvent(new Event('DOMContentLoaded'));
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockLandingPage.mount).toHaveBeenCalled();
      
      // Wait for landingPageOnStart to be set
      await vi.waitFor(() => expect(landingPageOnStart).not.toBeNull(), { timeout: 1000 });

      const config1: CountdownConfig = {
        mode: 'timer',
        targetDate: new Date(),
        durationSeconds: 300,
        timezone: 'UTC',
        theme: 'fireworks',
        showWorldMap: false,
      };

      // Start first countdown
      landingPageOnStart?.(config1);
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockLandingPage.destroy).toHaveBeenCalled();
      expect(createOrchestrator).toHaveBeenCalledTimes(1);
      expect(mockOrchestrator.start).toHaveBeenCalledTimes(1);

      // Simulate onBack which shows landing page again
      const orchestratorCall = vi.mocked(createOrchestrator).mock.calls[0][0];
      await orchestratorCall.onBack();
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockOrchestrator.destroy).toHaveBeenCalledTimes(1);
    });

    it('should push countdown to history when starting from landing page', async () => {
      const { pushCountdownToHistory } = await import('@core/url');
      const { default: init } = await import('./index');

      document.dispatchEvent(new Event('DOMContentLoaded'));
      await new Promise(resolve => setTimeout(resolve, 100));

      // Wait for landingPageOnStart to be set
      await vi.waitFor(() => expect(landingPageOnStart).not.toBeNull(), { timeout: 1000 });

      const config: CountdownConfig = {
        mode: 'wall-clock',
        targetDate: new Date(),
        timezone: 'UTC',
        theme: 'contribution-graph',
        showWorldMap: true,
      };

      landingPageOnStart?.(config);
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(pushCountdownToHistory).toHaveBeenCalledWith(config);
    });

    it('should update landing page history state before pushing countdown', async () => {
      const replaceStateSpy = vi.spyOn(window.history, 'replaceState');
      const { default: init } = await import('./index');

      document.dispatchEvent(new Event('DOMContentLoaded'));
      await new Promise(resolve => setTimeout(resolve, 100));

      // Wait for landingPageOnStart to be set
      await vi.waitFor(() => expect(landingPageOnStart).not.toBeNull(), { timeout: 1000 });

      const config: CountdownConfig = {
        mode: 'timer',
        targetDate: new Date(),
        durationSeconds: 300,
        timezone: 'UTC',
        theme: 'fireworks',
        showWorldMap: false,
      };

      // Clear the initial replaceState call
      replaceStateSpy.mockClear();

      landingPageOnStart?.(config);
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(replaceStateSpy).toHaveBeenCalledWith(
        { view: 'landing', config },
        '',
        window.location.href
      );
    });
  });

  describe('popstate navigation', () => {
    it('should handle popstate to landing page', async () => {
      const { createLandingPage } = await import('@components/landing-page');
      const { default: init } = await import('./index');

      document.dispatchEvent(new Event('DOMContentLoaded'));
      await new Promise(resolve => setTimeout(resolve, 50));

      vi.mocked(createLandingPage).mockClear();

      const popstateEvent = new PopStateEvent('popstate', {
        state: { view: 'landing' },
      });

      window.dispatchEvent(popstateEvent);
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(createLandingPage).toHaveBeenCalled();
    });

    it('should parse deep link when no state is present in popstate', async () => {
      const { parseDeepLink } = await import('@core/url');
      const { default: init } = await import('./index');

      const mockConfig: CountdownConfig = {
        mode: 'timer',
        targetDate: new Date(),
        durationSeconds: 300,
        timezone: 'UTC',
        theme: 'fireworks',
        showWorldMap: false,
      };

      vi.mocked(parseDeepLink).mockReturnValue({
        isValid: true,
        shouldShowConfiguration: false,
        config: mockConfig,
        errors: null,
      });

      document.dispatchEvent(new Event('DOMContentLoaded'));
      await new Promise(resolve => setTimeout(resolve, 50));

      const popstateEvent = new PopStateEvent('popstate', { state: null });
      window.dispatchEvent(popstateEvent);
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(parseDeepLink).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should cleanup on beforeunload', async () => {
      const { toastManager } = await import('@components/toast');
      const { destroyPWA } = await import('@app/pwa');
      const { destroyPerfOverlay } = await import('@components/perf-overlay');

      const { default: init } = await import('./index');
      document.dispatchEvent(new Event('DOMContentLoaded'));
      await new Promise(resolve => setTimeout(resolve, 50));

      window.dispatchEvent(new Event('beforeunload'));

      expect(toastManager.destroy).toHaveBeenCalled();
      expect(destroyPWA).toHaveBeenCalled();
      expect(destroyPerfOverlay).toHaveBeenCalled();
    });

    it('should cleanup orchestrator on beforeunload when countdown is active', async () => {
      const mockConfig: CountdownConfig = {
        mode: 'wall-clock',
        targetDate: new Date(),
        timezone: 'UTC',
        theme: 'contribution-graph',
        showWorldMap: true,
      };

      const { parseDeepLink } = await import('@core/url');

      vi.mocked(parseDeepLink).mockReturnValue({
        isValid: true,
        shouldShowConfiguration: false,
        config: mockConfig,
        errors: null,
      });

      const { default: init } = await import('./index');
      document.dispatchEvent(new Event('DOMContentLoaded'));
      await new Promise(resolve => setTimeout(resolve, 50));

      window.dispatchEvent(new Event('beforeunload'));

      expect(mockOrchestrator.destroy).toHaveBeenCalled();
    });
  });
});
