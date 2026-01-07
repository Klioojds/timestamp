import { describe, expect, it } from 'vitest';
import * as barrel from './index';
import * as digits from './digit-renderer';
import * as celebration from './celebration-renderer';
import * as layout from './text-layout';

/** Tests for text rendering barrel exports. */
describe('text-rendering/index barrel', () => {
  it('should re-export digit and celebration renderers when importing the barrel', () => {
    expect(barrel.renderDigits).toBe(digits.renderDigits);
    expect(barrel.renderCelebrationText).toBe(celebration.renderCelebrationText);
    expect(barrel.clearCelebrationText).toBe(celebration.clearCelebrationText);
  });

  it('should re-export layout helpers and constants when accessed through the barrel', () => {
    expect(barrel.wrapWords).toBe(layout.wrapWords);
    expect(barrel.calculateDigitLineWidth).toBe(layout.calculateDigitLineWidth);
    expect(barrel.BOUNDING_BOX_MARGIN).toBe(layout.BOUNDING_BOX_MARGIN);
  });
});