/**
 * Mobile Menu Component
 * 
 * Hamburger menu that consolidates all UI chrome on mobile viewports.
 * Provides a single entry point to access:
 * - Action buttons (Share, Favorite, Theme Switcher, GitHub)
 * - Timezone selector
 * - World map
 * 
 * ## Element Movement Lifecycle
 * 
 * The mobile menu **temporarily moves** elements into an overlay, then **restores** them:
 * 
 * ### 1. Open/Populate Phase
 * - Elements are moved from their original locations into overlay sections
 * - `originalParents` Map tracks: parent node, next sibling (for restoration)
 * - Moved elements: action buttons, timezone selector, world map
 * 
 * ### 2. Close/Restore Phase  
 * - Elements are moved back to their original positions using tracked data
 * - Uses `insertBefore(element, nextSibling)` to preserve DOM order
 * - Falls back to `appendChild()` if nextSibling was removed
 * - Visibility styles reset based on viewport (hidden on mobile, visible on desktop)
 * 
 * ### 3. Resize Handling (Throttled via requestAnimationFrame)
 * - Monitors viewport changes: mobile (≤600px) ↔ desktop (\>600px)
 * - Auto-closes overlay when resizing to desktop
 * - Restores elements even if overlay wasn't open (failsafe for rapid resizes)
 * - Marked as `{ passive: true }` for scroll performance
 * 
 * ## Accessibility Features
 * 
 * - Background (`#app`) set to `aria-hidden="true"` and `inert` when overlay open
 * - Focus trap keeps keyboard navigation within overlay
 * - Focus returns to hamburger button on close
 * - Overlay sections have `aria-label` for screen readers
 */

import { createFocusTrap, type FocusTrapController } from '@core/utils/accessibility/focus-trap';
import { cloneTemplate } from '@core/utils/dom/template-utils';
import { getIconSvg } from '@core/utils/icons';
import { BREAKPOINTS } from '@themes/shared/responsive-layout';

const OVERLAY_REMOVE_DELAY_MS = 160;
const TIMEZONE_SELECTOR_TEST_ID = 'timezone-selector';
const WORLD_MAP_TEST_ID = 'world-map';

/**
 * Configuration options for creating a mobile menu.
 */
export interface MobileMenuOptions {
  /** Container for the hamburger button */
  container: HTMLElement;
  /** Content to render in the overlay */
  content: {
    /** Action buttons to display in menu */
    actionButtons?: HTMLElement[];
    /** Color mode toggle component */
    colorModeToggle?: HTMLElement;
    /** Timezone selector component */
    timezoneSelector?: HTMLElement;
    /** World map component */
    worldMap?: HTMLElement;
  };
  /** Callback when menu opens */
  onOpen?: () => void;
  /** Callback when menu closes */
  onClose?: () => void;
}

/**
 * Mobile menu controller interface.
 */
export interface MobileMenuController {
  /** Check if menu is currently open */
  isOpen(): boolean;
  /** Open the menu overlay */
  open(): void;
  /** Close the menu overlay */
  close(): void;
  /** Update content in the overlay */
  updateContent(content: MobileMenuOptions['content']): void;
  /** Destroy the component */
  destroy(): void;
}

/**
 * Create a mobile menu component with hamburger button and overlay.
 * @param options - Configuration options
 * @returns Controller for managing the mobile menu
 */
