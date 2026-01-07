import { describe, expect, it } from 'vitest';

import { IntensityLevel } from './index';

describe('fireworks types', () => {
  it.each(Object.entries(IntensityLevel))('should mirror key and value for %s when exported', (key, value) => {
    expect(value).toBe(key);
  });
});
