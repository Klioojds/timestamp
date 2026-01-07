/**
 * Fireworks Controller
 *
 * Manages fireworks-js lifecycle, intensity updates, and canvas operations.
 */

import { Fireworks } from 'fireworks-js';

import type { IntensityConfig, IntensityLevelType } from '../../types';
import { IntensityLevel } from '../../types';
import { getIntensityConfig, getIntensityLevel } from './intensity';
import { getFireworksOptions } from './options';

const DEFAULT_START_SECONDS = 60;

/** State for the fireworks animation controller. */
export interface FireworksState {
  /** The fireworks-js instance. */
  fireworks: Fireworks | null;
  /** The canvas element for rendering. */
  canvas: HTMLCanvasElement | null;
  /** Current intensity level. */
  currentLevel: IntensityLevelType;
  /** Whether fireworks are currently running. */
  isRunning: boolean;
  /** Whether an overlay is active (pauses animations). */
  overlayActive: boolean;
  /** Whether fireworks were running before overlay opened. */
  wasRunningBeforeOverlay: boolean;
}

/**
 * Creates initial fireworks state with default values.
 * @returns Fresh state object with null fireworks instance and STARS_ONLY intensity
 */
export function createFireworksState(): FireworksState {
  return {
    fireworks: null,
    canvas: null,
    currentLevel: IntensityLevel.STARS_ONLY,
    isRunning: false,
    overlayActive: false,
    wasRunningBeforeOverlay: false,
  };
}

/** Type guard: checks if canvas is available and animations not disabled. */
function canAnimateFireworks(
  state: FireworksState,
  prefersReducedMotion: boolean
): state is FireworksState & { canvas: HTMLCanvasElement } {
  return !prefersReducedMotion && Boolean(state.canvas);
}

/**
 * Starts the fireworks animation.
 * @param state - Fireworks state object
 * @param prefersReducedMotion - Whether user prefers reduced motion (disables animations)
 * @remarks No-op if reduced motion is active or canvas unavailable.
 */
export function startFireworks(state: FireworksState, prefersReducedMotion: boolean): void {
  if (!canAnimateFireworks(state, prefersReducedMotion)) return;

  if (!state.fireworks) {
    const config = getIntensityConfig(DEFAULT_START_SECONDS);
    const level = getIntensityLevel(DEFAULT_START_SECONDS);
    if (config) {
      state.fireworks = new Fireworks(state.canvas, getFireworksOptions(level, config));
    }
  }

  if (state.fireworks && !state.isRunning) {
    state.fireworks.start();
    state.isRunning = true;
  }
}

/**
 * Stops the fireworks animation without destroying the instance.
 * @param state - Fireworks state object
 * @remarks Instance remains available for restart via startFireworks().
 */
export function stopFireworks(state: FireworksState): void {
  if (state.fireworks && state.isRunning) {
    state.fireworks.stop();
    state.isRunning = false;
  }
}

/** Apply fireworks options for a given intensity level. */
function applyOptionsForLevel(
  state: FireworksState,
  level: IntensityLevelType,
  config: IntensityConfig
): void {
  if (!state.canvas) return;

  if (!state.fireworks) {
    state.fireworks = new Fireworks(state.canvas, getFireworksOptions(level, config));
    return;
  }

  if (state.currentLevel !== level) {
    state.fireworks.updateOptions(getFireworksOptions(level, config));
  }
}

/** Transition to stars-only mode (no active fireworks). */
function stopForStarsOnly(state: FireworksState, newLevel: IntensityLevelType): void {
  if (state.isRunning) {
    stopFireworks(state);
  }
  state.currentLevel = newLevel;
}

/** Ensure fireworks are running with the specified configuration. */
function ensureRunningWithConfig(
  state: FireworksState,
  level: IntensityLevelType,
  config: NonNullable<ReturnType<typeof getIntensityConfig>>,
  prefersReducedMotion: boolean
): void {
  applyOptionsForLevel(state, level, config);
  startFireworks(state, prefersReducedMotion);
  state.currentLevel = level;
}

/**
 * Updates fireworks intensity based on time remaining.
 *
 * @param state - Fireworks state object
 * @param secondsRemaining - Seconds until countdown target
 * @param prefersReducedMotion - Whether user prefers reduced motion
 *
 * @remarks
 * Automatically scales fireworks based on proximity to zero:
 * - STARS_ONLY (\>12h): No fireworks
 * - OCCASIONAL (\<12h): Infrequent bursts
 * - FREQUENT (\<10m): Regular fireworks
 * - MAXIMUM (\<5s): Peak intensity for finale
 *
 * Performance optimized to skip updates when intensity level unchanged.
 */
export function updateFireworksIntensity(
  state: FireworksState,
  secondsRemaining: number,
  prefersReducedMotion: boolean
): void {
  if (!canAnimateFireworks(state, prefersReducedMotion)) return;

  const newLevel = getIntensityLevel(secondsRemaining);

  // PERF: Skip all work if level hasn't changed
  if (state.currentLevel === newLevel) return;

  const config = getIntensityConfig(secondsRemaining);

  if (!config) {
    stopForStarsOnly(state, newLevel);
    return;
  }

  ensureRunningWithConfig(state, newLevel, config, prefersReducedMotion);
}

/**
 * Destroys fireworks instance and cleans up all resources.
 * @param state - Fireworks state object
 * @remarks Stops animation, clears canvas, and nulls fireworks-js instance.
 */
export function destroyFireworks(state: FireworksState): void {
  stopFireworks(state);
  if (state.fireworks) {
    state.fireworks.stop();
    state.fireworks.clear();
    state.fireworks = null;
  }

  if (state.canvas) {
    const ctx = state.canvas.getContext('2d');
    ctx?.clearRect(0, 0, state.canvas.width, state.canvas.height);
  }
}

/**
 * Recreates fireworks instance after container update.
 *
 * @param state - Fireworks state object
 * @param newCanvas - New canvas element for rendering (or null)
 *
 * @remarks
 * Used during theme transitions or DOM updates that replace the canvas.
 * Destroys existing instance before assigning new canvas reference.
 */
export function recreateFireworksAfterContainerUpdate(
  state: FireworksState,
  newCanvas: HTMLCanvasElement | null
): void {
  destroyFireworks(state);
  state.canvas = newCanvas;
}