export function createMobileMenu(options: MobileMenuOptions): MobileMenuController {
  const { container, content, onOpen, onClose } = options;
  
  let isMenuOpen = false;
  let overlay: HTMLElement | null = null;
  let hamburgerButton: HTMLButtonElement | null = null;
  let focusTrap: FocusTrapController | null = null;
  let resizeHandler: (() => void) | null = null;
  let resizeAnimationFrameId: number | null = null;
  let overlayRemovalTimeoutId: ReturnType<typeof setTimeout> | null = null;
  
  // Track original parents for restoring elements
  const originalParents = new Map<HTMLElement, { parent: HTMLElement; nextSibling: Node | null }>();

  function storeOriginalLocation(element: HTMLElement): void {
    if (element.parentElement && !originalParents.has(element)) {
      originalParents.set(element, {
        parent: element.parentElement,
        nextSibling: element.nextSibling,
      });
    }
  }

  function moveElementToSection(
    element: HTMLElement,
    section: Element | null,
    options: { unhideElement?: boolean } = {}
  ): void {
    if (!section) return;
    storeOriginalLocation(element);
    section.appendChild(element);
    if (options.unhideElement !== false) {
      element.hidden = false;
    }
    (section as HTMLElement).hidden = false;
  }

  function setAppContainerAccessibility(isHidden: boolean): void {
    const appContainer = document.getElementById('app');

    if (!appContainer) return;

    if (isHidden) {
      appContainer.setAttribute('aria-hidden', 'true');
      appContainer.setAttribute('inert', '');
      return;
    }

    appContainer.removeAttribute('aria-hidden');
    appContainer.removeAttribute('inert');
  }

  function populateOptionalSection(
    element: HTMLElement | undefined,
    section: Element | null
  ): void {
    if (!section) return;

    if (element) {
      moveElementToSection(element, section);
      return;
    }

    (section as HTMLElement).hidden = true;
  }

  function populateActionButtonsSection(section: Element | null): void {
    if (!section) return;

    if (!content.actionButtons || content.actionButtons.length === 0) {
      (section as HTMLElement).hidden = true;
      return;
    }

    const buttonGrid = document.createElement('div');
    buttonGrid.className = 'mobile-menu-actions';

    content.actionButtons.forEach((button) => {
      moveElementToSection(button, buttonGrid);
    });

    section.appendChild(buttonGrid);
  }

  /** Create hamburger button element from template. */
  function createHamburgerButton(): HTMLButtonElement {
    const button = cloneTemplate<HTMLButtonElement>('mobile-menu-button-template');
    
    // Inject icon (must be done via JS as SVGs are dynamic)
    button.innerHTML = getIconSvg('three-bars', 24);
    button.addEventListener('click', toggleMenu);
    return button;
  }

  /** Create modal dialog overlay from template and inject close icon. */
  function createOverlay(): HTMLElement {
    const overlayElement = cloneTemplate<HTMLElement>('mobile-menu-overlay-template');
    
    // Inject close icon (SVG must be done via JS)
    const closeButton = overlayElement.querySelector('.mobile-menu-close');
    if (closeButton) {
      closeButton.innerHTML = getIconSvg('x', 24);
      closeButton.addEventListener('click', close);
    }
    
    // Close on backdrop click (click directly on overlay, not its children)
    overlayElement.addEventListener('click', (e) => {
      if (e.target === overlayElement) close();
    });
    
    return overlayElement;
  }

  /** Toggle menu open/closed. */
  function toggleMenu(): void {
    if (isMenuOpen) {
      close();
    } else {
      open();
    }
  }

  /** Open the menu overlay. */
  function open(): void {
    if (isMenuOpen || !hamburgerButton) return;
    
    isMenuOpen = true;
    hamburgerButton.setAttribute('aria-expanded', 'true');
    
    if (!overlay) {
      overlay = createOverlay();
    }
    document.body.appendChild(overlay);
    overlay.classList.add('open');

    // Defer heavy DOM moves to next frame so visibility transition completes quickly
    requestAnimationFrame(() => populateContent());
    
    // Hide background content from assistive tech when overlay is open
    setAppContainerAccessibility(true);
    
    // Setup focus trap
    focusTrap = createFocusTrap({
      container: overlay,
      onEscape: () => close(),
      onClickOutside: () => close(),
    });
    focusTrap.activate();
    
    // Focus close button
    const closeButton = overlay.querySelector('.mobile-menu-close') as HTMLElement;
    closeButton?.focus();
    
    onOpen?.();
  }

  /** Close the menu overlay. */
  function close(): void {
    if (!isMenuOpen || !overlay || !hamburgerButton) return;
    
    isMenuOpen = false;
    hamburgerButton.setAttribute('aria-expanded', 'false');
    overlay.classList.remove('open');
    
    // Restore background content visibility when overlay is closed
    setAppContainerAccessibility(false);
    
    // Cleanup focus trap
    if (focusTrap) {
      focusTrap.deactivate();
      focusTrap = null;
    }
    
    // Defer restoration to next frame to shorten visible close duration
    requestAnimationFrame(() => restoreContent());
    
    // Return focus to hamburger button
    hamburgerButton.focus();
    
    // Cancel any pending overlay removal before scheduling a new one
    if (overlayRemovalTimeoutId !== null) {
      clearTimeout(overlayRemovalTimeoutId);
    }
    
    // Remove from DOM after animation (matches 160ms CSS transition)
    overlayRemovalTimeoutId = setTimeout(() => {
      if (overlay && !isMenuOpen) {
        overlay.remove();
      }
      overlayRemovalTimeoutId = null;
    }, OVERLAY_REMOVE_DELAY_MS);
    
    onClose?.();
  }

  /**
   * Populate overlay with content sections.
   * @remarks
   * Issue #3 fix: Move elements (not clone) so event listeners work.
   */
  function populateContent(): void {
    if (!overlay) return;
    
    const actionsSection = overlay.querySelector('[data-section="actions"]');
    const colormodeSection = overlay.querySelector('[data-section="colormode"]');
    const timezoneSection = overlay.querySelector('[data-section="timezone"]');
    const worldmapSection = overlay.querySelector('[data-section="worldmap"]');
    
    // Clear existing content
    if (actionsSection) actionsSection.innerHTML = '';
    if (colormodeSection) colormodeSection.innerHTML = '';
    if (timezoneSection) timezoneSection.innerHTML = '';
    if (worldmapSection) worldmapSection.innerHTML = '';

    populateActionButtonsSection(actionsSection);
    populateOptionalSection(content.colorModeToggle, colormodeSection);
    populateOptionalSection(content.timezoneSelector, timezoneSection);
    populateOptionalSection(content.worldMap, worldmapSection);
  }
  
  /**
   * Restore content elements to their original locations when overlay closes or viewport resizes to desktop.
   */
  function restoreContent(): void {
    const isMobile = window.innerWidth <= BREAKPOINTS.mobile;
    
    // Restore all moved elements
    originalParents.forEach((location, element) => {
      // Check if the parent still exists in the DOM
      if (!document.body.contains(location.parent)) {
        // Parent was removed, can't restore
        return;
      }
      
      // Check if nextSibling exists AND is actually a child of the parent
      // (it might have been moved to the overlay too, and not yet restored)
      const nextSiblingInParent = location.nextSibling && 
        location.parent.contains(location.nextSibling);
      
      // Restore element to its original position
      if (nextSiblingInParent) {
        // Next sibling still exists in parent, insert before it
        location.parent.insertBefore(element, location.nextSibling);
      } else {
        // Next sibling was removed/moved or didn't exist, append to parent
        location.parent.appendChild(element);
      }
      
      // NOTE: Guards against timezone selector and world map visibility on mobile
      // populateContent() made them visible in the overlay,
      // must be hidden again on mobile after restoration
      if (isMobile) {
        const testId = element.getAttribute('data-testid');
        if (testId === TIMEZONE_SELECTOR_TEST_ID || testId === WORLD_MAP_TEST_ID) {
          element.hidden = true;
        }
      }
    });
    
    originalParents.clear();
  }

  /**
   * Handle viewport resize events (throttled via requestAnimationFrame).
   */
  function handleResize(): void {
    // Cancel any pending resize check
    if (resizeAnimationFrameId !== null) {
      cancelAnimationFrame(resizeAnimationFrameId);
    }
    
    // Schedule resize check on next animation frame
    resizeAnimationFrameId = requestAnimationFrame(() => {
      resizeAnimationFrameId = null;
      
      const isMobile = window.innerWidth <= BREAKPOINTS.mobile;
      
      // Close overlay and restore content if we resize to desktop
      if (!isMobile && isMenuOpen) {
        close();
      } else if (!isMobile && originalParents.size > 0) {
        // Restore content even if overlay isn't open (failsafe)
        restoreContent();
      }
    });
  }

  // Initialize
  hamburgerButton = createHamburgerButton();
  container.appendChild(hamburgerButton);
  
  resizeHandler = handleResize;
  window.addEventListener('resize', resizeHandler, { passive: true });

  return {
    isOpen: () => isMenuOpen,
    open,
    close,
    updateContent: (newContent) => {
      Object.assign(content, newContent);
      if (overlay) populateContent();
    },
    destroy: () => {
      if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler);
        if (resizeAnimationFrameId !== null) {
          cancelAnimationFrame(resizeAnimationFrameId);
          resizeAnimationFrameId = null;
        }
      }
      // Cancel any pending overlay removal
      if (overlayRemovalTimeoutId !== null) {
        clearTimeout(overlayRemovalTimeoutId);
        overlayRemovalTimeoutId = null;
      }
      close();
      hamburgerButton?.remove();
      overlay?.remove();
    },
  };
}
