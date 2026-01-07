import { describe, it, expect, beforeEach } from 'vitest';
import {
  setDataAttribute,
  removeDataAttribute,
  getDataAttribute,
  hasDataAttribute,
} from './data-attributes';

describe('data-attributes', () => {
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement('div');
  });

  describe('setDataAttribute', () => {
    it('should set string value', () => {
      setDataAttribute(element, 'theme', 'fireworks');
      expect(element.getAttribute('data-theme')).toBe('fireworks');
    });

    it('should set boolean value as string', () => {
      setDataAttribute(element, 'celebrating', true);
      expect(element.getAttribute('data-celebrating')).toBe('true');
      
      setDataAttribute(element, 'celebrating', false);
      expect(element.getAttribute('data-celebrating')).toBe('false');
    });
  });

  describe('removeDataAttribute', () => {
    it('should remove attribute', () => {
      element.setAttribute('data-celebrating', 'true');
      removeDataAttribute(element, 'celebrating');
      expect(element.hasAttribute('data-celebrating')).toBe(false);
    });

    it('should not throw if attribute does not exist', () => {
      expect(() => removeDataAttribute(element, 'nonexistent')).not.toThrow();
    });
  });

  describe('getDataAttribute', () => {
    it('should return attribute value', () => {
      element.setAttribute('data-theme', 'fireworks');
      expect(getDataAttribute(element, 'theme')).toBe('fireworks');
    });

    it('should return null if attribute does not exist', () => {
      expect(getDataAttribute(element, 'theme')).toBeNull();
    });
  });

  describe('hasDataAttribute', () => {
    it('should return true if attribute exists', () => {
      element.setAttribute('data-celebrating', 'true');
      expect(hasDataAttribute(element, 'celebrating')).toBe(true);
    });

    it('should return false if attribute does not exist', () => {
      expect(hasDataAttribute(element, 'celebrating')).toBe(false);
    });
  });
});
