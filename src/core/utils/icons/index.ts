/**
 * Centralized SVG icon utilities using Primer Octicons library.
 * 
 * Icons are imported individually from SVG files for optimal tree-shaking.
 * This reduces bundle size from ~900KB (full library) to ~5KB (24 icons).
 */

// Individual SVG imports - Vite imports these as raw strings
import arrowLeftSvg from '@primer/octicons/build/svg/arrow-left-16.svg?raw';
import checkSvg from '@primer/octicons/build/svg/check-16.svg?raw';
import chevronDownSvg from '@primer/octicons/build/svg/chevron-down-16.svg?raw';
import clockSvg from '@primer/octicons/build/svg/clock-16.svg?raw';
import cloudSvg from '@primer/octicons/build/svg/cloud-16.svg?raw';
import cloudOfflineSvg from '@primer/octicons/build/svg/cloud-offline-16.svg?raw';
import copilotSvg from '@primer/octicons/build/svg/copilot-16.svg?raw';
import deviceDesktopSvg from '@primer/octicons/build/svg/device-desktop-16.svg?raw';
import globeSvg from '@primer/octicons/build/svg/globe-16.svg?raw';
import heartSvg from '@primer/octicons/build/svg/heart-16.svg?raw';
import heartFillSvg from '@primer/octicons/build/svg/heart-fill-16.svg?raw';
import homeSvg from '@primer/octicons/build/svg/home-16.svg?raw';
import linkSvg from '@primer/octicons/build/svg/link-16.svg?raw';
import markGithubSvg from '@primer/octicons/build/svg/mark-github-16.svg?raw';
import moonSvg from '@primer/octicons/build/svg/moon-16.svg?raw';
import paintbrushSvg from '@primer/octicons/build/svg/paintbrush-16.svg?raw';
import pauseSvg from '@primer/octicons/build/svg/pause-16.svg?raw';
import playSvg from '@primer/octicons/build/svg/play-16.svg?raw';
import plusSvg from '@primer/octicons/build/svg/plus-16.svg?raw';
import screenFullSvg from '@primer/octicons/build/svg/screen-full-16.svg?raw';
import screenNormalSvg from '@primer/octicons/build/svg/screen-normal-16.svg?raw';
import sortAscSvg from '@primer/octicons/build/svg/sort-asc-16.svg?raw';
import sunSvg from '@primer/octicons/build/svg/sun-16.svg?raw';
import syncSvg from '@primer/octicons/build/svg/sync-16.svg?raw';
import threeBarsSvg from '@primer/octicons/build/svg/three-bars-16.svg?raw';
import trashSvg from '@primer/octicons/build/svg/trash-16.svg?raw';
import xSvg from '@primer/octicons/build/svg/x-16.svg?raw';

/** Standard icon sizes for button components. Maps semantic size names to pixel dimensions. */
export const ICON_SIZES = {
  SM: 12,
  MD: 16,
  LG: 20,
  XL: 24,
} as const;

/** Valid icon sizes in pixels (derived from ICON_SIZES). */
export type IconSize = (typeof ICON_SIZES)[keyof typeof ICON_SIZES];

/** Supported icon names - add new icons here as needed. */
export type IconName =
  | 'arrow-left'
  | 'check'
  | 'chevron-down'
  | 'clock'
  | 'cloud'
  | 'cloud-offline'
  | 'copilot'
  | 'device-desktop'
  | 'globe'
  | 'heart'
  | 'heart-fill'
  | 'home'
  | 'link'
  | 'mark-github'
  | 'moon'
  | 'paintbrush'
  | 'pause'
  | 'play'
  | 'plus'
  | 'screen-full'
  | 'screen-normal'
  | 'sort-asc'
  | 'sun'
  | 'sync'
  | 'three-bars'
  | 'trash'
  | 'x';

/** Map of icon names to their raw SVG strings */
const ICON_SVG_MAP: Record<IconName, string> = {
  'arrow-left': arrowLeftSvg,
  'check': checkSvg,
  'chevron-down': chevronDownSvg,
  'clock': clockSvg,
  'cloud': cloudSvg,
  'cloud-offline': cloudOfflineSvg,
  'copilot': copilotSvg,
  'device-desktop': deviceDesktopSvg,
  'globe': globeSvg,
  'heart': heartSvg,
  'heart-fill': heartFillSvg,
  'home': homeSvg,
  'link': linkSvg,
  'mark-github': markGithubSvg,
  'moon': moonSvg,
  'paintbrush': paintbrushSvg,
  'pause': pauseSvg,
  'play': playSvg,
  'plus': plusSvg,
  'screen-full': screenFullSvg,
  'screen-normal': screenNormalSvg,
  'sort-asc': sortAscSvg,
  'sun': sunSvg,
  'sync': syncSvg,
  'three-bars': threeBarsSvg,
  'trash': trashSvg,
  'x': xSvg,
};

/** Options for creating an icon SVG element. */
export interface CreateIconOptions {
  name: IconName;
  size?: IconSize;
  className?: string;
  /** Accessible label (makes icon visible to screen readers) */
  label?: string;
  /** Fill color override (defaults to currentColor) */
  fill?: string;
}

/**
 * Get raw SVG string for icon.
 * @param name - Icon identifier
 * @throws Error if icon name is unknown
 */
function getRawSvg(name: IconName): string {
  const svg = ICON_SVG_MAP[name];
  if (!svg) {
    throw new Error(`Unknown icon: ${name}`);
  }
  return svg;
}

/**
 * Create an SVG icon element with size, class, and accessibility attributes.
 * @param options - Icon configuration (name, size, className, label, fill)
 */
export function createIcon(options: CreateIconOptions): SVGSVGElement {
  const { name, size = 16, className, label, fill } = options;
  const svgString = getRawSvg(name);

  const template = document.createElement('template');
  template.innerHTML = svgString.trim();
  const svg = template.content.firstChild as SVGSVGElement;

  // Set size attributes
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  
  // Set accessibility attributes
  if (label) {
    svg.setAttribute('aria-label', label);
    svg.setAttribute('aria-hidden', 'false');
    svg.setAttribute('role', 'img');
  } else {
    svg.setAttribute('aria-hidden', 'true');
  }

  // Set fill color
  svg.setAttribute('fill', fill ?? 'currentColor');

  // Set class name
  if (className) {
    svg.setAttribute('class', className);
  }

  return svg;
}

/**
 * Get full SVG string for innerHTML insertion.
 * @param name - Icon identifier
 * @param size - Icon size in pixels
 * @param className - Optional CSS class
 */
export function getIconSvg(
  name: IconName,
  size: number = 16,
  className?: string
): string {
  const svgString = getRawSvg(name);
  
  // Parse and modify the SVG
  const template = document.createElement('template');
  template.innerHTML = svgString.trim();
  const svg = template.content.firstChild as SVGSVGElement;
  
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('fill', 'currentColor');
  
  if (className) {
    svg.setAttribute('class', className);
  }
  
  return svg.outerHTML;
}
