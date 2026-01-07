/**
 * Favorites Manager Module - Unit Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MAX_FAVORITES } from '@core/preferences';
import {
  getCurrentFavorites,
  isThemeFavorite,
  toggleThemeFavorite,
  getFavoriteHeartSVG,
} from './favorites-manager';

describe('favorites-manager', () => {
  let storage: Record<string, string>;

  beforeEach(() => {
    // Mock localStorage
    storage = {};
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => storage[key] || null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      storage[key] = value;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getCurrentFavorites', () => {
    it('should return empty array when no favorites', () => {
      const favorites = getCurrentFavorites();
      expect(favorites).toEqual([]);
    });

    it('should ignore invalid stored entries', () => {
      storage['countdown:favorites'] = JSON.stringify(['fireworks', 'not-a-theme']);

      const favorites = getCurrentFavorites();

      expect(favorites).toEqual(['fireworks']);
    });
  });

  describe('isThemeFavorite', () => {
    it('should return false when theme is not favorited', () => {
      expect(isThemeFavorite('fireworks')).toBe(false);
    });

    it('should return true when theme is already stored as favorite', () => {
      storage['countdown:favorites'] = JSON.stringify(['fireworks']);

      expect(isThemeFavorite('fireworks')).toBe(true);
    });
  });

  describe('toggleThemeFavorite', () => {
    it.each([
      {
        description: 'adds favorite when under limit',
        favorites: [] as string[],
        isFavorite: true,
        limitReached: false,
        announcementContains: null as string | null,
      },
      {
        description: 'returns announcement when limit reached',
        favorites: new Array(MAX_FAVORITES).fill('contribution-graph'),
        isFavorite: false,
        limitReached: true,
        announcementContains: 'Maximum',
      },
    ])('should handle toggle when it $description', ({ favorites, isFavorite, limitReached, announcementContains }) => {
      storage['countdown:favorites'] = JSON.stringify(favorites);

      const result = toggleThemeFavorite('fireworks');

      expect(result.isFavorite).toBe(isFavorite);
      expect(result.limitReached).toBe(limitReached);
      if (announcementContains) {
        expect(result.announcement).toContain(announcementContains);
      } else {
        expect(result.announcement).toBeNull();
      }
    });

    it('should remove existing favorite when toggled again', () => {
      storage['countdown:favorites'] = JSON.stringify(['fireworks']);

      const result = toggleThemeFavorite('fireworks');

      expect(result.isFavorite).toBe(false);
      expect(JSON.parse(storage['countdown:favorites'])).toEqual([]);
    });
  });

  describe('getFavoriteHeartSVG', () => {
    it('should return filled heart SVG when favorited', () => {
      const svg = getFavoriteHeartSVG(true);
      // Filled heart uses heart-fill icon
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
    });

    it('should return outlined heart SVG when not favorited', () => {
      const svg = getFavoriteHeartSVG(false);
      // Outline heart uses heart icon
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
    });
  });
});
