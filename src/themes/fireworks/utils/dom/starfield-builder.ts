/**
 * Landing Page Starfield Builder
 *
 * Creates starfield DOM for the landing page.
 */

import { LANDING_PAGE_STAR_COUNT } from '../../config';
import { createStarProperties } from '../stars';

/** Create a single star element. Animation controlled via CSS custom properties. */
function createStar(): HTMLElement {
  const { x, y, size, duration, delay } = createStarProperties();
  const star = document.createElement('div');
  star.className = 'landing-star';
  // Dynamic values only - static styles in CSS
  star.style.left = `${x}%`;
  star.style.top = `${y}%`;
  star.style.width = `${size}px`;
  star.style.height = `${size}px`;
  star.style.setProperty('--duration', `${duration}s`);
  star.style.setProperty('--delay', `${delay}s`);
  return star;
}

/**
 * Build landing page starfield with twinkling star animations.
 *
 * @param container - DOM element to append starfield to (will be cleared first)
 * @param shouldAnimate - Whether to start animations (false for reduced motion)
 * @returns Object with starfield container and array of star elements
 */
export function buildStarfield(
  container: HTMLElement,
  shouldAnimate: boolean
): { starfield: HTMLElement; stars: HTMLElement[] } {
  container.innerHTML = '';

  const starfield = document.createElement('div');
  starfield.className = 'landing-fireworks-starfield';
  starfield.setAttribute('aria-hidden', 'true');

  // NOTE: Start paused if animations disabled (respects prefers-reduced-motion)
  if (!shouldAnimate) {
    starfield.classList.add('is-paused');
  }

  const stars: HTMLElement[] = [];
  // PERF: Use DocumentFragment to batch DOM insertions
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < LANDING_PAGE_STAR_COUNT; i++) {
    const star = createStar();
    stars.push(star);
    fragment.appendChild(star);
  }

  starfield.appendChild(fragment);
  container.appendChild(starfield);

  return { starfield, stars };
}

/**
 * Pause star animations (for reduced motion or tab hidden).
 * @param starfield - Starfield container element
 * @param _stars - Star elements (unused, maintained for API consistency)
 */
export function pauseStarAnimations(starfield: HTMLElement, _stars: HTMLElement[]): void {
  starfield.classList.add('is-paused');
}

/**
 * Resume star animations.
 * @param starfield - Starfield container element
 * @param _stars - Star elements (unused, maintained for API consistency)
 */
export function resumeStarAnimations(starfield: HTMLElement, _stars: HTMLElement[]): void {
  starfield.classList.remove('is-paused');
}
