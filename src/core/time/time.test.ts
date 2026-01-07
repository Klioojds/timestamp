/**
 * Tests for time utility helpers that power countdown formatting and date calculations.
 */
import { describe, it, expect } from 'vitest';
import { withFakeNow } from '@/test-utils/time-helpers';
import {
  getTimeRemaining,
  formatCountdown,
  formatTimeRemainingCompact,
  formatTimeRemainingHuman,
  formatTimeRemainingHumanWithoutSeconds,
  createNewYearTargetDate,
  getCelebrationYear,
  isNewYearMidnight,
  padTimeUnit,
} from './time';

describe('padTimeUnit', () => {
  it.each([
    { value: 0, expected: '00', description: 'zero' },
    { value: 5, expected: '05', description: 'single digit' },
    { value: 12, expected: '12', description: 'two digits' },
    { value: 99, expected: '99', description: 'max two digits' },
    { value: 100, expected: '100', description: 'three digits (no truncation)' },
  ])('pads $description to "$expected"', ({ value, expected }) => {
    expect(padTimeUnit(value)).toBe(expected);
  });

  it.each([
    { value: -1, expected: '00', description: 'negative one' },
    { value: -100, expected: '00', description: 'large negative' },
  ])('clamps $description to "$expected"', ({ value, expected }) => {
    expect(padTimeUnit(value)).toBe(expected);
  });
});

describe('getTimeRemaining', () => {
  it('should return all time components when target is in the future', async () => {
    await withFakeNow(new Date('2024-12-30T12:00:00Z'), () => {
      const target = new Date('2025-01-01T00:00:00Z');

      const result = getTimeRemaining(target);

      expect(result.days).toBe(1);
      expect(result.hours).toBe(12);
      expect(result.minutes).toBe(0);
      expect(result.seconds).toBe(0);
      expect(result.total).toBeGreaterThan(0);
    });
  });

  it.each([
    { description: 'target is in the past', now: '2025-01-02T00:00:00Z', target: '2025-01-01T00:00:00Z' },
    { description: 'target equals current time', now: '2025-01-01T00:00:00Z', target: '2025-01-01T00:00:00Z' },
  ])('should return zeros when $description', async ({ now, target }) => {
    await withFakeNow(new Date(now), () => {
      const result = getTimeRemaining(new Date(target));

      expect(result).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
    });
  });
});

describe('formatCountdown', () => {
  it.each([
    { ms: (1 * 24 * 60 * 60 + 2 * 60 * 60 + 30 * 60 + 45) * 1000, expected: '01:02:30:45', description: '1d 2h 30m 45s' },
    { ms: (5 * 60 + 3) * 1000, expected: '00:00:05:03', description: '5m 3s (pads single digits)' },
    { ms: 0, expected: '00:00:00:00', description: 'zero' },
    { ms: -1000, expected: '00:00:00:00', description: 'negative' },
  ])(
    'should format as $expected when $description',
    ({ ms, expected }) => {
      expect(formatCountdown(ms)).toBe(expected);
    }
  );
});

describe('formatTimeRemainingCompact', () => {
  it.each([
    { time: { days: 1, hours: 2, minutes: 30, seconds: 45, total: 1000 }, expected: '01:02:30:45', description: 'days > 0' },
    { time: { days: 0, hours: 2, minutes: 30, seconds: 45, total: 1000 }, expected: '02:30:45', description: 'days = 0, hours > 0' },
    { time: { days: 0, hours: 0, minutes: 5, seconds: 3, total: 1000 }, expected: '05:03', description: 'only minutes and seconds' },
    { time: { days: 0, hours: 0, minutes: 0, seconds: 5, total: 1000 }, expected: '00:05', description: 'only seconds' },
    { time: { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 }, expected: '00:00', description: 'no remaining time' },
  ])(
    'should format as $expected when $description',
    ({ time, expected }) => {
      expect(formatTimeRemainingCompact(time)).toBe(expected);
    }
  );
});

