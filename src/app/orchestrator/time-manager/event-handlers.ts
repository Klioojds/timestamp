/**
 * Time Event Handlers - tick and completion event handling.
 */

import type { CountdownConfig, ThemeId, TimePageRenderer, TimeRemaining } from '@core/types';

import type { StateManager } from '@/core/state';
import type { AccessibilityManager } from '@/core/utils/accessibility';
import { createAttributeCache, setAttributeIfChanged } from '@/core/utils/accessibility';

import { completeCelebration, transitionToCelebrated, transitionToCelebrating } from '../celebration-transitions';
import { getCountdownAccessibleName } from '../theme-manager/theme-focus-preservation';
import type { CelebrationDisplay } from '../types';
import type { TimezoneManager } from './timezone-state-manager';

/** Time event handler configuration. */
export interface TimeEventHandlerOptions {
  container: HTMLElement;
  getCurrentTheme: () => TimePageRenderer | null;
  getCurrentThemeId: () => ThemeId;
  stateManager: StateManager;
  accessibilityManager: AccessibilityManager;
  getTimezoneManager: () => TimezoneManager | null;
  initialTimezone: string;
  config?: CountdownConfig;
  getCelebrationDisplay: (targetDate: Date) => CelebrationDisplay;
}

/** Time event handlers interface. */
export interface TimeEventHandlers {
  handleTick(time: TimeRemaining): void;
  handleComplete(): void;
  getLastAriaLabel(): string;
  setLastAriaLabel(label: string): void;
}

/** Creates time event handlers. */
export function createTimeEventHandlers(
  options: TimeEventHandlerOptions
): TimeEventHandlers {
  const {
    container,
    getCurrentTheme,
    stateManager,
    accessibilityManager,
    getTimezoneManager,
    initialTimezone,
    getCelebrationDisplay,
  } = options;

  // aria-label throttling - only update when formatted string changes
  const ariaLabelCache = createAttributeCache();

  return {
    handleTick(time: TimeRemaining): void {
      const currentState = stateManager.getCelebrationState();
      const currentTheme = getCurrentTheme();

      // Only call theme.updateTime during COUNTING state
      if (currentState === 'counting' && currentTheme) {
        currentTheme.updateTime(time);
      }

      // PERF: Only update aria-label when formatted string changes
      const newLabel = getCountdownAccessibleName(time, currentState !== 'counting');
      setAttributeIfChanged(container, 'aria-label', newLabel, ariaLabelCache);

      // Announce to screen readers (throttled internally)
      accessibilityManager.announceCountdown(time);
    },

    handleComplete(): void {
      const timezoneManager = getTimezoneManager();
      const currentTargetDate = timezoneManager?.getTargetDate() ?? new Date();
      const currentTimezone = timezoneManager?.getCurrentTimezone() ?? initialTimezone;
      const currentTheme = getCurrentTheme();
      const hadCelebrated = stateManager.hasCelebrated(currentTimezone);

      // Update aria-label for completion
      const completionLabel = getCountdownAccessibleName(null, true);
      container.setAttribute('aria-label', completionLabel);
      ariaLabelCache.current = completionLabel;

      const { message, fullMessage } = getCelebrationDisplay(currentTargetDate);

      if (hadCelebrated) {
        // Timezone already celebrated (via switch in wall-clock mode)
        // Skip animation, go directly to celebrated state
        transitionToCelebrated(stateManager, container, currentTimezone);
        currentTheme?.onCelebrated?.({ message, fullMessage });
      } else {
        // First celebration for this timezone - trigger animation
        // Transition: COUNTING → CELEBRATING → CELEBRATED
        transitionToCelebrating(stateManager, container, currentTimezone);
        currentTheme?.onCelebrating({ message, fullMessage });
        accessibilityManager.announceCelebration();

        // Transition: CELEBRATING → CELEBRATED (immediate)
        completeCelebration(stateManager);
      }
    },

    getLastAriaLabel(): string {
      return ariaLabelCache.current;
    },

    setLastAriaLabel(label: string): void {
      ariaLabelCache.current = label;
    },
  };
}
