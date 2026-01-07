/**
 * Theme selector types - compile-time sanity tests.
 */
import { describe, it, expect } from 'vitest';
import { expectTypeOf } from 'vitest';
import type { ThemeId } from '@core/types';
import type {
  ThemeSelectorController,
  ThemeSelectorOptions,
  ThemeSelectorState,
  ThemeSortConfig,
  ThemeSortDirection,
  ThemeSortField,
  ThemeTab,
} from './types';

describe('theme-picker types', () => {
  it('should enforce sort config shape and direction literals', () => {
    const sortConfig: ThemeSortConfig = { field: 'name', direction: 'asc' };
    expect(sortConfig.field).toBe('name');
    expect(sortConfig.direction).toBe('asc');

    // @ts-expect-error invalid field should not compile
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const invalidField: ThemeSortConfig = { field: 'invalid', direction: 'asc' };

    // @ts-expect-error invalid direction should not compile
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const invalidDirection: ThemeSortConfig = { field: 'name', direction: 'up' };
  });

  it('should align controller contract with public API', () => {
    const controller: ThemeSelectorController = {
      getElement: () => document.createElement('div'),
      setSelected: (_themeId: ThemeId) => undefined,
      updateColorMode: () => undefined,
      destroy: () => undefined,
    };

    expect(controller).toHaveProperty('getElement');
    expect(controller).toHaveProperty('setSelected');
    expect(controller).toHaveProperty('updateColorMode');
    expect(controller).toHaveProperty('destroy');
  });

  it('should maintain state and tab discriminants', () => {
    const state: ThemeSelectorState = {
      currentTheme: 'contribution-graph' as ThemeId,
      searchQuery: 'fire',
      focusedIndex: 0,
      filteredThemes: ['fireworks' as ThemeId],
      favorites: ['contribution-graph' as ThemeId],
      sortConfig: { field: 'author', direction: 'desc' },
      activeTab: 'favorites',
    };

    expectTypeOf(state.filteredThemes).items.toMatchTypeOf<ThemeId>();
    expectTypeOf(state.favorites).items.toMatchTypeOf<ThemeId>();
    expectTypeOf(state.activeTab).toEqualTypeOf<ThemeTab>();
    expect(state.sortConfig.direction).toBe('desc');
    expect(state.sortConfig.field).toBe('author');
  });

  it('should require currentTheme and onSelect options', () => {
    const options: ThemeSelectorOptions = {
      currentTheme: 'contribution-graph' as ThemeId,
      onSelect: () => undefined,
      showLivePreview: true,
    };

    expect(options.showLivePreview).toBe(true);
    expectTypeOf(options.onSelect).returns.toBeVoid();
  });
});
