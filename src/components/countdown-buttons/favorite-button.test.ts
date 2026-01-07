/**
 * Tests for Favorite Button Component
 * Verifies creation, interaction, and cleanup of the favorite button.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createFavoriteButton } from './favorite-button';
import * as favoritesModule from '@core/preferences';

describe('Favorite Button', () => {
  let getFavoritesSpy: ReturnType<typeof vi.spyOn>;
  let toggleFavoriteSpy: ReturnType<typeof vi.spyOn>;
  let isFavoriteSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Mock localStorage
    const storage: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => storage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        storage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete storage[key];
      }),
    });

    getFavoritesSpy = vi.spyOn(favoritesModule, 'getFavorites');
    toggleFavoriteSpy = vi.spyOn(favoritesModule, 'toggleFavorite');
    isFavoriteSpy = vi.spyOn(favoritesModule, 'isFavorite');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const renderButton = ({
    isFavorite = false,
    toggleResult = { added: !isFavorite, isFavorite: !isFavorite },
    onChange,
  }: {
    isFavorite?: boolean;
    toggleResult?: { added: boolean; isFavorite: boolean };
    onChange?: (value: boolean) => void;
  } = {}) => {
    isFavoriteSpy.mockReturnValue(isFavorite);
    toggleFavoriteSpy.mockReturnValue(toggleResult);

    const button = createFavoriteButton({
      themeId: 'contribution-graph',
      onChange,
    });

    const element = button.getElement();
    document.body.appendChild(element);
    return { button, element };
  };

  describe('createFavoriteButton', () => {
    it.each([
      { isFavorite: false, ariaPressed: 'false', ariaLabel: 'Add to favorites' },
      { isFavorite: true, ariaPressed: 'true', ariaLabel: 'Remove from favorites' },
    ])('should render state when isFavorite=$isFavorite', ({ isFavorite, ariaPressed, ariaLabel }) => {
      const { element } = renderButton({ isFavorite });

      expect(element.tagName).toBe('BUTTON');
      expect(element.getAttribute('type')).toBe('button');
      expect(element.getAttribute('tabindex')).toBe('0');
      expect(element.getAttribute('aria-pressed')).toBe(ariaPressed);
      expect(element.getAttribute('aria-label')).toBe(ariaLabel);

      // Verify an SVG icon is rendered
      const svg = element.querySelector('svg');
      expect(svg).not.toBeNull();
    });

    it('should toggle favorite status and update visuals', () => {
      const { element } = renderButton();

      element.click();

      expect(toggleFavoriteSpy).toHaveBeenCalledWith('contribution-graph');
      expect(element.getAttribute('aria-pressed')).toBe('true');
      expect(element.getAttribute('aria-label')).toBe('Remove from favorites');
      // Verify an SVG icon is rendered (filled heart)
      const svg = element.querySelector('svg');
      expect(svg).not.toBeNull();
    });

    it('should call onChange callback when provided', () => {
      const onChange = vi.fn();
      const { element } = renderButton({ onChange });

      element.click();

      expect(onChange).toHaveBeenCalledWith(true);
    });

    it('should toggle from favorited to not favorited', () => {
      const { element } = renderButton({
        isFavorite: true,
        toggleResult: { added: false, isFavorite: false },
      });

      expect(element.getAttribute('aria-pressed')).toBe('true');

      element.click();

      expect(element.getAttribute('aria-pressed')).toBe('false');
      expect(element.getAttribute('aria-label')).toBe('Add to favorites');
      // Verify an SVG icon is rendered (outline heart)
      const svg = element.querySelector('svg');
      expect(svg).not.toBeNull();
    });

    it('should not toggle for other keys', () => {
      const { element } = renderButton();
      element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));

      expect(toggleFavoriteSpy).not.toHaveBeenCalled();
    });
  });

  describe('setTheme', () => {
    it.each([
      {
        initialFavorite: false,
        nextFavorite: true,
        expectedPressed: 'true',
        expectedLabel: 'Remove from favorites',
      },
      {
        initialFavorite: true,
        nextFavorite: false,
        expectedPressed: 'false',
        expectedLabel: 'Add to favorites',
      },
    ])('should update button state when theme changes', ({ initialFavorite, nextFavorite, expectedPressed, expectedLabel }) => {
      const { button, element } = renderButton({ isFavorite: initialFavorite });

      isFavoriteSpy.mockReturnValue(nextFavorite);
      button.setTheme('fireworks');

      expect(element.getAttribute('aria-pressed')).toBe(expectedPressed);
      expect(element.getAttribute('aria-label')).toBe(expectedLabel);
      // Verify an SVG icon is rendered
      const svg = element.querySelector('svg');
      expect(svg).not.toBeNull();
    });
  });

  describe('destroy', () => {
    it('should remove element from DOM', () => {
      const { button, element } = renderButton();

      expect(document.body.contains(element)).toBe(true);

      button.destroy();

      expect(document.body.contains(element)).toBe(false);
    });

    it('should remove event listeners on destroy', () => {
      const { button, element } = renderButton();

      button.destroy();

      element.click();
      expect(toggleFavoriteSpy).not.toHaveBeenCalled();
    });
  });
});
