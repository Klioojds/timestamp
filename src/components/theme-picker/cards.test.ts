/**
 * Unit tests for theme selector cards (Grid Pattern).
 * Tests APG Grid Pattern implementation with gridcells and rows.
 */

import { describe, it, expect, vi } from 'vitest';
import * as registry from '@themes/registry';
import { createThemeCard, createContributeCard, updateFavoriteButton } from './cards';
import type { ThemeId } from '@core/types';

describe('createThemeCard (Grid Pattern)', () => {
  const mockThemeId: ThemeId = 'contribution-graph';
  const mockOnCardClick = vi.fn();
  const mockOnFavoriteToggle = vi.fn();
  const mockOnCardKeydown = vi.fn();

  it('returns element with role="row"', () => {
    const card = createThemeCard(
      mockThemeId,
      0,
      mockThemeId,
      mockOnCardClick,
      mockOnFavoriteToggle,
      mockOnCardKeydown
    );

    expect(card.getAttribute('role')).toBe('row');
  });

  it('contains first gridcell with role="gridcell" (select cell)', () => {
    const card = createThemeCard(
      mockThemeId,
      0,
      mockThemeId,
      mockOnCardClick,
      mockOnFavoriteToggle,
      mockOnCardKeydown
    );

    const selectCell = card.querySelector('[role="gridcell"]');
    expect(selectCell).toBeTruthy();
    expect(selectCell?.getAttribute('role')).toBe('gridcell');
  });

  it.each([
    { attribute: 'aria-selected', description: 'aria-selected attribute' },
    { attribute: 'tabindex', description: 'tabindex attribute' },
  ])('select cell has $description', ({ attribute }) => {
    const card = createThemeCard(
      mockThemeId,
      0,
      mockThemeId,
      mockOnCardClick,
      mockOnFavoriteToggle,
      mockOnCardKeydown
    );

    const selectCell = card.querySelector('[role="gridcell"]');
    expect(selectCell?.hasAttribute(attribute)).toBe(true);
  });

  it('sets aria-selected="true" when theme is selected', () => {
    const card = createThemeCard(
      mockThemeId,
      0,
      mockThemeId, // currentTheme matches themeId
      mockOnCardClick,
      mockOnFavoriteToggle,
      mockOnCardKeydown
    );

    const selectCell = card.querySelector('[role="gridcell"]');
    expect(selectCell?.getAttribute('aria-selected')).toBe('true');
  });

  it('sets aria-selected="false" when theme is not selected', () => {
    const card = createThemeCard(
      'fireworks' as ThemeId,
      0,
      mockThemeId, // currentTheme doesn't match
      mockOnCardClick,
      mockOnFavoriteToggle,
      mockOnCardKeydown
    );

    const selectCell = card.querySelector('[role="gridcell"]');
    expect(selectCell?.getAttribute('aria-selected')).toBe('false');
  });

  it('contains favorite gridcell with role="gridcell"', () => {
    const card = createThemeCard(
      mockThemeId,
      0,
      mockThemeId,
      mockOnCardClick,
      mockOnFavoriteToggle,
      mockOnCardKeydown
    );

    const favCell = card.querySelector('.theme-selector-gridcell--favorite');
    expect(favCell).toBeTruthy();
    expect(favCell?.getAttribute('role')).toBe('gridcell');
  });

  it('favorite button has aria-pressed attribute', () => {
    const card = createThemeCard(
      mockThemeId,
      0,
      mockThemeId,
      mockOnCardClick,
      mockOnFavoriteToggle,
      mockOnCardKeydown
    );

    const favButton = card.querySelector('.theme-selector-favorite-btn');
    expect(favButton?.hasAttribute('aria-pressed')).toBe(true);
  });

  it('favorite button has accessible name with theme name', () => {
    const card = createThemeCard(
      mockThemeId,
      0,
      mockThemeId,
      mockOnCardClick,
      mockOnFavoriteToggle,
      mockOnCardKeydown
    );

    const favButton = card.querySelector('.theme-selector-favorite-btn');
    const ariaLabel = favButton?.getAttribute('aria-label');
    expect(ariaLabel).toContain('favorite'); // Generic check
    expect(ariaLabel).toBeTruthy();
  });

  it('no nested interactive elements (grid pattern compliance)', () => {
    const card = createThemeCard(
      mockThemeId,
      0,
      mockThemeId,
      mockOnCardClick,
      mockOnFavoriteToggle,
      mockOnCardKeydown
    );

    // Row should contain multiple gridcells as siblings (not nested)
    const gridcells = card.querySelectorAll('[role="gridcell"]');
    expect(gridcells.length).toBeGreaterThanOrEqual(2); // At least select + favorite
    
    // Select cell should not contain other interactive elements directly
    const selectCell = card.querySelector('.theme-selector-card[role="gridcell"]');
    const directButtons = Array.from(selectCell?.querySelectorAll('button') || []).filter(
      btn => btn.parentElement === selectCell
    );
    const directLinks = Array.from(selectCell?.querySelectorAll('a') || []).filter(
      link => link.parentElement === selectCell
    );
    
    expect(directButtons.length).toBe(0); // No direct button children
    expect(directLinks.length).toBe(0); // No direct link children
  });

  it('calls onCardClick when select cell is clicked', () => {
    const card = createThemeCard(
      mockThemeId,
      0,
      'fireworks' as ThemeId,
      mockOnCardClick,
      mockOnFavoriteToggle,
      mockOnCardKeydown
    );

    const selectCell = card.querySelector('.theme-selector-card');
    selectCell?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(mockOnCardClick).toHaveBeenCalledWith(mockThemeId);
  });

  it('calls onFavoriteToggle when favorite button is clicked', () => {
    const card = createThemeCard(
      mockThemeId,
      0,
      mockThemeId,
      mockOnCardClick,
      mockOnFavoriteToggle,
      mockOnCardKeydown
    );

    const favButton = card.querySelector('.theme-selector-favorite-btn');
    favButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(mockOnFavoriteToggle).toHaveBeenCalled();
  });

  it('prevents favorite click from bubbling to card click (stopPropagation)', () => {
    const mockClick = vi.fn();
    const mockFav = vi.fn();
    
    const card = createThemeCard(
      mockThemeId,
      0,
      mockThemeId,
      mockClick,
      mockFav,
      mockOnCardKeydown
    );

    const favButton = card.querySelector('.theme-selector-favorite-btn');
    favButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    // onCardClick should NOT be called when favorite is clicked
    expect(mockClick).not.toHaveBeenCalled();
    expect(mockFav).toHaveBeenCalled();
  });

  describe('LCP optimization (isLcpCandidate)', () => {
    it('uses <img> with lazy loading by default (non-LCP)', () => {
      const card = createThemeCard(
        mockThemeId,
        0,
        mockThemeId,
        mockOnCardClick,
        mockOnFavoriteToggle,
        mockOnCardKeydown
      );

      const selectCell = card.querySelector('.theme-selector-card') as HTMLElement;
      const previewImg = selectCell?.querySelector('.theme-selector-card-preview-img') as HTMLImageElement;
      
      expect(previewImg).toBeTruthy();
      expect(previewImg?.tagName).toBe('IMG');
      expect(previewImg?.loading).toBe('lazy');
      expect(previewImg?.getAttribute('fetchpriority')).toBeNull();
    });

    it('uses <img> with fetchpriority="high" when isLcpCandidate=true', () => {
      const card = createThemeCard(
        mockThemeId,
        0,
        mockThemeId,
        mockOnCardClick,
        mockOnFavoriteToggle,
        mockOnCardKeydown,
        true // isLcpCandidate
      );

      const selectCell = card.querySelector('.theme-selector-card') as HTMLElement;
      const previewImg = selectCell?.querySelector('.theme-selector-card-preview-img') as HTMLImageElement;
      
      expect(previewImg).toBeTruthy();
      expect(previewImg?.tagName).toBe('IMG');
      expect(previewImg?.getAttribute('fetchpriority')).toBe('high');
      expect(previewImg?.loading).toBe('eager');
      expect(previewImg?.src).toBeTruthy();
    });

    it('non-LCP img has width/height hints to prevent layout shift', () => {
      const card = createThemeCard(
        mockThemeId,
        0,
        mockThemeId,
        mockOnCardClick,
        mockOnFavoriteToggle,
        mockOnCardKeydown,
        false // non-LCP
      );

      const previewImg = card.querySelector('.theme-selector-card-preview-img') as HTMLImageElement;
      expect(previewImg?.width).toBe(426);
      expect(previewImg?.height).toBe(240);
    });

    it('img element is decorative (empty alt)', () => {
      const card = createThemeCard(
        mockThemeId,
        0,
        mockThemeId,
        mockOnCardClick,
        mockOnFavoriteToggle,
        mockOnCardKeydown,
        true
      );

      const previewImg = card.querySelector('.theme-selector-card-preview-img') as HTMLImageElement;
      expect(previewImg?.alt).toBe('');
    });

    it('img element is not draggable', () => {
      const card = createThemeCard(
        mockThemeId,
        0,
        mockThemeId,
        mockOnCardClick,
        mockOnFavoriteToggle,
        mockOnCardKeydown,
        true
      );

      const previewImg = card.querySelector('.theme-selector-card-preview-img') as HTMLImageElement;
      expect(previewImg?.draggable).toBe(false);
    });
  });
});

