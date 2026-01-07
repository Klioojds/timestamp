/**
 * Timezone Selector Event Handlers Tests
 * Tests for keyboard navigation and user interactions.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  attachOptionClickHandlers,
  setupEventListeners,
} from './event-handlers';

// Mock roving tabindex
vi.mock('../../core/utils/accessibility/roving-tabindex', () => ({
  createRovingTabindex: vi.fn(() => ({
    focusIndex: vi.fn(),
    getCurrentIndex: vi.fn(() => 0),
    refresh: vi.fn(),
    destroy: vi.fn(),
  })),
}));

describe('Timezone Selector Event Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('attachOptionClickHandlers', () => {
    it('should attach click handlers to all options', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <button class="dropdown-option" data-value="tz1">Option 1</button>
        <button class="dropdown-option" data-value="tz2">Option 2</button>
      `;
      const onSelect = vi.fn();

      attachOptionClickHandlers(container, onSelect);

      const options = container.querySelectorAll('.dropdown-option');
      (options[0] as HTMLButtonElement).click();
      expect(onSelect).toHaveBeenCalledWith('tz1');

      (options[1] as HTMLButtonElement).click();
      expect(onSelect).toHaveBeenCalledWith('tz2');
    });
  });

  describe('setupEventListeners', () => {
    it('should return controller with cleanup methods', () => {
      const elements = {
        wrapper: document.createElement('div'),
        trigger: document.createElement('button'),
        dropdown: document.createElement('div'),
        searchInput: document.createElement('input'),
        listContainer: document.createElement('div'),
      };

      const callbacks = {
        onTriggerClick: vi.fn(),
        onTriggerKeydown: vi.fn(),
        onSearchInput: vi.fn(),
        onSearchKeydown: vi.fn(),
        onOptionClick: vi.fn(),
        onOutsideClick: vi.fn(),
        onEscape: vi.fn(),
        onFocusChange: vi.fn(),
      };

      const controller = setupEventListeners(elements, callbacks);

      expect(controller).toHaveProperty('initRovingTabindex');
      expect(controller).toHaveProperty('destroyRovingTabindex');
      expect(controller).toHaveProperty('focusIndex');
      expect(controller).toHaveProperty('destroy');

      // Should not throw when destroyed
      expect(() => controller.destroy()).not.toThrow();
    });

    it('should attach trigger click handler', () => {
      const elements = {
        wrapper: document.createElement('div'),
        trigger: document.createElement('button'),
        dropdown: document.createElement('div'),
        searchInput: document.createElement('input'),
        listContainer: document.createElement('div'),
      };

      const callbacks = {
        onTriggerClick: vi.fn(),
        onTriggerKeydown: vi.fn(),
        onSearchInput: vi.fn(),
        onSearchKeydown: vi.fn(),
        onOptionClick: vi.fn(),
        onOutsideClick: vi.fn(),
        onEscape: vi.fn(),
        onFocusChange: vi.fn(),
      };

      setupEventListeners(elements, callbacks);

      elements.trigger.click();
      expect(callbacks.onTriggerClick).toHaveBeenCalled();
    });

    it('should invoke outside/escape callbacks', () => {
      const elements = {
        wrapper: document.createElement('div'),
        trigger: document.createElement('button'),
        dropdown: document.createElement('div'),
        searchInput: document.createElement('input'),
        listContainer: document.createElement('div'),
      };

      document.body.appendChild(elements.wrapper);

      const callbacks = {
        onTriggerClick: vi.fn(),
        onTriggerKeydown: vi.fn(),
        onSearchInput: vi.fn(),
        onSearchKeydown: vi.fn(),
        onOptionClick: vi.fn(),
        onOutsideClick: vi.fn(),
        onEscape: vi.fn(),
        onFocusChange: vi.fn(),
      };

      const controller = setupEventListeners(elements, callbacks);

      document.dispatchEvent(new MouseEvent('click'));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(callbacks.onOutsideClick).toHaveBeenCalled();
      expect(callbacks.onEscape).toHaveBeenCalled();

      controller.destroy();
      elements.wrapper.remove();
    });
  });
});
