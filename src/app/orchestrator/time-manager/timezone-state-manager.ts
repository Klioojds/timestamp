/**
 * Timezone State Manager - manages timezone state, celebration transitions, and URL sync.
 */

import { getModeConfig } from '@core/config/mode-config';
import { buildConfigForUrlSync } from '@core/config/url-sync-helpers';
import {
    convertWallClockToAbsolute,
    hasWallClockTimeReached,
} from '@core/time/wall-clock-conversion';
import type {
    CelebrationOptions,
    CountdownConfig,
    CountdownMode,
    ThemeId,
    TimeRemaining,
    WallClockTime,
} from '@core/types';
import { syncTimezoneToUrl } from '@core/url';
import { createAttributeCache, setAttributeIfChanged } from '@core/utils/accessibility';

import { transitionToCelebrated, transitionToCounting } from '../celebration-transitions';
import type { CelebrationDisplay } from '../types';

/** Timezone manager callbacks to orchestrator. */
export interface TimezoneManagerCallbacks {
  getCurrentTheme: () => { 
    onCelebrated?: (options: CelebrationOptions) => void;
    onCounting?: () => void;
  } | null;
  getCelebrationDisplay: (targetDate: Date) => CelebrationDisplay;
  getTargetDate: () => Date;
  setTargetDate: (date: Date) => void;
  setComplete: (isComplete: boolean) => void;
  triggerCountdownUpdate: () => void;
  getLastTime: () => TimeRemaining | null;
  isComplete: () => boolean;
  updateWorldMap: (timezone: string) => void;
}

/** Timezone manager configuration. */
export interface TimezoneManagerOptions {
  initialTimezone: string;
  /** Null for timer/absolute modes. */
  wallClockTarget: WallClockTime | null;
  mode: CountdownMode;
  getCurrentThemeId: () => ThemeId;
  config?: CountdownConfig;
  container: HTMLElement;
  stateManager: { 
    setTimezone: (tz: string) => void; 
    getCelebrationState: () => 'counting' | 'celebrating' | 'celebrated'; 
    setCelebrationState: (state: 'counting' | 'celebrating' | 'celebrated') => void; 
    markCelebrated: (tz: string) => void; 
    hasCelebrated: (tz: string) => boolean; 
    resetCelebration: () => void; 
    setComplete: (c: boolean) => void;
  };
  callbacks: TimezoneManagerCallbacks;
}

/** Timezone manager controller interface. */
export interface TimezoneManager {
  getCurrentTimezone(): string;
  setTimezone(timezone: string): void;
  getTargetDate(): Date;
  /** Null for timer/absolute modes. */
  getWallClockTarget(): WallClockTime | null;
}

/** Creates a timezone manager. */
export function createTimezoneManager(options: TimezoneManagerOptions): TimezoneManager {
  const {
    initialTimezone,
    wallClockTarget,
    mode,
    getCurrentThemeId,
    config,
    container,
    stateManager,
    callbacks,
  } = options;

  let selectedTimezone = initialTimezone;
  const modeConfig = getModeConfig(mode);

  if (modeConfig.timezoneRelevantDuringCountdown && !wallClockTarget) {
    throw new Error('Wall-clock mode requires wallClockTarget');
  }

  const ariaLabelCache = createAttributeCache();

  function updateAriaLabel(label: string): void {
    setAttributeIfChanged(container, 'aria-label', label, ariaLabelCache);
  }

  // Timer: no target change. Absolute: fixed UTC instant. Wall-clock: recalculate for new timezone.
  function handleTimezoneChange(timezone: string): void {
    if (modeConfig.isDurationBased) {
      // Timer mode: timezone has NO effect on target
      // Just update world map display
      callbacks.updateWorldMap(timezone);
      return;
    }

    if (modeConfig.isAbsolute) {
      // Absolute mode: target never changes, it's a fixed UTC moment
      // Only update world map display (no recalculation needed)
      callbacks.updateWorldMap(timezone);
      return;
    }

    // Wall-clock mode: recalculate target for new timezone
    if (!wallClockTarget) {
      throw new Error('Wall-clock mode requires wallClockTarget to be set');
    }
    handleWallClockModeTimezoneChange(timezone);
    callbacks.updateWorldMap(timezone);
  }

  function handleWallClockModeTimezoneChange(timezone: string): void {
    // Calculate when wall-clock time occurs in the new timezone
    // wallClockTarget is guaranteed non-null here (checked in handleTimezoneChange)
    const newTargetDate = convertWallClockToAbsolute(wallClockTarget!, timezone);
    callbacks.setTargetDate(newTargetDate);

    // State machine transition based on whether timezone has reached target
    if (hasWallClockTimeReached(wallClockTarget!, timezone)) {
      // Transition to CELEBRATED state (skip animation)
      const hadCelebrated = stateManager.hasCelebrated(timezone);
      transitionToCelebrated(stateManager, container, timezone);

      // Call onCelebrated hook - show end state without animation
      // Only call if this timezone hasn't already celebrated (avoids replaying)
      if (!hadCelebrated) {
        const { message, fullMessage } = callbacks.getCelebrationDisplay(newTargetDate);
        callbacks.getCurrentTheme()?.onCelebrated?.({ message, fullMessage });
      }

      // Update aria-label for completion
      updateAriaLabel('The countdown has completed.');
    } else {
      // Transition to COUNTING state - resume countdown
      const wasCelebrating = stateManager.getCelebrationState() !== 'counting';
      transitionToCounting(stateManager, container);

      // Call onCounting hook to reset celebration UI
      if (wasCelebrating) {
        callbacks.getCurrentTheme()?.onCounting?.();
      }
    }
  }

  return {
    getCurrentTimezone(): string {
      return selectedTimezone;
    },

    setTimezone(timezone: string): void {
      selectedTimezone = timezone;
      stateManager.setTimezone(timezone);

      handleTimezoneChange(timezone);

      // PERF: replaceState avoids history bloat
      if (config) {
        const updatedConfig: CountdownConfig = buildConfigForUrlSync(config, {
          theme: getCurrentThemeId(),
          timezone,
        });
        syncTimezoneToUrl(timezone, updatedConfig);
      }

      callbacks.triggerCountdownUpdate();

      if (!callbacks.isComplete()) {
        const lastTime = callbacks.getLastTime();
        if (lastTime) {
          updateAriaLabel(`Countdown: ${lastTime.days} days, ${lastTime.hours} hours, ${lastTime.minutes} minutes`);
        }
      }
    },

    getTargetDate(): Date {
      return callbacks.getTargetDate();
    },

    getWallClockTarget(): WallClockTime | null {
      return wallClockTarget;
    },
  };
}
