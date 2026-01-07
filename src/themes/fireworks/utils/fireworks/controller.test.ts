import { afterEach, describe, expect, it, vi } from 'vitest';
import { Fireworks } from 'fireworks-js';
import { INTENSITY_CONFIGS } from '../../config';
import { IntensityLevel } from '../../types';
import {
  createFireworksState,
  destroyFireworks,
  recreateFireworksAfterContainerUpdate,
  startFireworks,
  stopFireworks,
  updateFireworksIntensity,
} from './controller';
import { getFireworksOptions } from './options';
import { getIntensityConfig, getIntensityLevel } from './intensity';

vi.mock('fireworks-js', () => import('../../test-utils/fireworks-js.mock'));

const createCanvas = () => {
  const canvas = document.createElement('canvas');
  canvas.getContext = vi.fn(() => ({ clearRect: vi.fn() } as unknown as CanvasRenderingContext2D));
  return canvas;
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('startFireworks', () => {
  it('should create and start fireworks when canvas is available and motion is allowed', () => {
    const state = createFireworksState();
    state.canvas = createCanvas();

    startFireworks(state, false);

    const expectedLevel = getIntensityLevel(60);
    const expectedConfig = getIntensityConfig(60);

    expect(state.fireworks).not.toBeNull();
    expect(state.isRunning).toBe(true);
    expect(state.fireworks?.canvas).toBe(state.canvas);
    expect(state.fireworks?.options).toEqual(
      getFireworksOptions(expectedLevel, expectedConfig!)
    );
  });

  it.each([
    { description: 'prefers reduced motion', prefersReducedMotion: true, canvasFactory: createCanvas },
    { description: 'canvas is missing', prefersReducedMotion: false, canvasFactory: () => null },
  ])('should not start fireworks when $description', ({ prefersReducedMotion, canvasFactory }) => {
    const state = createFireworksState();
    state.canvas = canvasFactory();

    startFireworks(state, prefersReducedMotion);

    expect(state.fireworks).toBeNull();
    expect(state.isRunning).toBe(false);
  });
});

describe('updateFireworksIntensity', () => {
  it('should do nothing when reduced motion is preferred', () => {
    const state = createFireworksState();
    state.canvas = createCanvas();

    updateFireworksIntensity(state, 10, true);

    expect(state.fireworks).toBeNull();
    expect(state.currentLevel).toBe(IntensityLevel.STARS_ONLY);
  });

  it('should stop fireworks and switch to stars only when config is null', () => {
    const state = createFireworksState();
    state.canvas = createCanvas();
    state.currentLevel = IntensityLevel.FREQUENT;
    state.fireworks = new Fireworks(state.canvas, {});
    state.isRunning = true;

    const stopSpy = vi.spyOn(state.fireworks, 'stop');

    updateFireworksIntensity(state, 50000, false);

    expect(stopSpy).toHaveBeenCalled();
    expect(state.isRunning).toBe(false);
    expect(state.currentLevel).toBe(IntensityLevel.STARS_ONLY);
  });

  it('should skip updates when intensity level does not change', () => {
    const state = createFireworksState();
    state.canvas = createCanvas();
    state.currentLevel = IntensityLevel.FREQUENT;
    state.fireworks = new Fireworks(state.canvas, {});
    state.isRunning = true;

    const updateOptionsSpy = vi.spyOn(state.fireworks, 'updateOptions');

    updateFireworksIntensity(state, 599, false);

    expect(updateOptionsSpy).not.toHaveBeenCalled();
    expect(state.currentLevel).toBe(IntensityLevel.FREQUENT);
    expect(state.isRunning).toBe(true);
  });

  it('should update options and start fireworks when level changes', () => {
    const state = createFireworksState();
    state.canvas = createCanvas();
    state.currentLevel = IntensityLevel.OCCASIONAL;
    state.fireworks = new Fireworks(
      state.canvas,
      getFireworksOptions(IntensityLevel.FREQUENT, INTENSITY_CONFIGS[IntensityLevel.FREQUENT]!)
    );
    const startSpy = vi.spyOn(state.fireworks, 'start');
    const updateOptionsSpy = vi.spyOn(state.fireworks, 'updateOptions');

    updateFireworksIntensity(state, 10, false);

    const finaleOptions = getFireworksOptions(
      IntensityLevel.FINALE,
      INTENSITY_CONFIGS[IntensityLevel.FINALE]!
    );

    expect(updateOptionsSpy).toHaveBeenCalledWith(finaleOptions);
    expect(startSpy).toHaveBeenCalled();
    expect(state.currentLevel).toBe(IntensityLevel.FINALE);
    expect(state.isRunning).toBe(true);
  });

  it('should create and start fireworks when none exist for the new level', () => {
    const state = createFireworksState();
    state.canvas = createCanvas();

    updateFireworksIntensity(state, 4, false);

    expect(state.fireworks).not.toBeNull();
    expect(state.currentLevel).toBe(IntensityLevel.MAXIMUM);
    expect(state.isRunning).toBe(true);
  });
});

describe('destroyFireworks', () => {
  it('should stop, clear, and null out fireworks resources', () => {
    const state = createFireworksState();
    state.canvas = createCanvas();
    state.fireworks = new Fireworks(state.canvas, {});
    state.isRunning = true;

    const stopSpy = vi.spyOn(state.fireworks, 'stop');
    const clearSpy = vi.spyOn(state.fireworks, 'clear');
    const contextClearSpy = vi.fn();
    state.canvas.getContext = vi.fn(() => ({ clearRect: contextClearSpy } as unknown as CanvasRenderingContext2D));

    destroyFireworks(state);

    expect(stopSpy).toHaveBeenCalled();
    expect(clearSpy).toHaveBeenCalled();
    expect(contextClearSpy).toHaveBeenCalled();
    expect(state.fireworks).toBeNull();
    expect(state.isRunning).toBe(false);
  });
});

describe('recreateFireworksAfterContainerUpdate', () => {
  it('should destroy existing fireworks and replace the canvas reference', () => {
    const state = createFireworksState();
    const originalCanvas = createCanvas();
    const newCanvas = createCanvas();

    state.canvas = originalCanvas;
    state.fireworks = new Fireworks(originalCanvas, {});
    state.isRunning = true;

    const stopSpy = vi.spyOn(state.fireworks, 'stop');

    recreateFireworksAfterContainerUpdate(state, newCanvas);

    expect(stopSpy).toHaveBeenCalled();
    expect(state.fireworks).toBeNull();
    expect(state.canvas).toBe(newCanvas);
    expect(state.isRunning).toBe(false);
  });
});

describe('stopFireworks', () => {
  it('should stop an active fireworks instance without destroying it', () => {
    const state = createFireworksState();
    state.canvas = createCanvas();
    state.fireworks = new Fireworks(state.canvas, {});
    state.isRunning = true;

    const stopSpy = vi.spyOn(state.fireworks, 'stop');

    stopFireworks(state);

    expect(stopSpy).toHaveBeenCalled();
    expect(state.isRunning).toBe(false);
    expect(state.fireworks).not.toBeNull();
  });
});