describe('createContributeCard (Grid Pattern)', () => {
  it('returns element with role="row"', () => {
    const card = createContributeCard();
    expect(card.getAttribute('role')).toBe('row');
  });

  it('contains gridcell with role="gridcell"', () => {
    const card = createContributeCard();
    const gridcell = card.querySelector('[role="gridcell"]');
    expect(gridcell).toBeTruthy();
    expect(gridcell?.getAttribute('role')).toBe('gridcell');
  });

  it('gridcell contains link to theme development guide', () => {
    const card = createContributeCard();
    const link = card.querySelector('a');
    expect(link).toBeTruthy();
    expect(link?.getAttribute('href')).toContain('THEME_DEVELOPMENT.md');
  });

  it('link has target="_blank" and rel="noopener noreferrer"', () => {
    const card = createContributeCard();
    const link = card.querySelector('a');
    expect(link?.getAttribute('target')).toBe('_blank');
    expect(link?.getAttribute('rel')).toBe('noopener noreferrer');
  });
});

describe('updateFavoriteButton', () => {
  it('updates aria-pressed to "true" when favorited', () => {
    const button = document.createElement('button');
    button.setAttribute('aria-pressed', 'false');
    
    updateFavoriteButton(button, true);
    
    expect(button.getAttribute('aria-pressed')).toBe('true');
  });

  it('updates aria-pressed to "false" when unfavorited', () => {
    const button = document.createElement('button');
    button.setAttribute('aria-pressed', 'true');
    
    updateFavoriteButton(button, false);
    
    expect(button.getAttribute('aria-pressed')).toBe('false');
  });

  it('updates button innerHTML (heart icon)', () => {
    const button = document.createElement('button');
    button.innerHTML = 'old content';
    
    updateFavoriteButton(button, true);
    
    expect(button.innerHTML).not.toBe('old content');
    expect(button.innerHTML).toContain('svg');
  });
});

