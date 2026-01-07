import { describe, it, expect } from 'vitest';
import type { CountdownMode } from '@core/types';
import {
  MODE_CONFIG,
  getModeConfig,
  shouldShowTimezoneSwitcherOnCountdown,
  shouldIncludeTimezoneInUrl,
  worldMapAvailableForMode,
  getAllModeConfigs,
} from './mode-config';

describe('MODE_CONFIG', () => {
  describe('derived properties', () => {
    const modes: CountdownMode[] = ['timer', 'absolute', 'wall-clock'];

    it.each(modes)('should derive worldMapAvailable from timezone relevance for %s', mode => {
      const config = getModeConfig(mode);
      expect(config.worldMapAvailable).toBe(config.timezoneRelevantDuringCountdown);
    });

    it.each(modes)('should derive hasDateInput from isDurationBased for %s', mode => {
      const config = getModeConfig(mode);
      expect(config.hasDateInput).toBe(!config.isDurationBased);
    });
  });

  describe('mode identity properties', () => {
    it.each([
      { mode: 'timer', flags: { isDurationBased: true, isWallClock: false, isAbsolute: false } },
      { mode: 'absolute', flags: { isDurationBased: false, isWallClock: false, isAbsolute: true } },
      { mode: 'wall-clock', flags: { isDurationBased: false, isWallClock: true, isAbsolute: false } },
    ])('should set identity flags for $mode', ({ mode, flags }) => {
      const config = getModeConfig(mode as CountdownMode);
      expect(config.isDurationBased).toBe(flags.isDurationBased);
      expect(config.isWallClock).toBe(flags.isWallClock);
      expect(config.isAbsolute).toBe(flags.isAbsolute);
      expect([config.isDurationBased, config.isWallClock, config.isAbsolute].filter(Boolean).length).toBe(1);
    });
  });

  describe('mode metadata', () => {
    it.each([
      {
        mode: 'wall-clock' as CountdownMode,
        expected: {
          timezoneRelevantDuringConfiguration: true,
          timezoneRelevantDuringCountdown: true,
          worldMapAvailable: true,
          displayName: 'Local Time',
          subtitle: 'Wall clock',
          icon: '🏠',
          description: "Per timezone, e.g. New Year's Eve",
          startButtonText: 'Start Countdown',
        },
      },
      {
        mode: 'absolute' as CountdownMode,
        expected: {
          timezoneRelevantDuringConfiguration: true,
          timezoneRelevantDuringCountdown: false,
          worldMapAvailable: false,
          displayName: 'Same Moment',
          subtitle: 'Absolute time',
          icon: '🌐',
          description: 'One instant, e.g. product launch',
          startButtonText: 'Start Countdown',
        },
      },
      {
        mode: 'timer' as CountdownMode,
        expected: {
          timezoneRelevantDuringConfiguration: false,
          timezoneRelevantDuringCountdown: false,
          worldMapAvailable: false,
          displayName: 'Timer',
          subtitle: 'Your countdown',
          icon: '⏱️',
          description: 'Fixed duration countdown',
          startButtonText: 'Start Timer',
        },
      },
    ])('should expose correct metadata for $mode mode', ({ mode, expected }) => {
      const config = getModeConfig(mode);

      expect(config.timezoneRelevantDuringConfiguration).toBe(expected.timezoneRelevantDuringConfiguration);
      expect(config.timezoneRelevantDuringCountdown).toBe(expected.timezoneRelevantDuringCountdown);
      expect(config.worldMapAvailable).toBe(expected.worldMapAvailable);
      expect(config.displayName).toBe(expected.displayName);
      expect(config.subtitle).toBe(expected.subtitle);
      expect(config.icon).toBe(expected.icon);
      expect(config.description).toBe(expected.description);
      expect(config.startButtonText).toBe(expected.startButtonText);
    });
  });
});

describe('helper functions', () => {
  describe('shouldShowTimezoneSwitcherOnCountdown', () => {
      it.each([
        { mode: 'timer', expected: false },
        { mode: 'absolute', expected: false },
        { mode: 'wall-clock', expected: true },
      ])('should return $expected for $mode', ({ mode, expected }) => {
        expect(shouldShowTimezoneSwitcherOnCountdown(mode as CountdownMode)).toBe(expected);
      });
  });

  describe('shouldIncludeTimezoneInUrl', () => {
      it.each([
        { mode: 'timer', expected: false },
        { mode: 'absolute', expected: false },
        { mode: 'wall-clock', expected: true },
      ])('should return $expected for $mode', ({ mode, expected }) => {
        expect(shouldIncludeTimezoneInUrl(mode as CountdownMode)).toBe(expected);
      });
  });

  describe('worldMapAvailableForMode', () => {
      it.each([
        { mode: 'timer', override: undefined, expected: false },
        { mode: 'absolute', override: undefined, expected: false },
        { mode: 'wall-clock', override: undefined, expected: true },
        { mode: 'wall-clock', override: false, expected: false },
        { mode: 'wall-clock', override: true, expected: true },
      ])('should return $expected for $mode with override=$override', ({ mode, override, expected }) => {
        expect(worldMapAvailableForMode(mode as CountdownMode, override)).toBe(expected);
      });
  });

  describe('getAllModeConfigs', () => {
    it('should return all modes in display order', () => {
      const configs = getAllModeConfigs();
      expect(configs).toHaveLength(3);
      expect(configs[0].mode).toBe('wall-clock');
      expect(configs[1].mode).toBe('absolute');
      expect(configs[2].mode).toBe('timer');
    });
  });
});
