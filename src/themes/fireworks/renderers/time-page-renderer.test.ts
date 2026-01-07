import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AnimationStateContext, TimeRemaining } from '@themes/shared/types';
import { fireworksTimePageRenderer } from './time-page-renderer';

const {
  createRendererStateMock,
  isRendererReadyMock,
  shouldEnableAnimationsMock,
  setupFireworksCanvasMock,
  reconnectFireworksCanvasMock,
  destroyFireworksCanvasMock,
  handleFireworksAnimationStateChangeMock,
  triggerMaximumFireworksMock,
  showStaticCelebrationMock,
  resetToCountdownDisplayMock,
  updateCountdownMock,
  updateFireworksIntensityMock,
} = vi.hoisted(() => ({
  createRendererStateMock: vi.fn(),
  isRendererReadyMock: vi.fn(),
  shouldEnableAnimationsMock: vi.fn(),
  setupFireworksCanvasMock: vi.fn(),
  reconnectFireworksCanvasMock: vi.fn(),
  destroyFireworksCanvasMock: vi.fn(),
  handleFireworksAnimationStateChangeMock: vi.fn(),
  triggerMaximumFireworksMock: vi.fn(),
  showStaticCelebrationMock: vi.fn(),
  resetToCountdownDisplayMock: vi.fn(),
  updateCountdownMock: vi.fn(),
  updateFireworksIntensityMock: vi.fn(),
}));

vi.mock('../utils/state', () => ({
  createRendererState: createRendererStateMock,
  isRendererReady: isRendererReadyMock,
}));

vi.mock('@themes/shared', () => ({
  shouldEnableAnimations: shouldEnableAnimationsMock,
}));

vi.mock('../utils/transitions', () => ({
  setupFireworksCanvas: setupFireworksCanvasMock,
  reconnectFireworksCanvas: reconnectFireworksCanvasMock,
  destroyFireworksCanvas: destroyFireworksCanvasMock,
  handleFireworksAnimationStateChange: handleFireworksAnimationStateChangeMock,
  triggerMaximumFireworks: triggerMaximumFireworksMock,
  showStaticCelebration: showStaticCelebrationMock,
  resetToCountdownDisplay: resetToCountdownDisplayMock,
}));

vi.mock('../utils/dom', () => ({
  updateCountdown: updateCountdownMock,
}));

vi.mock('../utils/fireworks', () => ({
  updateFireworksIntensity: updateFireworksIntensityMock,
}));

