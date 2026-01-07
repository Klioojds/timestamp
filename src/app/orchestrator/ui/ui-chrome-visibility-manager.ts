/**
 * Chrome Controller - UI chrome visibility, responsive CSS, and mobile menu wiring.
 * Chrome = non-theme UI: buttons, timezone selector, world map, mobile menu.
 */

import { shouldShowTimezoneSwitcherOnCountdown, worldMapAvailableForMode } from '@core/config/mode-config';
import type { CountdownMode } from '@core/types';
import {
    getResponsiveCSSProperties,
    isMobileViewport,
    type SafeAreaOptions,
} from '@themes/shared/responsive-layout';

import {
    createMobileMenu,
    type MobileMenuController,
} from '@/components/mobile-menu';

import { type UIComponents, updateFullscreenButtonForViewport } from './ui-factory';

/** Chrome controller configuration. */
export interface ChromeControllerOptions {
  container: HTMLElement;
  mode: CountdownMode;
  hasBackButton: boolean;
  showWorldMap: boolean;
  /** Called when overlay state changes (for pausing theme animations). */
  onOverlayStateChange?: (active: boolean) => void;
}

/** Chrome controller interface. */
export interface ChromeController {
  init(uiComponents: UIComponents): void;
  updateVisibility(): void;
  getResizeHandler(): () => void;
  destroy(): void;
}

/**
 * Extracts action buttons for mobile menu.
 * Filters out offline indicator and timer controls. Preserves share menu container structure.
 */
function getActionButtonElements(buttonContainer: HTMLElement | null): HTMLElement[] {
  if (!buttonContainer) return [];

  // Get direct children that are action buttons or containers
  // This preserves the share-menu-container structure instead of extracting nested buttons
  const elements: HTMLElement[] = [];
  
  for (const child of buttonContainer.children) {
    const el = child as HTMLElement;
    const testId = el.getAttribute('data-testid');
    
    // Skip offline indicator (always visible inline)
    if (testId === 'offline-indicator') continue;
    
    // Skip timer controls (always visible inline for timer mode)
    if (testId === 'timer-controls') continue;
    
    // Include share menu container as a whole (preserves dropdown structure)
    if (el.classList.contains('share-menu-container')) {
      elements.push(el);
      continue;
    }
    
    // Include direct child buttons and links
    if (el.tagName === 'BUTTON' || el.tagName === 'A') {
      elements.push(el);
    }
  }
  
  return elements;
}

/** Updates responsive CSS properties on root element. */
function updateResponsivePropertiesInternal(safeAreaOptions: SafeAreaOptions): void {
  const props = getResponsiveCSSProperties(
    window.innerWidth,
    window.innerHeight,
    safeAreaOptions
  );

  Object.entries(props).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });
}

/**
 * Creates a chrome controller for managing UI chrome visibility and responsive behavior.
 * 
 * Handles mobile menu creation, responsive CSS properties, and visibility toggling
 * for timezone selector, world map, and fullscreen button based on viewport size.
 * 
 * @param options - Configuration for the chrome controller
 * @returns Chrome controller instance with init/updateVisibility/destroy lifecycle
 * 
 * @example
 * ```typescript
 * const controller = createChromeController({
 *   container,
 *   mode: 'wall-clock',
 *   hasBackButton: true,
 *   showWorldMap: true,
 *   onOverlayStateChange: (active) => {
 *     // Pause animations when menu is open
 *   }
 * });
 * controller.init(uiComponents);
 * ```
 */
export function createChromeController(options: ChromeControllerOptions): ChromeController {
  const { container, mode, hasBackButton, showWorldMap, onOverlayStateChange } = options;

  let mobileMenu: MobileMenuController | null = null;
  let uiComponentsRef: UIComponents | null = null;
  let resizeHandler: (() => void) | null = null;

  const safeAreaOptions: SafeAreaOptions = {
    hasWorldMap: worldMapAvailableForMode(mode, showWorldMap),
    hasTimezoneSelector: shouldShowTimezoneSwitcherOnCountdown(mode),
    hasBackButton,
  };

  function updateVisibility(): void {
    const isMobile = isMobileViewport();

    // Hide inline chrome on mobile (world map and timezone in hamburger menu)
    if (uiComponentsRef?.timezoneSelector) {
      uiComponentsRef.timezoneSelector.setVisible(!isMobile);
    }
    if (uiComponentsRef?.worldMap) {
      uiComponentsRef.worldMap.setVisible(!isMobile);
    }

    // Update fullscreen button visibility/creation for viewport change
    if (uiComponentsRef) {
      updateFullscreenButtonForViewport(uiComponentsRef, isMobile);
    }

    // Update CSS properties for safe area
    updateResponsivePropertiesInternal(safeAreaOptions);
  }

  return {
    init(uiComponents: UIComponents): void {
      uiComponentsRef = uiComponents;

      // Set initial responsive CSS properties
      updateResponsivePropertiesInternal(safeAreaOptions);

      // Create mobile menu
      mobileMenu = createMobileMenu({
        container: document.body,
        content: {
          actionButtons: getActionButtonElements(uiComponents.buttonContainer),
          colorModeToggle: uiComponents.colorModeToggle,
          timezoneSelector: shouldShowTimezoneSwitcherOnCountdown(mode) ? uiComponents.timezoneSelector?.getElement() : undefined,
          worldMap: worldMapAvailableForMode(mode, showWorldMap) ? uiComponents.worldMap?.getElement() : undefined,
        },
        onOpen: () => {
          container.setAttribute('data-menu-open', 'true');
          onOverlayStateChange?.(true);
        },
        onClose: () => {
          container.removeAttribute('data-menu-open');
          onOverlayStateChange?.(false);
        },
      });

      // Initial visibility setup
      updateVisibility();

      // Create resize handler
      resizeHandler = () => updateVisibility();
      window.addEventListener('resize', resizeHandler);
    },

    updateVisibility,

    getResizeHandler(): () => void {
      return resizeHandler ?? (() => {});
    },

    destroy(): void {
      // Remove resize handler
      if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler);
        resizeHandler = null;
      }

      // Destroy mobile menu
      if (mobileMenu) {
        mobileMenu.destroy();
        mobileMenu = null;
      }

      uiComponentsRef = null;
    },
  };
}
