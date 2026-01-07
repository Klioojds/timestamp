/**
 * Unit tests for color mode toggle component.
 * 
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const systemSubscribers: Array<() => void> = [];
const unsubscribeSpy = vi.fn();

vi.mock('@core/preferences/color-mode', async () => {
  const actual = await vi.importActual<typeof import('@core/preferences/color-mode')>(
    '@core/preferences/color-mode'
  );

  return {
    ...actual,
    subscribeToSystemMode: vi.fn((callback: () => void) => {
      systemSubscribers.push(callback);
      return () => {
        unsubscribeSpy();
        const index = systemSubscribers.indexOf(callback);
        if (index !== -1) {
          systemSubscribers.splice(index, 1);
        }
      };
    }),
  };
});

import {
  createColorModeToggle,
  destroyColorModeToggle,
  COLOR_MODE_CHANGE_EVENT,
  type ColorModeChangeDetail,
} from './color-mode-toggle';
import {
  getColorModePreference,
  setColorModePreference,
} from '@core/preferences/color-mode';
import type { ColorMode } from '@core/types';

const renderToggle = (attachToDom = false): HTMLElement => {
  const element = createColorModeToggle();
  if (attachToDom) {
    document.body.appendChild(element);
  }
  return element;
};

const getButton = (element: HTMLElement, mode: ColorMode): HTMLElement => {
  const button = element.querySelector(`[data-mode="${mode}"]`);
  if (!button) {
    throw new Error(`Expected button for mode ${mode}`);
  }
  return button as HTMLElement;
};

const dispatchKeydown = (radioGroup: HTMLElement, target: HTMLElement, key: string): void => {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
  });

  Object.defineProperty(event, 'target', { value: target, writable: false });
  radioGroup.dispatchEvent(event);
};

describe('color-mode-toggle', () => {
  let toggle: HTMLElement;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset to default 'system' mode
    setColorModePreference('system');
    systemSubscribers.length = 0;
    unsubscribeSpy.mockClear();
  });

  afterEach(() => {
    if (toggle) {
      destroyColorModeToggle(toggle);
    }
  });

  describe('createColorModeToggle', () => {
    it('should create toggle with correct structure', () => {
      toggle = renderToggle();

      expect(toggle.className).toBe('color-mode-toggle');

      const radioGroup = toggle.querySelector('.color-mode-toggle-group');
      expect(radioGroup).toBeTruthy();
      expect(radioGroup?.getAttribute('role')).toBe('radiogroup');
      expect(radioGroup?.getAttribute('aria-label')).toBe('Color mode');

      // Should have 3 radio buttons (light, dark, system)
      const buttons = toggle.querySelectorAll('.color-mode-toggle-option');
      expect(buttons).toHaveLength(3);
    });

    it('should render light, dark, and system options', () => {
      toggle = renderToggle();

      const lightButton = getButton(toggle, 'light');
      const darkButton = getButton(toggle, 'dark');
      const systemButton = getButton(toggle, 'system');

      expect(lightButton).toBeTruthy();
      expect(darkButton).toBeTruthy();
      expect(systemButton).toBeTruthy();

      // Check labels
      expect(lightButton?.textContent).toContain('Light');
      expect(darkButton?.textContent).toContain('Dark');
      expect(systemButton?.textContent).toContain('System');

      // Check icons are rendered as SVGs
      const icons = toggle.querySelectorAll('.color-mode-toggle-icon');
      expect(icons).toHaveLength(3);
      icons.forEach((icon) => {
        expect(icon.tagName.toLowerCase()).toBe('svg');
      });
    });

    it('should reflect current preference on mount', () => {
      setColorModePreference('dark');

      toggle = renderToggle();

      const darkButton = getButton(toggle, 'dark');
      expect(darkButton?.getAttribute('aria-checked')).toBe('true');
      expect(darkButton?.classList.contains('color-mode-toggle-option--selected')).toBe(true);

      const lightButton = getButton(toggle, 'light');
      expect(lightButton?.getAttribute('aria-checked')).toBe('false');
      expect(lightButton?.classList.contains('color-mode-toggle-option--selected')).toBe(false);
    });

    it('should have correct ARIA attributes', () => {
      toggle = renderToggle();

      const buttons = toggle.querySelectorAll('.color-mode-toggle-option');
      buttons.forEach((button) => {
        expect(button.getAttribute('role')).toBe('radio');
        expect(button.getAttribute('aria-label')).toBeTruthy();
        expect(button.getAttribute('aria-checked')).toMatch(/^(true|false)$/);
      });
    });
  });

  describe('mode selection', () => {
    it('should change preference on click', () => {
      toggle = renderToggle();

      const darkButton = getButton(toggle, 'dark');
      darkButton.click();

      expect(getColorModePreference()).toBe('dark');
    });

    it('should dispatch custom event on mode change', () => {
      toggle = renderToggle();

      const eventHandler = vi.fn((event: Event) => {
        const customEvent = event as CustomEvent<ColorModeChangeDetail>;
        expect(customEvent.detail.mode).toBe('light');
      });

      toggle.addEventListener(COLOR_MODE_CHANGE_EVENT, eventHandler);

      const lightButton = getButton(toggle, 'light');
      lightButton.click();

      expect(eventHandler).toHaveBeenCalledOnce();
    });

    it('should update UI when mode changes', () => {
      toggle = renderToggle();

      const darkButton = getButton(toggle, 'dark');
      const systemButton = getButton(toggle, 'system');

      // Initially system is selected
      expect(systemButton.getAttribute('aria-checked')).toBe('true');
      expect(darkButton.getAttribute('aria-checked')).toBe('false');

      // Click dark
      darkButton.click();

      expect(darkButton.getAttribute('aria-checked')).toBe('true');
      expect(darkButton.classList.contains('color-mode-toggle-option--selected')).toBe(true);
      expect(systemButton.getAttribute('aria-checked')).toBe('false');
      expect(systemButton.classList.contains('color-mode-toggle-option--selected')).toBe(false);
    });

    it('should change mode on Enter key', () => {
      toggle = renderToggle();

      const radioGroup = toggle.querySelector('.color-mode-toggle-group') as HTMLElement;
      const lightButton = getButton(toggle, 'light');

      dispatchKeydown(radioGroup, lightButton, 'Enter');

      expect(getColorModePreference()).toBe('light');
    });

    it('should change mode on Space key', () => {
      toggle = renderToggle();

      const radioGroup = toggle.querySelector('.color-mode-toggle-group') as HTMLElement;
      const darkButton = getButton(toggle, 'dark');

      dispatchKeydown(radioGroup, darkButton, ' ');

      expect(getColorModePreference()).toBe('dark');
    });
  });

  describe('keyboard navigation', () => {
    it.each([
      { key: 'ArrowRight', current: 'light', expected: 'dark' },
      { key: 'ArrowDown', current: 'light', expected: 'dark' },
      { key: 'ArrowLeft', current: 'dark', expected: 'light' },
      { key: 'ArrowUp', current: 'dark', expected: 'light' },
    ])('should move focus from $current to $expected with $key', ({ key, current, expected }) => {
      toggle = renderToggle(true);

      const radioGroup = toggle.querySelector('.color-mode-toggle-group') as HTMLElement;
      const currentButton = getButton(toggle, current as ColorMode);
      const expectedButton = getButton(toggle, expected as ColorMode);

      const focusSpy = vi.spyOn(expectedButton, 'focus');

      dispatchKeydown(radioGroup, currentButton, key);

      expect(focusSpy).toHaveBeenCalled();
    });

    it.each([
      { key: 'ArrowRight', current: 'system', expected: 'light' },
      { key: 'ArrowLeft', current: 'light', expected: 'system' },
    ])('should wrap from $current to $expected with $key', ({ key, current, expected }) => {
      toggle = renderToggle(true);

      const radioGroup = toggle.querySelector('.color-mode-toggle-group') as HTMLElement;
      const currentButton = getButton(toggle, current as ColorMode);
      const expectedButton = getButton(toggle, expected as ColorMode);

      const focusSpy = vi.spyOn(expectedButton, 'focus');

      dispatchKeydown(radioGroup, currentButton, key);

      expect(focusSpy).toHaveBeenCalled();
    });

    it('should have tabindex="0" on checked button and "-1" on others (roving tabindex)', () => {
      setColorModePreference('dark');
      toggle = renderToggle();

      const lightButton = getButton(toggle, 'light');
      const darkButton = getButton(toggle, 'dark');
      const systemButton = getButton(toggle, 'system');

      expect(lightButton.getAttribute('tabindex')).toBe('-1');
      expect(darkButton.getAttribute('tabindex')).toBe('0'); // checked
      expect(systemButton.getAttribute('tabindex')).toBe('-1');
    });

    it('should update roving tabindex when selection changes', () => {
      setColorModePreference('light');
      toggle = renderToggle();

      const lightButton = getButton(toggle, 'light');
      const darkButton = getButton(toggle, 'dark');

      expect(lightButton.getAttribute('tabindex')).toBe('0');
      expect(darkButton.getAttribute('tabindex')).toBe('-1');

      // Change to dark mode
      darkButton.click();

      expect(lightButton.getAttribute('tabindex')).toBe('-1');
      expect(darkButton.getAttribute('tabindex')).toBe('0');
    });

    it('should be keyboard focusable on checked button', () => {
      setColorModePreference('system');
      toggle = renderToggle(true);

      const systemButton = getButton(toggle, 'system');
      
      // Simulate Tab key focusing the button
      systemButton.focus();
      
      expect(document.activeElement).toBe(systemButton);
    });
  });

  describe('system mode subscription', () => {
    it('should dispatch event when system mode changes while preference is system', () => {
      setColorModePreference('system');
      toggle = renderToggle();

      const eventHandler = vi.fn();
      toggle.addEventListener(COLOR_MODE_CHANGE_EVENT, eventHandler);

      systemSubscribers.forEach((callback) => callback());

      expect(eventHandler).toHaveBeenCalled();
    });

    it('should not dispatch system event when preference is user-selected', () => {
      setColorModePreference('dark');
      toggle = renderToggle();

      const eventHandler = vi.fn();
      toggle.addEventListener(COLOR_MODE_CHANGE_EVENT, eventHandler);

      systemSubscribers.forEach((callback) => callback());

      expect(eventHandler).not.toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should remove element on destroy', () => {
      toggle = renderToggle(true);

      expect(document.body.contains(toggle)).toBe(true);

      destroyColorModeToggle(toggle);

      expect(document.body.contains(toggle)).toBe(false);
    });

    it('should clean up event listeners on destroy', () => {
      toggle = renderToggle(true);

      // Verify toggle is in DOM before destroy
      expect(document.body.contains(toggle)).toBe(true);

      // Destroy should remove element and clean up
      destroyColorModeToggle(toggle);

      // Element should be removed
      expect(document.body.contains(toggle)).toBe(false);

      // Calling destroy again should be safe (no-op)
      expect(() => destroyColorModeToggle(toggle)).not.toThrow();
    });

    it('should unsubscribe system listener on destroy', () => {
      toggle = renderToggle(true);

      destroyColorModeToggle(toggle);

      expect(unsubscribeSpy).toHaveBeenCalled();
      expect(systemSubscribers.length).toBe(0);
    });
  });
});
