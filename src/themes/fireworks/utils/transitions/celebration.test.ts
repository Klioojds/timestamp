/** Tests for fireworks celebration transitions. */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createRendererState } from '../state';
import type { CountdownDOMRefs } from '../dom';
import * as domUtils from '../dom';
import * as fireworksUtils from '../fireworks';
import {
  triggerMaximumFireworks,
  showStaticCelebration,
  resetToCountdownDisplay,
} from './celebration';

/** Creates mock countdown DOM refs for testing. */
function createMockCountdownRefs(): CountdownDOMRefs {
  return {
    daysUnit: document.createElement('div'),
    hoursUnit: document.createElement('div'),
    minsValue: document.createElement('span'),
    secsValue: document.createElement('span'),
    daysSep: document.createElement('span'),
    hoursSep: document.createElement('span'),
    countdownEl: document.createElement('div'),
    celebrationEl: document.createElement('p'),
  };
}

describe('celebration transitions', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('triggerMaximumFireworks', () => {
    it('should not execute when renderer not ready', () => {
      const state = createRendererState();
      const showCelebrationSpy = vi.spyOn(domUtils, 'showCelebration').mockImplementation(() => {});

      triggerMaximumFireworks(state, 'Happy New Year!');

      expect(showCelebrationSpy).not.toHaveBeenCalled();
    });

    it('should not execute when countdownRefs is null', () => {
      const state = createRendererState();
      state.container = document.createElement('div');
      state.themeRoot = document.createElement('div');
      // countdownRefs is still null
      const showCelebrationSpy = vi.spyOn(domUtils, 'showCelebration').mockImplementation(() => {});

      triggerMaximumFireworks(state, 'Happy New Year!');

      expect(showCelebrationSpy).not.toHaveBeenCalled();
    });

    it('should show celebration message when renderer ready', () => {
      const state = createRendererState();
      state.container = document.createElement('div');
      state.themeRoot = document.createElement('div');
      state.countdownRefs = createMockCountdownRefs();
      const showCelebrationSpy = vi.spyOn(domUtils, 'showCelebration').mockImplementation(() => {});

      triggerMaximumFireworks(state, 'Happy New Year!');

      expect(showCelebrationSpy).toHaveBeenCalledWith(state.countdownRefs, 'Happy New Year!');
    });

    it('should not show celebration when message is empty', () => {
      const state = createRendererState();
      state.container = document.createElement('div');
      state.themeRoot = document.createElement('div');
      state.countdownRefs = createMockCountdownRefs();
      const showCelebrationSpy = vi.spyOn(domUtils, 'showCelebration').mockImplementation(() => {});

      triggerMaximumFireworks(state, '');

      expect(showCelebrationSpy).not.toHaveBeenCalled();
    });

    it('should trigger maximum intensity fireworks', () => {
      const state = createRendererState();
      state.container = document.createElement('div');
      state.themeRoot = document.createElement('div');
      state.countdownRefs = createMockCountdownRefs();
      state.getAnimationState = () => ({ shouldAnimate: true, prefersReducedMotion: false });
      const intensitySpy = vi
        .spyOn(fireworksUtils, 'updateFireworksIntensity')
        .mockImplementation(() => {});

      triggerMaximumFireworks(state, 'Happy New Year!');

      expect(intensitySpy).toHaveBeenCalledWith(state.fireworksState, 0, false);
    });

    it('should pass reduced motion preference to intensity update', () => {
      const state = createRendererState();
      state.container = document.createElement('div');
      state.themeRoot = document.createElement('div');
      state.countdownRefs = createMockCountdownRefs();
      state.getAnimationState = () => ({ shouldAnimate: true, prefersReducedMotion: true });
      const intensitySpy = vi
        .spyOn(fireworksUtils, 'updateFireworksIntensity')
        .mockImplementation(() => {});

      triggerMaximumFireworks(state, '');

      expect(intensitySpy).toHaveBeenCalledWith(state.fireworksState, 0, true);
    });
  });

  describe('showStaticCelebration', () => {
    it('should not execute when renderer not ready', () => {
      const state = createRendererState();
      const showCelebrationSpy = vi.spyOn(domUtils, 'showCelebration').mockImplementation(() => {});

      showStaticCelebration(state, 'Celebration!');

      expect(showCelebrationSpy).not.toHaveBeenCalled();
    });

    it('should not execute when countdownRefs is null', () => {
      const state = createRendererState();
      state.container = document.createElement('div');
      state.themeRoot = document.createElement('div');
      // countdownRefs is still null
      const showCelebrationSpy = vi.spyOn(domUtils, 'showCelebration').mockImplementation(() => {});

      showStaticCelebration(state, 'Already Celebrated!');

      expect(showCelebrationSpy).not.toHaveBeenCalled();
    });

    it('should show celebration message when renderer ready', () => {
      const state = createRendererState();
      state.container = document.createElement('div');
      state.themeRoot = document.createElement('div');
      state.countdownRefs = createMockCountdownRefs();
      const showCelebrationSpy = vi.spyOn(domUtils, 'showCelebration').mockImplementation(() => {});

      showStaticCelebration(state, 'Already Celebrated!');

      expect(showCelebrationSpy).toHaveBeenCalledWith(state.countdownRefs, 'Already Celebrated!');
    });

    it('should not show celebration when message is empty', () => {
      const state = createRendererState();
      state.container = document.createElement('div');
      state.themeRoot = document.createElement('div');
      state.countdownRefs = createMockCountdownRefs();
      const showCelebrationSpy = vi.spyOn(domUtils, 'showCelebration').mockImplementation(() => {});

      showStaticCelebration(state, '');

      expect(showCelebrationSpy).not.toHaveBeenCalled();
    });

    it('should set maximum intensity for static celebration', () => {
      const state = createRendererState();
      state.container = document.createElement('div');
      state.themeRoot = document.createElement('div');
      state.countdownRefs = createMockCountdownRefs();
      state.getAnimationState = () => ({ shouldAnimate: true, prefersReducedMotion: false });
      const intensitySpy = vi
        .spyOn(fireworksUtils, 'updateFireworksIntensity')
        .mockImplementation(() => {});

      showStaticCelebration(state, 'Done!');

      expect(intensitySpy).toHaveBeenCalledWith(state.fireworksState, 0, false);
    });
  });

  describe('resetToCountdownDisplay', () => {
    it('should not execute when renderer not ready', () => {
      const state = createRendererState();
      const showCountdownSpy = vi.spyOn(domUtils, 'showCountdown').mockImplementation(() => {});

      resetToCountdownDisplay(state);

      expect(showCountdownSpy).not.toHaveBeenCalled();
    });

    it('should not execute when countdownRefs is null', () => {
      const state = createRendererState();
      state.container = document.createElement('div');
      state.themeRoot = document.createElement('div');
      // countdownRefs is still null
      const showCountdownSpy = vi.spyOn(domUtils, 'showCountdown').mockImplementation(() => {});

      resetToCountdownDisplay(state);

      expect(showCountdownSpy).not.toHaveBeenCalled();
    });

    it('should show countdown when renderer ready', () => {
      const state = createRendererState();
      state.container = document.createElement('div');
      state.themeRoot = document.createElement('div');
      state.countdownRefs = createMockCountdownRefs();
      const showCountdownSpy = vi.spyOn(domUtils, 'showCountdown').mockImplementation(() => {});

      resetToCountdownDisplay(state);

      expect(showCountdownSpy).toHaveBeenCalledWith(state.countdownRefs);
    });
  });
});