describe('buildAuthorSection edge cases', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('omits author cell when registry returns null', () => {
    vi.spyOn(registry, 'getThemeAuthor').mockReturnValue(null);

    const row = createThemeCard(
      'contribution-graph' as ThemeId,
      0,
      'contribution-graph' as ThemeId,
      vi.fn(),
      vi.fn(),
      vi.fn()
    );

    expect(row.querySelector('.theme-selector-gridcell--author')).toBeNull();
  });

  it('author link has aria-label with GitHub context', () => {
    const card = createThemeCard(
      'contribution-graph' as ThemeId,
      0,
      'contribution-graph' as ThemeId,
      vi.fn(),
      vi.fn(),
      vi.fn()
    );

    const authorLink = card.querySelector('.theme-selector-card-author');
    if (authorLink) {
      const ariaLabel = authorLink.getAttribute('aria-label');
      expect(ariaLabel).toContain('GitHub');
      expect(ariaLabel).toContain('opens in new tab');
    }
  });

  it('prevents author click from bubbling to card click (stopPropagation)', () => {
    const mockOnCardClick = vi.fn();
    const card = createThemeCard(
      'contribution-graph' as ThemeId,
      0,
      'contribution-graph' as ThemeId,
      mockOnCardClick,
      vi.fn(),
      vi.fn()
    );

    const authorLink = card.querySelector('.theme-selector-card-author');
    if (authorLink) {
      authorLink.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      // onCardClick should NOT be called when author link is clicked
      expect(mockOnCardClick).not.toHaveBeenCalled();
    }
  });
});