describe('fireworksTimePageRenderer', () => {
  const animationState: AnimationStateContext = { shouldAnimate: true, prefersReducedMotion: false };
  let state: any;

  beforeEach(() => {
    const mockCountdownRefs = {
      daysUnit: document.createElement('div'),
      hoursUnit: document.createElement('div'),
      minsValue: document.createElement('span'),
      secsValue: document.createElement('span'),
      daysSep: document.createElement('span'),
      hoursSep: document.createElement('span'),
      countdownEl: document.createElement('div'),
      celebrationEl: document.createElement('p'),
    };

    state = {
      container: document.createElement('div'),
      countdownRefs: mockCountdownRefs,
      fireworksState: { currentLevel: 'OCCASIONAL' },
      getAnimationState: vi.fn(() => animationState),
      resourceTracker: { timeouts: [] },
    };

    vi.clearAllMocks();
    createRendererStateMock.mockReturnValue(state);
    isRendererReadyMock.mockReturnValue(true);
    shouldEnableAnimationsMock.mockReturnValue(true);
  });

  it('should delegate mount to setupFireworksCanvas when mounting', () => {
    const renderer = fireworksTimePageRenderer(new Date());
    const container = document.createElement('div');
    const context = { getAnimationState: vi.fn(() => animationState) } as any;

    renderer.mount(container, context);

    expect(setupFireworksCanvasMock).toHaveBeenCalledWith(state, container, context);
  });

  it('should delegate container reconnection when updating container', () => {
    const renderer = fireworksTimePageRenderer(new Date());
    const newContainer = document.createElement('section');

    renderer.updateContainer(newContainer);

    expect(reconnectFireworksCanvasMock).toHaveBeenCalledWith(state, newContainer);
  });

  it('should clean up resources when destroying', async () => {
    const renderer = fireworksTimePageRenderer(new Date());

    await renderer.destroy();

    expect(destroyFireworksCanvasMock).toHaveBeenCalledWith(state);
  });

  it('should skip time updates when renderer is not ready', () => {
    isRendererReadyMock.mockReturnValueOnce(false);
    const renderer = fireworksTimePageRenderer(new Date());
    const time: TimeRemaining = { days: 0, hours: 0, minutes: 0, seconds: 0, total: 1000 };

    renderer.updateTime(time);

    expect(updateCountdownMock).not.toHaveBeenCalled();
    expect(shouldEnableAnimationsMock).not.toHaveBeenCalled();
    expect(updateFireworksIntensityMock).not.toHaveBeenCalled();
  });

  it('should skip time updates when countdownRefs is null', () => {
    state.countdownRefs = null;
    const renderer = fireworksTimePageRenderer(new Date());
    const time: TimeRemaining = { days: 0, hours: 0, minutes: 0, seconds: 0, total: 1000 };

    renderer.updateTime(time);

    expect(updateCountdownMock).not.toHaveBeenCalled();
  });

  it('should update countdown display when renderer is ready', () => {
    const renderer = fireworksTimePageRenderer(new Date());
    const time: TimeRemaining = { days: 1, hours: 2, minutes: 3, seconds: 4, total: 5000 };

    renderer.updateTime(time);

    expect(updateCountdownMock).toHaveBeenCalledWith(state.countdownRefs, 1, 2, 3, 4);
  });

  it('should update fireworks intensity when animations are enabled', () => {
    const renderer = fireworksTimePageRenderer(new Date());
    const time: TimeRemaining = { days: 0, hours: 0, minutes: 0, seconds: 5, total: 5010 };

    renderer.updateTime(time);

    expect(updateFireworksIntensityMock).toHaveBeenCalledWith(state.fireworksState, 5, animationState.prefersReducedMotion);
  });

  it('should not update fireworks intensity when animations are disabled', () => {
    shouldEnableAnimationsMock.mockReturnValueOnce(false);
    const renderer = fireworksTimePageRenderer(new Date());
    const time: TimeRemaining = { days: 0, hours: 0, minutes: 0, seconds: 10, total: 10000 };

    renderer.updateTime(time);

    expect(updateFireworksIntensityMock).not.toHaveBeenCalled();
  });

  it('should delegate animation state changes to transition handler', () => {
    const renderer = fireworksTimePageRenderer(new Date());
    const context: AnimationStateContext = { shouldAnimate: false, prefersReducedMotion: true };

    renderer.onAnimationStateChange(context);

    expect(handleFireworksAnimationStateChangeMock).toHaveBeenCalledWith(state, context);
  });

  it('should reset to countdown display when counting', () => {
    const renderer = fireworksTimePageRenderer(new Date());

    renderer.onCounting();

    expect(resetToCountdownDisplayMock).toHaveBeenCalledWith(state);
  });

  it.each([
    { options: { message: { forTextContent: 'text message' } }, expected: 'text message' },
    { options: { fullMessage: 'fallback message' }, expected: 'fallback message' },
    { options: undefined, expected: '' },
  ])('should trigger maximum fireworks when celebrating with derived message', ({ options, expected }) => {
    const renderer = fireworksTimePageRenderer(new Date());

    renderer.onCelebrating(options as any);

    expect(triggerMaximumFireworksMock).toHaveBeenCalledWith(state, expected);
  });

  it.each([
    { options: { message: { forTextContent: 'text message' } }, expected: 'text message' },
    { options: { fullMessage: 'fallback message' }, expected: 'fallback message' },
    { options: undefined, expected: '' },
  ])('should show static celebration when celebrated with derived message', ({ options, expected }) => {
    const renderer = fireworksTimePageRenderer(new Date());

    renderer.onCelebrated(options as any);

    expect(showStaticCelebrationMock).toHaveBeenCalledWith(state, expected);
  });

  it('should expose cleanup handles snapshot when requested', () => {
    const renderer = fireworksTimePageRenderer(new Date());

    const handles = renderer.getResourceTracker();

    expect(handles).toStrictEqual(state.resourceTracker);
    expect(handles).not.toBe(state.resourceTracker);
  });
});
