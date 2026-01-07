/**
 * Form Controller Tests
 * Unified tests for form state management and user interaction coordination.
 * Combines form-state and interaction-controller test coverage.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createFormController,
  toLocalInputValue,
  type FormElements,
  type ManagedControllers,
  type FormControllerCallbacks,
  type LandingPageFormState,
} from './form-controller';
import type { EventHandlerContext, LandingPageElements, LandingPageState, LandingPageCallbacks } from './event-handlers';
import {
  createLandingElements,
  createLandingState,
  createHandlers,
} from '@/test-utils/landing-page-fixtures';

describe('FormController', () => {
  describe('toLocalInputValue', () => {
    it.each([
      {
        description: 'should convert date to datetime-local format in local time',
        date: new Date(2025, 11, 31, 23, 59, 0),
        expected: '2025-12-31T23:59',
      },
      {
        description: 'should truncate seconds and milliseconds',
        date: new Date(2025, 5, 15, 12, 30, 45),
        expected: '2025-06-15T12:30',
      },
      {
        description: 'should correctly pad single-digit months and days',
        date: new Date(2025, 0, 5, 8, 5, 0),
        expected: '2025-01-05T08:05',
      },
    ])('$description', ({ date, expected }) => {
      const result = toLocalInputValue(date);

      expect(result).toBe(expected);
    });
  });

  describe('State Management', () => {
    let elements: FormElements;
    let controllers: ManagedControllers;
    let callbacks: FormControllerCallbacks;
    let state: LandingPageFormState;
    let formController: ReturnType<typeof createFormController>;

    beforeEach(() => {
      // Create a container with mode fieldset containing all 3 radios in DOM order
      const modeFieldset = document.createElement('fieldset');
      const wallClockRadio = document.createElement('input');
      wallClockRadio.type = 'radio';
      wallClockRadio.name = 'mode';
      wallClockRadio.value = 'wall-clock';
      const absoluteRadio = document.createElement('input');
      absoluteRadio.type = 'radio';
      absoluteRadio.name = 'mode';
      absoluteRadio.value = 'absolute';
      const timerRadio = document.createElement('input');
      timerRadio.type = 'radio';
      timerRadio.name = 'mode';
      timerRadio.value = 'timer';
      // Append all 3 radios in the correct order (matches real DOM)
      modeFieldset.append(wallClockRadio, absoluteRadio, timerRadio);
      document.body.appendChild(modeFieldset);

      // Create form elements
      elements = {
        dateInput: document.createElement('input'),
        hoursInput: document.createElement('input'),
        minutesInput: document.createElement('input'),
        secondsInput: document.createElement('input'),
        completionMessageInput: document.createElement('textarea'),
        dateSection: document.createElement('section'),
        timerSection: document.createElement('section'),
        timezoneSection: document.createElement('section'),
        worldMapToggle: document.createElement('section'),
        startButton: document.createElement('button'),
        modeRadios: {
          'wall-clock': wallClockRadio,
          'absolute': absoluteRadio,
          'timer': timerRadio,
        } as any,
        modeFieldset,
      };

      // Create world map toggle button inside section
      const toggleButton = document.createElement('button');
      toggleButton.className = 'landing-map-toggle';
      elements.worldMapToggle.appendChild(toggleButton);

      // Create mock controllers
      controllers = {
        themeSelectorController: {
          setSelected: vi.fn(),
          destroy: vi.fn(),
        } as any,
        timezoneSelectorController: {
          setTimezone: vi.fn(),
          destroy: vi.fn(),
        } as any,
        backgroundManager: {
          destroy: vi.fn(),
          initialize: vi.fn(),
          render: vi.fn(),
          waitForReady: vi.fn(),
          getController: vi.fn(),
        } as any,
      };

      const landingElements = createLandingElements();
      const landingState = createLandingState();
      const landingCallbacks = createHandlers();

      // Create callbacks
      callbacks = {
        onModeChange: vi.fn(),
        onThemeChange: vi.fn(),
        createEventContext: vi.fn((): EventHandlerContext => ({
          state: landingState,
          elements: landingElements,
          callbacks: landingCallbacks,
        })),
      };

      // Create initial state
      state = {
        mode: 'wall-clock',
        theme: 'contribution-graph',
        timezone: 'America/New_York',
        showWorldMap: true,
      };

      // Create controller
      formController = createFormController(elements, controllers, callbacks);
    });

    afterEach(() => {
      formController.destroy();
      elements.modeFieldset.remove();
    });

    describe('initializeForm', () => {
      it('should set mode radio to checked', () => {
        formController.initializeForm({}, state);
        expect(elements.modeRadios['wall-clock'].checked).toBe(true);
      });

      it('should initialize date input with default New Year date', () => {
        formController.initializeForm({}, state);
        expect(elements.dateInput.value).toBeTruthy();
      });

      it('should initialize date input with provided targetDate', () => {
        // Use local time constructor so expected output matches
        const targetDate = new Date(2026, 0, 1, 0, 0, 0); // Jan 1, 2026, midnight LOCAL

        formController.initializeForm({ targetDate }, state);

        expect(elements.dateInput.value).toBe('2026-01-01T00:00');
      });

      it('should initialize timer inputs with provided duration', () => {
        formController.initializeForm({ durationSeconds: 5400 }, state);

        expect(elements.hoursInput.value).toBe('1');
        expect(elements.minutesInput.value).toBe('30');
        expect(elements.secondsInput.value).toBe('0');
      });

      it('should initialize message input with provided message', () => {
        formController.initializeForm({ completionMessage: 'Time up!' }, state);

        expect(elements.completionMessageInput.value).toBe('Time up!');
      });

      it.each([
        { mode: 'wall-clock' as const, label: 'Start Countdown', ariaLabel: 'Start wall-clock countdown' },
        { mode: 'timer' as const, label: 'Start Timer', ariaLabel: 'Start timer countdown' },
      ])('should update start button label for mode $mode', ({ mode, label, ariaLabel }) => {
        state.mode = mode;
        formController.initializeForm({}, state);

        expect(elements.startButton.textContent).toBe(label);
        expect(elements.startButton.getAttribute('aria-label')).toBe(ariaLabel);
      });
    });

    describe('setConfig', () => {
      it('should update mode and call callback', () => {
        formController.setConfig({ mode: 'timer' }, state);

        expect(callbacks.onModeChange).toHaveBeenCalledWith('timer');
        expect(elements.modeRadios.timer.checked).toBe(true);
      });

      it('should update date input', () => {
        // Use local time constructor so expected output matches
        const targetDate = new Date(2026, 5, 15, 12, 0, 0); // June 15, 2026, 12:00 LOCAL

        formController.setConfig({ targetDate }, state);

        expect(elements.dateInput.value).toBe('2026-06-15T12:00');
      });

      it('should update duration inputs', () => {
        formController.setConfig({ durationSeconds: 7265 }, state); // 2:01:05

        expect(elements.hoursInput.value).toBe('2');
        expect(elements.minutesInput.value).toBe('1');
        expect(elements.secondsInput.value).toBe('5');
      });

      it('should update message input', () => {
        formController.setConfig({ completionMessage: 'Done!' }, state);

        expect(elements.completionMessageInput.value).toBe('Done!');
      });

      it('should update theme and call callback', () => {
        formController.setConfig({ theme: 'fireworks' }, state);

        expect(state.theme).toBe('fireworks');
        expect(controllers.themeSelectorController?.setSelected).toHaveBeenCalledWith('fireworks');
        expect(callbacks.onThemeChange).toHaveBeenCalledWith('fireworks');
      });

      it('should update timezone state and controller', () => {
        formController.setConfig({ timezone: 'Europe/London' }, state);

        expect(state.timezone).toBe('Europe/London');
        expect(controllers.timezoneSelectorController?.setTimezone).toHaveBeenCalledWith('Europe/London');
      });

      it('should update showWorldMap state and toggle button', () => {
        formController.setConfig({ showWorldMap: false }, state);

        expect(state.showWorldMap).toBe(false);
        const toggleButton = elements.worldMapToggle.querySelector('.landing-map-toggle');
        expect(toggleButton?.classList.contains('is-on')).toBe(false);
        expect(toggleButton?.getAttribute('aria-checked')).toBe('false');
      });

      it('should handle null controllers gracefully', () => {
        controllers.themeSelectorController = null;
        controllers.timezoneSelectorController = null;

        // Should not throw
        expect(() => {
          formController.setConfig({
            theme: 'fireworks',
            timezone: 'UTC',
          }, state);
        }).not.toThrow();
      });
    });

    describe('toggleMode', () => {
      it.each([
        {
          mode: 'wall-clock' as const,
          expected: { dateHidden: false, timerHidden: true, timezoneHidden: false, worldMapHidden: false, timerInert: 'true', dateInert: false },
        },
        {
          mode: 'timer' as const,
          expected: { dateHidden: true, timerHidden: false, timezoneHidden: true, worldMapHidden: true, timerInert: null, dateInert: true },
        },
      ])('should update visibility for mode $mode', ({ mode, expected }) => {
        formController.toggleMode(mode, state);

        expect(state.mode).toBe(mode);
        expect(elements.dateSection.hidden).toBe(expected.dateHidden);
        expect(elements.timerSection.hidden).toBe(expected.timerHidden);
        expect(elements.timezoneSection.hidden).toBe(expected.timezoneHidden);
        expect(elements.worldMapToggle.hidden).toBe(expected.worldMapHidden);
        expect(elements.timerSection.getAttribute('inert')).toBe(expected.timerInert);
        expect(elements.dateSection.hasAttribute('inert')).toBe(expected.dateInert);
      });

      it('should remove inert attribute when returning to wall-clock', () => {
        formController.toggleMode('timer', state);
        formController.toggleMode('wall-clock', state);

        expect(elements.dateSection.hasAttribute('inert')).toBe(false);
        expect(elements.timerSection.getAttribute('inert')).toBe('true');
      });
    });

    describe('updateStartButtonLabel', () => {
      it.each([
        { mode: 'wall-clock' as const, label: 'Start Countdown', ariaLabel: 'Start wall-clock countdown' },
        { mode: 'timer' as const, label: 'Start Timer', ariaLabel: 'Start timer countdown' },
      ])('should set start button label for mode $mode', ({ mode, label, ariaLabel }) => {
        formController.updateStartButtonLabel(mode);

        expect(elements.startButton.textContent).toBe(label);
        expect(elements.startButton.getAttribute('aria-label')).toBe(ariaLabel);
      });
    });
  });

  describe('Interaction Management', () => {
    let elements: FormElements;
    let controllers: ManagedControllers;
    let callbacks: FormControllerCallbacks;
    let landingElements: LandingPageElements;
    let landingState: LandingPageState;
    let landingCallbacks: LandingPageCallbacks;
    let formController: ReturnType<typeof createFormController>;

    beforeEach(() => {
      landingElements = createLandingElements();
      landingState = createLandingState();
      landingCallbacks = createHandlers();

      // Create a container with mode fieldset containing all 3 radios in DOM order
      const modeFieldset = document.createElement('fieldset');
      const wallClockRadio = document.createElement('input');
      wallClockRadio.type = 'radio';
      wallClockRadio.name = 'mode';
      wallClockRadio.value = 'wall-clock';
      const absoluteRadio = document.createElement('input');
      absoluteRadio.type = 'radio';
      absoluteRadio.name = 'mode';
      absoluteRadio.value = 'absolute';
      const timerRadio = document.createElement('input');
      timerRadio.type = 'radio';
      timerRadio.name = 'mode';
      timerRadio.value = 'timer';
      // Append all 3 radios in the correct order (matches real DOM)
      modeFieldset.append(wallClockRadio, absoluteRadio, timerRadio);
      document.body.appendChild(modeFieldset);

      elements = {
        dateInput: landingElements.dateInput,
        hoursInput: landingElements.hoursInput,
        minutesInput: landingElements.minutesInput,
        secondsInput: landingElements.secondsInput,
        completionMessageInput: landingElements.completionMessageInput,
        dateSection: document.createElement('section'),
        timerSection: document.createElement('section'),
        timezoneSection: document.createElement('section'),
        worldMapToggle: document.createElement('section'),
        startButton: landingElements.startButton,
        modeRadios: {
          'wall-clock': wallClockRadio,
          'absolute': absoluteRadio,
          'timer': timerRadio,
        } as any,
        modeFieldset,
      };

      controllers = {
        timezoneSelectorController: {
          destroy: vi.fn(),
          setTimezone: vi.fn(),
          getElement: vi.fn(),
        } as any,
        themeSelectorController: {
          destroy: vi.fn(),
          setSelected: vi.fn(),
          getElement: vi.fn(),
        } as any,
        backgroundManager: {
          destroy: vi.fn(),
          initialize: vi.fn(),
          render: vi.fn(),
          waitForReady: vi.fn(),
          getController: vi.fn(),
        } as any,
      };

      callbacks = {
        onModeChange: vi.fn(),
        onThemeChange: vi.fn(),
        createEventContext: vi.fn((): EventHandlerContext => ({
          state: landingState,
          elements: landingElements,
          callbacks: landingCallbacks,
        })),
      };

      formController = createFormController(elements, controllers, callbacks);
    });

    afterEach(() => {
      formController.destroy();
      elements.modeFieldset.remove();
    });

    describe('initializeModeNavigation', () => {
      it.each([
        { mode: 'wall-clock' as const, index: 0 },
        { mode: 'absolute' as const, index: 1 },
        { mode: 'timer' as const, index: 2 },
      ])('should set roving tabindex for %s mode', ({ mode, index }) => {
        formController.initializeModeNavigation(mode);

        const rovingController = formController.getModeRovingController();
        expect(rovingController?.getCurrentIndex()).toBe(index);
        expect(elements.modeRadios['wall-clock'].getAttribute('tabindex')).toBe(
          mode === 'wall-clock' ? '0' : '-1'
        );
        expect(elements.modeRadios.absolute.getAttribute('tabindex')).toBe(
          mode === 'absolute' ? '0' : '-1'
        );
        expect(elements.modeRadios.timer.getAttribute('tabindex')).toBe(
          mode === 'timer' ? '0' : '-1'
        );
      });
    });

    describe('updateModeNavigation', () => {
      beforeEach(() => {
        formController.initializeModeNavigation('wall-clock');
      });

      it.each([
        { mode: 'absolute' as const },
        { mode: 'timer' as const },
        { mode: 'wall-clock' as const },
      ])('should update tabindex when switching to %s mode', ({ mode }) => {
        formController.updateModeNavigation(mode);

        expect(elements.modeRadios['wall-clock'].getAttribute('tabindex')).toBe(
          mode === 'wall-clock' ? '0' : '-1'
        );
        expect(elements.modeRadios.absolute.getAttribute('tabindex')).toBe(
          mode === 'absolute' ? '0' : '-1'
        );
        expect(elements.modeRadios.timer.getAttribute('tabindex')).toBe(
          mode === 'timer' ? '0' : '-1'
        );
      });
    });

    describe('bindEvents', () => {
      beforeEach(() => {
        formController.bindEvents();
      });

      it.each([
        { radio: 'wall-clock' as const },
        { radio: 'absolute' as const },
        { radio: 'timer' as const },
      ])('should call onModeChange when %s radio changes', ({ radio }) => {
        elements.modeRadios[radio].dispatchEvent(new Event('change'));

        expect(callbacks.onModeChange).toHaveBeenCalledWith(radio);
      });

      it('should bind start button click handler', () => {
        elements.startButton.dispatchEvent(new Event('click'));

        // The start handler would call context.callbacks.onStart if validation passes
        // Since context is mocked, we just verify the event was bound
        expect(callbacks.createEventContext).toHaveBeenCalled();
      });

      it('should bind input change handlers', () => {
        elements.dateInput.dispatchEvent(new Event('input'));
        elements.hoursInput.dispatchEvent(new Event('input'));
        elements.minutesInput.dispatchEvent(new Event('input'));
        elements.secondsInput.dispatchEvent(new Event('input'));

        expect(callbacks.createEventContext).toHaveBeenCalled();
      });
    });

    describe('destroy', () => {
      let timezoneSelectorDestroySpy: ReturnType<typeof vi.fn>;
      let themeSelectorDestroySpy: ReturnType<typeof vi.fn>;
      let backgroundManagerDestroySpy: ReturnType<typeof vi.fn>;

      beforeEach(() => {
        timezoneSelectorDestroySpy = controllers.timezoneSelectorController!.destroy as ReturnType<typeof vi.fn>;
        themeSelectorDestroySpy = controllers.themeSelectorController!.destroy as ReturnType<typeof vi.fn>;
        backgroundManagerDestroySpy = controllers.backgroundManager!.destroy as ReturnType<typeof vi.fn>;

        formController.initializeModeNavigation('wall-clock');
        formController.bindEvents();
      });

      it('should destroy managed controllers and roving tabindex', () => {
        formController.destroy();

        expect(timezoneSelectorDestroySpy).toHaveBeenCalled();
        expect(themeSelectorDestroySpy).toHaveBeenCalled();
        expect(backgroundManagerDestroySpy).toHaveBeenCalled();
        expect(formController.getModeRovingController()).toBeNull();
        expect(controllers.timezoneSelectorController).toBeNull();
        expect(controllers.themeSelectorController).toBeNull();
        expect(controllers.backgroundManager).toBeNull();
      });

      it('should remove event listeners', () => {
        const modeChangeSpy = vi.fn();
        callbacks.onModeChange = modeChangeSpy;

        // Rebind with spy
        formController.destroy();
        formController = createFormController(elements, controllers, callbacks);
        formController.bindEvents();

        // Verify event fires
        elements.modeRadios['wall-clock'].dispatchEvent(new Event('change'));
        expect(modeChangeSpy).toHaveBeenCalledTimes(1);

        // Destroy and verify event no longer fires
        formController.destroy();
        modeChangeSpy.mockClear();
        elements.modeRadios['wall-clock'].dispatchEvent(new Event('change'));
        expect(modeChangeSpy).not.toHaveBeenCalled();
      });

      it('should handle null controllers gracefully', () => {
        controllers.timezoneSelectorController = null;
        controllers.themeSelectorController = null;
        controllers.backgroundManager = null;

        expect(() => {
          formController.destroy();
        }).not.toThrow();
      });
    });

    describe('keyboard navigation', () => {
      beforeEach(() => {
        formController.initializeModeNavigation('wall-clock');
      });

      it('should move focus with right arrow', () => {
        elements.modeRadios['wall-clock'].focus();

        const rightArrowEvent = new KeyboardEvent('keydown', {
          key: 'ArrowRight',
          bubbles: true,
        });
        elements.modeFieldset.dispatchEvent(rightArrowEvent);

        expect(elements.modeRadios.absolute.getAttribute('tabindex')).toBe('0');
        expect(elements.modeRadios['wall-clock'].getAttribute('tabindex')).toBe('-1');
      });

      it('should wrap navigation from timer back to wall-clock', () => {
        formController.updateModeNavigation('timer');

        const rightArrowEvent = new KeyboardEvent('keydown', {
          key: 'ArrowRight',
          bubbles: true,
        });
        elements.modeFieldset.dispatchEvent(rightArrowEvent);

        expect(elements.modeRadios['wall-clock'].getAttribute('tabindex')).toBe('0');
      });
    });
  });
});
