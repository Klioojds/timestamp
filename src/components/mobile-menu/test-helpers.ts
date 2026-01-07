/**
 * Test harness utilities for the mobile menu component.
 */
import { vi } from 'vitest';

import { createMobileMenu, type MobileMenuController, type MobileMenuOptions } from './index';

/** Options for rendering a mobile menu in tests. */
export interface RenderMenuOptions {
  width?: number;
  content?: MobileMenuOptions['content'];
  onOpen?: () => void;
  onClose?: () => void;
}

/** Harness returned by {@link renderMobileMenu}. */
export interface MobileMenuHarness {
  container: HTMLElement;
  menu: MobileMenuController;
  actionButtons: HTMLElement[];
  setViewportWidth: (width: number) => void;
  getHamburger: () => HTMLButtonElement;
  getOverlay: () => HTMLElement | null;
  getCloseButton: () => HTMLElement | null;
  getSection: (section: 'actions' | 'timezone' | 'worldmap') => HTMLElement | null;
  cleanup: () => void;
}

/** Create default mock action buttons with test IDs. */
export function createMockActionButtons(): HTMLElement[] {
  return [
    createMockButton('share-button', 'Share'),
    createMockButton('favorite-button', 'Favorite'),
    createMockButton('theme-switcher-button', 'Switch Theme'),
    createMockButton('github-button', 'GitHub'),
  ];
}

/** Create a mock timezone selector element. */
export function createMockTimezoneSelector(): HTMLElement {
  return createLabeledDiv('timezone-selector', 'Timezone Selector');
}

/** Create a mock world map element. */
export function createMockWorldMap(): HTMLElement {
  return createLabeledDiv('world-map', 'World Map');
}

/**
 * Render a mobile menu and return a harness with common getters and cleanup.
 * @param options - Optional viewport width, content overrides, and callbacks
 * @returns Harness containing menu controller and DOM accessors
 */
export function renderMobileMenu(options: RenderMenuOptions = {}): MobileMenuHarness {
  const restoreRaf = stubRaf();
  const container = document.createElement('div');
  document.body.appendChild(container);

  const actionButtons = options.content?.actionButtons ?? createMockActionButtons();
  const content: MobileMenuOptions['content'] = {
    actionButtons,
    timezoneSelector: options.content?.timezoneSelector,
    worldMap: options.content?.worldMap,
  };

  const setViewportWidth = (width: number): void => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
    window.dispatchEvent(new Event('resize'));
  };

  setViewportWidth(options.width ?? 1024);

  const menu = createMobileMenu({
    container,
    content,
    onOpen: options.onOpen,
    onClose: options.onClose,
  });

  const getHamburger = (): HTMLButtonElement =>
    container.querySelector('[data-testid="mobile-menu-button"]') as HTMLButtonElement;

  const getOverlay = (): HTMLElement | null =>
    document.body.querySelector('[data-testid="mobile-menu-overlay"]');

  const getCloseButton = (): HTMLElement | null =>
    document.body.querySelector('[data-testid="mobile-menu-close"]');

  const getSection = (section: 'actions' | 'timezone' | 'worldmap'): HTMLElement | null =>
    document.body.querySelector(`[data-section="${section}"]`);

  const cleanup = (): void => {
    menu.destroy();
    container.remove();
    restoreRaf();
    vi.restoreAllMocks();
  };

  return {
    container,
    menu,
    actionButtons,
    setViewportWidth,
    getHamburger,
    getOverlay,
    getCloseButton,
    getSection,
    cleanup,
  };
}

function createMockButton(testId: string, label: string): HTMLElement {
  const button = document.createElement('button');
  button.setAttribute('data-testid', testId);
  button.textContent = label;
  return button;
}

function createLabeledDiv(testId: string, label: string): HTMLElement {
  const element = document.createElement('div');
  element.setAttribute('data-testid', testId);
  element.textContent = label;
  return element;
}

function stubRaf(): () => void {
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  });
  vi.stubGlobal('cancelAnimationFrame', () => {});

  return () => {
    vi.unstubAllGlobals();
  };
}
