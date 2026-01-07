/**
 * Unit tests for responsive layout utilities
 */

import { describe, it, expect } from 'vitest';
import {
  BREAKPOINTS,
  CHROME_ZONES,
  isMobileViewport,
  isTabletViewport,
  isSmallMobileViewport,
  getSafeArea,
  getResponsiveCSSProperties,
} from './responsive-layout';

const MOBILE_VIEWPORT = { width: 375, height: 667 };
const DESKTOP_VIEWPORT = { width: 1440, height: 900 };

describe('ResponsiveLayout utilities', () => {
  describe('isMobileViewport()', () => {
    it.each([
      { width: 320, expected: true },
      { width: 375, expected: true },
      { width: 600, expected: true },
      { width: 768, expected: true },
      { width: 900, expected: true },
      { width: 1050, expected: true },
      { width: 1051, expected: false },
      { width: 1200, expected: false },
      { width: 1440, expected: false },
    ])('returns $expected for width $width', ({ width, expected }) => {
      expect(isMobileViewport(width)).toBe(expected);
    });
  });

  describe('getSafeArea()', () => {
    it('returns maximum safe area on mobile (no bottom chrome)', () => {
      const safeArea = getSafeArea(MOBILE_VIEWPORT.width, MOBILE_VIEWPORT.height, {
        hasWorldMap: true,
        hasTimezoneSelector: true,
      });

      expect(safeArea.top).toBe(CHROME_ZONES.mobile.top);
      expect(safeArea.bottom).toBe(CHROME_ZONES.mobile.bottom);
      expect(safeArea.left).toBe(CHROME_ZONES.mobile.left);
      expect(safeArea.right).toBe(CHROME_ZONES.mobile.right);

      expect(safeArea.width).toBe(MOBILE_VIEWPORT.width - CHROME_ZONES.mobile.left - CHROME_ZONES.mobile.right);
      expect(safeArea.height).toBe(MOBILE_VIEWPORT.height - CHROME_ZONES.mobile.top - CHROME_ZONES.mobile.bottom);
    });

    it('returns safe area with bottom reserved on desktop', () => {
      const safeArea = getSafeArea(DESKTOP_VIEWPORT.width, DESKTOP_VIEWPORT.height, {
        hasWorldMap: true,
        hasTimezoneSelector: true,
      });

      expect(safeArea.top).toBe(CHROME_ZONES.desktop.top);
      expect(safeArea.right).toBe(CHROME_ZONES.desktop.right);
      expect(safeArea.left).toBe(CHROME_ZONES.desktop.left);
      expect(safeArea.bottom).toBeGreaterThanOrEqual(220);

      expect(safeArea.width).toBe(DESKTOP_VIEWPORT.width - safeArea.left - safeArea.right);
      expect(safeArea.height).toBe(DESKTOP_VIEWPORT.height - safeArea.top - safeArea.bottom);
    });

    it('returns minimal bottom space when no world map/timezone', () => {
      const safeArea = getSafeArea(DESKTOP_VIEWPORT.width, DESKTOP_VIEWPORT.height, {
        hasWorldMap: false,
        hasTimezoneSelector: false,
      });

      expect(safeArea.bottom).toBe(30);
    });

    it('accounts for back button when present', () => {
      const withoutBackButton = getSafeArea(MOBILE_VIEWPORT.width, MOBILE_VIEWPORT.height, {
        hasBackButton: false,
      });
      const withBackButton = getSafeArea(MOBILE_VIEWPORT.width, MOBILE_VIEWPORT.height, {
        hasBackButton: true,
      });

      expect(withBackButton.left).toBe(CHROME_ZONES.backButton.width);
      expect(withBackButton.left).toBeGreaterThan(withoutBackButton.left);
      expect(withBackButton.width).toBeLessThan(withoutBackButton.width);
    });

    it('handles medium viewport (768px) - uses mobile zones', () => {
      const viewport = { width: 768, height: 1024 };
      
      const safeArea = getSafeArea(viewport.width, viewport.height, {
        hasWorldMap: true,
        hasTimezoneSelector: true,
      });

      expect(safeArea.top).toBe(CHROME_ZONES.mobile.top);
      expect(safeArea.bottom).toBe(CHROME_ZONES.mobile.bottom);
    });

    it('handles very small mobile viewport', () => {
      const viewport = { width: 320, height: 568 };
      
      const safeArea = getSafeArea(viewport.width, viewport.height);

      expect(safeArea.width).toBeGreaterThan(0);
      expect(safeArea.height).toBeGreaterThan(0);
      expect(safeArea.top).toBe(CHROME_ZONES.mobile.top);
      expect(safeArea.bottom).toBe(CHROME_ZONES.mobile.bottom);
    });
  });

  describe('getResponsiveCSSProperties()', () => {
    it.each([
      {
        label: 'mobile',
        width: 375,
        height: 667,
        expected: {
          breakpoint: 'mobile',
          isMobile: '1',
          fontScale: '0.7',
          top: `${CHROME_ZONES.mobile.top}px`,
          bottom: `${CHROME_ZONES.mobile.bottom}px`,
          left: `${CHROME_ZONES.mobile.left}px`,
          right: `${CHROME_ZONES.mobile.right}px`,
        },
      },
      {
        label: 'tablet-sized (768px) - treated as mobile',
        width: 768,
        height: 1024,
        expected: { breakpoint: 'mobile', isMobile: '1', fontScale: '0.7' },
      },
      {
        label: 'desktop',
        width: 1440,
        height: 900,
        expected: { breakpoint: 'desktop', isMobile: '0', fontScale: '1', top: `${CHROME_ZONES.desktop.top}px` },
      },
    ])('returns CSS props for $label viewport', ({ width, height, expected }) => {
      const props = getResponsiveCSSProperties(width, height, {
        hasWorldMap: true,
        hasTimezoneSelector: true,
      });

      expect(props['--viewport-breakpoint']).toBe(expected.breakpoint);
      expect(props['--is-mobile']).toBe(expected.isMobile);
      expect(props['--font-scale']).toBe(expected.fontScale);

      if (expected.top) expect(props['--safe-area-top']).toBe(expected.top);
      if (expected.bottom) expect(props['--safe-area-bottom']).toBe(expected.bottom);
      if (expected.left) expect(props['--safe-area-left']).toBe(expected.left);
      if (expected.right) expect(props['--safe-area-right']).toBe(expected.right);
    });

    it('includes calculated width and height', () => {
      const viewport = { width: 1440, height: 900 };
      const props = getResponsiveCSSProperties(viewport.width, viewport.height);

      expect(props['--safe-area-width']).toMatch(/^\d+px$/);
      expect(props['--safe-area-height']).toMatch(/^\d+px$/);
      
      const width = parseInt(props['--safe-area-width']);
      const height = parseInt(props['--safe-area-height']);
      
      expect(width).toBeGreaterThan(0);
      expect(height).toBeGreaterThan(0);
      expect(width).toBeLessThanOrEqual(viewport.width);
      expect(height).toBeLessThanOrEqual(viewport.height);
    });

    it('adjusts left inset when back button is present', () => {
      const propsWithout = getResponsiveCSSProperties(375, 667, { hasBackButton: false });
      const propsWith = getResponsiveCSSProperties(375, 667, { hasBackButton: true });

      const leftWithout = parseInt(propsWithout['--safe-area-left']);
      const leftWith = parseInt(propsWith['--safe-area-left']);

      expect(leftWith).toBeGreaterThan(leftWithout);
      expect(leftWith).toBe(CHROME_ZONES.backButton.width);
    });
  });

  describe('BREAKPOINTS constant', () => {
    it('exports correct breakpoint values', () => {
      expect(BREAKPOINTS.mobile).toBe(1050);
      expect(BREAKPOINTS.tablet).toBe(768);
      expect(BREAKPOINTS.small).toBe(540);
      expect(BREAKPOINTS.desktop).toBe(Infinity);
      expect(Object.keys(BREAKPOINTS)).toEqual(['mobile', 'tablet', 'small', 'desktop']);
    });
  });

  describe('isTabletViewport()', () => {
    it.each([
      { width: 320, expected: true },
      { width: 540, expected: true },
      { width: 768, expected: true },
      { width: 769, expected: false },
      { width: 1050, expected: false },
    ])('returns $expected for width $width', ({ width, expected }) => {
      expect(isTabletViewport(width)).toBe(expected);
    });
  });

  describe('isSmallMobileViewport()', () => {
    it.each([
      { width: 320, expected: true },
      { width: 540, expected: true },
      { width: 541, expected: false },
      { width: 768, expected: false },
    ])('returns $expected for width $width', ({ width, expected }) => {
      expect(isSmallMobileViewport(width)).toBe(expected);
    });
  });

  describe('CHROME_ZONES constant', () => {
    it('exports mobile chrome zones', () => {
      expect(CHROME_ZONES.mobile.top).toBeGreaterThan(0);
      expect(CHROME_ZONES.mobile.bottom).toBeGreaterThan(0);
      expect(CHROME_ZONES.mobile.left).toBeGreaterThan(0);
      expect(CHROME_ZONES.mobile.right).toBeGreaterThan(0);
    });

    it('exports desktop chrome zones', () => {
      expect(CHROME_ZONES.desktop.top).toBeGreaterThan(0);
      expect(CHROME_ZONES.desktop.bottom).toBeGreaterThan(0);
      expect(CHROME_ZONES.desktop.left).toBeGreaterThan(0);
      expect(CHROME_ZONES.desktop.right).toBeGreaterThan(0);
      expect(CHROME_ZONES.desktop.bottom).toBeGreaterThan(CHROME_ZONES.mobile.bottom);
    });

    it('exports back button dimensions', () => {
      expect(CHROME_ZONES.backButton.width).toBeGreaterThan(0);
      expect(CHROME_ZONES.backButton.height).toBeGreaterThan(0);
    });
  });
});
