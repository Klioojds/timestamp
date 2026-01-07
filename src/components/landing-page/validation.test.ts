/**
 * Landing Page Form Validation Tests
 * Tests validation logic for wall-clock mode, timer mode, and error reporting.
 *
 * Note: isNewYearMidnight and getDateModeDefaultMessage are thin wrappers
 * over local implementations. Their core logic is tested via validateForm
 * integration tests below. For comprehensive isNewYearMidnight edge cases,
 * see time.test.ts which tests the canonical implementation.
 */
import { describe, it, expect } from 'vitest';
import {
  validateDateMode,
  validateTimerMode,
  validateForm,
  type ValidationResult,
} from './validation';
import { DEFAULT_COMPLETION_MESSAGE } from '@core/config/constants';
import { DATE_MODE_DEFAULT_MESSAGE, NEW_YEAR_MESSAGE } from './dom-builders';

describe('Landing Page Validation', () => {
  describe('validateDateMode', () => {
    it('should validate valid date input', () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      const result = validateDateMode(futureDate.slice(0, 16));

      expect(result.isValid).toBe(true);
      expect(result.targetDate).toBeInstanceOf(Date);
      expect(result.errors).toEqual([]);
      expect(result.invalidFields.size).toBe(0);
    });

    it('should reject empty date input', () => {
      const result = validateDateMode('');

      expect(result.isValid).toBe(false);
      expect(result.targetDate).toBeUndefined();
      expect(result.errors).toContain('Target date is required for wall-clock mode.');
      expect(result.invalidFields.has('date')).toBe(true);
    });

    it('should reject invalid date format', () => {
      const result = validateDateMode('invalid-date');

      expect(result.isValid).toBe(false);
      expect(result.targetDate).toBeUndefined();
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.invalidFields.has('date')).toBe(true);
    });

    it('should reject past dates', () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString();
      const result = validateDateMode(pastDate.slice(0, 16));

      expect(result.isValid).toBe(false);
      expect(result.targetDate).toBeUndefined();
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.invalidFields.has('date')).toBe(true);
    });
  });

  describe('validateTimerMode', () => {
    it.each([
      {
        description: 'hours only',
        hours: '2',
        minutes: '',
        seconds: '',
        expectedSeconds: 7200,
      },
      {
        description: 'minutes only',
        hours: '',
        minutes: '30',
        seconds: '',
        expectedSeconds: 1800,
      },
      {
        description: 'seconds only',
        hours: '',
        minutes: '',
        seconds: '45',
        expectedSeconds: 45,
      },
      {
        description: 'combined hours, minutes, seconds',
        hours: '1',
        minutes: '30',
        seconds: '45',
        expectedSeconds: 5445,
      },
      {
        description: 'arbitrary minutes (75 minutes)',
        hours: '',
        minutes: '75',
        seconds: '',
        expectedSeconds: 4500,
      },
      {
        description: 'large arbitrary minutes (2173 minutes)',
        hours: '',
        minutes: '2173',
        seconds: '',
        expectedSeconds: 130380,
      },
      {
        description: 'negative hours coerced to 0',
        hours: '-5',
        minutes: '30',
        seconds: '',
        expectedSeconds: 1800,
      },
      {
        description: 'float hours floored',
        hours: '1.7',
        minutes: '',
        seconds: '',
        expectedSeconds: 3600,
      },
    ])('should validate timer with $description', ({ hours, minutes, seconds, expectedSeconds }) => {
      const result = validateTimerMode(hours, minutes, seconds);

      expect(result.isValid).toBe(true);
      expect(result.durationSeconds).toBe(expectedSeconds);
      expect(result.targetDate).toBeInstanceOf(Date);
      expect(result.errors).toEqual([]);
      expect(result.invalidFields.size).toBe(0);
    });

    it.each([
      {
        description: 'all empty inputs',
        hours: '',
        minutes: '',
        seconds: '',
        expectedMessage: 'Duration required',
      },
      {
        description: 'zero duration',
        hours: '0',
        minutes: '0',
        seconds: '0',
        expectedMessage: 'zero',
      },
      {
        description: 'whitespace only inputs',
        hours: '   ',
        minutes: '  ',
        seconds: '  ',
        expectedMessage: 'Duration required',
      },
      {
        description: 'exceeds max (365 days + 1 second)',
        hours: '8760',
        minutes: '0',
        seconds: '1',
        expectedMessage: /maximum.*365 days/i,
      },
      {
        description: 'exceeds max (366 days)',
        hours: '8784',
        minutes: '',
        seconds: '',
        expectedMessage: /maximum.*365 days/i,
      },
    ])('should reject timer when $description', ({ hours, minutes, seconds, expectedMessage }) => {
      const result = validateTimerMode(hours, minutes, seconds);

      expect(result.isValid).toBe(false);
      expect(result.durationSeconds).toBeUndefined();
      expect(result.errors.join(' ')).toMatch(expectedMessage);
      expect(result.invalidFields.has('duration')).toBe(true);
    });

    it.each([
      {
        description: 'accept exactly 365 days (boundary test)',
        hours: '8760',
        minutes: '',
        seconds: '',
        expectedSeconds: 31536000,
      },
      {
        description: 'coerce invalid characters to 0 (treated as empty)',
        hours: 'abc',
        minutes: '30',
        seconds: '',
        expectedSeconds: 1800,
      },
    ])('should $description', ({ hours, minutes, seconds, expectedSeconds }) => {
      const result = validateTimerMode(hours, minutes, seconds);

      expect(result.isValid).toBe(true);
      expect(result.durationSeconds).toBe(expectedSeconds);
      expect(result.errors).toEqual([]);
      expect(result.invalidFields.size).toBe(0);
    });
  });

  describe('validateForm', () => {
    it('should validate complete wall-clock mode form with custom message', () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      const result = validateForm({
        mode: 'wall-clock',
        dateValue: futureDate.slice(0, 16),
        hoursValue: '',
        minutesValue: '',
        secondsValue: '',
        messageValue: 'Countdown complete!',
        theme: 'contribution-graph',
        timezone: 'America/New_York',
        showWorldMap: true,
      });

      expect(result.isValid).toBe(true);
      expect(result.config).toBeDefined();
      expect(result.config?.mode).toBe('wall-clock');
      expect(result.config?.completionMessage).toBe('Countdown complete!');
      expect(result.errors).toEqual([]);
      expect(result.invalidFields.size).toBe(0);
    });

    it('should include wallClockTarget in wall-clock mode config', () => {
      // Use a specific future date/time to verify wall-clock components are extracted correctly
      // Always use next year to ensure the date is in the future regardless of current date
      const nextYear = new Date().getFullYear() + 1;
      const result = validateForm({
        mode: 'wall-clock',
        dateValue: `${nextYear}-01-01T00:00`,
        hoursValue: '',
        minutesValue: '',
        secondsValue: '',
        messageValue: '',

        theme: 'contribution-graph',
        timezone: 'America/New_York',
        showWorldMap: true,
      });

      expect(result.isValid).toBe(true);
      expect(result.config?.wallClockTarget).toBeDefined();
      expect(result.config?.wallClockTarget?.year).toBe(nextYear);
      expect(result.config?.wallClockTarget?.month).toBe(0); // 0-indexed
      expect(result.config?.wallClockTarget?.day).toBe(1);
      expect(result.config?.wallClockTarget?.hours).toBe(0);
      expect(result.config?.wallClockTarget?.minutes).toBe(0);
      expect(result.config?.wallClockTarget?.seconds).toBe(0);
    });

    it('should use Hooray! as default for non-New Year wall-clock mode', () => {
      // Use a date that is NOT New Year's midnight (e.g., June 15)
      const nonNewYearDate = new Date();
      nonNewYearDate.setFullYear(nonNewYearDate.getFullYear() + 1);
      nonNewYearDate.setMonth(5); // June
      nonNewYearDate.setDate(15);
      nonNewYearDate.setHours(14, 30, 0, 0);

      const result = validateForm({
        mode: 'wall-clock',
        dateValue: nonNewYearDate.toISOString().slice(0, 16),
        hoursValue: '',
        minutesValue: '',
        secondsValue: '',
        messageValue: '',
        theme: 'contribution-graph',
        timezone: 'America/New_York',
        showWorldMap: true,
      });

      expect(result.isValid).toBe(true);
      expect(result.config?.completionMessage).toBe(DATE_MODE_DEFAULT_MESSAGE);
    });

    it('should use Happy New Year! for New Year midnight wall-clock mode', () => {
      // Use exactly midnight on January 1st of next year in a fixed format
      // The dateValue input is local time format (YYYY-MM-DDTHH:mm), so use fixed string
      const nextYear = new Date().getFullYear() + 1;
      const newYearDateValue = `${nextYear}-01-01T00:00`;

      const result = validateForm({
        mode: 'wall-clock',
        dateValue: newYearDateValue,
        hoursValue: '',
        minutesValue: '',
        secondsValue: '',
        messageValue: '',
        theme: 'contribution-graph',
        timezone: 'America/New_York',
        showWorldMap: true,
      });

      expect(result.isValid).toBe(true);
      expect(result.config?.completionMessage).toBe(NEW_YEAR_MESSAGE);
    });

    it('should store plain text completion message for wall-clock mode', () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      const scriptMessage = "<script>alert('xss')</script>";

      const result = validateForm({
        mode: 'wall-clock',
        dateValue: futureDate.slice(0, 16),
        hoursValue: '',
        minutesValue: '',
        secondsValue: '',
        messageValue: scriptMessage,
        theme: 'contribution-graph',
        timezone: 'UTC',
        showWorldMap: true,
      });

      // Config stores plain text - SafeMessage handles XSS at display time
      expect(result.isValid).toBe(true);
      expect(result.config?.completionMessage).toBe(scriptMessage);
    });

    it('should validate complete timer mode form with custom message', () => {
      const result = validateForm({
        mode: 'timer',
        dateValue: '',
        hoursValue: '1',
        minutesValue: '30',
        secondsValue: '0',
        messageValue: 'Time is up!',
        theme: 'fireworks',
        timezone: 'UTC',
        showWorldMap: false,
      });

      expect(result.isValid).toBe(true);
      expect(result.config).toBeDefined();
      expect(result.config?.mode).toBe('timer');
      expect(result.config?.completionMessage).toBe('Time is up!');
      expect(result.config?.durationSeconds).toBe(5400);
      expect(result.errors).toEqual([]);
      expect(result.invalidFields.size).toBe(0);
    });

    it('should validate absolute mode and force world map off', () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();

      const result = validateForm({
        mode: 'absolute',
        dateValue: futureDate.slice(0, 16),
        hoursValue: '',
        minutesValue: '',
        secondsValue: '',
        messageValue: '',
        theme: 'fireworks',
        timezone: '',
        showWorldMap: true,
      });

      expect(result.isValid).toBe(true);
      expect(result.config?.mode).toBe('absolute');
      expect(result.config?.showWorldMap).toBe(false);
      expect(result.config?.completionMessage).toBe(DATE_MODE_DEFAULT_MESSAGE);
    });

    it('should use default message for empty timer message', () => {
      const result = validateForm({
        mode: 'timer',
        dateValue: '',
        hoursValue: '0',
        minutesValue: '5',
        secondsValue: '0',
        messageValue: '',
        theme: 'contribution-graph',
        timezone: 'UTC',
        showWorldMap: false,
      });

      expect(result.isValid).toBe(true);
      expect(result.config?.completionMessage).toBe(DEFAULT_COMPLETION_MESSAGE);
    });

    it('should return errors for invalid wall-clock mode', () => {
      const result = validateForm({
        mode: 'wall-clock',
        dateValue: '',
        hoursValue: '',
        minutesValue: '',
        secondsValue: '',
        messageValue: '',

        theme: 'contribution-graph',
        timezone: 'America/New_York',
        showWorldMap: true,
      });

      expect(result.isValid).toBe(false);
      expect(result.config).toBeUndefined();
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.invalidFields.has('date')).toBe(true);
    });

    it('should return errors for invalid timer mode', () => {
      const result = validateForm({
        mode: 'timer',
        dateValue: '',
        hoursValue: '',
        minutesValue: '',
        secondsValue: '',
        messageValue: '',
        theme: 'fireworks',
        timezone: 'UTC',
        showWorldMap: false,
      });

      expect(result.isValid).toBe(false);
      expect(result.config).toBeUndefined();
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.invalidFields.has('duration')).toBe(true);
    });
  });
});
