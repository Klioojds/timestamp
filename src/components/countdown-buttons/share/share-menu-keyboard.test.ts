/**
 * Keyboard handlers for share menu
 * Unit tests for navigation and trigger key handling.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  handleButtonKeydown,
  handleMenuKeydown,
  isInMobileMenu,
  updateMobileContext,
  type MenuKeyboardCallbacks,
  type MenuKeyboardState,
} from './share-menu-keyboard';

function createMenuState(): { state: MenuKeyboardState; callbacks: MenuKeyboardCallbacks; buttons: HTMLButtonElement[] } {
  const buttons = [0, 1, 2].map(() => document.createElement('button'));
  buttons.forEach((button) => document.body.appendChild(button));
  const state: MenuKeyboardState = {
    currentFocusedIndex: 0,
    menuItems: buttons,
    isOpen: true,
  };

  return {
    state,
    buttons,
    callbacks: {
      openMenu: vi.fn(),
      closeMenu: vi.fn(),
      setFocusedIndex: vi.fn((index: number) => {
        state.currentFocusedIndex = index;
      }),
    },
  };
}

describe('share-menu-keyboard', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('handleMenuKeydown', () => {
    it('should cycle focus with ArrowDown/ArrowUp and Home/End', () => {
      const { state, callbacks, buttons } = createMenuState();

      handleMenuKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }), state, callbacks);
      expect(state.currentFocusedIndex).toBe(1);
      expect(document.activeElement).toBe(buttons[1]);

      handleMenuKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }), state, callbacks);
      expect(state.currentFocusedIndex).toBe(2);
      expect(document.activeElement).toBe(buttons[2]);

      handleMenuKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }), state, callbacks);
      expect(state.currentFocusedIndex).toBe(0);
      expect(document.activeElement).toBe(buttons[0]);

      handleMenuKeydown(new KeyboardEvent('keydown', { key: 'ArrowUp' }), state, callbacks);
      expect(state.currentFocusedIndex).toBe(2);
      expect(document.activeElement).toBe(buttons[2]);

      handleMenuKeydown(new KeyboardEvent('keydown', { key: 'Home' }), state, callbacks);
      expect(state.currentFocusedIndex).toBe(0);
      expect(document.activeElement).toBe(buttons[0]);

      handleMenuKeydown(new KeyboardEvent('keydown', { key: 'End' }), state, callbacks);
      expect(state.currentFocusedIndex).toBe(2);
      expect(document.activeElement).toBe(buttons[2]);
    });
  });

  describe('handleButtonKeydown', () => {
    it('should open menu on ArrowDown/Enter/Space when closed', () => {
      const state: MenuKeyboardState = {
        currentFocusedIndex: 0,
        menuItems: [],
        isOpen: false,
      };
      const callbacks: MenuKeyboardCallbacks = {
        openMenu: vi.fn(),
        closeMenu: vi.fn(),
        setFocusedIndex: vi.fn(),
      };

      ['ArrowDown', 'Enter', ' '].forEach((key) => {
        callbacks.openMenu.mockClear();
        handleButtonKeydown(new KeyboardEvent('keydown', { key }), state, callbacks);
        expect(callbacks.openMenu).toHaveBeenCalledTimes(1);
      });
    });

    it('should close menu on Escape when open', () => {
      const state: MenuKeyboardState = {
        currentFocusedIndex: 0,
        menuItems: [],
        isOpen: true,
      };
      const callbacks: MenuKeyboardCallbacks = {
        openMenu: vi.fn(),
        closeMenu: vi.fn(),
        setFocusedIndex: vi.fn(),
      };

      handleButtonKeydown(new KeyboardEvent('keydown', { key: 'Escape' }), state, callbacks);
      expect(callbacks.closeMenu).toHaveBeenCalledTimes(1);
    });
  });

  describe('mobile context helpers', () => {
    it('should detect mobile menu ancestry', () => {
      const wrapper = document.createElement('div');
      wrapper.className = 'mobile-menu-actions';
      const container = document.createElement('div');
      wrapper.appendChild(container);
      document.body.appendChild(wrapper);

      expect(isInMobileMenu(container)).toBe(true);
    });

    it('should set tab indices to 0 inside mobile menu and -1 when closed on desktop', () => {
      const wrapper = document.createElement('div');
      wrapper.className = 'mobile-menu-actions';
      const container = document.createElement('div');
      wrapper.appendChild(container);
      document.body.appendChild(wrapper);

      const items = [0, 1, 2].map(() => document.createElement('button'));

      updateMobileContext(container, items, false);
      expect(items.every((item) => item.tabIndex === 0)).toBe(true);

      document.body.removeChild(wrapper);
      document.body.appendChild(container);
      updateMobileContext(container, items, false);
      expect(items.every((item) => item.tabIndex === -1)).toBe(true);

      items.forEach((item) => (item.tabIndex = 5));
      updateMobileContext(container, items, true);
      expect(items.every((item) => item.tabIndex === 5)).toBe(true);
    });
  });
});
