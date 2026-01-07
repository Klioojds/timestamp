import { renderMobileMenu, type MobileMenuHarness, type RenderMenuOptions } from '@/components/mobile-menu/test-helpers';

/** Default viewport width used for mobile menu tests. */
export const MOBILE_VIEWPORT_WIDTH = 375;

/**
 * Render mobile menu at mobile viewport width and open overlay.
 * @returns Harness with opened mobile menu
 */
export function renderOpenMobileMenu(options: RenderMenuOptions = {}): MobileMenuHarness {
  const harness = renderMobileMenu({ width: MOBILE_VIEWPORT_WIDTH, ...options });
  harness.menu.open();
  return harness;
}
