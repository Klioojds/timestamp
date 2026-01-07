/**
 * Text layout utilities for pixel-art rendering.
 *
 * Shared utilities for calculating text dimensions and positioning
 * used by both digit and celebration renderers.
 */

import {
  BOUNDING_BOX_MARGIN,
  CHAR_SPACING,
  LINE_SPACING,
} from '../../../config';
import { DIGIT_WIDTH } from '../patterns';

/** Word spacing for celebration text. */
export const WORD_SPACING = 5;

// Re-export layout constants from config for convenience
export { BOUNDING_BOX_MARGIN,CHAR_SPACING, LINE_SPACING };

/** Calculate the rendered width of a line containing digits and colons. */
export function calculateDigitLineWidth(str: string, digitWidth: number = DIGIT_WIDTH): number {
  let width = 0;
  for (const char of str) {
    width += (char === ':' ? 3 : digitWidth) + CHAR_SPACING;
  }
  return width - CHAR_SPACING;
}

/** Calculate width of a single word in grid columns (no spaces). */
export function wordWidth(word: string): number {
  if (word.length === 0) return 0;
  return word.length * DIGIT_WIDTH + (word.length - 1) * CHAR_SPACING;
}

/** Calculate rendered width of a line with spaces (spaces use WORD_SPACING, chars use DIGIT_WIDTH). */
export function celebrationLineWidth(text: string): number {
  if (text.length === 0) return 0;

  let width = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === ' ') {
      width += WORD_SPACING;
    } else {
      width += DIGIT_WIDTH;
      if (i < text.length - 1 && text[i + 1] !== ' ') {
        width += CHAR_SPACING;
      }
    }
  }
  return width;
}

/** Clean message for pixel rendering: uppercase, alphanumeric + space + punctuation. */
export function cleanMessage(message: string): string {
  const stripped = message.replace(/[^\x20-\x7E]/g, '');
  return stripped.toUpperCase();
}

/** Split message into lines that fit within available columns. Best-effort for oversized words. */
export function wrapWords(message: string, maxCols: number, padding: number): string[] {
  const words = message.split(/\s+/).filter((w) => w.length > 0);
  const availableCols = maxCols - padding * 2;
  const lines: string[] = [];
  let currentLine = '';
  let currentWidth = 0;

  for (const word of words) {
    const wWidth = wordWidth(word);

    // Word too long even alone? Add on its own line (will overflow but best effort)
    if (wWidth > availableCols) {
      if (currentLine) {
        lines.push(currentLine.trim());
        currentLine = '';
        currentWidth = 0;
      }
      lines.push(word);
      continue;
    }

    const separator = currentLine ? WORD_SPACING : 0;
    const newWidth = currentWidth + separator + wWidth;

    if (newWidth <= availableCols) {
      currentLine = currentLine ? `${currentLine} ${word}` : word;
      currentWidth = newWidth;
    } else {
      if (currentLine) {
        lines.push(currentLine.trim());
      }
      currentLine = word;
      currentWidth = wWidth;
    }
  }

  if (currentLine) {
    lines.push(currentLine.trim());
  }

  return lines;
}
