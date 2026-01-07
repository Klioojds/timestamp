import { describe, it, expect } from 'vitest';

import * as indexModule from './index';
import * as favorites from './favorites';
import * as colorMode from './color-mode';

describe('preferences index exports', () => {
  it('re-exports favorites helpers', () => {
    expect(indexModule.getFavorites).toBe(favorites.getFavorites);
    expect(indexModule.toggleFavorite).toBe(favorites.toggleFavorite);
    expect(indexModule.MAX_FAVORITES).toBe(favorites.MAX_FAVORITES);
  });

  it('re-exports color mode helpers', () => {
    expect(indexModule.getColorMode).toBe(colorMode.getColorMode);
    expect(indexModule.saveColorMode).toBe(colorMode.saveColorMode);
    expect(indexModule.resolveColorMode).toBe(colorMode.resolveColorMode);
  });
});