/**
 * Keyboard Navigation Module - Unit Tests
 */

import { describe, it, expect, vi } from 'vitest';
import {
  createSearchKeydownHandler,
  createCardKeydownHandler,
} from './keyboard-nav';
import type { RovingTabindexController } from '@core/utils/accessibility/roving-tabindex';

const buildRow = (themeId?: string) => {
  const row = document.createElement('div');
  row.setAttribute('role', 'row');
  if (themeId) {
    row.setAttribute('data-theme-id', themeId);
  }

  const mainCell = document.createElement('div');
  mainCell.setAttribute('role', 'gridcell');
  mainCell.setAttribute('tabindex', '-1');
  row.appendChild(mainCell);

  return { row, mainCell };
};

describe('keyboard-nav', () => {
  describe('createSearchKeydownHandler', () => {
    it.each([
      { key: 'ArrowDown', expectedIndex: 0 },
      { key: 'ArrowUp', expectedIndex: 9 },
    ])('should focus correct item on $key', ({ key, expectedIndex }) => {
      const mockController: Partial<RovingTabindexController> = {
        focusIndex: vi.fn(),
      };
      const handler = createSearchKeydownHandler(
        () => mockController as RovingTabindexController,
        () => 10
      );

      const event = new KeyboardEvent('keydown', { key });
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
      handler(event);

      expect(mockController.focusIndex).toHaveBeenCalledWith(expectedIndex);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should handle null roving controller', () => {
      const handler = createSearchKeydownHandler(
        () => null,
        () => 10
      );

      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
      
      expect(() => handler(event)).not.toThrow();
    });

    it('should move focus to provided next target on Tab', () => {
      const mockController: Partial<RovingTabindexController> = {
        focusIndex: vi.fn(),
      };

      const searchInput = document.createElement('input');
      const sortButton = document.createElement('button');
      document.body.append(searchInput, sortButton);

      const handler = createSearchKeydownHandler(
        () => mockController as RovingTabindexController,
        () => 10,
        () => sortButton
      );

      const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() });

      handler(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(document.activeElement).toBe(sortButton);
    });
  });

  describe('createCardKeydownHandler', () => {
    it.each([
      'Enter',
      ' ',
    ])('should call onCardSelect on %s', (key) => {
      const onCardSelect = vi.fn();
      const handler = createCardKeydownHandler(onCardSelect, () => null);

      const { row, mainCell } = buildRow('fireworks');
      document.body.appendChild(row);

      const event = new KeyboardEvent('keydown', { key, bubbles: true });
      Object.defineProperty(event, 'target', { value: mainCell });
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() });

      handler(event);

      expect(onCardSelect).toHaveBeenCalledWith('fireworks');
      row.remove();
    });

    it.each(['b', 'c', 'g', 'z', '1', '9'])('should redirect "%s" key to search input', (key) => {
      const searchInput = document.createElement('input');
      const focusSpy = vi.spyOn(searchInput, 'focus');
      const handler = createCardKeydownHandler(vi.fn(), () => searchInput);

      const { row, mainCell } = buildRow('fireworks');
      document.body.appendChild(row);
      const event = new KeyboardEvent('keydown', { key, bubbles: true });
      Object.defineProperty(event, 'target', { value: mainCell });

      handler(event);

      expect(focusSpy).toHaveBeenCalled();
      row.remove();
    });

    it('should not focus search input on special character key', () => {
      const searchInput = document.createElement('input');
      const focusSpy = vi.spyOn(searchInput, 'focus');
      const handler = createCardKeydownHandler(vi.fn(), () => searchInput);

      const { row, mainCell } = buildRow('fireworks');
      document.body.appendChild(row);
      const event = new KeyboardEvent('keydown', { key: '@', bubbles: true });
      Object.defineProperty(event, 'target', { value: mainCell });

      handler(event);

      expect(focusSpy).not.toHaveBeenCalled();
      row.remove();
    });

    it('should not call onCardSelect when target has no theme id', () => {
      const onCardSelect = vi.fn();
      const handler = createCardKeydownHandler(onCardSelect, () => null);

      const { row, mainCell } = buildRow();
      document.body.appendChild(row);

      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      Object.defineProperty(event, 'target', { value: mainCell });
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() });

      handler(event);

      expect(onCardSelect).not.toHaveBeenCalled();
      row.remove();
    });

    it.each(['f', 'F'])('should call onFavoriteToggle on "%s" key when card is focused', (key) => {
      const onCardSelect = vi.fn();
      const onFavoriteToggle = vi.fn();
      const handler = createCardKeydownHandler(onCardSelect, () => null, onFavoriteToggle);

      const { row, mainCell } = buildRow('fireworks');
      const favCell = document.createElement('div');
      favCell.setAttribute('role', 'gridcell');
      const favButton = document.createElement('button');
      favButton.setAttribute('data-testid', 'favorite-btn-fireworks');
      favButton.tabIndex = -1;
      favCell.appendChild(favButton);
      row.appendChild(favCell);
      document.body.appendChild(row);

      const event = new KeyboardEvent('keydown', { key, bubbles: true });
      Object.defineProperty(event, 'target', { value: mainCell });
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() });

      handler(event);

      expect(onFavoriteToggle).toHaveBeenCalledWith('fireworks', favButton);
      expect(event.preventDefault).toHaveBeenCalled();
      row.remove();
    });

    it('should not redirect "f" key to search input (reserved for favorite toggle)', () => {
      const searchInput = document.createElement('input');
      const focusSpy = vi.spyOn(searchInput, 'focus');
      const handler = createCardKeydownHandler(vi.fn(), () => searchInput);

      const { row, mainCell } = buildRow('fireworks');
      document.body.appendChild(row);
      const event = new KeyboardEvent('keydown', { key: 'f', bubbles: true });
      Object.defineProperty(event, 'target', { value: mainCell });

      handler(event);

      expect(focusSpy).not.toHaveBeenCalled();
      row.remove();
    });

    it.each(['a', 'A'])('should open author link on "%s" key when card is focused', (key) => {
      const onCardSelect = vi.fn();
      const handler = createCardKeydownHandler(onCardSelect, () => null);

      const { row, mainCell } = buildRow('fireworks');
      const authorCell = document.createElement('div');
      authorCell.setAttribute('role', 'gridcell');
      const authorLink = document.createElement('a');
      authorLink.setAttribute('data-testid', 'theme-author-fireworks');
      authorLink.setAttribute('href', 'https://github.com/test');
      authorLink.tabIndex = -1;
      const clickSpy = vi.spyOn(authorLink, 'click');
      authorCell.appendChild(authorLink);
      row.appendChild(authorCell);
      document.body.appendChild(row);

      const event = new KeyboardEvent('keydown', { key, bubbles: true });
      Object.defineProperty(event, 'target', { value: mainCell });
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() });

      handler(event);

      expect(clickSpy).toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
      row.remove();
    });

    it('should not redirect "a" key to search input (reserved for author link)', () => {
      const searchInput = document.createElement('input');
      const focusSpy = vi.spyOn(searchInput, 'focus');
      const handler = createCardKeydownHandler(vi.fn(), () => searchInput);

      const { row, mainCell } = buildRow('fireworks');
      document.body.appendChild(row);
      const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true });
      Object.defineProperty(event, 'target', { value: mainCell });

      handler(event);

      expect(focusSpy).not.toHaveBeenCalled();
      row.remove();
    });
  });
});
