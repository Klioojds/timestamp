/**
 * Tests for DOM Write Guards
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { setTextIfChanged, setHiddenIfChanged } from './dom-guards';

describe('setTextIfChanged', () => {
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement('div');
    element.textContent = 'initial';
  });

  describe('when element exists', () => {
    it.each([
      { next: 'new value', description: 'new value differs' },
      { next: '05', description: 'from empty string', mutateInitial: '' },
      { next: '', description: 'to empty string' },
    ])('updates text when $description', ({ next, mutateInitial }) => {
      if (mutateInitial !== undefined) {
        element.textContent = mutateInitial;
      }

      const result = setTextIfChanged(element, next);

      expect(result).toBe(true);
      expect(element.textContent).toBe(next);
    });

    it('returns false when value is the same', () => {
      const result = setTextIfChanged(element, 'initial');

      expect(result).toBe(false);
      expect(element.textContent).toBe('initial');
    });
  });

  describe('SSR safety (null elements)', () => {
    it('returns false for null element', () => {
      const result = setTextIfChanged(null, 'value');

      expect(result).toBe(false);
    });

    it('does not throw for null element', () => {
      expect(() => setTextIfChanged(null, 'value')).not.toThrow();
    });
  });
});

describe('setHiddenIfChanged', () => {
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement('div');
    element.hidden = false;
  });

  describe('when element exists', () => {
    it('hides element when shouldHide is true', () => {
      const result = setHiddenIfChanged(element, true);

      expect(result).toBe(true);
      expect(element.hidden).toBe(true);
    });

    it('shows element when shouldHide is false', () => {
      element.hidden = true;
      const result = setHiddenIfChanged(element, false);

      expect(result).toBe(true);
      expect(element.hidden).toBe(false);
    });

    it('returns false when hidden state is the same (hidden)', () => {
      element.hidden = true;
      const result = setHiddenIfChanged(element, true);

      expect(result).toBe(false);
      expect(element.hidden).toBe(true);
    });

    it('returns false when hidden state is the same (visible)', () => {
      const result = setHiddenIfChanged(element, false);

      expect(result).toBe(false);
      expect(element.hidden).toBe(false);
    });
  });

  describe('SSR safety (null elements)', () => {
    it('returns false for null element', () => {
      const result = setHiddenIfChanged(null, true);

      expect(result).toBe(false);
    });

    it('does not throw for null element', () => {
      expect(() => setHiddenIfChanged(null, true)).not.toThrow();
    });
  });
});
