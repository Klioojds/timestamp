/**
 * @file drag.test.ts
 * @description Unit tests for the perf-overlay drag module
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupDragging } from './drag';

describe('Perf Overlay Drag', () => {
  let container: HTMLDivElement;
  let header: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '10px';
    container.style.right = '10px';

    header = document.createElement('div');
    container.appendChild(header);

    document.body.appendChild(container);

    // Mock getBoundingClientRect
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      top: 50,
      right: 300,
      bottom: 150,
      width: 200,
      height: 100,
      x: 100,
      y: 50,
      toJSON: () => ({}),
    });
  });

  afterEach(() => {
    container.remove();
    vi.restoreAllMocks();
  });

  describe('setupDragging', () => {
    it('should return a cleanup function', () => {
      const cleanup = setupDragging(container, header);
      expect(typeof cleanup).toBe('function');
    });

    it('should set cursor to grabbing on mousedown', () => {
      setupDragging(container, header);

      header.dispatchEvent(new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 50,
        bubbles: true,
      }));

      expect(header.style.cursor).toBe('grabbing');
    });

    it('should not start drag if clicking on a button', () => {
      const button = document.createElement('button');
      header.appendChild(button);

      setupDragging(container, header);

      // Simulate click on button
      const event = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 50,
        bubbles: true,
      });
      Object.defineProperty(event, 'target', { value: button });

      header.dispatchEvent(event);

      // Cursor should not change
      expect(header.style.cursor).not.toBe('grabbing');
    });

    it('should update container position on mousemove', () => {
      setupDragging(container, header);

      // Start drag
      header.dispatchEvent(new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 50,
        bubbles: true,
      }));

      // Move mouse
      document.dispatchEvent(new MouseEvent('mousemove', {
        clientX: 150,
        clientY: 100,
        bubbles: true,
      }));

      expect(container.style.left).toBe('150px');
      expect(container.style.top).toBe('100px');
      expect(container.style.right).toBe('auto');
    });

    it('should reset cursor on mouseup', () => {
      setupDragging(container, header);

      // Start drag
      header.dispatchEvent(new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 50,
        bubbles: true,
      }));

      expect(header.style.cursor).toBe('grabbing');

      // End drag
      document.dispatchEvent(new MouseEvent('mouseup', {
        bubbles: true,
      }));

      expect(header.style.cursor).toBe('grab');
    });

    it('should clean up event listeners on cleanup', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      const cleanup = setupDragging(container, header);
      cleanup();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));
    });
  });
});
