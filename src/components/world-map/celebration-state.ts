/**
 * Helpers for applying celebration-related UI state to city markers.
 */
import type { CityMarker } from '@/app/data/cities';

/** Apply celebration state and ARIA labels to marker button. */
export function applyCelebrationState(
  marker: HTMLButtonElement,
  city: CityMarker,
  isCelebrating: boolean
): void {
  marker.setAttribute('data-celebrating', isCelebrating.toString());

  if (isCelebrating) {
    marker.classList.add('city-celebrated');
    marker.setAttribute('aria-label', `${city.name} - ${city.timezone} — celebrated`);
  } else {
    marker.classList.remove('city-celebrated');
    marker.setAttribute('aria-label', `${city.name} - ${city.timezone}`);
  }
}
