/**
 * Shared landing page fixtures for DOM elements, state, and callbacks.
 */
import { vi } from 'vitest';
import type {
  LandingPageCallbacks,
  LandingPageElements,
  LandingPageState,
} from '@/components/landing-page/event-handlers';
import type { CountdownMode, ThemeId } from '@core/types';

const DEFAULT_MODE: CountdownMode = 'wall-clock';
const DEFAULT_THEME: ThemeId = 'contribution-graph';
const DEFAULT_TIMEZONE = 'America/New_York';

/** Create landing page DOM elements with test defaults. */
export function createLandingElements(): LandingPageElements {
  const dateSection = document.createElement('section');
  const timerSection = document.createElement('section');
  const timezoneSection = document.createElement('section');
  const worldMapToggle = document.createElement('section');

  const startButton = document.createElement('button');
  const dateInput = document.createElement('input');
  dateInput.type = 'datetime-local';

  const hoursInput = document.createElement('input');
  const minutesInput = document.createElement('input');
  const secondsInput = document.createElement('input');

  const completionMessageInput = document.createElement('textarea');

  const dateError = document.createElement('div');
  dateError.hidden = true;
  const durationError = document.createElement('div');
  durationError.hidden = true;
  const durationPreview = document.createElement('div');

  const statusRegion = document.createElement('div');

  return {
    dateSection,
    timerSection,
    timezoneSection,
    worldMapToggle,
    startButton,
    dateInput,
    hoursInput,
    minutesInput,
    secondsInput,
    completionMessageInput,
    dateError,
    durationError,
    durationPreview,
    statusRegion,
  };
}

/** Build default landing page state. */
export function createLandingState(): LandingPageState {
  return {
    mode: DEFAULT_MODE,
    theme: DEFAULT_THEME,
    timezone: DEFAULT_TIMEZONE,
    showWorldMap: true,
  };
}

/** Create landing page callbacks backed by vi.fn spies. */
export function createHandlers(): LandingPageCallbacks {
  return {
    onModeToggle: vi.fn(),
    onThemeSelect: vi.fn(),
    onTimezoneSelect: vi.fn(),
    onStart: vi.fn(),
    announce: vi.fn(),
  };
}
