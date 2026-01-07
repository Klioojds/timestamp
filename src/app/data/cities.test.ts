/** City Marker Data and Helper Tests */

import { describe, it, expect } from 'vitest';
import {
  FEATURED_CITIES,
  findCityByTimezone,
  getCityPositionPercent,
  type CityMarker,
} from './cities';

describe('FEATURED_CITIES', () => {
  it('should contain multiple cities', () => {
    expect(FEATURED_CITIES.length).toBeGreaterThan(0);
  });

  it('should have required properties for each city', () => {
    FEATURED_CITIES.forEach((city) => {
      expect(city).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          timezone: expect.any(String),
          lat: expect.any(Number),
          lng: expect.any(Number),
          utcOffset: expect.any(Number),
        })
      );
    });
  });

  it.each([
    ['timezone identifiers contain / or are UTC', (city: CityMarker) => city.timezone === 'UTC' || city.timezone.includes('/')],
    ['latitude stays within [-90, 90]', (city: CityMarker) => city.lat >= -90 && city.lat <= 90],
    ['longitude stays within [-180, 180]', (city: CityMarker) => city.lng >= -180 && city.lng <= 180],
  ])('should ensure %s', (_description, predicate) => {
    FEATURED_CITIES.forEach((city) => {
      expect(predicate(city)).toBe(true);
    });
  });
});

describe('findCityByTimezone', () => {
  it.each([
    { timezone: 'America/New_York', expectedId: 'nyc' },
    { timezone: 'Europe/London', expectedId: 'london' },
    { timezone: 'Asia/Tokyo', expectedId: 'tokyo' },
    { timezone: 'Pacific/Auckland', expectedId: 'auckland' },
    { timezone: 'UTC', expectedId: 'utc' },
  ])('should find $expectedId for timezone $timezone', ({ timezone, expectedId }) => {
    const result = findCityByTimezone(timezone);
    expect(result).toBeDefined();
    expect(result?.id).toBe(expectedId);
  });

  it('should return undefined for unknown timezone', () => {
    expect(findCityByTimezone('Unknown/Timezone')).toBeUndefined();
  });
});

describe('getCityPositionPercent', () => {
  it('should return percentage coordinates between 0 and 100', () => {
    const london = findCityByTimezone('Europe/London')!;
    const result = getCityPositionPercent(london);
    expect(result.x).toBeGreaterThanOrEqual(0);
    expect(result.x).toBeLessThanOrEqual(100);
    expect(result.y).toBeGreaterThanOrEqual(0);
    expect(result.y).toBeLessThanOrEqual(100);
  });

  it('should place Sydney in eastern/southern quadrant', () => {
    const sydney = findCityByTimezone('Australia/Sydney')!;
    const result = getCityPositionPercent(sydney);
    expect(result.x).toBeGreaterThan(80); // Eastern
    expect(result.y).toBeGreaterThan(50); // Southern
  });

  it('should place NYC in western/northern quadrant', () => {
    const nyc = findCityByTimezone('America/New_York')!;
    const result = getCityPositionPercent(nyc);
    expect(result.x).toBeLessThan(50); // Western
    expect(result.y).toBeLessThan(50); // Northern
  });
});
