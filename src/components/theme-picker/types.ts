/** Theme Selector Types - shared type definitions. */

import type { ThemeId } from '@core/types';

export type ThemeSortField = 'name' | 'author' | 'date';

export type ThemeSortDirection = 'asc' | 'desc';

/**
 * Tab identifier for theme selector tabs.
 */
export type ThemeTab = 'themes' | 'favorites';

/**
 * Sort configuration for theme ordering.
 */
export interface ThemeSortConfig {
  field: ThemeSortField;
  direction: ThemeSortDirection;
}

/**
 * Options for creating a theme selector instance.
 */
export interface ThemeSelectorOptions {
  /** Currently selected theme ID */
  currentTheme: ThemeId;
  /** Callback when theme is selected */
  onSelect: (themeId: ThemeId) => void;
  /** Whether to show live background preview on selection */
  showLivePreview?: boolean;
}

/**
 * Controller returned from createThemeSelector.
 */
export interface ThemeSelectorController {
  /** Get the root element */
  getElement(): HTMLElement;
  /** Update selected theme */
  setSelected(themeId: ThemeId): void;
  /** Update preview images based on current color mode */
  updateColorMode(): void;
  /** Destroy and cleanup */
  destroy(): void;
}

/**
 * Internal state for theme selector.
 */
export interface ThemeSelectorState {
  currentTheme: ThemeId;
  searchQuery: string;
  focusedIndex: number;
  filteredThemes: ThemeId[];
  favorites: ThemeId[];
  sortConfig: ThemeSortConfig;
  activeTab: ThemeTab;
}
