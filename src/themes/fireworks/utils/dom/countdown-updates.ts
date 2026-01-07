/**
 * Countdown Display Updates
 *
 * Updates countdown time values and handles visibility of time units.
 */

import { padTimeUnit } from '@core/time/time';
import { setHiddenIfChanged, setTextIfChanged } from '@themes/shared/dom-guards';

/**
 * Cached DOM element references for countdown updates.
 *
 * @remarks
 * Eliminates repeated querySelector calls during each updateTime tick.
 * Created during mount, nullified during destroy.
 */
export interface CountdownDOMRefs {
  /** Days time unit container. */
  daysUnit: HTMLElement;
  /** Hours time unit container. */
  hoursUnit: HTMLElement;
  /** Minutes value span. */
  minsValue: HTMLElement;
  /** Seconds value span. */
  secsValue: HTMLElement;
  /** Separator before days unit. */
  daysSep: HTMLElement;
  /** Separator before hours unit. */
  hoursSep: HTMLElement;
  /** Countdown display container. */
  countdownEl: HTMLElement;
  /** Celebration message element. */
  celebrationEl: HTMLElement;
}

/**
 * Update a time unit's value and visibility.
 * @param unitElement - Time unit container element
 * @param separatorBefore - Separator element before this unit
 * @param value - Time value to display
 * @param shouldHide - Whether to hide this unit (for leading zeros)
 */
function updateTimeUnit(
  unitElement: HTMLElement | null,
  separatorBefore: HTMLElement | null,
  value: number,
  shouldHide: boolean
): void {
  setHiddenIfChanged(unitElement, shouldHide);
  setHiddenIfChanged(separatorBefore, shouldHide);

  if (!shouldHide && unitElement) {
    const valueEl = unitElement.querySelector('.value') as HTMLElement | null;
    setTextIfChanged(valueEl, padTimeUnit(value));
  }
}

/**
 * Update countdown display with new time values.
 *
 * Hides leading zero units (days, hours) for cleaner display. Minutes and seconds
 * are always visible regardless of value.
 *
 * @param refs - Cached DOM element references
 * @param days - Days remaining
 * @param hours - Hours remaining
 * @param minutes - Minutes remaining
 * @param seconds - Seconds remaining
 */
export function updateCountdown(
  refs: CountdownDOMRefs,
  days: number,
  hours: number,
  minutes: number,
  seconds: number
): void {
  // Always update minutes and seconds
  setTextIfChanged(refs.minsValue, padTimeUnit(minutes));
  setTextIfChanged(refs.secsValue, padTimeUnit(seconds));

  // Hide days if zero
  updateTimeUnit(refs.daysUnit, refs.daysSep, days, days === 0);

  // Hide hours if both days and hours are zero
  updateTimeUnit(refs.hoursUnit, refs.hoursSep, hours, days === 0 && hours === 0);
}

/**
 * Show celebration message with given text.
 * @param refs - Cached DOM element references
 * @param message - Celebration message to display
 */
export function showCelebration(refs: CountdownDOMRefs, message: string): void {
  refs.countdownEl.hidden = true;
  refs.celebrationEl.textContent = message;
  refs.celebrationEl.hidden = false;
}

/**
 * Hide celebration message and show countdown.
 * @param refs - Cached DOM element references
 */
export function showCountdown(refs: CountdownDOMRefs): void {
  refs.countdownEl.hidden = false;
  refs.celebrationEl.hidden = true;
}
