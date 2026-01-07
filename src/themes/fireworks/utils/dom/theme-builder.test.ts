import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { TIME_PAGE_STAR_COUNT, CITY_SILHOUETTE_PATH } from '../../config';
import * as stars from '../stars';
import { buildThemeDOM } from './theme-builder';

describe('buildThemeDOM', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should clear container before building DOM', () => {
    container.innerHTML = '<p id="old">old</p>';

    buildThemeDOM(container);

    expect(container.querySelector('#old')).toBeNull();
  });

  it('should create root theme element with expected children', () => {
    const elements = buildThemeDOM(container);

    expect(container.firstElementChild).toBe(elements.root);
    expect(elements.root.className).toBe('fireworks-theme');
    expect(elements.root.contains(elements.starfield)).toBe(true);
    expect(elements.root.contains(elements.canvas)).toBe(true);
    expect(elements.root.contains(elements.countdown)).toBe(true);
    expect(elements.root.contains(elements.celebration)).toBe(true);
  });

  it.each([
    { key: 'daysUnit', testId: 'countdown-days', label: 'DAYS' },
    { key: 'hoursUnit', testId: 'countdown-hours', label: 'HOURS' },
    { key: 'minutesUnit', testId: 'countdown-minutes', label: 'MINS' },
    { key: 'secondsUnit', testId: 'countdown-seconds', label: 'SECS' },
  ])('should create $key with data-testid and label', ({ key, testId, label }) => {
    const elements = buildThemeDOM(container);
    const unit = elements[key as keyof typeof elements] as HTMLElement;

    expect(unit.getAttribute('data-testid')).toBe(testId);
    expect(unit.querySelector('.label')?.textContent).toBe(label);
    expect(unit.querySelector('.value')?.textContent).toBe('00');
  });

  it('should include separators between time units', () => {
    const { countdown } = buildThemeDOM(container);
    const separators = countdown.querySelectorAll('.separator');

    expect(separators).toHaveLength(3);
    separators.forEach((separator) => {
      expect(separator.textContent).toBe(':');
    });
  });

  it('should build starfield with configured star count and styles', () => {
    let callIndex = 0;
    vi.spyOn(stars, 'createStarProperties').mockImplementation(() => {
      const index = callIndex++;
      return { x: index, y: index + 1, size: index + 2, duration: 0.5 + index, delay: 0.1 * index };
    });

    const { starfield } = buildThemeDOM(container);
    const starsInDom = starfield.querySelectorAll('.star');
    const firstStar = starsInDom[0] as HTMLElement;
    const lastStar = starsInDom[starsInDom.length - 1] as HTMLElement;

    expect(stars.createStarProperties).toHaveBeenCalledTimes(TIME_PAGE_STAR_COUNT);
    expect(starsInDom).toHaveLength(TIME_PAGE_STAR_COUNT);
    expect(starfield.getAttribute('aria-hidden')).toBe('true');

    expect(firstStar.style.left).toBe('0%');
    expect(firstStar.style.top).toBe('1%');
    expect(firstStar.style.width).toBe('2px');
    expect(firstStar.style.height).toBe('2px');
    expect(firstStar.style.animationDuration).toBe('0.5s');
    expect(firstStar.style.animationDelay).toBe('0s');

    const lastIndex = TIME_PAGE_STAR_COUNT - 1;
    expect(lastStar.style.left).toBe(`${lastIndex}%`);
    expect(lastStar.style.top).toBe(`${lastIndex + 1}%`);
    expect(lastStar.style.width).toBe(`${lastIndex + 2}px`);
    expect(lastStar.style.height).toBe(`${lastIndex + 2}px`);
    expect(lastStar.style.animationDuration).toBe(`${0.5 + lastIndex}s`);
    expect(lastStar.style.animationDelay).toBe(`${0.1 * lastIndex}s`);
  });

  it('should create canvas element with aria-hidden true', () => {
    const { canvas } = buildThemeDOM(container);

    expect(canvas.tagName).toBe('CANVAS');
    expect(canvas.className).toBe('fireworks-canvas');
    expect(canvas.getAttribute('aria-hidden')).toBe('true');
  });

  it('should build city silhouette SVG structure', () => {
    const { root } = buildThemeDOM(container);
    const city = root.querySelector('.city-silhouette') as HTMLElement | null;
    const svg = city?.querySelector('svg');
    const path = svg?.querySelector('path');

    expect(city?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.getAttribute('viewBox')).toBe('0 0 400 100');
    expect(svg?.getAttribute('preserveAspectRatio')).toBe('none');
    expect(path?.getAttribute('d')).toBe(CITY_SILHOUETTE_PATH);
    expect(path?.getAttribute('fill')).toBe('#0a0a0a');
  });

  it('should create hidden celebration message with default text', () => {
    const { celebration } = buildThemeDOM(container);

    expect(celebration.className).toBe('celebration-message');
    expect(celebration.getAttribute('data-testid')).toBe('celebration-message');
    expect(celebration.hidden).toBe(true);
    expect(celebration.textContent).toBe('🎆 Happy New Year! 🎆');
  });
});
