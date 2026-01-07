import { describe, expect, it } from 'vitest';
import {
  BOUNDING_BOX_MARGIN,
  CHAR_SPACING,
  LINE_SPACING,
  WORD_SPACING,
  calculateDigitLineWidth,
  celebrationLineWidth,
  cleanMessage,
  wrapWords,
  wordWidth,
} from './text-layout';

/** Tests for pixel text layout helpers. */
describe('text-layout', () => {
  it.each([
    { text: '0', expected: 5 },
    { text: '12', expected: 11 },
    { text: '12:34', expected: 27 },
    { text: '1:2:3', expected: 25 },
  ])('should calculate digit line width when measuring "$text"', ({ text, expected }) => {
    expect(calculateDigitLineWidth(text)).toBe(expected);
  });

  it.each([
    { word: '', expected: 0 },
    { word: 'A', expected: 5 },
    { word: 'HELLO', expected: 5 * 5 + CHAR_SPACING * 4 },
  ])('should measure word width when evaluating "$word"', ({ word, expected }) => {
    expect(wordWidth(word)).toBe(expected);
  });

  it.each([
    { text: '', expected: 0 },
    { text: 'HI', expected: 5 + CHAR_SPACING + 5 },
    { text: 'HI THERE', expected: 45 },
  ])('should calculate celebration line width when measuring "$text"', ({ text, expected }) => {
    expect(celebrationLineWidth(text)).toBe(expected);
  });

  it('should clean message when input contains non-ascii characters', () => {
    expect(cleanMessage('Hello 😊')).toBe('HELLO ');
    expect(cleanMessage('ok')).toBe('OK');
  });

  it.each([
    {
      title: 'should keep words on one line when space allows',
      message: 'HELLO WORLD',
      maxCols: 40,
      padding: 2,
      expected: ['HELLO', 'WORLD'],
    },
    {
      title: 'should wrap to new line when width exceeded',
      message: 'HELLO WORLD AGAIN',
      maxCols: 20,
      padding: 2,
      expected: ['HELLO', 'WORLD', 'AGAIN'],
    },
    {
      title: 'should place oversized word on its own line',
      message: 'SUPERCALIFRAGILISTIC',
      maxCols: 10,
      padding: 1,
      expected: ['SUPERCALIFRAGILISTIC'],
    },
  ])('$title', ({ message, maxCols, padding, expected }) => {
    expect(wrapWords(message, maxCols, padding)).toEqual(expected);
  });

  it('should expose constants for other modules when imported', () => {
    expect(BOUNDING_BOX_MARGIN).toBeDefined();
    expect(LINE_SPACING).toBeGreaterThan(0);
    expect(CHAR_SPACING).toBeGreaterThan(0);
  });
});