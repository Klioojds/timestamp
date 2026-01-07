/**
 * Responsive Layout Utilities
 *
 * Provides a "safety net" for themes to render content within
 * available viewport space, accounting for UI chrome zones.
 *
 * ## Breakpoint Strategy
 *
 * SINGLE SOURCE OF TRUTH for JavaScript/TypeScript breakpoint values.
 * CSS uses Sass variables in media queries via `@use '../base/breakpoints' as bp`.
 * See `src/styles/base/_breakpoints.scss` for the SCSS single source of truth.
 *
 * - Mobile (≤1050px): Chrome moves to hamburger menu, maximum content space.
 * - Tablet (≤768px): Compact spacing, stacked layouts.
 * - Small mobile (≤540px): Minimal spacing, single column.
 * - Desktop (\>1050px): Chrome is visible inline, reserved zones.
 *
 * IMPORTANT: Keep these values in sync with src/styles/base/_breakpoints.scss
 */

/** Mobile breakpoint - hamburger menu appears at or below this width */
const MOBILE_BREAKPOINT_PX = 1050;

/** Tablet breakpoint - compact layouts at or below this width */
const TABLET_BREAKPOINT_PX = 768;

/** Small mobile breakpoint - minimal layouts at or below this width */
const SMALL_MOBILE_BREAKPOINT_PX = 540;

const BASE_DESKTOP_BOTTOM_PADDING_PX = 30;
const TIMEZONE_SELECTOR_MIN_BOTTOM_PX = 100;
const DEFAULT_EDGE_INSET_PX = 20;
const FONT_SCALE = { mobile: 0.7, desktop: 1 } as const;

export const BREAKPOINTS = {
  /** Mobile breakpoint (hamburger menu) - use max-width: 1050px in CSS */
  mobile: MOBILE_BREAKPOINT_PX,
  /** Tablet breakpoint (compact layouts) - use max-width: 768px in CSS */
  tablet: TABLET_BREAKPOINT_PX,
  /** Small mobile breakpoint (minimal layouts) - use max-width: 540px in CSS */
  small: SMALL_MOBILE_BREAKPOINT_PX,
  desktop: Infinity,
} as const;

/** Reserved space for UI chrome zones (in pixels) */
export const CHROME_ZONES = {
  mobile: { top: 70, bottom: 20, left: DEFAULT_EDGE_INSET_PX, right: DEFAULT_EDGE_INSET_PX },
  desktop: { top: 70, bottom: 220, left: DEFAULT_EDGE_INSET_PX, right: DEFAULT_EDGE_INSET_PX },
  backButton: { width: 80, height: 48 },
} as const;

export type ResponsiveBreakpoint = 'mobile' | 'desktop';

/** @internal Used by getResponsiveCSSProperties */
function getResponsiveBreakpoint(viewportWidth: number): ResponsiveBreakpoint {
  return viewportWidth <= BREAKPOINTS.mobile ? 'mobile' : 'desktop';
}

/**
 * Check if current viewport is mobile (≤1050px).
 * @public
 */
export function isMobileViewport(viewportWidth: number = window.innerWidth): boolean {
  return viewportWidth <= BREAKPOINTS.mobile;
}

/**
 * Check if current viewport is tablet or smaller (≤768px).
 * @public
 */
export function isTabletViewport(viewportWidth: number = window.innerWidth): boolean {
  return viewportWidth <= BREAKPOINTS.tablet;
}

/**
 * Check if current viewport is small mobile (≤540px).
 * @public
 */
export function isSmallMobileViewport(viewportWidth: number = window.innerWidth): boolean {
  return viewportWidth <= BREAKPOINTS.small;
}

/** Safe area dimensions with insets from viewport edges. */
export interface SafeAreaDimensions {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
}

/** Options for calculating safe area. */
export interface SafeAreaOptions {
  hasWorldMap?: boolean;
  hasTimezoneSelector?: boolean;
  hasBackButton?: boolean;
}

/**
 * Calculate safe area for theme content, accounting for UI chrome.
 * @public
 */
export function getSafeArea(
  viewportWidth: number,
  viewportHeight: number,
  options: SafeAreaOptions = {}
): SafeAreaDimensions {
  const { hasWorldMap = false, hasTimezoneSelector = false, hasBackButton = false } = options;
  const isMobile = isMobileViewport(viewportWidth);

  if (isMobile) {
    const zones = CHROME_ZONES.mobile;
    return {
      top: zones.top,
      right: zones.right,
      bottom: zones.bottom,
      left: hasBackButton ? CHROME_ZONES.backButton.width : zones.left,
      width: viewportWidth - (hasBackButton ? CHROME_ZONES.backButton.width : zones.left) - zones.right,
      height: viewportHeight - zones.top - zones.bottom,
    };
  }

  let bottom = BASE_DESKTOP_BOTTOM_PADDING_PX;
  if (hasWorldMap) bottom = Math.max(bottom, CHROME_ZONES.desktop.bottom);
  if (hasTimezoneSelector) bottom = Math.max(bottom, TIMEZONE_SELECTOR_MIN_BOTTOM_PX);

  const top = CHROME_ZONES.desktop.top;
  const left = hasBackButton ? CHROME_ZONES.backButton.width : CHROME_ZONES.desktop.left;
  const right = CHROME_ZONES.desktop.right;

  return {
    top, right, bottom, left,
    width: viewportWidth - left - right,
    height: viewportHeight - top - bottom,
  };
}

/**
 * Generate CSS custom properties for responsive layout.
 * @public
 */
export function getResponsiveCSSProperties(
  viewportWidth: number,
  viewportHeight: number,
  options: SafeAreaOptions = {}
): Record<string, string> {
  const safeArea = getSafeArea(viewportWidth, viewportHeight, options);
  const breakpoint = getResponsiveBreakpoint(viewportWidth);
  const isMobile = breakpoint === 'mobile';

  return {
    '--safe-area-top': `${safeArea.top}px`,
    '--safe-area-right': `${safeArea.right}px`,
    '--safe-area-bottom': `${safeArea.bottom}px`,
    '--safe-area-left': `${safeArea.left}px`,
    '--safe-area-width': `${safeArea.width}px`,
    '--safe-area-height': `${safeArea.height}px`,
    '--viewport-breakpoint': breakpoint,
    '--is-mobile': isMobile ? '1' : '0',
    '--font-scale': isMobile ? `${FONT_SCALE.mobile}` : `${FONT_SCALE.desktop}`,
  };
}
