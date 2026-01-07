/** State management with reactive subscriptions and factory pattern for cleanup. */

import type { CelebrationState, CountdownMode, ThemeId } from '@core/types';
import { validateThemeId } from '@themes/registry';

import { DEFAULT_COMPLETION_MESSAGE } from '../config/constants';
import { isValidTransition } from './state-transitions';

/** Application state interface. */
export interface AppState {
  selectedTheme: ThemeId;
  selectedTimezone: string;
  userTimezone: string;
  targetDate: Date;
  isComplete: boolean;
  countdownMode: CountdownMode;
  completionMessage: string;
  durationSeconds?: number;
}

/** Callback for state changes. */
export type StateChangeCallback = (newState: AppState, previousState: AppState) => void;

const DEFAULT_COUNTDOWN_MODE: CountdownMode = 'wall-clock';

/** Detect user's timezone from browser (fallback: UTC). */
function detectUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

/** Options for creating a state manager. */
export interface StateManagerOptions {
  initialTheme?: ThemeId;
  initialTimezone?: string;
  targetDate?: Date;
  countdownMode?: CountdownMode;
  completionMessage?: string;
  durationSeconds?: number;
}

/** State manager with subscription support. */
export interface StateManager {
  getState(): AppState;
  setTheme(theme: ThemeId): void;
  setTimezone(timezone: string): void;
  setTargetDate(date: Date): void;
  setComplete(complete: boolean): void;
  setCountdownMode(mode: CountdownMode): void;
  setCompletionMessage(message: string): void;
  setDurationSeconds(seconds?: number): void;
  getCelebrationState(): CelebrationState;
  setCelebrationState(state: CelebrationState): void;
  hasCelebrated(timezone: string): boolean;
  markCelebrated(timezone: string): void;
  resetCelebration(): void;
  subscribe(callback: StateChangeCallback): () => void;
  destroy(): void;
}

/**
 * Create a state manager instance with subscription support.
 *
 * @param options - Configuration options for the state manager
 * @returns StateManager instance with getState, setters, subscribe, and destroy methods
 * @example
 * ```typescript
 * const stateManager = createStateManager({
 *   initialTheme: 'contribution-graph',
 *   initialTimezone: 'America/New_York',
 * });
 *
 * // Subscribe to state changes
 * const unsubscribe = stateManager.subscribe((newState, prevState) => {
 *   console.log('State changed:', newState);
 * });
 *
 * // Update state
 * stateManager.setTheme('fireworks');
 *
 * // Clean up
 * stateManager.destroy();
 * ```
 */
export function createStateManager(options: StateManagerOptions = {}): StateManager {
  const userTimezone = detectUserTimezone();

  let state: AppState = {
    selectedTheme: validateThemeId(options.initialTheme),
    selectedTimezone: options.initialTimezone ?? userTimezone,
    userTimezone,
    targetDate: options.targetDate ?? new Date(),
    isComplete: false,
    countdownMode: options.countdownMode ?? DEFAULT_COUNTDOWN_MODE,
    completionMessage: options.completionMessage ?? DEFAULT_COMPLETION_MESSAGE,
    durationSeconds: options.durationSeconds,
  };

  // Celebration state tracking (separate from AppState for isolation)
  let celebrationState: CelebrationState = 'counting';
  const celebratedTimezones = new Set<string>();

  const subscribers = new Set<StateChangeCallback>();

  function notifySubscribers(previousState: AppState): void {
    subscribers.forEach((callback) => {
      try {
        callback(state, previousState);
      } catch (error) {
        console.error('State subscriber error:', error);
      }
    });
  }

  /** Generic state updater - skips update if value unchanged. */
  function updateField<K extends keyof AppState>(key: K, value: AppState[K]): void {
    if (value === state[key]) return;
    const previousState = { ...state };
    state = { ...state, [key]: value };
    notifySubscribers(previousState);
  }

  return {
    getState: () => ({ ...state }),
    setTheme: (theme: ThemeId) => updateField('selectedTheme', validateThemeId(theme)),
    setTimezone: (timezone: string) => updateField('selectedTimezone', timezone),
    setTargetDate(date: Date) {
      const previousState = { ...state };
      state = { ...state, targetDate: date };
      notifySubscribers(previousState);
    },
    setComplete: (complete: boolean) => updateField('isComplete', complete),
    setCountdownMode: (mode: CountdownMode) => updateField('countdownMode', mode),
    setCompletionMessage: (message: string) => updateField('completionMessage', message),
    setDurationSeconds: (seconds?: number) => updateField('durationSeconds', seconds),
    
    /**
     * Get current celebration state.
     * @returns Current celebration state ('counting' | 'celebrating' | 'celebrated')
     */
    getCelebrationState: () => celebrationState,
    
    /**
     * Set celebration state with transition validation.
     * @param newState - Target celebration state
     * @throws Error if transition is invalid
     * @example
     * ```typescript
     * stateManager.setCelebrationState('celebrating'); // counting → celebrating
     * stateManager.setCelebrationState('celebrated'); // celebrating → celebrated
     * ```
     */
    setCelebrationState(newState: CelebrationState) {
      if (!isValidTransition(celebrationState, newState)) {
        console.warn(`Invalid celebration transition: ${celebrationState} → ${newState}`);
        return;
      }
      celebrationState = newState;
    },
    
    /**
     * Check if countdown has celebrated in a specific timezone.
     * @param timezone - IANA timezone identifier
     * @returns True if celebrated in this timezone
     */
    hasCelebrated: (timezone: string) => celebratedTimezones.has(timezone),
    
    /**
     * Mark countdown as celebrated in a specific timezone.
     * @param timezone - IANA timezone identifier
     */
    markCelebrated: (timezone: string) => celebratedTimezones.add(timezone),
    
    /**
     * Reset celebration state to 'counting' and clear celebrated timezones.
     */
    resetCelebration() {
      celebrationState = 'counting';
      celebratedTimezones.clear();
    },
    
    subscribe(callback: StateChangeCallback) {
      subscribers.add(callback);
      return () => subscribers.delete(callback);
    },
    destroy: () => subscribers.clear(),
  };
}
