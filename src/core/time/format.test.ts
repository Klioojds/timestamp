/**
 * Shared Format Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import { extractTimeUnitsFromSeconds, extractTimeUnitsFromMs, pluralize } from './format';

describe('Format Utilities', () => {
  describe('extractTimeUnitsFromSeconds()', () => {
    it.each([
      { seconds: 0, expected: { days: 0, hours: 0, minutes: 0, seconds: 0 } },
      { seconds: 59, expected: { days: 0, hours: 0, minutes: 0, seconds: 59 } },
      { seconds: 60, expected: { days: 0, hours: 0, minutes: 1, seconds: 0 } },
      { seconds: 3661, expected: { days: 0, hours: 1, minutes: 1, seconds: 1 } },
      { seconds: 86400, expected: { days: 1, hours: 0, minutes: 0, seconds: 0 } },
      { seconds: 90061, expected: { days: 1, hours: 1, minutes: 1, seconds: 1 } },
    ])('extracts units from $seconds seconds', ({ seconds, expected }) => {
      expect(extractTimeUnitsFromSeconds(seconds)).toEqual(expected);
    });

    it('floors float input', () => {
      expect(extractTimeUnitsFromSeconds(3661.9)).toEqual({
        days: 0, hours: 1, minutes: 1, seconds: 1,
      });
    });

    it('clamps negative to zero', () => {
      expect(extractTimeUnitsFromSeconds(-100)).toEqual({
        days: 0, hours: 0, minutes: 0, seconds: 0,
      });
    });
  });

  describe('extractTimeUnitsFromMs()', () => {
    it.each([
      { ms: 3_661_000, description: 'whole seconds' },
      { ms: 3_661_999, description: 'partial seconds' },
    ])('converts milliseconds to units for $description', ({ ms }) => {
      expect(extractTimeUnitsFromMs(ms)).toEqual({
        days: 0, hours: 1, minutes: 1, seconds: 1,
      });
    });
  });

  describe('pluralize()', () => {
    it.each([
      [0, 'day', '0 days'],
      [1, 'day', '1 day'],
      [2, 'day', '2 days'],
      [1, 'hour', '1 hour'],
      [5, 'minute', '5 minutes'],
      [1, 'second', '1 second'],
    ])('pluralize(%d, "%s") → "%s"', (value, singular, expected) => {
      expect(pluralize(value, singular)).toBe(expected);
    });
  });
});
