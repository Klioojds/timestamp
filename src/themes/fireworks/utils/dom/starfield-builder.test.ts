import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { LANDING_PAGE_STAR_COUNT } from '../../config';
import * as stars from '../stars';
import { buildStarfield, pauseStarAnimations, resumeStarAnimations } from './starfield-builder';

describe('buildStarfield', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should clear container and render starfield wrapper', () => {
    container.innerHTML = '<p>old</p>';

    const { starfield } = buildStarfield(container, true);

    expect(container.querySelector('p')).toBeNull();
    expect(container.firstElementChild).toBe(starfield);
    expect(starfield.classList.contains('landing-fireworks-starfield')).toBe(true);
    expect(starfield.getAttribute('aria-hidden')).toBe('true');
  });

  it.each([
    { shouldAnimate: true, expectedPaused: false },
    { shouldAnimate: false, expectedPaused: true },
  ])('should set paused class based on shouldAnimate=$shouldAnimate', ({ shouldAnimate, expectedPaused }) => {
    const { starfield } = buildStarfield(container, shouldAnimate);

    expect(starfield.classList.contains('is-paused')).toBe(expectedPaused);
  });

  it('should create stars with configured count and styles', () => {
    let callIndex = 0;
    vi.spyOn(stars, 'createStarProperties').mockImplementation(() => {
      const index = callIndex++;
      return { x: index, y: index + 2, size: index + 3, duration: 1 + index, delay: 0.2 * index };
    });

    const { starfield, stars: starElements } = buildStarfield(container, true);
    const firstStar = starElements[0];
    const lastStar = starElements[starElements.length - 1];

    expect(stars.createStarProperties).toHaveBeenCalledTimes(LANDING_PAGE_STAR_COUNT);
    expect(starElements).toHaveLength(LANDING_PAGE_STAR_COUNT);
    expect(starfield.childElementCount).toBe(LANDING_PAGE_STAR_COUNT);

    expect(firstStar.style.left).toBe('0%');
    expect(firstStar.style.top).toBe('2%');
    expect(firstStar.style.width).toBe('3px');
    expect(firstStar.style.height).toBe('3px');
    expect(firstStar.style.getPropertyValue('--duration')).toBe('1s');
    expect(firstStar.style.getPropertyValue('--delay')).toBe('0s');

    const lastIndex = LANDING_PAGE_STAR_COUNT - 1;
    expect(lastStar.style.left).toBe(`${lastIndex}%`);
    expect(lastStar.style.top).toBe(`${lastIndex + 2}%`);
    expect(lastStar.style.width).toBe(`${lastIndex + 3}px`);
    expect(lastStar.style.height).toBe(`${lastIndex + 3}px`);
    expect(lastStar.style.getPropertyValue('--duration')).toBe(`${1 + lastIndex}s`);
    expect(lastStar.style.getPropertyValue('--delay')).toBe(`${0.2 * lastIndex}s`);
  });
});

describe('starfield animation controls', () => {
  it('should add paused class when pausing animations', () => {
    const starfield = document.createElement('div');

    pauseStarAnimations(starfield, []);

    expect(starfield.classList.contains('is-paused')).toBe(true);
  });

  it('should remove paused class when resuming animations', () => {
    const starfield = document.createElement('div');
    starfield.classList.add('is-paused');

    resumeStarAnimations(starfield, []);

    expect(starfield.classList.contains('is-paused')).toBe(false);
  });
});
