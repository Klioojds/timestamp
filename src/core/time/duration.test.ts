/**
 * Duration Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import {
  coerceFieldsToSeconds,
  formatDuration,
  parseDurationParam,
} from './duration';
import { MAX_DURATION_SECONDS } from '@core/config/constants';

describe('Duration Utilities', () => {
  describe('coerceFieldsToSeconds()', () => {
    describe('coercion and sanitization', () => {
      it.each([
        { desc: 'convert 75 minutes', input: [0, 75, 0], expected: 4500 },
        { desc: 'convert 2173 minutes', input: [0, 2173, 0], expected: 130380 },
        { desc: 'coerce string inputs', input: ['1', '30', '45'], expected: 5445 },
        { desc: 'coerce numeric inputs', input: [1, 30, 45], expected: 5445 },
        { desc: 'coerce mixed inputs', input: ['2', 15, '30'], expected: 8130 },
        { desc: 'floor float hours', input: [1.5, 0, 0], expected: 3600 },
        { desc: 'floor string float minutes', input: [0, '2.7', 0], expected: 120 },
        { desc: 'negative numeric → 0', input: [-5, 0, 0], expected: 0 },
        { desc: 'negative string → 0', input: ['0', '-10', '0'], expected: 0 },
        { desc: 'empty strings → 0', input: ['', '', ''], expected: 0 },
        { desc: 'whitespace strings → 0', input: ['  ', '  ', '  '], expected: 0 },
        { desc: 'non-numeric strings → 0', input: ['abc', 'xyz', '123'], expected: 123 },
        { desc: 'trim whitespace', input: [' 1 ', ' 30 ', ' 45 '], expected: 5445 },
      ])('$desc', ({ input, expected }) => {
        const [h, m, s] = input;
        const result = coerceFieldsToSeconds(h, m, s);
        expect(result.totalSeconds).toBe(expected);
        expect(result.exceedsMax).toBe(false);
      });
    });

    describe('maximum bounds', () => {
      it.each([
        { desc: 'exactly 365 days', input: [8760, 0, 0], exceedsMax: false },
        { desc: '365 days + 1 second', input: [8760, 0, 1], exceedsMax: true },
        { desc: 'very large hours', input: [100000, 0, 0], exceedsMax: true },
      ])('$desc', ({ input, exceedsMax }) => {
        const [h, m, s] = input;
        const result = coerceFieldsToSeconds(h, m, s);
        expect(result.totalSeconds).toBe(MAX_DURATION_SECONDS);
        expect(result.exceedsMax).toBe(exceedsMax);
      });
    });

    describe('overflow safety', () => {
      it.each([
        { desc: 'MAX_SAFE_INTEGER hours', input: [Number.MAX_SAFE_INTEGER, 0, 0] },
        { desc: 'multiple huge values', input: [999999999, 999999999, 999999999] },
      ])('$desc', ({ input }) => {
        const [h, m, s] = input;
        const result = coerceFieldsToSeconds(h, m, s);
        expect(result.totalSeconds).toBe(MAX_DURATION_SECONDS);
        expect(result.exceedsMax).toBe(true);
        expect(Number.isSafeInteger(result.totalSeconds)).toBe(true);
      });
    });
  });

  describe('parseDurationParam()', () => {
    describe('valid inputs', () => {
      it.each([
        ['300', 300],
        ['31536000', 31536000],
        ['  300  ', 300],
        ['300.7', 300],
        ['1', 1],
      ])('parses "%s" → %d', (input, expected) => {
        expect(parseDurationParam(input)).toBe(expected);
      });
    });

    describe('invalid inputs', () => {
      it.each(['31536001', '-5', '0', 'abc', '', '   '])(
        'returns null for "%s"',
        (input) => {
          expect(parseDurationParam(input)).toBeNull();
        }
      );
    });

    it('round-trips URL serialization', () => {
      expect(parseDurationParam('4500')).toBe(4500);
      expect(parseDurationParam('4500.9')).toBe(4500);
    });
  });

  describe('formatDuration()', () => {
    describe('short style', () => {
      it.each([
        [130380, '1d 12h 13m 0s'],
        [4500, '1h 15m 0s'],
        [300, '5m 0s'],
        [45, '45s'],
        [0, '0s'],
        [86700, '1d 0h 5m 0s'],
        [3600, '1h 0m 0s'],
      ])('formats %d → "%s"', (seconds, expected) => {
        expect(formatDuration(seconds, 'short')).toBe(expected);
      });
    });

    describe('long style', () => {
      it.each([
        [86400, '1 day'],
        [172800, '2 days'],
        [3600, '1 hour'],
        [7200, '2 hours'],
        [60, '1 minute'],
        [120, '2 minutes'],
        [1, '1 second'],
        [2, '2 seconds'],
        [3661, '1 hour 1 minute 1 second'],
        [7322, '2 hours 2 minutes 2 seconds'],
        [86700, '1 day 5 minutes'],
        [0, '0 seconds'],
      ])('formats %d → "%s"', (seconds, expected) => {
        expect(formatDuration(seconds, 'long')).toBe(expected);
      });
    });

    it('defaults to short style', () => {
      expect(formatDuration(4500)).toBe('1h 15m 0s');
    });
  });
});
