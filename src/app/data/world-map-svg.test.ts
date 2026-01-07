import { describe, it, expect } from 'vitest';
import { MAP_VIEWBOX, latLngToSvg } from './world-map-svg';

const { width, height } = MAP_VIEWBOX;

describe('latLngToSvg', () => {
  it('places equator and prime meridian at the center of the viewBox', () => {
    const result = latLngToSvg(0, 0);

    expect(result.x).toBeCloseTo(width / 2, 5);
    expect(result.y).toBeCloseTo(height / 2, 5);
  });

  it.each([
    { lat: 90, lng: -180, expected: { x: 0, y: 0 } },
    { lat: -90, lng: 180, expected: { x: width, y: height } },
    { lat: 0, lng: -180, expected: { x: 0, y: height / 2 } },
    { lat: 0, lng: 180, expected: { x: width, y: height / 2 } },
  ])('maps lat=$lat lng=$lng to viewBox edges', ({ lat, lng, expected }) => {
    const result = latLngToSvg(lat, lng);

    expect(result.x).toBeCloseTo(expected.x, 5);
    expect(result.y).toBeCloseTo(expected.y, 5);
  });

  it('returns coordinates within the viewBox for typical city coordinates', () => {
    const result = latLngToSvg(37.7749, -122.4194); // San Francisco

    expect(result.x).toBeGreaterThanOrEqual(0);
    expect(result.x).toBeLessThanOrEqual(width);
    expect(result.y).toBeGreaterThanOrEqual(0);
    expect(result.y).toBeLessThanOrEqual(height);
  });
});
