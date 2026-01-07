/** Color mode preference utilities for light/dark/system mode. */

import type { ColorMode, ResolvedColorMode } from '@core/types';

const STORAGE_KEY = 'countdown:color-mode';
const DEFAULT_MODE: ColorMode = 'system';

/** Get the user's color mode preference from localStorage. @public */
export function getColorModePreference(): ColorMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {
    // localStorage access may be blocked
  }
  return DEFAULT_MODE;
}

/** Save the user's color mode preference to localStorage. @public */
export function setColorModePreference(mode: ColorMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // localStorage access may be blocked
  }
}

/** Get the resolved color mode after resolving 'system' to OS preference. @public */
export function getResolvedColorMode(mode?: ColorMode): ResolvedColorMode {
  const preferenceMode = mode ?? getColorModePreference();
  // NOTE: System mode requires querying OS preference via media query
  if (preferenceMode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return preferenceMode;
}

/** Subscribe to system color mode changes. Returns cleanup function. @public */
export function subscribeToSystemMode(
  callback: (mode: ResolvedColorMode) => void
): () => void {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
    callback(event.matches ? 'dark' : 'light');
  };

  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }
  // NOTE: Safari < 14 requires deprecated addListener API
  mediaQuery.addListener(handleChange);
  return () => mediaQuery.removeListener(handleChange);
}
