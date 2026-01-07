/**
 * Card Builder Module - Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createThemeCard,
  updateFavoriteButton,
  buildSearchSection,
  buildResultsCount,
  buildThemesContainer,
  createSentinel,
} from './card-builder';
import type { ThemeId } from '@core/types';

describe('card-builder', () => {
  beforeEach(() => {
    // Mock localStorage for favorites
    const storage: Record<string, string> = {};
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => storage[key] || null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      storage[key] = value;
    });
  });

  describe('createThemeCard', () => {
    it.each([
      {
        description: 'non-selected card',
        currentTheme: 'contribution-graph' as ThemeId,
        expectedSelected: false,
        expectedTabIndex: '-1',
      },
      {
        description: 'selected card',
        currentTheme: 'fireworks' as ThemeId,
        expectedSelected: true,
        expectedTabIndex: '-1',
      },
    ])('should render %s with correct semantics', ({ currentTheme, expectedSelected, expectedTabIndex }) => {
      const onCardClick = vi.fn();
      const onFavoriteToggle = vi.fn();
      const onCardKeydown = vi.fn();

      const card = createThemeCard('fireworks', 0, currentTheme, onCardClick, onFavoriteToggle, onCardKeydown);
      const selectCell = card.querySelector('[role="gridcell"].theme-selector-card');

      expect(card.getAttribute('role')).toBe('row');
      expect(card.getAttribute('data-theme-id')).toBe('fireworks');
      expect(card.getAttribute('data-index')).toBe('0');
      expect(selectCell?.getAttribute('role')).toBe('gridcell');
      expect(selectCell?.getAttribute('aria-selected')).toBe(expectedSelected ? 'true' : 'false');
      expect(selectCell?.getAttribute('tabindex')).toBe(expectedTabIndex);
      expect(selectCell?.classList.contains('theme-selector-card--selected')).toBe(expectedSelected);
      expect(card.getAttribute('data-testid')).toBe('theme-card-fireworks');
    });

    it('should call onCardClick when clicked', () => {
      const onCardClick = vi.fn();
      const card = createThemeCard(
        'fireworks',
        0,
        'contribution-graph',
        onCardClick,
        vi.fn(),
        vi.fn()
      );

      const selectCell = card.querySelector('[role="gridcell"].theme-selector-card') as HTMLElement;
      selectCell.click();

      expect(onCardClick).toHaveBeenCalledWith('fireworks');
    });

    it('should include favorite button', () => {
      const card = createThemeCard(
        'fireworks',
        0,
        'contribution-graph',
        vi.fn(),
        vi.fn(),
        vi.fn()
      );

      const favButton = card.querySelector('[data-testid="favorite-btn-fireworks"]');
      expect(favButton).not.toBeNull();
    });

    it('should stop propagation when favorite button clicked', () => {
      const onCardClick = vi.fn();
      const onFavoriteToggle = vi.fn();
      const card = createThemeCard(
        'fireworks',
        0,
        'contribution-graph',
        onCardClick,
        onFavoriteToggle,
        vi.fn()
      );

      const favButton = card.querySelector('[data-testid="favorite-btn-fireworks"]') as HTMLElement;
      favButton?.click();

      expect(onFavoriteToggle).toHaveBeenCalled();
      expect(onCardClick).not.toHaveBeenCalled();
    });
  });

  describe('updateFavoriteButton', () => {
    it.each([
      { isFavorite: true, expected: 'true' },
      { isFavorite: false, expected: 'false' },
    ])('should set aria-pressed to $expected when isFavorite=$isFavorite', ({ isFavorite, expected }) => {
      const button = document.createElement('button');
      button.innerHTML = '<svg></svg>';

      updateFavoriteButton(button, isFavorite);

      expect(button.getAttribute('aria-pressed')).toBe(expected);
      expect(button.innerHTML).toContain('<svg');
    });
  });

  describe('buildSearchSection', () => {
    it('should build search section with input', () => {
      const onInput = vi.fn();
      const onKeydown = vi.fn();
      const { section, searchInput } = buildSearchSection(onInput, onKeydown);

      expect(section.classList.contains('theme-selector-search-section')).toBe(true);
      expect(searchInput.type).toBe('search');
      expect(searchInput.getAttribute('data-testid')).toBe('theme-search-input');
    });

    it('should call onInput when input event fires', () => {
      const onInput = vi.fn();
      const { searchInput } = buildSearchSection(onInput, vi.fn());

      searchInput.dispatchEvent(new Event('input'));

      expect(onInput).toHaveBeenCalled();
    });
  });

  describe('buildResultsCount', () => {
    it('should build results count with aria-live', () => {
      const element = buildResultsCount();

      expect(element.getAttribute('role')).toBe('status');
      expect(element.getAttribute('aria-live')).toBe('polite');
      expect(element.getAttribute('aria-atomic')).toBe('true');
    });
  });

  describe('buildThemesContainer', () => {
    it('should build themes container with group role for grouped listbox pattern', () => {
      const element = buildThemesContainer();

      // APG Grid Pattern: use role="grid" with rowcount metadata
      expect(element.getAttribute('role')).toBe('grid');
      expect(element.getAttribute('aria-label')).toBe('Theme selector');
      expect(element.getAttribute('aria-rowcount')).toBe('0');
    });
  });

  describe('createSentinel', () => {
    it('should create sentinel element', () => {
      const element = createSentinel();

      expect(element.classList.contains('theme-selector-sentinel')).toBe(true);
      expect(element.getAttribute('data-testid')).toBe('theme-selector-sentinel');
    });
  });
});
