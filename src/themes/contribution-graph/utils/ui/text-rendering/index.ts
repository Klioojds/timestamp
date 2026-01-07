/**
 * Text rendering utilities barrel export.
 *
 * Digit and celebration text rendering for the contribution-graph theme.
 */

export { clearCelebrationText,renderCelebrationText } from './celebration-renderer';
export { renderDigits } from './digit-renderer';
export {
  BOUNDING_BOX_MARGIN,
  calculateDigitLineWidth,
  celebrationLineWidth,
  CHAR_SPACING,
  cleanMessage,
  LINE_SPACING,
  WORD_SPACING,
  wordWidth,
  wrapWords,
} from './text-layout';
