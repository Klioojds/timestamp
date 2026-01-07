/**
 * @file mobile-menu.test.ts
 * @description Unit tests for mobile menu component
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderOpenMobileMenu, MOBILE_VIEWPORT_WIDTH } from '@/test-utils/mobile-menu-fixtures';
import {
  createMockActionButtons,
  createMockTimezoneSelector,
  createMockWorldMap,
  renderMobileMenu,
  type MobileMenuHarness,
} from './test-helpers';

const ANIMATION_DURATION_MS = 350;
const DESKTOP_VIEWPORT_WIDTH = 1200;

const waitForAnimation = (): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ANIMATION_DURATION_MS));

const dispatchKey = (target: HTMLElement | null, key: string): void => {
  target?.dispatchEvent(new KeyboardEvent('keydown', { key }));
};

describe('MobileMenu component', () => {
  let harness: MobileMenuHarness | null = null;

  afterEach(() => {
    harness?.cleanup();
    harness = null;
  });

  describe('creation', () => {
    it('creates hamburger button on mobile viewport', () => {
      harness = renderMobileMenu({ width: MOBILE_VIEWPORT_WIDTH });

      const hamburger = harness.getHamburger();
      expect(hamburger).toBeTruthy();
      expect(hamburger?.tagName).toBe('BUTTON');
    });

    it('has correct aria attributes for accessibility', () => {
      harness = renderMobileMenu({ width: MOBILE_VIEWPORT_WIDTH });

      const hamburger = harness.getHamburger();
      expect(hamburger?.getAttribute('aria-label')).toBeTruthy();
      expect(hamburger?.getAttribute('aria-expanded')).toBe('false');
      expect(hamburger?.getAttribute('aria-haspopup')).toBe('dialog');
    });

    it('returns controller with required methods', () => {
      harness = renderMobileMenu();

      expect(harness.menu.isOpen).toBeTypeOf('function');
      expect(harness.menu.open).toBeTypeOf('function');
      expect(harness.menu.close).toBeTypeOf('function');
      expect(harness.menu.updateContent).toBeTypeOf('function');
      expect(harness.menu.destroy).toBeTypeOf('function');
    });
  });

  describe('overlay', () => {
    it('opens overlay when hamburger button clicked', () => {
      harness = renderMobileMenu({ width: MOBILE_VIEWPORT_WIDTH });

      const hamburger = harness.getHamburger();
      hamburger.click();

      expect(harness.menu.isOpen()).toBe(true);

      const overlay = harness.getOverlay();
      expect(overlay).toBeTruthy();
      expect(overlay?.classList.contains('open')).toBe(true);
    });

    it.each([
      {
        trigger: 'close button clicked',
        action: (menuHarness: MobileMenuHarness) => menuHarness.getCloseButton()?.click(),
      },
      {
        trigger: 'backdrop clicked',
        action: (menuHarness: MobileMenuHarness) => menuHarness.getOverlay()?.click(),
      },
      {
        trigger: 'Escape key pressed',
        action: (menuHarness: MobileMenuHarness) => dispatchKey(menuHarness.getOverlay(), 'Escape'),
      },
    ])('closes overlay when $trigger', ({ action }) => {
      harness = renderOpenMobileMenu();

      action(harness);

      expect(harness.menu.isOpen()).toBe(false);
    });

    it('does not close when clicking inside content area', () => {
      harness = renderOpenMobileMenu();

      const content = document.body.querySelector('[data-testid="mobile-menu-content"]') as HTMLElement;
      content.click();

      expect(harness.menu.isOpen()).toBe(true);
    });

    it('does not close on other key presses', () => {
      harness = renderOpenMobileMenu();

      dispatchKey(harness.getOverlay(), 'Enter');

      expect(harness.menu.isOpen()).toBe(true);
    });

    it('updates aria-expanded when opening/closing', () => {
      harness = renderMobileMenu({ width: MOBILE_VIEWPORT_WIDTH });

      const hamburger = harness.getHamburger();
      
      harness.menu.open();
      expect(hamburger?.getAttribute('aria-expanded')).toBe('true');

      harness.menu.close();
      expect(hamburger?.getAttribute('aria-expanded')).toBe('false');
    });

    it('returns focus to hamburger button when closed', () => {
      harness = renderOpenMobileMenu();

      const hamburger = harness.getHamburger();

      harness.menu.close();

      expect(document.activeElement).toBe(hamburger);
    });

    it('focuses close button when opened', () => {
      harness = renderOpenMobileMenu();

      const closeButton = harness.getCloseButton();
      expect(document.activeElement).toBe(closeButton);
    });

    it('calls onOpen callback when opened', () => {
      const onOpen = vi.fn();
      
      harness = renderMobileMenu({ width: MOBILE_VIEWPORT_WIDTH, onOpen });

      harness.menu.open();
      expect(onOpen).toHaveBeenCalledOnce();
    });

    it('calls onClose callback when closed', () => {
      const onClose = vi.fn();
      
      harness = renderMobileMenu({ width: MOBILE_VIEWPORT_WIDTH, onClose });

      harness.menu.open();
      harness.menu.close();
      
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('does not open if already open', () => {
      const onOpen = vi.fn();
      
      harness = renderMobileMenu({ width: MOBILE_VIEWPORT_WIDTH, onOpen });

      harness.menu.open();
      harness.menu.open();
      
      expect(onOpen).toHaveBeenCalledOnce();
    });

    it('does not close if already closed', () => {
      const onClose = vi.fn();
      
      harness = renderMobileMenu({ width: MOBILE_VIEWPORT_WIDTH, onClose });

      harness.menu.close();
      
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('content', () => {
    it('renders action buttons in overlay', () => {
      harness = renderOpenMobileMenu();

      const actionsSection = harness.getSection('actions');
      expect(actionsSection).toBeTruthy();
      
      const shareButton = actionsSection?.querySelector('[data-testid="share-button"]');
      const favoriteButton = actionsSection?.querySelector('[data-testid="favorite-button"]');
      
      expect(shareButton).toBeTruthy();
      expect(favoriteButton).toBeTruthy();
    });

    const OPTIONAL_SECTIONS = [
      {
        section: 'timezone' as const,
        factory: createMockTimezoneSelector,
        testId: 'timezone-selector',
      },
      {
        section: 'worldmap' as const,
        factory: createMockWorldMap,
        testId: 'world-map',
      },
    ];

    it.each(OPTIONAL_SECTIONS)(
      'renders $section section in overlay when configured',
      ({ section, factory, testId }) => {
        const content =
          section === 'timezone'
            ? { actionButtons: createMockActionButtons(), timezoneSelector: factory() }
            : { actionButtons: createMockActionButtons(), worldMap: factory() };

        harness = renderOpenMobileMenu({ content });

        const sectionElement = harness.getSection(section);
        expect(sectionElement).toBeTruthy();
        expect(sectionElement?.querySelector(`[data-testid="${testId}"]`)).toBeTruthy();
      },
    );

    it.each(OPTIONAL_SECTIONS)(
      'hides $section section when not configured',
      ({ section }) => {
        harness = renderOpenMobileMenu();

        const sectionElement = harness.getSection(section) as HTMLElement;
        expect(sectionElement.hidden).toBe(true);
      },
    );

    it('updates content dynamically via updateContent()', async () => {
      const timezoneSelector = createMockTimezoneSelector();
      harness = renderOpenMobileMenu({ content: { actionButtons: createMockActionButtons() } });

      // Initially no timezone selector
      let timezoneSection = harness.getSection('timezone') as HTMLElement;
      expect(timezoneSection.hidden).toBe(true);

      // Update content while overlay is open
      harness.menu.updateContent({ timezoneSelector });

      // Content should be updated immediately (no need to close/reopen)
      timezoneSection = harness.getSection('timezone') as HTMLElement;
      expect(timezoneSection.hidden).toBe(false);
      expect(timezoneSection.contains(timezoneSelector)).toBe(true);
      
      // Close and wait for animation
      harness.menu.close();
      await waitForAnimation();
    });

    it('moves action buttons to preserve event listeners', async () => {
      const originalParent = document.createElement('div');
      originalParent.className = 'original-button-container';
      document.body.appendChild(originalParent);
      const actionButtons = createMockActionButtons();
      actionButtons.forEach(btn => originalParent.appendChild(btn));

      harness = renderOpenMobileMenu({
        content: { actionButtons },
      });

      // Buttons should be MOVED from their original parent to the overlay
      expect(actionButtons[0].parentElement).not.toBe(originalParent);
      
      // Buttons should be in the overlay (mobile menu actions section)
      const actionsSection = harness.getSection('actions');
      expect(actionsSection?.querySelector('[data-testid="share-button"]')).toBeTruthy();
      
      // When closed, they should be restored immediately (not async)
      harness.menu.close();
      
      // Buttons should be restored to original parent synchronously
      expect(actionButtons[0].parentElement).toBe(originalParent);
      
      // Cleanup
      originalParent.remove();
    });

    it('moves (not clones) timezone selector and world map into overlay', () => {
      // Store original parents
      const tzOriginalParent = document.createElement('div');
      const mapOriginalParent = document.createElement('div');
      const timezoneSelector = createMockTimezoneSelector();
      const worldMap = createMockWorldMap();
      tzOriginalParent.appendChild(timezoneSelector);
      mapOriginalParent.appendChild(worldMap);

      harness = renderOpenMobileMenu({
        content: {
          actionButtons: createMockActionButtons(),
          timezoneSelector,
          worldMap,
        },
      });

      // These elements should be moved into overlay
      const timezoneSection = harness.getSection('timezone');
      const worldMapSection = harness.getSection('worldmap');

      expect(timezoneSection?.contains(timezoneSelector)).toBe(true);
      expect(worldMapSection?.contains(worldMap)).toBe(true);
      
      // Elements should no longer be in their original parents
      expect(tzOriginalParent.contains(timezoneSelector)).toBe(false);
      expect(mapOriginalParent.contains(worldMap)).toBe(false);
    });
  });

  describe('responsiveness', () => {
    it('closes overlay when resizing from mobile to desktop', () => {
      harness = renderOpenMobileMenu({ width: MOBILE_VIEWPORT_WIDTH });

      expect(harness.menu.isOpen()).toBe(true);

      harness.setViewportWidth(DESKTOP_VIEWPORT_WIDTH);

      expect(harness.menu.isOpen()).toBe(false);
    });

    it('does not reopen overlay when resizing within mobile range', () => {
      harness = renderOpenMobileMenu({ width: MOBILE_VIEWPORT_WIDTH });

      harness.setViewportWidth(320);

      expect(harness.menu.isOpen()).toBe(true);
    });
  });

  describe('cleanup', () => {
    it('removes hamburger button on destroy', () => {
      harness = renderMobileMenu();

      expect(harness.getHamburger()).toBeTruthy();

      harness.menu.destroy();

      expect(harness.container.querySelector('[data-testid="mobile-menu-button"]')).toBeFalsy();
    });

    it('removes overlay on destroy', async () => {
      harness = renderOpenMobileMenu();
      expect(harness.getOverlay()).toBeTruthy();

      harness.menu.destroy();

      await waitForAnimation();

      expect(harness.getOverlay()).toBeFalsy();
    });

    it('removes resize listener on destroy', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      harness = renderMobileMenu();

      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function), { passive: true });

      harness.menu.destroy();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });

    it('closes overlay before destroying', () => {
      harness = renderOpenMobileMenu();
      harness.menu.destroy();

      expect(harness.menu.isOpen()).toBe(false);
    });
  });

  describe('accessibility', () => {
    it.each([
      { attribute: 'role', expected: 'dialog' },
      { attribute: 'aria-modal', expected: 'true' },
    ])('sets overlay $attribute attribute', ({ attribute, expected }) => {
      harness = renderOpenMobileMenu();

      const overlay = harness.getOverlay();
      expect(overlay?.getAttribute(attribute)).toBe(expected);
    });

    it('sets overlay aria-label', () => {
      harness = renderOpenMobileMenu();

      const overlay = harness.getOverlay();
      expect(overlay?.getAttribute('aria-label')).toBeTruthy();
    });

    it('sections have aria-label for screen readers', () => {
      harness = renderOpenMobileMenu({
        content: {
          actionButtons: createMockActionButtons(),
          timezoneSelector: createMockTimezoneSelector(),
          worldMap: createMockWorldMap(),
        },
      });

      const actionsSection = harness.getSection('actions');
      const timezoneSection = harness.getSection('timezone');
      const worldMapSection = harness.getSection('worldmap');

      expect(actionsSection?.getAttribute('aria-label')).toBeTruthy();
      expect(timezoneSection?.getAttribute('aria-label')).toBeTruthy();
      expect(worldMapSection?.getAttribute('aria-label')).toBeTruthy();
    });

    it('close button has aria-label', () => {
      harness = renderOpenMobileMenu();

      const closeButton = harness.getCloseButton();
      expect(closeButton?.getAttribute('aria-label')).toBeTruthy();
    });

    it('close button has tabindex="0" for keyboard navigation', () => {
      harness = renderOpenMobileMenu();

      const closeButton = harness.getCloseButton();
      expect(closeButton?.getAttribute('tabindex')).toBe('0');
    });
  });
});
