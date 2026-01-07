/**
 * Theme Resolver - async theme loading and resolution utilities.
 */

import { isNewYearMidnight } from '@core/time/time';
import type { CountdownConfig, ThemeConfig, ThemeId, TimePageRenderer } from '@core/types';
import { createSafeMessageFromText } from '@core/utils/text';
import { loadThemeSafe } from '@themes/registry';

import { DEFAULT_COMPLETION_MESSAGE } from '@/core/config/constants';
import { getModeConfig } from '@/core/config/mode-config';

import type { CelebrationDisplay } from '../types';

/**
 * Create a theme renderer instance.
 * 
 * Loads the theme module and instantiates the renderer with the provided target date.
 * 
 * @param themeId - Theme identifier from registry
 * @param targetDate - Target date for countdown
 * @returns Promise resolving to theme renderer instance
 * 
 * @example
 * ```typescript
 * const renderer = await createThemeRenderer('contribution-graph', targetDate);
 * renderer.mount(container, mountContext);
 * ```
 */
export async function createThemeRenderer(
  themeId: ThemeId,
  targetDate: Date
): Promise<TimePageRenderer> {
  const { timePageRenderer } = await loadThemeSafe(themeId);
  return timePageRenderer(targetDate);
}

/**
 * Get theme configuration by ID.
 * 
 * Loads the theme module and returns its configuration object.
 * 
 * @param themeId - Theme identifier from registry
 * @returns Promise resolving to theme configuration
 * 
 * @example
 * ```typescript
 * const config = await getThemeConfig('contribution-graph');
 * console.log(config.responsiveLayout); // { mobile: {...}, desktop: {...} }
 * ```
 */
export async function getThemeConfig(themeId: ThemeId): Promise<ThemeConfig> {
  const { config: themeConfig } = await loadThemeSafe(themeId);
  return themeConfig;
}

/**
 * Determine what to display when celebration triggers.
 * 
 * Returns appropriate celebration message based on countdown mode and target date:
 * - Timer mode: Uses completionMessage or default
 * - New Year: Shows year with "Happy New Year!" announcement
 * - Other dates: Uses completionMessage or "Complete!"
 * 
 * @param config - Countdown configuration (mode, completionMessage)
 * @param targetDate - Target date for countdown
 * @returns Celebration display with SafeMessage for theme and fullMessage for accessibility
 * 
 * @example
 * ```typescript
 * // Timer mode
 * const display = getCelebrationDisplay({ mode: 'timer', completionMessage: 'Done!' }, date);
 * // { message: SafeMessage('DONE!'), fullMessage: 'Done!' }
 * 
 * // New Year
 * const display = getCelebrationDisplay(undefined, new Date('2025-01-01T00:00:00Z'));
 * // { message: SafeMessage('2025'), fullMessage: 'Happy New Year! Welcome to 2025!' }
 * ```
 */
export function getCelebrationDisplay(
  config: CountdownConfig | undefined,
  targetDate: Date
): CelebrationDisplay {
  // Timer mode: use completion message
  const modeConfig = config?.mode ? getModeConfig(config.mode) : null;
  if (modeConfig?.isDurationBased && config) {
    const plainText = config.completionMessage || DEFAULT_COMPLETION_MESSAGE;
    return {
      message: createSafeMessageFromText(plainText.toUpperCase()),
      fullMessage: plainText,
    };
  }

  // Date mode: check if New Year
  if (isNewYearMidnight(targetDate)) {
    const year = targetDate.getFullYear().toString();
    return {
      message: createSafeMessageFromText(year),
      fullMessage: `Happy New Year! Welcome to ${year}!`,
    };
  }

  // Non-New Year date: use completion message or default
  const plainText = config?.completionMessage || 'Complete!';
  return {
    message: createSafeMessageFromText(plainText.toUpperCase()),
    fullMessage: plainText,
  };
}
