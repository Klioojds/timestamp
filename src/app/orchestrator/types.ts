/**
 * Orchestrator Types
 * Shared type definitions for orchestrator modules.
 */

import type { CountdownConfig, SafeMessage, ThemeId, TimePageRenderer, TimeRemaining } from '@core/types';

/**
 * Options for creating an orchestrator.
 */
export interface OrchestratorOptions {
  /** Container element for the countdown */
  container: HTMLElement;
  
  /** Initial theme to load (optional, defaults to config.theme) */
  initialTheme?: ThemeId;
  
  /** Countdown configuration */
  config?: CountdownConfig;
  
  /** Callback when back button is clicked */
  onBack?: () => void;
}

/**
 * Celebration display info.
 * Contains SafeMessage for theme rendering and fullMessage for accessibility.
 */
export interface CelebrationDisplay {
  /** Safe message for theme display (pre-sanitized). */
  message: SafeMessage;
  /** Full semantic message for screen reader announcement (plain text). */
  fullMessage: string;
}

/**
 * Shared callback interface for orchestrator modules.
 * Consolidates common callback patterns to reduce duplication across:
 * - theme-switcher.ts (theme switching)
 * - timezone-state-manager.ts (timezone handling)
 * - countdown-event-handlers.ts (event handling)
 */
export interface OrchestratorCallbacks {
  /** Returns current active theme renderer */
  getCurrentTheme: () => TimePageRenderer | null;
  
  /** Returns current theme ID */
  getCurrentThemeId: () => ThemeId;
  
  /** Returns target date for countdown */
  getTargetDate: () => Date;
  
  /** Updates target date (for timer resume, timezone switch) */
  setTargetDate: (date: Date) => void;
  
  /** Generates celebration display content based on mode and date */
  getCelebrationDisplay: (targetDate: Date) => CelebrationDisplay;
  
  /** Returns last computed time remaining (null if not yet computed) */
  getLastTime: () => TimeRemaining | null;
  
  /** Returns whether countdown has completed */
  isComplete: () => boolean;
}
