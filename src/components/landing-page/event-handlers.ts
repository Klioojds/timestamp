/**
 * Landing Page Event Handlers
 * Extracted event handling logic from landing-page.ts for testability and organization.
 */

import { showErrorToast, type ToastController } from '@components/toast';
import { getModeConfig } from '@core/config/mode-config';
import { coerceFieldsToSeconds, formatDuration } from '@core/time/duration';
import type { CountdownConfig, CountdownMode, ThemeId } from '@core/types';

import { type FormInputs, validateForm } from './validation';

const DURATION_PREVIEW_DEBOUNCE_MS = 200;

/** Landing page state managed by event handlers. */
export interface LandingPageState {
  mode: CountdownMode;
  theme: ThemeId;
  timezone: string;
  showWorldMap: boolean;
}

/**
 * References to DOM elements needed by event handlers.
 */
export interface LandingPageElements {
  /** Date/time input section container */
  dateSection: HTMLElement;
  /** Timer duration inputs section container */
  timerSection: HTMLElement;
  /** Timezone selector section container */
  timezoneSection: HTMLElement;
  /** World map toggle button container */
  worldMapToggle: HTMLElement;
  /** Start countdown button */
  startButton: HTMLButtonElement;
  /** Datetime-local input for target date */
  dateInput: HTMLInputElement;
  /** Hours input for timer duration */
  hoursInput: HTMLInputElement;
  /** Minutes input for timer duration */
  minutesInput: HTMLInputElement;
  /** Seconds input for timer duration */
  secondsInput: HTMLInputElement;
  /** Textarea for completion message */
  completionMessageInput: HTMLTextAreaElement;
  /** Error message display for date input */
  dateError: HTMLElement;
  /** Error message display for duration inputs */
  durationError: HTMLElement;
  /** Live preview of normalized timer duration */
  durationPreview: HTMLElement;
  /** ARIA live region for screen reader announcements */
  statusRegion: HTMLElement;
}

/**
 * Callbacks provided by the landing page.
 */
export interface LandingPageCallbacks {
  /** Invoked when user changes countdown mode */
  onModeToggle: (mode: CountdownMode) => void;
  /** Invoked when user selects a different theme */
  onThemeSelect: (theme: ThemeId) => void;
  /** Invoked when user selects a different timezone */
  onTimezoneSelect: (timezone: string) => void;
  /** Invoked when user starts countdown with valid config */
  onStart: (config: CountdownConfig) => void;
  /** Announce message to screen readers via ARIA live region */
  announce: (message: string) => void;
}

/**
 * Context provided to event handlers.
 */
export interface EventHandlerContext {
  /** Current landing page state (mode, theme, timezone, showWorldMap) */
  state: LandingPageState;
  /** References to DOM elements for reading values and showing errors */
  elements: LandingPageElements;
  /** Callbacks for coordinating with parent component */
  callbacks: LandingPageCallbacks;
}

/**
 * Create mode change handler.
 * @param context - Event handler context
 * @returns Handler function for mode change events
 */
export function createModeChangeHandler(
  context: EventHandlerContext
): (mode: CountdownMode) => void {
  return (mode: CountdownMode) => {
    context.state.mode = mode;
    context.callbacks.onModeToggle(mode);
    const config = getModeConfig(mode);
    context.callbacks.announce(`${config.displayName} mode selected. ${config.description}`);
  };
}

/** Active error toast controller for cleanup */
let activeErrorToast: ToastController | null = null;

/**
 * Create a start button click handler.
 * @param context - Event handler context
 * @returns Handler function for start button clicks
 */
export function createStartHandler(context: EventHandlerContext): () => void {
  return () => {
    // Clear previous validation state
    clearValidationErrors(context.elements);
    // Dismiss any existing error toast
    activeErrorToast?.dismiss();
    activeErrorToast = null;

    // Gather form inputs
    const inputs: FormInputs = {
      mode: context.state.mode,
      dateValue: context.elements.dateInput.value,
      hoursValue: context.elements.hoursInput.value,
      minutesValue: context.elements.minutesInput.value,
      secondsValue: context.elements.secondsInput.value,
      messageValue: context.elements.completionMessageInput.value,
      theme: context.state.theme,
      timezone: context.state.timezone,
      showWorldMap: context.state.showWorldMap,
    };

    // Validate form
    const { config, errors, invalidFields } = validateForm(inputs);

    if (errors.length > 0 || !config) {
      // Show inline validation errors
      showValidationErrors(context.elements, errors, invalidFields);
      // Show toast notification for first error
      if (errors[0]) {
        activeErrorToast = showErrorToast(errors[0], {
          id: 'landing-error-toast',
          duration: 0, // Don't auto-dismiss error toasts
        });
      }
      focusFirstInvalid(context.elements, context.state.mode, invalidFields);
      return;
    }

    // Success - call onStart
    context.callbacks.onStart(config);
  };
}

/**
 * Get the active error toast controller (for cleanup).
 * @returns The active error toast controller or null
 */
export function getActiveErrorToast(): ToastController | null {
  return activeErrorToast;
}

/**
 * Clear the active error toast reference (for cleanup).
 */
export function clearActiveErrorToast(): void {
  activeErrorToast?.dismiss();
  activeErrorToast = null;
}

/**
 * Create an input change handler to clear validation errors.
 * @param context - Event handler context
 * @param field - The field type ('date' or 'duration')
 * @returns Handler function for input change events
 */
