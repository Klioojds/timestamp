import { describe, expect, it } from 'vitest';
import { DEFAULT_ANIMATION_STATE, shouldEnableAnimations } from '@themes/shared';
import {
  createBaseRendererState,
  isRendererReady,
  updateRendererContainer,
} from './base-renderer-state';

const animationStates = {
  enabled: () => ({ shouldAnimate: true, prefersReducedMotion: false }),
  reduced: () => ({ shouldAnimate: true, prefersReducedMotion: true }),
  disabled: () => ({ shouldAnimate: false, prefersReducedMotion: false }),
};

describe('createBaseRendererState', () => {
  it('should initialize base fields with defaults', () => {
    const state = createBaseRendererState();

    expect(state.container).toBeNull();
    expect(state.gridState).toBeNull();
    expect(state.loopState.currentPhase).toBe('calm');
    expect(state.resourceTracker.intervals).toHaveLength(0);
    expect(state.getAnimationState()).toEqual(DEFAULT_ANIMATION_STATE);
    expect(state.resizeRafId).toBeNull();
    expect(state.periodicCleanupId).toBeNull();
  });
});

describe('isRendererReady', () => {
  it.each([
    { container: null, gridState: null, expected: false },
    { container: document.createElement('div'), gridState: null, expected: false },
    { container: null, gridState: {} as never, expected: false },
    { container: document.createElement('div'), gridState: {} as never, expected: true },
  ])('should return $expected when container=$container gridState=$gridState', ({ container, gridState, expected }) => {
    expect(isRendererReady({ container, gridState } as never)).toBe(expected);
  });
});

describe('shouldEnableAnimations', () => {
  it.each([
    { getter: animationStates.enabled, expected: true },
    { getter: animationStates.reduced, expected: false },
    { getter: animationStates.disabled, expected: false },
  ])('should return $expected for animation state getter', ({ getter, expected }) => {
    expect(shouldEnableAnimations(getter)).toBe(expected);
  });
});

describe('updateRendererContainer', () => {
  it('should update the container reference', () => {
    const state = createBaseRendererState();
    const newContainer = document.createElement('div');

    updateRendererContainer(state, newContainer);

    expect(state.container).toBe(newContainer);
  });
});
