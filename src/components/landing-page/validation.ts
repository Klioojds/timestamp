/**
 * Landing Page Form Validation
 * Extracted validation logic from landing-page.ts for testability and reuse.
 */

import { getModeConfig } from '@core/config/mode-config';
import { coerceFieldsToSeconds } from '@core/time/duration';
import { getUserTimezone } from '@core/time/timezone';
import type { CountdownConfig, CountdownMode, ThemeId, WallClockTime } from '@core/types';
import { validateTargetDate } from '@core/url';
import { MAX_MESSAGE_LENGTH } from '@core/utils/text';

import { DEFAULT_COMPLETION_MESSAGE } from '@/core/config/constants';

import { DATE_MODE_DEFAULT_MESSAGE, NEW_YEAR_MESSAGE } from './dom-builders';

/**
 * Validation result for a single field or the entire form.
 */
export interface ValidationResult {
  /** True if all validation checks passed */
  isValid: boolean;
  /** Complete validated config (only present if isValid is true) */
  config?: CountdownConfig;
  /** Countdown target date (present if date/timer mode validates) */
  targetDate?: Date;
  /** Timer duration in seconds (only for timer mode) */
  durationSeconds?: number;
  /** Human-readable error messages for display */
  errors: string[];
  /** Set of field names that failed validation (e.g., 'date', 'duration') */
  invalidFields: Set<string>;
}

/**
 * Input values from the form.
 */
export interface FormInputs {
  /** Selected countdown mode (wall-clock, absolute, or timer) */
  mode: CountdownMode;
  /** Datetime-local input value (YYYY-MM-DDTHH:mm) */
  dateValue: string;
  /** Timer hours input value (numeric string) */
  hoursValue: string;
  /** Timer minutes input value (numeric string) */
  minutesValue: string;
  /** Timer seconds input value (numeric string) */
  secondsValue: string;
  /** User-entered completion message (empty for default) */
  messageValue: string;
  /** Selected theme identifier */
  theme: ThemeId;
  /** IANA timezone identifier (e.g., 'America/New_York') */
  timezone: string;
  /** Whether world map should be shown during countdown */
  showWorldMap: boolean;
}

/**
 * Check if target date is New Year's Day midnight (00:00:00 on January 1st).
 * @param date - Target date to check
 * @returns true if midnight on January 1st
 */
export function isNewYearMidnight(date: Date): boolean {
  return (
    date.getMonth() === 0 && // January
    date.getDate() === 1 && // 1st
    date.getHours() === 0 &&
    date.getMinutes() === 0
  );
}

/**
 * Get default completion message for date mode.
 * @param targetDate - Target date for countdown
 * @returns "Happy New Year!" for New Year's midnight, else "Hooray!"
 */
export function getDateModeDefaultMessage(targetDate: Date): string {
  return isNewYearMidnight(targetDate) ? NEW_YEAR_MESSAGE : DATE_MODE_DEFAULT_MESSAGE;
}

/**
 * Validate date mode inputs.
 * @param dateValue - Datetime-local input value
 * @returns Validation result with targetDate if valid
 */
export function validateDateMode(dateValue: string): ValidationResult {
  const errors: string[] = [];
  const invalidFields = new Set<string>();

  if (!dateValue) {
    errors.push('Target date is required for wall-clock mode.');
    invalidFields.add('date');
    return { isValid: false, errors, invalidFields };
  }

  const validation = validateTargetDate(dateValue);
  if (!validation.isValid || !validation.date) {
    errors.push(validation.error ?? 'Invalid target date');
    invalidFields.add('date');
    return { isValid: false, errors, invalidFields };
  }

  return {
    isValid: true,
    targetDate: validation.date,
    errors: [],
    invalidFields: new Set(),
  };
}

/**
 * Validate timer mode inputs.
 * @param hoursValue - Hours input value
 * @param minutesValue - Minutes input value
 * @param secondsValue - Seconds input value
 * @returns Validation result with durationSeconds and targetDate if valid
 */