describe('formatTimeRemainingHuman', () => {
  it.each([
    {
      time: { days: 2, hours: 5, minutes: 30, seconds: 15, total: 1000 },
      expected: '2 days, 5 hours, 30 minutes, 15 seconds',
      description: 'all components use plural forms',
    },
    {
      time: { days: 1, hours: 1, minutes: 1, seconds: 1, total: 1000 },
      expected: '1 day, 1 hour, 1 minute, 1 second',
      description: 'singular components when value is one',
    },
    {
      time: { days: 0, hours: 0, minutes: 5, seconds: 0, total: 1000 },
      expected: '5 minutes, 0 seconds',
      description: 'omits zero days and hours but keeps seconds',
    },
    {
      time: { days: 0, hours: 0, minutes: 0, seconds: 10, total: 1000 },
      expected: '10 seconds',
      description: 'shows only seconds when other units are zero',
    },
  ])('should format as $expected when $description', ({ time, expected }) => {
    expect(formatTimeRemainingHuman(time)).toBe(expected);
  });
});

describe('formatTimeRemainingHumanWithoutSeconds', () => {
  it.each([
    {
      time: { days: 2, hours: 5, minutes: 30, seconds: 15, total: 1000 },
      expected: '2 days, 5 hours, 30 minutes',
      description: 'includes days, hours, and minutes when present',
    },
    {
      time: { days: 1, hours: 1, minutes: 1, seconds: 45, total: 1000 },
      expected: '1 day, 1 hour, 1 minute',
      description: 'uses singular labels for unit value of one',
    },
    {
      time: { days: 0, hours: 0, minutes: 5, seconds: 30, total: 1000 },
      expected: '5 minutes',
      description: 'omits zero-valued days and hours',
    },
    {
      time: { days: 0, hours: 0, minutes: 0, seconds: 45, total: 1000 },
      expected: 'less than 1 minute',
      description: 'falls back to less-than-a-minute when only seconds remain',
    },
    {
      time: { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 },
      expected: 'less than 1 minute',
      description: 'falls back when total time is zero',
    },
  ])('should format as $expected when $description', ({ time, expected }) => {
    expect(formatTimeRemainingHumanWithoutSeconds(time)).toBe(expected);
  });
});

describe('createNewYearTargetDate', () => {
  it('should return January 1st of next year at midnight', async () => {
    await withFakeNow(new Date('2024-06-15T12:00:00'), () => {
      const target = createNewYearTargetDate();

      expect(target.getFullYear()).toBe(2025);
      expect(target.getMonth()).toBe(0); // January
      expect(target.getDate()).toBe(1);
      expect(target.getHours()).toBe(0);
      expect(target.getMinutes()).toBe(0);
      expect(target.getSeconds()).toBe(0);
    });
  });
});

describe('getCelebrationYear', () => {
  it.each([
    { target: new Date('2025-01-01T00:00:00'), expected: 2025, description: 'midnight target date' },
    { target: new Date('2030-06-15T12:01:00'), expected: 2030, description: 'arbitrary target date' },
  ])('should return the target year for $description', ({ target, expected }) => {
    expect(getCelebrationYear(target)).toBe(expected);
  });
});

describe('isNewYearMidnight', () => {
  it.each([
    {
      date: new Date(2026, 0, 1, 0, 0, 0, 0),
      expected: true,
      description: 'January 1st at exactly midnight',
    },
    {
      date: new Date(2025, 0, 1, 0, 0, 0, 0),
      expected: true,
      description: 'January 1st midnight in a different year',
    },
    {
      date: new Date(2030, 0, 1, 0, 0, 0, 0),
      expected: true,
      description: 'January 1st midnight far in the future',
    },
    {
      date: new Date(2000, 0, 1, 0, 0, 0, 0),
      expected: true,
      description: 'January 1st midnight in the past',
    },
    {
      date: new Date(2025, 11, 31, 23, 59, 59, 0),
      expected: false,
      description: 'one second before midnight on December 31st',
    },
    {
      date: new Date(2026, 0, 1, 12, 0, 0, 0),
      expected: false,
      description: 'January 1st at noon',
    },
    {
      date: new Date(2026, 0, 1, 0, 0, 1, 0),
      expected: false,
      description: 'January 1st one second after midnight',
    },
    {
      date: new Date(2025, 5, 15, 0, 0, 0, 0),
      expected: false,
      description: 'other date at midnight',
    },
    {
      date: new Date(2026, 0, 2, 0, 0, 0, 0),
      expected: false,
      description: 'January 2nd at midnight',
    },
    {
      date: new Date(2026, 1, 1, 0, 0, 0, 0),
      expected: false,
      description: 'February 1st at midnight',
    },
  ])('should return $expected when date is $description', ({ date, expected }) => {
    expect(isNewYearMidnight(date)).toBe(expected);
  });
});
