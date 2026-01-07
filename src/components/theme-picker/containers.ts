/**
 * Container Builders - factory functions for creating container elements.
 * @remarks Templates defined in index.html for consistent DOM structure
 */

import { cloneTemplate } from '@core/utils/dom';

/**
 * Build themes grid container. Uses role="grid" per APG Grid Pattern.
 * @returns Grid container element cloned from template
 */
export function buildThemesContainer(): HTMLElement {
  return cloneTemplate<HTMLElement>('themes-container-template');
}

/**
 * Create sentinel element for IntersectionObserver lazy loading.
 * @returns Sentinel element cloned from template
 */
export function createSentinel(): HTMLElement {
  return cloneTemplate<HTMLElement>('sentinel-template');
}