export function validateTimerMode(
  hoursValue: string,
  minutesValue: string,
  secondsValue: string
): ValidationResult {
  const errors: string[] = [];
  const invalidFields = new Set<string>();

  // Check if at least one field has a value
  const hasHours = hoursValue.trim() !== '';
  const hasMinutes = minutesValue.trim() !== '';
  const hasSeconds = secondsValue.trim() !== '';

  if (!hasHours && !hasMinutes && !hasSeconds) {
    errors.push('Duration required: Enter at least one value for hours, minutes, or seconds');
    invalidFields.add('duration');
    return { isValid: false, errors, invalidFields };
  }

  // Use coerceFieldsToSeconds for arbitrary numeric input
  const coercionResult = coerceFieldsToSeconds(hoursValue, minutesValue, secondsValue);

  // Check if duration is within bounds
  if (coercionResult.totalSeconds === 0) {
    errors.push('Duration must be greater than zero');
    invalidFields.add('duration');
    return { isValid: false, errors, invalidFields };
  }

  if (coercionResult.exceedsMax) {
    errors.push(`Maximum duration is 1 year (365 days). Enter a shorter duration.`);
    invalidFields.add('duration');
    return { isValid: false, errors, invalidFields };
  }

  const durationSeconds = coercionResult.totalSeconds;
  const targetDate = new Date(Date.now() + durationSeconds * 1000);

  return {
    isValid: true,
    durationSeconds,
    targetDate,
    errors: [],
    invalidFields: new Set(),
  };
}

/**
 * Validate the entire form and build a CountdownConfig if valid.
 * @param inputs - Form input values
 * @returns Validation result with config if valid
 */
export function validateForm(inputs: FormInputs): ValidationResult {
  const { 
    mode, 
    dateValue, 
    hoursValue, 
    minutesValue, 
    secondsValue, 
    messageValue,
    theme, 
    timezone, 
    showWorldMap 
  } = inputs;

  let result: ValidationResult;
  const config = getModeConfig(mode);

  if (config.isDurationBased) {
    result = validateTimerMode(hoursValue, minutesValue, secondsValue);
    if (!result.isValid) {
      return result;
    }

    // Store plain text (truncated) - SafeMessage is created at display time
    const completionMessage = messageValue 
      ? messageValue.slice(0, MAX_MESSAGE_LENGTH) 
      : DEFAULT_COMPLETION_MESSAGE;

    return {
      isValid: true,
      config: {
        mode: 'timer',
        targetDate: result.targetDate!,
        durationSeconds: result.durationSeconds,
        completionMessage,
        theme,
        timezone: timezone || getUserTimezone(),
        showWorldMap,
      },
      targetDate: result.targetDate,
      durationSeconds: result.durationSeconds,
      errors: [],
      invalidFields: new Set(),
    };
  } else if (config.isAbsolute) {
    // Absolute mode: fixed UTC instant, same for everyone
    result = validateDateMode(dateValue);
    if (!result.isValid) {
      return result;
    }

    const defaultMessage = getDateModeDefaultMessage(result.targetDate!);
    // Store plain text (truncated) - SafeMessage is created at display time
    const completionMessage = messageValue 
      ? messageValue.slice(0, MAX_MESSAGE_LENGTH) 
      : defaultMessage;

    return {
      isValid: true,
      config: {
        mode: 'absolute',
        targetDate: result.targetDate!,
        completionMessage,
        theme,
        timezone: timezone || getUserTimezone(),
        showWorldMap: false, // Absolute mode never shows world map
      },
      targetDate: result.targetDate,
      errors: [],
      invalidFields: new Set(),
    };
  } else {
    // Wall-clock mode: each timezone sees their local time
    result = validateDateMode(dateValue);
    if (!result.isValid) {
      return result;
    }

    // Extract wall-clock components from the local Date
    // These represent the abstract time (e.g., "midnight on Jan 1") without timezone
    const wallClockTarget: WallClockTime = {
      year: result.targetDate!.getFullYear(),
      month: result.targetDate!.getMonth(),
      day: result.targetDate!.getDate(),
      hours: result.targetDate!.getHours(),
      minutes: result.targetDate!.getMinutes(),
      seconds: result.targetDate!.getSeconds(),
    };

    // Use user-provided message, or smart default based on target date
    const defaultMessage = getDateModeDefaultMessage(result.targetDate!);
    // Store plain text (truncated) - SafeMessage is created at display time
    const completionMessage = messageValue 
      ? messageValue.slice(0, MAX_MESSAGE_LENGTH) 
      : defaultMessage;

    return {
      isValid: true,
      config: {
        mode: 'wall-clock',
        targetDate: result.targetDate!,
        wallClockTarget,
        completionMessage,
        theme,
        timezone: timezone || getUserTimezone(),
        showWorldMap,
      },
      targetDate: result.targetDate,
      errors: [],
      invalidFields: new Set(),
    };
  }
}
