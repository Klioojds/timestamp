/** City marker data and helpers for timezone selection. */

import { latLngToSvg, MAP_VIEWBOX } from './world-map-svg';

export interface CityMarker {
  id: string;
  name: string;
  timezone: string;
  lat: number;
  lng: number;
  utcOffset: number;
}

/** Featured cities ordered by UTC offset (first to celebrate → last). */
export const FEATURED_CITIES: CityMarker[] = [
  { id: 'auckland', name: 'Auckland', timezone: 'Pacific/Auckland', lat: -36.85, lng: 174.76, utcOffset: 13 },
  { id: 'sydney', name: 'Sydney', timezone: 'Australia/Sydney', lat: -33.87, lng: 151.21, utcOffset: 11 },
  { id: 'tokyo', name: 'Tokyo', timezone: 'Asia/Tokyo', lat: 35.68, lng: 139.69, utcOffset: 9 },
  { id: 'shanghai', name: 'Shanghai', timezone: 'Asia/Shanghai', lat: 31.23, lng: 121.47, utcOffset: 8 },
  { id: 'dubai', name: 'Dubai', timezone: 'Asia/Dubai', lat: 25.20, lng: 55.27, utcOffset: 4 },
  { id: 'paris', name: 'Paris', timezone: 'Europe/Paris', lat: 48.86, lng: 2.35, utcOffset: 1 },
  { id: 'london', name: 'London', timezone: 'Europe/London', lat: 51.51, lng: -0.13, utcOffset: 0 },
  { id: 'utc', name: 'UTC', timezone: 'UTC', lat: 0, lng: 0, utcOffset: 0 },
  { id: 'nyc', name: 'New York', timezone: 'America/New_York', lat: 40.71, lng: -74.01, utcOffset: -5 },
  { id: 'chicago', name: 'Chicago', timezone: 'America/Chicago', lat: 41.88, lng: -87.63, utcOffset: -6 },
  { id: 'la', name: 'Los Angeles', timezone: 'America/Los_Angeles', lat: 34.05, lng: -118.24, utcOffset: -8 },
];

export function findCityByTimezone(timezone: string): CityMarker | undefined {
  return FEATURED_CITIES.find((city) => city.timezone === timezone);
}

export function getCityPositionPercent(city: CityMarker): { x: number; y: number } {
  const svgPos = latLngToSvg(city.lat, city.lng);
  return {
    x: (svgPos.x / MAP_VIEWBOX.width) * 100,
    y: (svgPos.y / MAP_VIEWBOX.height) * 100,
  };
}
