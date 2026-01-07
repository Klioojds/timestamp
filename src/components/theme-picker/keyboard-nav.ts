/** Keyboard navigation handlers for search input and theme cards. */

import type { ThemeId } from '@core/types';
import type { RovingTabindexController } from '@core/utils/accessibility/roving-tabindex';

/**
 * Create keyboard handler for search input navigation.
 * @param getRovingController - Function returning roving tabindex controller
 * @param getNavigableItemCount - Function returning total navigable items
 * @param getNextFocusTarget - Optional function returning next tab target
 * @returns Keydown event handler
 * @remarks ArrowDown focuses first card, ArrowUp focuses last card
 */
export function createSearchKeydownHandler(
  getRovingController: () => RovingTabindexController | null,
  getNavigableItemCount: () => number,
  getNextFocusTarget?: () => HTMLElement | null
): (e: KeyboardEvent) => void {
  return (e: KeyboardEvent) => {
    if (e.key === 'Tab' && !e.shiftKey) {
      const next = getNextFocusTarget?.();
      if (next) {
        e.preventDefault();
        next.focus();
        return;
      }
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      // NOTE: Prevent roving tabindex from also handling this event
      e.stopPropagation();
      getRovingController()?.focusIndex(0);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      // NOTE: Prevent roving tabindex from also handling this event
      e.stopPropagation();
      const lastIndex = Math.max(0, getNavigableItemCount() - 1);
      getRovingController()?.focusIndex(lastIndex);
    }
  };
}

/**
 * Create keyboard handler for theme card interactions.
 * @param onCardSelect - Theme selection callback
 * @param getSearchInput - Function returning search input element
 * @param onFavoriteToggle - Optional favorite toggle callback
 * @param rovingControllerGetter - Optional function returning roving tabindex controller
 * @returns Keydown event handler
 * @remarks Implements APG Grid Pattern: Arrow keys navigate rows/cells, f/a for actions
 */
export function createCardKeydownHandler(
  onCardSelect: (themeId: ThemeId) => void,
  getSearchInput: () => HTMLInputElement | null,
  onFavoriteToggle?: (themeId: ThemeId, target: HTMLElement) => void,
  rovingControllerGetter?: () => RovingTabindexController | null
): (e: KeyboardEvent) => void {
  return (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) {
      return;
    }

    const { key, target } = e;
    const currentElement = target as HTMLElement;
    
    const row = currentElement.closest('[role="row"]') as HTMLElement | null;
    if (!row) return;
    
    const themeId = row.getAttribute('data-theme-id') as ThemeId;

    if (key === 'ArrowLeft' || key === 'ArrowRight') {
      e.preventDefault();
      e.stopPropagation();

      const focusableElements: HTMLElement[] = [];
      
      const gridcells = Array.from(row.querySelectorAll<HTMLElement>('[role="gridcell"]'));
      
      for (const cell of gridcells) {
        if (cell.hasAttribute('tabindex')) {
          focusableElements.push(cell);
        }
        const focusableChildren = Array.from(
          cell.querySelectorAll<HTMLElement>('a[tabindex], button[tabindex]')
        );
        focusableElements.push(...focusableChildren);
      }

      const currentIndex = focusableElements.indexOf(currentElement);
      if (currentIndex === -1) return;

      const delta = key === 'ArrowRight' ? 1 : -1;
      const newIndex = currentIndex + delta;

      if (newIndex >= 0 && newIndex < focusableElements.length) {
        focusableElements[newIndex].focus();
      }
      return;
    }

    if (key === 'ArrowDown' || key === 'ArrowUp') {
      const firstGridcell = row.querySelector<HTMLElement>('[role="gridcell"]:first-child[tabindex]');
      if (firstGridcell && currentElement !== firstGridcell) {
        e.preventDefault();
        e.stopPropagation();
        
        const controller = rovingControllerGetter?.();
        if (controller) {
          const container = firstGridcell.closest('[role="tabpanel"]');
          if (container) {
            const allFirstCells = Array.from(
              container.querySelectorAll<HTMLElement>(
                '[role="row"] > [role="gridcell"]:first-child:is([tabindex]), [role="row"] > [role="gridcell"]:first-child:not([tabindex]) > a'
              )
            );
            const targetIndex = allFirstCells.indexOf(firstGridcell);
            if (targetIndex !== -1) {
              controller.focusIndex(targetIndex);
              return;
            }
          }
        }
        
        firstGridcell.focus();
        return;
      }
      return;
    }

    switch (key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (currentElement.matches('[role="gridcell"]') && themeId) {
          onCardSelect(themeId);
        } else if (currentElement.matches('a')) {
          currentElement.click();
        } else if (currentElement.matches('button')) {
          currentElement.click();
        }
        break;

      case 'f':
      case 'F':
        if (themeId && onFavoriteToggle) {
          const favButton = row.querySelector<HTMLElement>('[data-testid^="favorite-btn-"]');
          if (favButton) {
            e.preventDefault();
            onFavoriteToggle(themeId, favButton);
          }
        }
        break;

      case 'a':
      case 'A':
        if (themeId) {
          const authorLink = row.querySelector('[data-testid^="theme-author-"]') as HTMLAnchorElement;
          if (authorLink) {
            e.preventDefault();
            authorLink.click();
          }
        }
        break;

      default:
        if (/^[b-eg-zB-EG-Z0-9]$/.test(key)) {
          const searchInput = getSearchInput();
          if (searchInput) {
            searchInput.focus();
          }
        }
        break;
    }
  };
}
