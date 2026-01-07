/**
 * Roving Tabindex Utility Tests
 * Verifies keyboard navigation patterns for accessible roving tabindex.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createRovingTabindex,
  type RovingTabindexController,
  type RovingTabindexOptions,
} from './roving-tabindex';

describe('createRovingTabindex', () => {
  let container: HTMLElement;
  let items: HTMLElement[];
  let controller: RovingTabindexController | null;

  const createController = (options: Partial<RovingTabindexOptions> = {}) =>
    createRovingTabindex({ container, selector: 'button', ...options });

  const pressKey = (target: HTMLElement, key: string, init: KeyboardEventInit = {}) =>
    target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...init }));

  const mockScrollIntoViewOnItems = () => {
    items.forEach((item) => {
      item.scrollIntoView = vi.fn();
    });
  };

  beforeEach(() => {
    // Mock scrollIntoView since JSDOM doesn't implement it
    Element.prototype.scrollIntoView = vi.fn();

    container = document.createElement('div');
    container.setAttribute('role', 'listbox');
    document.body.appendChild(container);

    // Create 5 focusable items
    items = [];
    for (let i = 0; i < 5; i++) {
      const item = document.createElement('button');
      item.textContent = `Item ${i}`;
      item.setAttribute('role', 'option');
      item.setAttribute('data-index', String(i));
      container.appendChild(item);
      items.push(item);
    }
  });

  afterEach(() => {
    controller?.destroy();
    controller = null;
    container.remove();
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should set tabindex="0" on the first item by default', () => {
      controller = createController();

      expect(items[0].getAttribute('tabindex')).toBe('0');
      items.slice(1).forEach((item) => {
        expect(item.getAttribute('tabindex')).toBe('-1');
      });
    });

    it('should set tabindex="0" on the initial index if provided', () => {
      controller = createController({ initialIndex: 2 });

      expect(items[2].getAttribute('tabindex')).toBe('0');
      items.filter((_, i) => i !== 2).forEach((item) => {
        expect(item.getAttribute('tabindex')).toBe('-1');
      });
    });

    it('should clamp initial index to valid range', () => {
      controller = createController({ initialIndex: 10 });

      expect(items[4].getAttribute('tabindex')).toBe('0'); // Last item
    });

    it('should handle empty container gracefully', () => {
      container.innerHTML = '';
      
      expect(() => {
        controller = createRovingTabindex({
          container,
          selector: 'button',
        });
      }).not.toThrow();
    });
  });

  describe('keyboard navigation', () => {
    it.each([
      { key: 'ArrowDown', start: 0, expected: 1 },
      { key: 'ArrowUp', start: 2, expected: 1, options: { initialIndex: 2 } },
      { key: 'ArrowRight', start: 0, expected: 1 },
      { key: 'ArrowLeft', start: 2, expected: 1, options: { initialIndex: 2 } },
      { key: 'Home', start: 3, expected: 0, options: { initialIndex: 3 } },
      { key: 'End', start: 0, expected: 4 },
    ])('should move focus on $key', ({ key, start, expected, options = {} }) => {
      controller = createController(options);

      items[start].focus();
      pressKey(items[start], key);

      expect(document.activeElement).toBe(items[expected]);
      expect(items[expected].getAttribute('tabindex')).toBe('0');
    });
  });

  describe('wrapping behavior', () => {
    it.each([
      { description: 'last to first', start: 4, key: 'ArrowDown', expected: 0, options: { initialIndex: 4 } },
      { description: 'first to last', start: 0, key: 'ArrowUp', expected: 4 },
    ])('should wrap $description when wrap=true', ({ start, key, expected, options = {} }) => {
      controller = createController(options);

      items[start].focus();
      pressKey(items[start], key);

      expect(document.activeElement).toBe(items[expected]);
    });

    it('should not wrap when wrap=false', () => {
      controller = createController({ initialIndex: 4, wrap: false });

      items[4].focus();
      pressKey(items[4], 'ArrowDown');

      expect(document.activeElement).toBe(items[4]);
    });
  });

  describe('orientation', () => {
    it.each([
      {
        orientation: 'vertical' as const,
        blockedKey: 'ArrowRight',
        moveKey: 'ArrowDown',
        expectedIndex: 1,
      },
      {
        orientation: 'horizontal' as const,
        blockedKey: 'ArrowDown',
        moveKey: 'ArrowRight',
        expectedIndex: 1,
      },
    ])('should respect $orientation orientation', ({ orientation, blockedKey, moveKey, expectedIndex }) => {
      controller = createController({ orientation });

      items[0].focus();
      pressKey(items[0], blockedKey);
      expect(document.activeElement).toBe(items[0]);

      pressKey(items[0], moveKey);
      expect(document.activeElement).toBe(items[expectedIndex]);
    });

    it('should respond to both axis arrow keys when orientation="both"', () => {
      controller = createController();

      items[0].focus();
      pressKey(items[0], 'ArrowDown');
      expect(document.activeElement).toBe(items[1]);

      pressKey(items[1], 'ArrowRight');
      expect(document.activeElement).toBe(items[2]);
    });
  });

  describe('controller methods', () => {
    it('should focus specific index with focusIndex()', () => {
      controller = createController();

      controller.focusIndex(3);

      expect(document.activeElement).toBe(items[3]);
      expect(items[3].getAttribute('tabindex')).toBe('0');
    });

    it('should return current index with getCurrentIndex()', () => {
      controller = createController({ initialIndex: 2 });

      expect(controller.getCurrentIndex()).toBe(2);

      controller.focusIndex(4);
      expect(controller.getCurrentIndex()).toBe(4);
    });

    it('should refresh items with refresh()', () => {
      controller = createController({ initialIndex: 2 });

      // Add new item
      const newItem = document.createElement('button');
      newItem.textContent = 'New Item';
      container.appendChild(newItem);

      controller.refresh();

      // Move to the new item
      controller.focusIndex(5);
      expect(document.activeElement).toBe(newItem);
    });

    it('should clamp current index when items shrink on refresh', () => {
      controller = createController({ initialIndex: 4 });

      // Remove last item and refresh
      items.pop()?.remove();
      controller.refresh();

      const refreshedItems = container.querySelectorAll('button');
      expect(refreshedItems.length).toBe(4);
      expect(controller.getCurrentIndex()).toBe(3);
      expect(refreshedItems[3].getAttribute('tabindex')).toBe('0');
    });

    it('should clean up event listeners on destroy()', () => {
      controller = createController();

      controller.destroy();

      // After destroy, keyboard events should not work
      items[0].focus();
      items[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));

      // Focus should not have moved (event listener removed)
      expect(document.activeElement).toBe(items[0]);
      expect(items[0].getAttribute('tabindex')).toBe('0');
    });
  });

  describe('onFocusChange callback', () => {
    it('should call onFocusChange when focus changes', () => {
      const onFocusChange = vi.fn();

      controller = createController({ onFocusChange });

      items[0].focus();
      pressKey(items[0], 'ArrowDown');

      expect(onFocusChange).toHaveBeenCalledWith(1, items[1]);
    });

    it('should call onFocusChange with correct arguments on focusIndex()', () => {
      const onFocusChange = vi.fn();

      controller = createController({ onFocusChange });

      controller.focusIndex(3);

      expect(onFocusChange).toHaveBeenCalledWith(3, items[3]);
    });
  });

  describe('aria-activedescendant support', () => {
    it('should update aria-activedescendant on container when items have IDs', () => {
      items.forEach((item, i) => {
        item.id = `item-${i}`;
      });

      controller = createController({ useActivedescendant: true });

      items[0].focus();
      pressKey(items[0], 'ArrowDown');

      expect(container.getAttribute('aria-activedescendant')).toBe('item-1');
    });
  });

  describe('scrollIntoView behavior', () => {
    interface ScrollCase {
      description: string;
      options?: Partial<RovingTabindexOptions>;
      perform: () => HTMLElement;
    }

    const SCROLL_CASES: ScrollCase[] = [
      {
        description: 'when moving to the next item via ArrowDown',
        perform: () => {
          items[0].focus();
          pressKey(items[0], 'ArrowDown');
          return items[1];
        },
      },
      {
        description: 'when focusing a specific index via focusIndex()',
        perform: () => {
          controller!.focusIndex(3);
          return items[3];
        },
      },
      {
        description: 'when jumping to Home from index 3',
        options: { initialIndex: 3 },
        perform: () => {
          items[3].focus();
          pressKey(items[3], 'Home');
          return items[0];
        },
      },
      {
        description: 'when jumping to End from the first item',
        perform: () => {
          items[0].focus();
          pressKey(items[0], 'End');
          return items[4];
        },
      },
    ];

    it.each(SCROLL_CASES)('should call scrollIntoView %s', ({ options = {}, perform }) => {
      mockScrollIntoViewOnItems();

      controller = createController(options);

      const target = perform();

      expect(target.scrollIntoView).toHaveBeenCalledWith({
        block: 'nearest',
        inline: 'nearest',
      });
    });
  });
});
