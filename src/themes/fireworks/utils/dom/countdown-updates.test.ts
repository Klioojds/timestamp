import { describe, expect, it, beforeEach } from 'vitest';
import {
  updateCountdown,
  showCelebration,
  showCountdown,
  type CountdownDOMRefs,
} from './countdown-updates';

function createCountdownContainer(): { root: HTMLElement; refs: CountdownDOMRefs } {
  const root = document.createElement('div');
  const countdown = document.createElement('div');
  countdown.className = 'countdown-display';
  root.appendChild(countdown);

  const createUnit = (testId: string, label: string): HTMLElement => {
    const unit = document.createElement('div');
    unit.className = 'time-unit';
    unit.setAttribute('data-testid', testId);

    const value = document.createElement('span');
    value.className = 'value';
    value.textContent = '00';

    const labelEl = document.createElement('span');
    labelEl.className = 'label';
    labelEl.textContent = label;

    unit.appendChild(value);
    unit.appendChild(labelEl);
    return unit;
  };

  const days = createUnit('countdown-days', 'DAYS');
  const hours = createUnit('countdown-hours', 'HOURS');
  const minutes = createUnit('countdown-minutes', 'MINS');
  const seconds = createUnit('countdown-seconds', 'SECS');

  const createSeparator = (): HTMLElement => {
    const sep = document.createElement('span');
    sep.className = 'separator';
    sep.textContent = ':';
    return sep;
  };

  const daysSep = createSeparator();
  const hoursSep = createSeparator();

  countdown.appendChild(days);
  countdown.appendChild(daysSep);
  countdown.appendChild(hours);
  countdown.appendChild(hoursSep);
  countdown.appendChild(minutes);
  countdown.appendChild(createSeparator());
  countdown.appendChild(seconds);

  const celebration = document.createElement('p');
  celebration.className = 'celebration-message';
  celebration.setAttribute('data-testid', 'celebration-message');
  celebration.hidden = true;
  countdown.after(celebration);

  const refs: CountdownDOMRefs = {
    daysUnit: days,
    hoursUnit: hours,
    minsValue: minutes.querySelector('.value') as HTMLElement,
    secsValue: seconds.querySelector('.value') as HTMLElement,
    daysSep,
    hoursSep,
    countdownEl: countdown,
    celebrationEl: celebration,
  };

  return { root, refs };
}

describe('updateCountdown', () => {
  let root: HTMLElement;
  let refs: CountdownDOMRefs;

  beforeEach(() => {
    ({ root, refs } = createCountdownContainer());
  });

  it('should update minutes and seconds with padded values', () => {
    updateCountdown(refs, 0, 0, 5, 9);

    expect(refs.minsValue.textContent).toBe('05');
    expect(refs.secsValue.textContent).toBe('09');
  });

  it.each([
    {
      scenario: 'days and hours are non-zero',
      input: { days: 2, hours: 3, minutes: 10, seconds: 11 },
      expectedHidden: { days: false, hours: false, daysSep: false, hoursSep: false },
    },
    {
      scenario: 'days are zero but hours remain',
      input: { days: 0, hours: 4, minutes: 8, seconds: 12 },
      expectedHidden: { days: true, hours: false, daysSep: true, hoursSep: false },
    },
    {
      scenario: 'days and hours are zero',
      input: { days: 0, hours: 0, minutes: 7, seconds: 3 },
      expectedHidden: { days: true, hours: true, daysSep: true, hoursSep: true },
    },
  ])('should set visibility when $scenario', ({ input, expectedHidden }) => {
    updateCountdown(refs, input.days, input.hours, input.minutes, input.seconds);

    expect(refs.daysUnit.hidden).toBe(expectedHidden.days);
    expect(refs.hoursUnit.hidden).toBe(expectedHidden.hours);
    expect(refs.daysSep.hidden).toBe(expectedHidden.daysSep);
    expect(refs.hoursSep.hidden).toBe(expectedHidden.hoursSep);
  });
});

describe('celebration visibility', () => {
  let refs: CountdownDOMRefs;

  beforeEach(() => {
    ({ refs } = createCountdownContainer());
  });

  it('should show celebration message and hide countdown', () => {
    showCelebration(refs, 'Boom!');

    expect(refs.countdownEl.hidden).toBe(true);
    expect(refs.celebrationEl.hidden).toBe(false);
    expect(refs.celebrationEl.textContent).toBe('Boom!');
  });

  it('should hide celebration message and show countdown', () => {
    showCelebration(refs, 'Boom!');
    showCountdown(refs);

    expect(refs.countdownEl.hidden).toBe(false);
    expect(refs.celebrationEl.hidden).toBe(true);
  });
});
