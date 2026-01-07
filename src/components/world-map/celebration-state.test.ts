import { describe, it, expect } from 'vitest';
import { applyCelebrationState } from './celebration-state';
import type { CityMarker } from '@/app/data/cities';

describe('world-map/celebration-state', () => {
  const city: CityMarker = {
    id: 'test-city',
    name: 'Test City',
    timezone: 'Etc/UTC',
    lat: 0,
    lng: 0,
    utcOffset: 0,
  };

  it('should apply celebrating attributes and aria label', () => {
    const marker = document.createElement('button');

    applyCelebrationState(marker, city, true);

    expect(marker.getAttribute('data-celebrating')).toBe('true');
    expect(marker.classList.contains('city-celebrated')).toBe(true);
    expect(marker.getAttribute('aria-label')).toContain('— celebrated');
  });

  it('should remove celebrating state when false', () => {
    const marker = document.createElement('button');
    marker.classList.add('city-celebrated');

    applyCelebrationState(marker, city, false);

    expect(marker.getAttribute('data-celebrating')).toBe('false');
    expect(marker.classList.contains('city-celebrated')).toBe(false);
    expect(marker.getAttribute('aria-label')).toBe('Test City - Etc/UTC');
  });
});
