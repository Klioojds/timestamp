/** Tests for favorites utility module. */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getFavorites,
  isFavorite,
  toggleFavorite,
  MAX_FAVORITES,
} from './favorites';
import { mockStorageError, setLocalStorageJson } from '@/test-utils/storage';

describe('Favorites', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('getFavorites', () => {
    it('should return empty array when no favorites saved', () => {
      expect(getFavorites()).toEqual([]);
    });

    it('should return saved favorites', () => {
      setLocalStorageJson('countdown:favorites', ['contribution-graph', 'fireworks']);
      expect(getFavorites()).toEqual(['contribution-graph', 'fireworks']);
    });

    it('should filter out invalid theme IDs', () => {
      setLocalStorageJson('countdown:favorites', ['contribution-graph', 'invalid-theme', 'fireworks']);
      expect(getFavorites()).toEqual(['contribution-graph', 'fireworks']);
    });

    it('should return empty array on parse error', () => {
      localStorage.setItem('countdown:favorites', 'invalid json');
      expect(getFavorites()).toEqual([]);
    });

    it('should handle localStorage errors gracefully', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const storageSpy = mockStorageError('getItem');

      expect(getFavorites()).toEqual([]);
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
      storageSpy.mockRestore();
    });
  });

  describe('isFavorite', () => {
    it('should return true for favorite themes', () => {
      setLocalStorageJson('countdown:favorites', ['contribution-graph']);
      expect(isFavorite('contribution-graph')).toBe(true);
    });

    it('should return false for non-favorite themes', () => {
      expect(isFavorite('contribution-graph')).toBe(false);
    });
  });

  describe('toggleFavorite', () => {
    it('should add theme when not a favorite', () => {
      const result = toggleFavorite('contribution-graph');
      expect(result).toEqual({ added: true, isFavorite: true });
      expect(isFavorite('contribution-graph')).toBe(true);
    });

    it('should remove theme when already a favorite', () => {
      setLocalStorageJson('countdown:favorites', ['contribution-graph']);
      const result = toggleFavorite('contribution-graph');
      expect(result).toEqual({ added: false, isFavorite: false });
      expect(isFavorite('contribution-graph')).toBe(false);
    });

    it('should return limitReached and not add when at capacity', () => {
      const filled = Array.from({ length: MAX_FAVORITES }, () => 'contribution-graph' as const);
      setLocalStorageJson('countdown:favorites', filled);

      const result = toggleFavorite('fireworks');

      expect(result).toEqual({ added: false, limitReached: true, isFavorite: false });
      expect(getFavorites().length).toBe(MAX_FAVORITES);
    });

    it('should handle localStorage write errors gracefully', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const storageSpy = mockStorageError('setItem');

      const result = toggleFavorite('contribution-graph');
      expect(result.added).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
      storageSpy.mockRestore();
    });
  });

  describe('MAX_FAVORITES constant', () => {
    it('should be 10', () => {
      expect(MAX_FAVORITES).toBe(10);
    });
  });
});
