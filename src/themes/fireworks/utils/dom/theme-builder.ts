/**
 * Fireworks Theme DOM Builder
 *
 * Creates DOM structure for the fireworks theme using document.createElement().
 * All styling comes from CSS - only structural classes and data attributes here.
 */

import { CITY_SILHOUETTE_PATH, TIME_PAGE_STAR_COUNT } from '../../config';
import { createStarProperties } from '../stars';

/** References to key DOM elements for updates. */
export interface ThemeElements {
  root: HTMLElement;
  starfield: HTMLElement;
  canvas: HTMLCanvasElement;
  countdown: HTMLElement;
  celebration: HTMLElement;
  daysUnit: HTMLElement;
  hoursUnit: HTMLElement;
  minutesUnit: HTMLElement;
  secondsUnit: HTMLElement;
}

/** Create a time unit (days/hours/mins/secs) with value and label. */
function createTimeUnit(testId: string, label: string): HTMLElement {
  // NOTE: Using data-testid for E2E test targeting
  const unit = document.createElement('div');
  unit.className = 'time-unit';
  unit.setAttribute('data-testid', testId);

  const value = document.createElement('span');
  value.className = 'value';
  value.textContent = '00';

  const labelEl = document.createElement('span');
  labelEl.className = 'label';
  labelEl.textContent = label;

  unit.appendChild(value);
  unit.appendChild(labelEl);
  return unit;
}

/** Create separator element. */
function createSeparator(): HTMLElement {
  const sep = document.createElement('span');
  sep.className = 'separator';
  sep.textContent = ':';
  return sep;
}

/** Create countdown display with all time units. */
function createCountdownDisplay(): {
  countdown: HTMLElement;
  daysUnit: HTMLElement;
  hoursUnit: HTMLElement;
  minutesUnit: HTMLElement;
  secondsUnit: HTMLElement;
} {
  const countdown = document.createElement('div');
  countdown.className = 'countdown-display';
  countdown.setAttribute('data-testid', 'countdown-display');

  const daysUnit = createTimeUnit('countdown-days', 'DAYS');
  const hoursUnit = createTimeUnit('countdown-hours', 'HOURS');
  const minutesUnit = createTimeUnit('countdown-minutes', 'MINS');
  const secondsUnit = createTimeUnit('countdown-seconds', 'SECS');

  countdown.appendChild(daysUnit);
  countdown.appendChild(createSeparator());
  countdown.appendChild(hoursUnit);
  countdown.appendChild(createSeparator());
  countdown.appendChild(minutesUnit);
  countdown.appendChild(createSeparator());
  countdown.appendChild(secondsUnit);

  return { countdown, daysUnit, hoursUnit, minutesUnit, secondsUnit };
}

/** Create starfield with twinkling stars. */
function createStarfield(): HTMLElement {
  const starfield = document.createElement('div');
  starfield.className = 'starfield';
  starfield.setAttribute('aria-hidden', 'true');

  // PERF: Use DocumentFragment to batch DOM insertions (avoid layout thrashing)
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < TIME_PAGE_STAR_COUNT; i++) {
    const { x, y, size, duration, delay } = createStarProperties();
    const star = document.createElement('div');
    star.className = 'star';
    star.style.left = `${x}%`;
    star.style.top = `${y}%`;
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;
    star.style.animationDuration = `${duration}s`;
    star.style.animationDelay = `${delay}s`;
    fragment.appendChild(star);
  }
  starfield.appendChild(fragment);

  return starfield;
}

/** Create fireworks canvas. */
function createCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.className = 'fireworks-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  return canvas;
}

/** Create city silhouette SVG. */
function createCitySilhouette(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'city-silhouette';
  container.setAttribute('aria-hidden', 'true');

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 400 100');
  svg.setAttribute('preserveAspectRatio', 'none');

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', CITY_SILHOUETTE_PATH);
  path.setAttribute('fill', '#0a0a0a');

  svg.appendChild(path);
  container.appendChild(svg);
  return container;
}

/** Create celebration message element. */
function createCelebrationMessage(): HTMLElement {
  const message = document.createElement('p');
  message.className = 'celebration-message';
  message.setAttribute('data-testid', 'celebration-message');
  message.hidden = true;
  message.textContent = '🎆 Happy New Year! 🎆';
  return message;
}

/**
 * Build complete fireworks theme DOM structure.
 *
 * Creates countdown display, starfield, fireworks canvas, and city silhouette.
 * All styling comes from CSS - only structural classes and data attributes here.
 *
 * @param container - DOM element to append theme structure to
 * @returns References to key DOM elements for updates and lifecycle management
 */
export function buildThemeDOM(container: HTMLElement): ThemeElements {
  container.innerHTML = '';

  const root = document.createElement('div');
  root.className = 'fireworks-theme';

  const starfield = createStarfield();
  const canvas = createCanvas();
  const city = createCitySilhouette();
  const { countdown, daysUnit, hoursUnit, minutesUnit, secondsUnit } = createCountdownDisplay();
  const celebration = createCelebrationMessage();

  root.appendChild(starfield);
  root.appendChild(canvas);
  root.appendChild(city);
  root.appendChild(countdown);
  root.appendChild(celebration);

  container.appendChild(root);

  return {
    root,
    starfield,
    canvas,
    countdown,
    celebration,
    daysUnit,
    hoursUnit,
    minutesUnit,
    secondsUnit,
  };
}
