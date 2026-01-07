import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AnimationStateContext } from '@core/types';
import { fireworksLandingPageRenderer } from './landing-page-renderer';

const {
  DEFAULT_ANIMATION_STATE,
  createLandingRendererStateMock,
  getLandingElementCountMock,
  buildStarfieldMock,
  pauseStarAnimationsMock,
  resumeStarAnimationsMock,
} = vi.hoisted(() => ({
  DEFAULT_ANIMATION_STATE: { shouldAnimate: true, prefersReducedMotion: false } satisfies AnimationStateContext,
  createLandingRendererStateMock: vi.fn(),
  getLandingElementCountMock: vi.fn(),
  buildStarfieldMock: vi.fn(),
  pauseStarAnimationsMock: vi.fn(),
  resumeStarAnimationsMock: vi.fn(),
}));

vi.mock('../utils/state', () => ({
  DEFAULT_ANIMATION_STATE,
  createLandingRendererState: createLandingRendererStateMock,
  getLandingElementCount: getLandingElementCountMock,
}));

vi.mock('../utils/dom', () => ({
  buildStarfield: buildStarfieldMock,
  pauseStarAnimations: pauseStarAnimationsMock,
  resumeStarAnimations: resumeStarAnimationsMock,
}));

describe('fireworksLandingPageRenderer', () => {
  let state: any;

  beforeEach(() => {
    state = {
      isDestroyed: false,
      getAnimationState: vi.fn(() => DEFAULT_ANIMATION_STATE),
      starfield: null,
      stars: [],
    };

    vi.clearAllMocks();
    createLandingRendererStateMock.mockReturnValue(state);
    buildStarfieldMock.mockReturnValue({ starfield: document.createElement('div'), stars: [] });
  });

  it.each([
    {
      scenario: 'default animation state is used when context is missing',
      context: undefined,
      expectedAnimate: true,
    },
    {
      scenario: 'context enables animation when allowed',
      context: { getAnimationState: vi.fn(() => ({ shouldAnimate: true, prefersReducedMotion: false })) },
      expectedAnimate: true,
    },
    {
      scenario: 'context disables animation when reduced motion is preferred',
      context: { getAnimationState: vi.fn(() => ({ shouldAnimate: true, prefersReducedMotion: true })) },
      expectedAnimate: false,
    },
  ])('should build starfield with animation flag when mounting and $scenario', ({ context, expectedAnimate }) => {
    const renderer = fireworksLandingPageRenderer(document.createElement('div'));
    const container = document.createElement('div');

    renderer.mount(container, context as any);

    expect(buildStarfieldMock).toHaveBeenCalledWith(container, expectedAnimate);
    expect(state.starfield).toBeTruthy();
  });

  it.each([
    { description: 'state is destroyed', setup: (currentState: any) => { currentState.isDestroyed = true; } },
    { description: 'starfield already exists', setup: (currentState: any) => { currentState.starfield = document.createElement('div'); } },
  ])('should skip mount when %s', ({ setup }) => {
    setup(state);
    const renderer = fireworksLandingPageRenderer(document.createElement('div'));

    renderer.mount(document.createElement('div'));

    expect(buildStarfieldMock).not.toHaveBeenCalled();
  });

  it('should ignore animation changes when starfield is missing', () => {
    const renderer = fireworksLandingPageRenderer(document.createElement('div'));

    renderer.onAnimationStateChange({ shouldAnimate: false, prefersReducedMotion: true });

    expect(pauseStarAnimationsMock).not.toHaveBeenCalled();
    expect(resumeStarAnimationsMock).not.toHaveBeenCalled();
  });

  it.each([
    {
      context: { shouldAnimate: true, prefersReducedMotion: false },
      expected: 'resume',
    },
    {
      context: { shouldAnimate: false, prefersReducedMotion: true },
      expected: 'pause',
    },
  ])('should toggle star animations when animation state changes', ({ context, expected }) => {
    const renderer = fireworksLandingPageRenderer(document.createElement('div'));
    const container = document.createElement('div');
    renderer.mount(container);

    renderer.onAnimationStateChange(context as AnimationStateContext);

    if (expected === 'resume') {
      expect(resumeStarAnimationsMock).toHaveBeenCalledWith(state.starfield, state.stars);
      expect(pauseStarAnimationsMock).not.toHaveBeenCalled();
    } else {
      expect(pauseStarAnimationsMock).toHaveBeenCalledWith(state.starfield, state.stars);
      expect(resumeStarAnimationsMock).not.toHaveBeenCalled();
    }
  });

  it('should destroy starfield and mark state as destroyed', () => {
    const renderer = fireworksLandingPageRenderer(document.createElement('div'));
    const container = document.createElement('div');
    renderer.mount(container);
    const starfield = state.starfield as HTMLElement;

    renderer.destroy();

    expect(state.isDestroyed).toBe(true);
    expect(state.starfield).toBeNull();
    expect(state.stars).toHaveLength(0);
    expect(container.contains(starfield)).toBe(false);
  });

  it('should delegate element counting to state helper', () => {
    getLandingElementCountMock.mockReturnValue({ total: 3, animated: 2 });
    const renderer = fireworksLandingPageRenderer(document.createElement('div'));

    const counts = renderer.getElementCount();

    expect(getLandingElementCountMock).toHaveBeenCalledWith(state);
    expect(counts).toEqual({ total: 3, animated: 2 });
  });
});
