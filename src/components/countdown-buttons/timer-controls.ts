/** Timer Controls Component - Play/pause toggle and reset buttons for timer mode countdowns. */

import '../../styles/components/countdown-ui.css';

import { createIcon, ICON_SIZES } from '@core/utils/dom';
import { cloneTemplate } from '@core/utils/dom/template-utils';

/** Options for creating timer controls. */
export interface TimerControlsOptions {
  /** Whether the timer is initially playing (not paused) */
  initialPlaying?: boolean;
  /** Callback invoked when play/pause is toggled */
  onPlayPauseToggle?: (isPlaying: boolean) => void;
  /** Callback invoked when reset is clicked */
  onReset?: () => void;
}

/** Timer controls controller interface. */
export interface TimerControlsController {
  /** Get the container element holding all controls */
  getElement(): HTMLDivElement;
  /** Update the play/pause button state */
  setPlaying(isPlaying: boolean): void;
  /** Check if the timer is currently playing */
  isPlaying(): boolean;
  /** Remove the controls and clean up */
  destroy(): void;
}

/** Minimum time between aria-live announcements to prevent spam (ms) */
const ARIA_LIVE_THROTTLE_MS = 1000;

function createPlayPauseIcon(isPlaying: boolean): SVGSVGElement {
  return createIcon({
    name: isPlaying ? 'pause' : 'play',
    size: ICON_SIZES.LG,
  });
}

function createResetIcon(): SVGSVGElement {
  return createIcon({
    name: 'sync',
    size: ICON_SIZES.LG,
  });
}

function updatePlayPauseState(button: HTMLButtonElement, isPlaying: boolean): void {
  button.setAttribute('aria-pressed', (!isPlaying).toString());
  button.setAttribute('aria-label', isPlaying ? 'Pause timer' : 'Resume timer');
  
  const oldIcon = button.querySelector('svg');
  const newIcon = createPlayPauseIcon(isPlaying);
  
  if (oldIcon) {
    button.replaceChild(newIcon, oldIcon);
  } else {
    button.appendChild(newIcon);
  }
}

/** Announce state change to screen readers via aria-live region. Announcements are throttled to prevent spam. */
function announceStateChange(
  liveRegion: HTMLSpanElement,
  message: string,
  lastAnnouncementTime: { value: number }
): void {
  const now = Date.now();
  if (now - lastAnnouncementTime.value < ARIA_LIVE_THROTTLE_MS) {
    return;
  }
  
  lastAnnouncementTime.value = now;
  liveRegion.textContent = message;
  
  // Clear after announcement to allow repeat announcements
  setTimeout(() => {
    liveRegion.textContent = '';
  }, 100);
}

/**
 * Create timer controls from template (play/pause toggle and reset button).
 * @returns Controller with getElement, setPlaying, isPlaying, and destroy methods
 */
export function createTimerControls(
  options: TimerControlsOptions = {}
): TimerControlsController {
  let playing = options.initialPlaying ?? true;
  const lastAnnouncementTime = { value: 0 };

  // Clone container from template
  const container = cloneTemplate<HTMLDivElement>('timer-controls-template');

  // Get elements from template
  const liveRegion = container.querySelector('[aria-live]') as HTMLSpanElement;
  const playPauseButton = container.querySelector('[data-testid="timer-play-pause"]') as HTMLButtonElement;
  const resetButton = container.querySelector('[data-testid="timer-reset"]') as HTMLButtonElement;

  // Inject icons (must be done via JS as SVGs change based on state)
  const playPauseIcon = createPlayPauseIcon(playing);
  playPauseButton.appendChild(playPauseIcon);
  
  const resetIcon = createResetIcon();
  resetButton.appendChild(resetIcon);

  // Set initial state
  updatePlayPauseState(playPauseButton, playing);

  /** Handle play/pause toggle click */
  function handlePlayPauseClick(): void {
    playing = !playing;
    updatePlayPauseState(playPauseButton, playing);
    
    const message = playing ? 'Timer resumed' : 'Timer paused';
    announceStateChange(liveRegion, message, lastAnnouncementTime);
    
    options.onPlayPauseToggle?.(playing);
  }

  /** Handle reset button click */
  function handleResetClick(): void {
    announceStateChange(liveRegion, 'Timer reset', lastAnnouncementTime);
    options.onReset?.();
    // Note: Reset preserves play/pause state (AC2.1, AC2.2)
    // The orchestrator handles resetting from celebration state
  }

  playPauseButton.addEventListener('click', handlePlayPauseClick);
  resetButton.addEventListener('click', handleResetClick);

  return {
    getElement(): HTMLDivElement {
      return container;
    },

    setPlaying(isPlaying: boolean): void {
      playing = isPlaying;
      updatePlayPauseState(playPauseButton, playing);
    },

    isPlaying(): boolean {
      return playing;
    },

    destroy(): void {
      playPauseButton.removeEventListener('click', handlePlayPauseClick);
      resetButton.removeEventListener('click', handleResetClick);
      container.remove();
    },
  };
}
