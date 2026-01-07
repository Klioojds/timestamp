import { describe, it, expect } from 'vitest';
import {
  DATA_VALUE_ATTRIBUTE,
  DROPDOWN_OPTION_SELECTOR,
  EMPTY_STATE_MESSAGE,
  GROUP_LABELS,
  GROUP_RENDER_ORDER,
} from './constants';

describe('timezone-selector/constants', () => {
  it('should expose stable selectors and data attributes', () => {
    expect(DROPDOWN_OPTION_SELECTOR).toBe('.dropdown-option');
    expect(DATA_VALUE_ATTRIBUTE).toBe('data-value');
  });

  it('should define group labels for all render order keys', () => {
    expect(Object.keys(GROUP_LABELS)).toEqual([...GROUP_RENDER_ORDER]);
    expect(GROUP_LABELS.celebrating).toContain('Celebrating');
    expect(GROUP_LABELS.userZone).toContain('Timezone');
  });

  it('should render groups in deterministic order', () => {
    expect(GROUP_RENDER_ORDER).toEqual([
      'celebrating',
      'userZone',
      'featured',
      'others',
    ]);
  });

  it('should provide an empty state message', () => {
    expect(EMPTY_STATE_MESSAGE).toBe('No timezones found');
  });
});
