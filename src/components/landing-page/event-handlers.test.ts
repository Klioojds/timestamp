/**
 * Landing Page Event Handlers Tests
 * Tests event handling logic extracted from landing-page.ts
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createModeChangeHandler,
  createStartHandler,
  createInputChangeHandler,
  createThemeSelectHandler,
  createTimezoneSelectHandler,
  clearActiveErrorToast,
  type EventHandlerContext,
} from './event-handlers';
import type { CountdownMode, ThemeId } from '@core/types';
import { toastManager } from '@components/toast';

describe('Landing Page Event Handlers', () => {
  let context: EventHandlerContext;

  beforeEach(() => {
    context = {
      state: {
        mode: 'wall-clock',
        theme: 'contribution-graph',
        timezone: 'America/New_York',
        showWorldMap: true,
      },
      elements: {
        dateSection: document.createElement('section'),
        timerSection: document.createElement('section'),
        timezoneSection: document.createElement('section'),
        worldMapToggle: document.createElement('section'),
        startButton: document.createElement('button'),
        dateInput: document.createElement('input'),
        hoursInput: document.createElement('input'),
        minutesInput: document.createElement('input'),
        secondsInput: document.createElement('input'),
        completionMessageInput: document.createElement('textarea'),
        dateError: document.createElement('span'),
        durationError: document.createElement('span'),
        durationPreview: document.createElement('div'),
        statusRegion: document.createElement('div'),
      },
      callbacks: {
        onModeToggle: vi.fn(),
        onThemeSelect: vi.fn(),
        onTimezoneSelect: vi.fn(),
        onStart: vi.fn(),
        announce: vi.fn(),
      },
    };
  });

  afterEach(() => {
    // Clean up any active toasts
    clearActiveErrorToast();
    toastManager.destroy();
  });

  describe('createModeChangeHandler', () => {
    it('should toggle mode and update UI', () => {
      const handler = createModeChangeHandler(context);

      handler('timer');

      expect(context.state.mode).toBe('timer');
      expect(context.callbacks.onModeToggle).toHaveBeenCalledWith('timer');
      expect(context.callbacks.announce).toHaveBeenCalledWith('Timer mode selected. Fixed duration countdown');
    });

    it('should announce wall-clock mode correctly', () => {
      context.state.mode = 'timer';
      const handler = createModeChangeHandler(context);

      handler('wall-clock');

      expect(context.state.mode).toBe('wall-clock');
      expect(context.callbacks.announce).toHaveBeenCalledWith('Local Time mode selected. Per timezone, e.g. New Year\'s Eve');
    });
  });

  describe('createStartHandler', () => {
    it('should validate and call onStart with valid wall-clock mode', () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      context.elements.dateInput.value = futureDate.slice(0, 16);

      const handler = createStartHandler(context);
      handler();

      expect(context.callbacks.onStart).toHaveBeenCalled();
      const config = context.callbacks.onStart.mock.calls[0][0];
      expect(config.mode).toBe('wall-clock');
      expect(config.theme).toBe('contribution-graph');
    });

    it('should validate and call onStart with valid timer mode', () => {
      context.state.mode = 'timer';
      context.elements.hoursInput.value = '1';
      context.elements.minutesInput.value = '30';
      context.elements.secondsInput.value = '0';
      context.elements.completionMessageInput.value = 'Time up!';

      const handler = createStartHandler(context);
      handler();

      expect(context.callbacks.onStart).toHaveBeenCalled();
      const config = context.callbacks.onStart.mock.calls[0][0];
      expect(config.mode).toBe('timer');
      expect(config.durationSeconds).toBe(5400);
      expect(config.completionMessage).toBe('Time up!');
    });

    it('should validate absolute mode and disable world map', () => {
      context.state.mode = 'absolute';
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      context.elements.dateInput.value = futureDate.slice(0, 16);
      context.elements.completionMessageInput.value = '';

      const handler = createStartHandler(context);
      handler();

      expect(context.callbacks.onStart).toHaveBeenCalled();
      const config = context.callbacks.onStart.mock.calls[0][0];
      expect(config.mode).toBe('absolute');
      expect(config.showWorldMap).toBe(false);
      expect(config.targetDate).toBeInstanceOf(Date);
    });

    it('should show error for invalid date', () => {
      context.elements.dateInput.value = '';

      const handler = createStartHandler(context);
      handler();

      expect(context.callbacks.onStart).not.toHaveBeenCalled();
      expect(context.elements.dateError.hidden).toBe(false);
      // Error toast is shown via the toast system
      expect(document.querySelector('[data-toast-id]')).toBeTruthy();
    });

    it('should show error for invalid timer duration', () => {
      context.state.mode = 'timer';
      context.elements.hoursInput.value = '';
      context.elements.minutesInput.value = '';
      context.elements.secondsInput.value = '';

      const handler = createStartHandler(context);
      handler();

      expect(context.callbacks.onStart).not.toHaveBeenCalled();
      expect(context.elements.durationError.hidden).toBe(false);
      // Error toast is shown via the toast system
      expect(document.querySelector('[data-toast-id]')).toBeTruthy();
    });

    it('should focus first invalid field on error', () => {
      context.elements.dateInput.value = '';
      context.elements.dateInput.focus = vi.fn();

      const handler = createStartHandler(context);
      handler();

      expect(context.elements.dateInput.focus).toHaveBeenCalled();
    });
  });

  describe('createInputChangeHandler', () => {
    it('should clear date validation errors', () => {
      context.elements.dateInput.classList.add('is-invalid');
      context.elements.dateInput.setAttribute('aria-invalid', 'true');
      context.elements.dateError.hidden = false;

      const handler = createInputChangeHandler(context, 'date');
      handler();

      expect(context.elements.dateInput.classList.contains('is-invalid')).toBe(false);
      expect(context.elements.dateInput.hasAttribute('aria-invalid')).toBe(false);
      expect(context.elements.dateError.hidden).toBe(true);
    });

    it('should clear duration validation errors', () => {
      context.elements.hoursInput.classList.add('is-invalid');
      context.elements.minutesInput.classList.add('is-invalid');
      context.elements.secondsInput.classList.add('is-invalid');
      context.elements.durationError.hidden = false;

      const handler = createInputChangeHandler(context, 'duration');
      handler();

      expect(context.elements.hoursInput.classList.contains('is-invalid')).toBe(false);
      expect(context.elements.minutesInput.classList.contains('is-invalid')).toBe(false);
      expect(context.elements.secondsInput.classList.contains('is-invalid')).toBe(false);
      expect(context.elements.durationError.hidden).toBe(true);
    });
  });

  describe('createThemeSelectHandler', () => {
    it('should update theme state and call callback', () => {
      const handler = createThemeSelectHandler(context);
      handler('fireworks' as ThemeId);

      expect(context.state.theme).toBe('fireworks');
      expect(context.callbacks.onThemeSelect).toHaveBeenCalledWith('fireworks');
    });

    it('should skip if same theme is selected', () => {
      const handler = createThemeSelectHandler(context);
      handler('contribution-graph');

      expect(context.callbacks.onThemeSelect).not.toHaveBeenCalled();
    });
  });

  describe('createTimezoneSelectHandler', () => {
    it('should update timezone state and call callback', () => {
      const handler = createTimezoneSelectHandler(context);
      handler('Europe/London');

      expect(context.state.timezone).toBe('Europe/London');
      expect(context.callbacks.onTimezoneSelect).toHaveBeenCalledWith('Europe/London');
    });
  });
});
