/** Shared utilities for share controls: clipboard and icons. */

import { createIcon, ICON_SIZES } from '@core/utils/dom';

/**
 * Copy URL to clipboard using Clipboard API.
 * @param url - URL to copy
 */
export async function copyShareUrlToClipboard(url: string): Promise<void> {
  await navigator.clipboard.writeText(url);
}

/**
 * Create share link icon SVG element.
 * @param className - Optional CSS class
 * @returns SVG element
 */
export function createShareLinkIcon(className?: string): SVGSVGElement {
  return createIcon({ name: 'link', size: ICON_SIZES.MD, className });
}
