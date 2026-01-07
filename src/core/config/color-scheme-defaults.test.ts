import { describe, it, expect } from 'vitest';

import { COLOR_SCHEME_DEFAULTS, COLOR_VARIABLE_MAP } from './color-scheme-defaults';

describe('color-scheme-defaults', () => {
  it('provides a complete and frozen variable map', () => {
    expect(COLOR_VARIABLE_MAP).toHaveLength(16);
    expect(Object.isFrozen(COLOR_VARIABLE_MAP)).toBe(true);
  });

  it('exposes immutable light and dark defaults', () => {
    expect(Object.isFrozen(COLOR_SCHEME_DEFAULTS)).toBe(true);
    expect(Object.isFrozen(COLOR_SCHEME_DEFAULTS.dark)).toBe(true);
    expect(Object.isFrozen(COLOR_SCHEME_DEFAULTS.light)).toBe(true);

    expect(COLOR_SCHEME_DEFAULTS.dark.focusRing).toBe('#58a6ff');
    expect(COLOR_SCHEME_DEFAULTS.light.background).toBe('#ffffff');
  });

  it('prevents mutation of color values', () => {
    expect(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (COLOR_SCHEME_DEFAULTS.dark as any).background = '#000000';
    }).toThrow(TypeError);
  });
});