export function createInputChangeHandler(
  context: EventHandlerContext,
  field: 'date' | 'duration'
): () => void {
  return () => {
    if (field === 'date') {
      context.elements.dateInput.classList.remove('is-invalid');
      context.elements.dateInput.removeAttribute('aria-invalid');
      context.elements.dateError.hidden = true;
    } else {
      context.elements.hoursInput.classList.remove('is-invalid');
      context.elements.minutesInput.classList.remove('is-invalid');
      context.elements.secondsInput.classList.remove('is-invalid');
      context.elements.hoursInput.removeAttribute('aria-invalid');
      context.elements.minutesInput.removeAttribute('aria-invalid');
      context.elements.secondsInput.removeAttribute('aria-invalid');
      context.elements.durationError.hidden = true;
    }
    // Dismiss any active error toast
    activeErrorToast?.dismiss();
    activeErrorToast = null;
  };
}

/** Debounce timeout ID for duration preview updates. */
let durationPreviewDebounceId: ReturnType<typeof setTimeout> | null = null;

/**
 * Create a debounced duration preview handler.
 * @param context - Event handler context
 * @returns Handler function for duration input events
 */
export function createDurationPreviewHandler(
  context: EventHandlerContext
): () => void {
  return () => {
    // Clear previous debounce timer
    if (durationPreviewDebounceId !== null) {
      clearTimeout(durationPreviewDebounceId);
    }

    // Debounce preview update by configured interval
    durationPreviewDebounceId = setTimeout(() => {
      const { totalSeconds } = coerceFieldsToSeconds(
        context.elements.hoursInput.value,
        context.elements.minutesInput.value,
        context.elements.secondsInput.value
      );

      if (totalSeconds === 0) {
        context.elements.durationPreview.textContent = '';
        context.elements.durationPreview.setAttribute('aria-hidden', 'true');
      } else {
        const formatted = formatDuration(totalSeconds, 'long');
        context.elements.durationPreview.textContent = `Total: ${formatted}`;
        context.elements.durationPreview.setAttribute('aria-hidden', 'false');
      }
    }, DURATION_PREVIEW_DEBOUNCE_MS);
  };
}

/**
 * Create a theme selection handler.
 * @param context - Event handler context
 * @returns Handler function for theme selection events
 */
export function createThemeSelectHandler(
  context: EventHandlerContext
): (theme: ThemeId) => void {
  return (theme: ThemeId) => {
    // Skip if selecting the same theme
    if (theme === context.state.theme) {
      return;
    }

    context.state.theme = theme;
    context.callbacks.onThemeSelect(theme);
  };
}

/**
 * Create a timezone selection handler.
 * @param context - Event handler context
 * @returns Handler function for timezone selection events
 */
export function createTimezoneSelectHandler(
  context: EventHandlerContext
): (timezone: string) => void {
  return (timezone: string) => {
    context.state.timezone = timezone;
    context.callbacks.onTimezoneSelect(timezone);
  };
}

// Helper functions for validation UI

function clearValidationErrors(elements: LandingPageElements): void {
  // Clear date input error state
  elements.dateInput.classList.remove('is-invalid');
  elements.dateInput.removeAttribute('aria-invalid');
  elements.dateError.hidden = true;
  elements.dateError.textContent = '';

  // Clear duration inputs error state
  elements.hoursInput.classList.remove('is-invalid');
  elements.minutesInput.classList.remove('is-invalid');
  elements.secondsInput.classList.remove('is-invalid');
  elements.hoursInput.removeAttribute('aria-invalid');
  elements.minutesInput.removeAttribute('aria-invalid');
  elements.secondsInput.removeAttribute('aria-invalid');
  elements.durationError.hidden = true;
  elements.durationError.textContent = '';
}

function showValidationErrors(
  elements: LandingPageElements,
  errors: string[],
  invalidFields: Set<string>
): void {
  if (invalidFields.has('date')) {
    elements.dateInput.classList.add('is-invalid');
    elements.dateInput.setAttribute('aria-invalid', 'true');
    const dateErrorMsg = errors.find(
      (e) => e.toLowerCase().includes('date') || e.toLowerCase().includes('target')
    );
    if (dateErrorMsg) {
      elements.dateError.textContent = dateErrorMsg;
      elements.dateError.hidden = false;
    }
  }

  if (invalidFields.has('duration')) {
    elements.hoursInput.classList.add('is-invalid');
    elements.minutesInput.classList.add('is-invalid');
    elements.secondsInput.classList.add('is-invalid');
    elements.hoursInput.setAttribute('aria-invalid', 'true');
    elements.minutesInput.setAttribute('aria-invalid', 'true');
    elements.secondsInput.setAttribute('aria-invalid', 'true');
    const durationErrorMsg = errors.find((e) => e.toLowerCase().includes('duration'));
    if (durationErrorMsg) {
      elements.durationError.textContent = durationErrorMsg;
      elements.durationError.hidden = false;
    }
  }
}

function focusFirstInvalid(
  elements: LandingPageElements,
  mode: CountdownMode,
  invalidFields: Set<string>
): void {
  const config = getModeConfig(mode);
  if (config.isDurationBased && invalidFields.has('duration')) {
    elements.hoursInput.focus();
  } else if (config.isWallClock && invalidFields.has('date')) {
    elements.dateInput.focus();
  }
}
