/**
 * Theme Preview Image Resolution
 *
 * Provides utilities for resolving theme preview image URLs for both 1x and 2x (retina) displays.
 * Uses Vite's glob import to eagerly bundle preview images at build time.
 *
 * @remarks
 * In Node.js environments (scripts), the glob import returns empty and callers should use
 * `registerWebpMockLoader()` to provide mock URLs for preview generation.
 *
 * @packageDocumentation
 */

const FALLBACK_PREVIEW_URL = 'mocked-preview.webp';

/** Subfolder where theme images are stored */
const IMAGES_SUBFOLDER = 'images';

/**
 * Detect if we're running in a Vite environment.
 * In Node.js (scripts), `import.meta.env` is undefined.
 */
const isViteEnvironment = typeof import.meta.env !== 'undefined';

/**
 * Eagerly import card-specific preview images using Vite's glob import.
 * Both 1x and 2x card images are bundled for srcset support.
 * README images (1200x675) are excluded from the bundle.
 * In Node.js scripts, this returns empty; they use `registerWebpMockLoader()` instead.
 */
const previewMap: Record<string, string> = isViteEnvironment
  ? (import.meta.glob('../*/images/preview-*-card-*.webp', {
      eager: true,
      query: '?url',
      import: 'default',
    }) as Record<string, string>)
  : {};

/** Result of getPreviewUrls containing both 1x and 2x URLs */
export interface PreviewUrlSet {
  /** URL for 1x (standard display) image */
  url1x: string;
  /** URL for 2x (retina/HiDPI) image */
  url2x: string;
}

/**
 * Resolve both 1x and 2x preview image URLs for a theme.
 * Used for srcset attribute to enable responsive image loading.
 *
 * @param themeId - Theme identifier
 * @param colorMode - Color mode preference (dark or light)
 * @returns Object with url1x and url2x properties
 */
export function getPreviewUrls(
  themeId: string,
  colorMode: 'dark' | 'light' = 'dark'
): PreviewUrlSet {
  const url1xKey = `../${themeId}/${IMAGES_SUBFOLDER}/preview-${colorMode}-card-1x.webp`;
  const url2xKey = `../${themeId}/${IMAGES_SUBFOLDER}/preview-${colorMode}-card-2x.webp`;

  const url1x = previewMap[url1xKey];
  const url2x = previewMap[url2xKey];

  return {
    url1x: typeof url1x === 'string' ? url1x : FALLBACK_PREVIEW_URL,
    url2x: typeof url2x === 'string' ? url2x : FALLBACK_PREVIEW_URL,
  };
}

