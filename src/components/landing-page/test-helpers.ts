/**
 * Shared test helpers for landing page component tests.
 */
import type { CountdownConfig } from '@core/types';
import { vi } from 'vitest';

import { cleanupDOM } from '@/test-utils/dom-helpers';
import { type MatchMediaMockControls, mockMatchMedia } from '@/test-utils/theme-test-helpers';

import { createLandingPage, type LandingPageController } from './index';

export interface RenderLandingPageOptions {
  initialConfig?: Partial<CountdownConfig>;
  onStart?: (config: CountdownConfig) => void;
}

type OnStartMock = ReturnType<typeof vi.fn<(config: CountdownConfig) => void>>;

export interface LandingPageHarness {
  container: HTMLElement;
  page: LandingPageController;
  onStart: OnStartMock;
  matchMediaMock: MatchMediaMockControls;
  getModeRadio: (mode: 'wall-clock' | 'timer') => HTMLInputElement;
  getSection: (testId: 'landing-date-section' | 'landing-timer-section' | 'landing-world-map-section' | 'landing-timezone-section') => HTMLElement;
  cleanup: () => void;
}

/**
 * Render landing page into fresh container with accessibility region.
 * @param options - Optional initial config and start callback
 * @returns Harness with page controller, DOM helpers, and cleanup
 */
export function renderLandingPage(options: RenderLandingPageOptions = {}): LandingPageHarness {
  cleanupDOM();
  const container = document.createElement('div');
  document.body.appendChild(container);

  // Ensure a11y status region exists (matches index.html)
  let a11yStatus = document.getElementById('a11y-status');
  if (!a11yStatus) {
    a11yStatus = document.createElement('div');
    a11yStatus.id = 'a11y-status';
    a11yStatus.setAttribute('role', 'status');
    a11yStatus.setAttribute('aria-live', 'polite');
    a11yStatus.className = 'sr-only';
    document.body.appendChild(a11yStatus);
  }

  const matchMediaMock = mockMatchMedia();
  const onStart: OnStartMock = vi.fn<(config: CountdownConfig) => void>((config) => {
    options.onStart?.(config);
  });

  const page = createLandingPage({
    onStart,
    initialConfig: options.initialConfig,
  });

  page.mount(container);

  const getModeRadio = (mode: 'wall-clock' | 'timer'): HTMLInputElement =>
    container.querySelector(`[data-testid="landing-mode-${mode}"]`) as HTMLInputElement;

  const getSection = (
    testId: 'landing-date-section' | 'landing-timer-section' | 'landing-world-map-section' | 'landing-timezone-section'
  ): HTMLElement => container.querySelector(`[data-testid="${testId}"]`) as HTMLElement;

  const cleanup = (): void => {
    matchMediaMock.restore();
    container.remove();
    cleanupDOM();
    vi.restoreAllMocks();
  };

  return {
    container,
    page,
    onStart,
    matchMediaMock,
    getModeRadio,
    getSection,
    cleanup,
  };
}
