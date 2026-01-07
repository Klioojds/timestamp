/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initializeTargetDate } from './countdown-target-calculator';
import type { CountdownConfig, WallClockTime } from '@core/types';
import { convertWallClockToAbsolute, createNextOccurrence } from '@core/time/wall-clock-conversion';
import { getModeConfig } from '@core/config/mode-config';

vi.mock('@core/config/mode-config', () => ({
  getModeConfig: vi.fn((mode: string) => ({
    isAbsolute: mode === 'absolute',
  })),
}));

vi.mock('@core/time/wall-clock-conversion', () => ({
  convertWallClockToAbsolute: vi.fn((target: WallClockTime, _timezone: string) =>
    new Date(Date.UTC(
      target.year,
      target.month,
      target.day,
      target.hours,
      target.minutes,
      target.seconds
    ))
  ),
  createNextOccurrence: vi.fn((month: number, day: number) => ({
    year: 2026,
    month,
    day,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })),
}));

describe('initializeTargetDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-06T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('returns existing target date for timer configs', () => {
    const targetDate = new Date('2026-02-01T00:00:00Z');
    const config: CountdownConfig = {
      mode: 'timer',
      targetDate,
      durationSeconds: 120,
    } as CountdownConfig;

    const result = initializeTargetDate(config, 'UTC', true);

    expect(result.targetDate.getTime()).toBe(targetDate.getTime());
    expect(result.wallClockTarget).toBeNull();
  });

  it('calculates target date from duration when timer target date missing', () => {
    const config: CountdownConfig = {
      mode: 'timer',
      durationSeconds: 180,
    } as CountdownConfig;

    const result = initializeTargetDate(config, 'UTC', true);

    expect(result.targetDate.getTime()).toBe(new Date('2026-01-06T00:03:00Z').getTime());
    expect(result.wallClockTarget).toBeNull();
  });

  it('uses explicit wall-clock target when provided', () => {
    const wallClockTarget: WallClockTime = {
      year: 2026,
      month: 0,
      day: 1,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
    const config: CountdownConfig = {
      mode: 'wall-clock',
      wallClockTarget,
    } as CountdownConfig;

    const result = initializeTargetDate(config, 'America/New_York', false);

    expect(convertWallClockToAbsolute).toHaveBeenCalledWith(wallClockTarget, 'America/New_York');
    expect(result.wallClockTarget).toEqual(wallClockTarget);
    expect(result.targetDate instanceof Date).toBe(true);
  });

  it('preserves absolute target date for absolute mode', () => {
    const absoluteDate = new Date('2026-03-01T12:00:00Z');
    const config: CountdownConfig = {
      mode: 'absolute',
      targetDate: absoluteDate,
    } as CountdownConfig;

    const result = initializeTargetDate(config, 'UTC', false);

    expect(getModeConfig).toHaveBeenCalledWith('absolute');
    expect(result.targetDate.getTime()).toBe(absoluteDate.getTime());
    expect(result.wallClockTarget).toBeNull();
  });

  it('converts legacy wall-clock configs without explicit wallClockTarget', () => {
    const legacyDate = new Date('2026-05-10T15:00:00Z');
    const config: CountdownConfig = {
      mode: 'wall-clock',
      targetDate: legacyDate,
    } as CountdownConfig;

    const result = initializeTargetDate(config, 'Europe/London', false);

    const expectedWallClock = {
      year: legacyDate.getFullYear(),
      month: legacyDate.getMonth(),
      day: legacyDate.getDate(),
      hours: legacyDate.getHours(),
      minutes: legacyDate.getMinutes(),
      seconds: legacyDate.getSeconds(),
    };

    expect(result.wallClockTarget).toEqual(expectedWallClock);
    expect(convertWallClockToAbsolute).toHaveBeenCalledWith(expectedWallClock, 'Europe/London');
  });

  it('falls back to default new year occurrence when config missing', () => {
    const result = initializeTargetDate(undefined, 'UTC', false);

    expect(createNextOccurrence).toHaveBeenCalledWith(0, 1);
    expect(result.wallClockTarget).toEqual({
      year: 2026,
      month: 0,
      day: 1,
      hours: 0,
      minutes: 0,
      seconds: 0,
    });
    expect(convertWallClockToAbsolute).toHaveBeenCalledWith(result.wallClockTarget, 'UTC');
  });
});
