/**
 * @file chrome-controller.test.ts
 * @description Unit tests for the chrome controller module
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { createChromeControllerFixture } from '@/test-utils/orchestrator-fixtures';

// Mock the responsive layout module
vi.mock('@themes/shared/responsive-layout', () => ({
  getResponsiveCSSProperties: vi.fn(() => ({
    '--safe-area-top': '80px',
    '--safe-area-bottom': '60px',
    '--font-scale': '1',
  })),
  isMobileViewport: vi.fn(() => false),
}));

// Mock the mobile menu module
vi.mock('@/components/mobile-menu', () => ({
  createMobileMenu: vi.fn(() => ({
    isOpen: () => false,
    open: vi.fn(),
    close: vi.fn(),
    updateContent: vi.fn(),
    destroy: vi.fn(),
  })),
}));

describe('ChromeController', () => {
  let fixture: ReturnType<typeof createChromeControllerFixture> | null = null;

  afterEach(() => {
    fixture?.cleanup();
    fixture = null;
  });

  describe('createChromeController', () => {
    it('should initialize with UI components', () => {
      fixture = createChromeControllerFixture();

      expect(() => fixture.controller.init(fixture.uiComponents)).not.toThrow();
    });

    it('should set responsive CSS properties on init', () => {
      fixture = createChromeControllerFixture();

      expect(document.documentElement.style.getPropertyValue('--safe-area-top')).toBe('80px');
      expect(document.documentElement.style.getPropertyValue('--safe-area-bottom')).toBe('60px');
      expect(document.documentElement.style.getPropertyValue('--font-scale')).toBe('1');
    });

    it('should handle destroy when not initialized', () => {
      const controller = createChromeControllerFixture({ autoInit: false }).controller;

      expect(() => controller.destroy()).not.toThrow();
    });

    it('should return resize handler', () => {
      const controller = createChromeControllerFixture().controller;
      const handler = controller.getResizeHandler();

      expect(typeof handler).toBe('function');
    });

    it('should toggle visibility based on viewport size', async () => {
      fixture = createChromeControllerFixture();
      const { isMobileViewport } = await import('@themes/shared/responsive-layout');
      const isMobileViewportMock = vi.mocked(isMobileViewport);

      isMobileViewportMock.mockReturnValue(true);
      fixture.controller.updateVisibility();
      expect(fixture.uiComponents.timezoneSelector?.setVisible).toHaveBeenCalledWith(false);
      expect(fixture.uiComponents.worldMap?.setVisible).toHaveBeenCalledWith(false);

      isMobileViewportMock.mockReturnValue(false);
      fixture.controller.updateVisibility();
      expect(fixture.uiComponents.timezoneSelector?.setVisible).toHaveBeenCalledWith(true);
      expect(fixture.uiComponents.worldMap?.setVisible).toHaveBeenCalledWith(true);
    });

    it('should clean up resize handler and mobile menu on destroy', async () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      fixture = createChromeControllerFixture();

      const { createMobileMenu } = await import('@/components/mobile-menu');
      const createMobileMenuMock = vi.mocked(createMobileMenu);
      const menuInstance = createMobileMenuMock.mock.results[0]?.value;

      fixture.controller.destroy();

      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
      expect(menuInstance?.destroy).toHaveBeenCalled();
    });

    it('should reuse resize handler reference', () => {
      const controller = createChromeControllerFixture().controller;

      const handler = controller.getResizeHandler();
      expect(controller.getResizeHandler()).toBe(handler);
    });
  });
});
