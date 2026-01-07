import { describe, it, expect } from 'vitest';

import { createIcon, getIconSvg, ICON_SIZES } from './index';

describe('icon utilities', () => {
  it('creates accessible SVG elements with sizing and classes', () => {
    const icon = createIcon({ name: 'heart', size: ICON_SIZES.LG, className: 'text-accent', label: 'Favorite' });

    expect(icon.getAttribute('width')).toBe(String(ICON_SIZES.LG));
    expect(icon.getAttribute('height')).toBe(String(ICON_SIZES.LG));
    expect(icon.getAttribute('class')).toBe('text-accent');
    expect(icon.getAttribute('aria-label')).toBe('Favorite');
    expect(icon.getAttribute('role')).toBe('img');
    expect(icon.getAttribute('fill')).toBe('currentColor');
  });

  it('returns svg markup with correct attributes', () => {
    const svgString = getIconSvg('sun', 20, 'sun-icon');

    expect(svgString).toContain('width="20"');
    expect(svgString).toContain('height="20"');
    expect(svgString).toContain('sun-icon');
    expect(svgString).toContain('aria-hidden="true"');
  });

  it('throws for unknown icon names', () => {
    expect(() => createIcon({ name: 'unknown' as never })).toThrow('Unknown icon');
  });
});