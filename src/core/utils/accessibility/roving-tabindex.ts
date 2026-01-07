/**
 * Roving Tabindex Utility
 * Provides keyboard navigation for composite widgets. Only one item is
 * tabbable at a time; arrow keys move focus between items.
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/radio/examples/radio/
 */

/** Orientation for arrow key navigation. */
export type RovingOrientation = 'horizontal' | 'vertical' | 'both';

/** Options for creating a roving tabindex controller. */
export interface RovingTabindexOptions {
  container: HTMLElement;
  selector: string;
  initialIndex?: number;
  wrap?: boolean;
  orientation?: RovingOrientation;
  onFocusChange?: (index: number, element: HTMLElement) => void;
  useActivedescendant?: boolean;
}

/** Controller for managing roving tabindex. */
export interface RovingTabindexController {
  focusIndex(index: number): void;
  getCurrentIndex(): number;
  refresh(): void;
  destroy(): void;
}

/**
 * Create a roving tabindex controller for keyboard navigation.
 * @param options - Roving tabindex configuration
 */
export function createRovingTabindex(
  options: RovingTabindexOptions
): RovingTabindexController {
  const {
    container,
    selector,
    initialIndex = 0,
    wrap = true,
    orientation = 'both',
    onFocusChange,
    useActivedescendant = false,
  } = options;

  let currentIndex = 0;
  let items: HTMLElement[] = [];

  function queryItems(): void {
    items = Array.from(container.querySelectorAll<HTMLElement>(selector));
  }

  function updateTabindex(focusedIndex: number): void {
    items.forEach((item, i) => {
      item.setAttribute('tabindex', i === focusedIndex ? '0' : '-1');
    });
    if (useActivedescendant && items[focusedIndex]?.id) {
      container.setAttribute('aria-activedescendant', items[focusedIndex].id);
    }
  }

  function focusItem(index: number, shouldFocus = true): void {
    if (items.length === 0) return;
    const clampedIndex = Math.max(0, Math.min(index, items.length - 1));
    currentIndex = clampedIndex;
    updateTabindex(clampedIndex);

    if (shouldFocus) {
      const element = items[clampedIndex];
      element.focus();
      // Scroll into view (not available in JSDOM)
      if (typeof element.scrollIntoView === 'function') {
        element.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    }
    onFocusChange?.(clampedIndex, items[clampedIndex]);
  }

  function moveFocus(delta: number): void {
    if (items.length === 0) return;
    let newIndex = currentIndex + delta;
    if (wrap) {
      if (newIndex < 0) newIndex = items.length - 1;
      else if (newIndex >= items.length) newIndex = 0;
    } else {
      newIndex = Math.max(0, Math.min(newIndex, items.length - 1));
    }
    focusItem(newIndex);
  }

  function handleKeydown(event: KeyboardEvent): void {
    const { key, target } = event;
    // Only handle events for managed items (supports both real and synthetic events)
    const targetElement = target as HTMLElement;
    const activeElement = document.activeElement as HTMLElement | null;
    const isTargetAnItem = items.some(item => item.contains(targetElement) || item === targetElement);
    const isActiveElementAnItem = activeElement && items.some(item => item.contains(activeElement) || item === activeElement);
    if (!isTargetAnItem && !isActiveElementAnItem) return;

    const isVerticalKey = key === 'ArrowUp' || key === 'ArrowDown';
    const isHorizontalKey = key === 'ArrowLeft' || key === 'ArrowRight';
    if (orientation === 'vertical' && isHorizontalKey) return;
    if (orientation === 'horizontal' && isVerticalKey) return;

    switch (key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        moveFocus(1);
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        moveFocus(-1);
        break;
      case 'Home':
        event.preventDefault();
        focusItem(0);
        break;
      case 'End':
        event.preventDefault();
        focusItem(items.length - 1);
        break;
    }
  }

  // Initialize
  queryItems();
  if (items.length > 0) {
    const clampedInitial = Math.max(0, Math.min(initialIndex, items.length - 1));
    currentIndex = clampedInitial;
    updateTabindex(clampedInitial);
  }
  container.addEventListener('keydown', handleKeydown);

  return {
    focusIndex: (index: number) => focusItem(index),
    getCurrentIndex: () => currentIndex,
    refresh(): void {
      queryItems();
      if (currentIndex >= items.length) currentIndex = Math.max(0, items.length - 1);
      updateTabindex(currentIndex);
    },
    destroy: () => container.removeEventListener('keydown', handleKeydown),
  };
}
