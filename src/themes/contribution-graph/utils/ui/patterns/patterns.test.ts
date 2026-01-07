import { describe, expect, it } from 'vitest';
import { DIGIT_HEIGHT, DIGIT_PATTERNS, DIGIT_WIDTH } from './digits';
import { LETTER_PATTERNS } from './letters';
import { PUNCTUATION_PATTERNS } from './punctuation';

describe('DIGIT_PATTERNS', () => {
  it('should have consistent dimensions for each digit and colon', () => {
    Object.entries(DIGIT_PATTERNS).forEach(([char, pattern]) => {
      expect(pattern).toHaveLength(DIGIT_HEIGHT);
      pattern.forEach((row) => expect(row).toHaveLength(DIGIT_WIDTH));
      expect(['0','1','2','3','4','5','6','7','8','9',':']).toContain(char);
    });
  });
});

describe('LETTER_PATTERNS', () => {
  it('should include 26 uppercase letters with 5x7 matrices', () => {
    expect(Object.keys(LETTER_PATTERNS)).toHaveLength(26);

    Object.entries(LETTER_PATTERNS).forEach(([letter, pattern]) => {
      expect(letter).toMatch(/^[A-Z]$/);
      expect(pattern).toHaveLength(DIGIT_HEIGHT);
      pattern.forEach((row) => expect(row).toHaveLength(DIGIT_WIDTH));
    });
  });
});

describe('PUNCTUATION_PATTERNS', () => {
  it.each(Object.entries(PUNCTUATION_PATTERNS))('should size punctuation %s to digit grid', (_, pattern) => {
    expect(pattern).toHaveLength(DIGIT_HEIGHT);
    pattern.forEach((row) => expect(row).toHaveLength(DIGIT_WIDTH));
  });
});
