/**
 * Focus Trap Utility Tests
 * Verifies focus trapping behavior for modal dialogs following accessibility patterns.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createFocusTrap,
  type FocusTrapController,
} from './focus-trap';

/**
 * Create a mock MouseEvent with a specified target element.
 * jsdom doesn't properly set event.target, so we need to define it.
 */
function createMockMouseEvent(target: Element): MouseEvent {
  const event = new MouseEvent('mousedown', { bubbles: true });
  Object.defineProperty(event, 'target', { value: target });
  return event;
}

describe('createFocusTrap', () => {
  let container: HTMLElement;
  let button1: HTMLButtonElement;
  let button2: HTMLButtonElement;
  let input: HTMLInputElement;
  let controller: FocusTrapController | null;

  const activateTrap = (options: Parameters<typeof createFocusTrap>[0] = { container }) => {
    controller = createFocusTrap({ container, ...options });
    controller.activate();
    return controller;
  };

  const createOutsideButton = () => {
    const outsideButton = document.createElement('button');
    document.body.appendChild(outsideButton);
    return outsideButton;
  };

  const dispatchKey = (target: HTMLElement, key: string, init: KeyboardEventInit = {}) =>
    target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...init }));

  beforeEach(() => {
    container = document.createElement('div');
    container.setAttribute('role', 'dialog');
    container.setAttribute('aria-modal', 'true');
    document.body.appendChild(container);

    // Create focusable elements
    button1 = document.createElement('button');
    button1.textContent = 'First Button';
    container.appendChild(button1);

    input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Input';
    container.appendChild(input);

    button2 = document.createElement('button');
    button2.textContent = 'Last Button';
    container.appendChild(button2);
  });

  afterEach(() => {
    controller?.deactivate();
    controller = null;
    container.remove();
    vi.restoreAllMocks();
  });

  describe('activation', () => {
    it('should call focus on the first focusable element on activate', () => {
      const focusSpy = vi.spyOn(button1, 'focus');
      
      activateTrap();

      expect(focusSpy).toHaveBeenCalled();
    });

    it('should call focus on specified initialFocus element', () => {
      const focusSpy = vi.spyOn(input, 'focus');
      
      activateTrap({ container, initialFocus: input });

      expect(focusSpy).toHaveBeenCalled();
    });

    it('should handle container with no focusable elements', () => {
      container.innerHTML = '<div>No focusable content</div>';

      controller = createFocusTrap({ container });
      
      expect(() => controller!.activate()).not.toThrow();
    });
  });

  describe('focus trap behavior', () => {
    it('should wrap focus from last to first on Tab when at last element', () => {
      activateTrap();

      // Simulate being on the last element
      button2.focus();
      
      const focusSpy = vi.spyOn(button1, 'focus');
      
      dispatchKey(container, 'Tab');

      expect(focusSpy).toHaveBeenCalled();
    });

    it('should wrap focus from first to last on Shift+Tab when at first element', () => {
      activateTrap();

      // Simulate being on the first element
      button1.focus();
      
      const focusSpy = vi.spyOn(button2, 'focus');
      
      dispatchKey(container, 'Tab', { shiftKey: true });

      expect(focusSpy).toHaveBeenCalled();
    });

    it('should not wrap focus when Tab between middle elements', () => {
      activateTrap();

      input.focus();
      
      const firstFocusSpy = vi.spyOn(button1, 'focus');
      const lastFocusSpy = vi.spyOn(button2, 'focus');
      
      dispatchKey(container, 'Tab');

      // Neither first nor last should be forcibly focused
      expect(firstFocusSpy).not.toHaveBeenCalled();
      expect(lastFocusSpy).not.toHaveBeenCalled();
    });
  });

  describe('Escape key handling', () => {
    it('should call onEscape when Escape is pressed', () => {
      const onEscape = vi.fn();
      activateTrap({ container, onEscape });

      dispatchKey(container, 'Escape');

      expect(onEscape).toHaveBeenCalledTimes(1);
    });

    it('should not call onEscape when Escape is pressed and escapeDeactivates=false', () => {
      const onEscape = vi.fn();
      activateTrap({ container, onEscape, escapeDeactivates: false });

      dispatchKey(container, 'Escape');

      expect(onEscape).not.toHaveBeenCalled();
    });
  });

  describe('click outside handling', () => {
    it('should call onClickOutside when clicking outside the container', () => {
      const onClickOutside = vi.fn();
      activateTrap({ container, onClickOutside });

      // Create and click an outside element
      const outsideEl = document.createElement('div');
      document.body.appendChild(outsideEl);
      
      document.dispatchEvent(createMockMouseEvent(outsideEl));

      expect(onClickOutside).toHaveBeenCalledTimes(1);
      outsideEl.remove();
    });

    it('should not call onClickOutside when clicking inside the container', () => {
      const onClickOutside = vi.fn();
      activateTrap({ container, onClickOutside });

      document.dispatchEvent(createMockMouseEvent(button1));

      expect(onClickOutside).not.toHaveBeenCalled();
    });

    it('should not call onClickOutside when clickOutsideDeactivates=false', () => {
      const onClickOutside = vi.fn();
      activateTrap({ container, onClickOutside, clickOutsideDeactivates: false });

      const outsideEl = document.createElement('div');
      document.body.appendChild(outsideEl);
      
      document.dispatchEvent(createMockMouseEvent(outsideEl));

      expect(onClickOutside).not.toHaveBeenCalled();
      outsideEl.remove();
    });
  });

  describe('deactivation', () => {
    it('should restore focus to previously focused element on deactivate', () => {
      const outsideButton = createOutsideButton();
      outsideButton.focus();

      const focusSpy = vi.spyOn(outsideButton, 'focus');

      const trap = activateTrap();
      trap.deactivate();

      expect(focusSpy).toHaveBeenCalled();
      outsideButton.remove();
    });

    it('should not restore focus when returnFocusOnDeactivate=false', () => {
      const outsideButton = createOutsideButton();
      outsideButton.focus();

      const focusSpy = vi.spyOn(outsideButton, 'focus');

      const trap = activateTrap({ container, returnFocusOnDeactivate: false });
      
      // Clear spy calls from before
      focusSpy.mockClear();
      
      trap.deactivate();

      // Focus should not be called on the outside button
      expect(focusSpy).not.toHaveBeenCalled();
      outsideButton.remove();
    });

    it('should remove event listeners on deactivate', () => {
      const onEscape = vi.fn();
      const trap = activateTrap({ container, onEscape });
      trap.deactivate();

      // Pressing Escape after deactivation should not trigger callback
      dispatchKey(container, 'Escape');

      expect(onEscape).not.toHaveBeenCalled();
    });

    it('should handle multiple activate/deactivate cycles', () => {
      const button1FocusSpy = vi.spyOn(button1, 'focus');
      
      activateTrap();
      expect(button1FocusSpy).toHaveBeenCalled();
      
      button1FocusSpy.mockClear();

      controller.deactivate();
      
      controller.activate();
      expect(button1FocusSpy).toHaveBeenCalled();

      controller.deactivate();
    });
  });

  describe('getFocusableElements', () => {
    it('should exclude disabled elements', () => {
      button1.disabled = true;

      const focusSpy = vi.spyOn(input, 'focus');
      
      activateTrap();

      // First focusable should now be the input (button1 is disabled)
      expect(focusSpy).toHaveBeenCalled();
    });

    it('should exclude hidden elements', () => {
      button1.hidden = true;

      const focusSpy = vi.spyOn(input, 'focus');
      
      activateTrap();

      // First focusable should now be the input (button1 is hidden)
      expect(focusSpy).toHaveBeenCalled();
    });

    it('should exclude elements with tabindex="-1"', () => {
      button1.setAttribute('tabindex', '-1');

      const focusSpy = vi.spyOn(input, 'focus');
      
      activateTrap();

      // First focusable should now be the input
      expect(focusSpy).toHaveBeenCalled();
    });
  });

  describe('isActive', () => {
    it('should return true when trap is active', () => {
      controller = createFocusTrap({ container });
      
      expect(controller.isActive()).toBe(false);
      
      controller.activate();
      expect(controller.isActive()).toBe(true);
      
      controller.deactivate();
      expect(controller.isActive()).toBe(false);
    });
  });
});
