/**
 * Countdown configuration helpers.
 *
 * Provides utilities for merging runtime overrides with persisted countdown
 * configuration while applying consistent defaults before syncing to the URL.
 */

import type { CountdownConfig, ThemeId } from '@core/types';

/**
 * Required overrides for syncing countdown configuration to the URL.
 */
export interface ConfigForUrlSyncOptions {
  /** Theme identifier to persist */
  theme: ThemeId;
  /** Timezone identifier to persist */
  timezone: string;
  /** Optional world map visibility override */
  showWorldMap?: boolean;
}

/**
 * Build countdown configuration for URL sync with defaults applied.
 * @throws If baseConfig is undefined
 * @public
 */
export function buildConfigForUrlSync(
  baseConfig: CountdownConfig | undefined,
  overrides: ConfigForUrlSyncOptions
): CountdownConfig {
  if (!baseConfig) {
    throw new Error('Countdown config is required before syncing to URL');
  }

  const { showWorldMap: showWorldMapOverride, ...restOverrides } = overrides;

  return {
    ...baseConfig,
    ...restOverrides,
    showWorldMap: showWorldMapOverride ?? baseConfig.showWorldMap ?? true,
  };
}
