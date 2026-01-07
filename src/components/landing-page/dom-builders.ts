/**
 * Landing Page DOM Builders
 * Extracted DOM building functions from landing-page.ts for organization and testing.
 *
 * @remarks
 * Static structures are defined in index.html as `<template>` elements.
 * These functions clone templates and wire up event handlers.
 */

import { getAllModeConfigs } from '@core/config/mode-config';
import { cloneTemplate, getIconSvg } from '@core/utils/dom';

/**
 * Core project dependencies displayed in the footer.
 * This data-driven array enables validation scripts to exclude these
 * from theme-specific dependency warnings.
 * 
 * @remarks
 * Maximum recommended footer links: 8 (to keep footer visually clean)
 * Theme-specific dependencies (e.g., fireworks-js) go in theme configs, not here.
 */
export const CORE_DEPENDENCIES: ReadonlyArray<{ name: string; url: string; label: string }> = [
  { name: 'natural-earth', url: 'https://www.naturalearthdata.com/', label: 'Natural Earth' },
  { name: '@primer/octicons', url: 'https://github.com/primer/octicons', label: 'Octicons' },
  { name: 'playwright', url: 'https://playwright.dev/', label: 'Playwright' },
  { name: 'suncalc', url: 'https://github.com/mourner/suncalc', label: 'SunCalc' },
  { name: 'typescript', url: 'https://www.typescriptlang.org/', label: 'TypeScript' },
  { name: 'vite', url: 'https://vitejs.dev/', label: 'Vite' },
  { name: 'vitest', url: 'https://vitest.dev/', label: 'Vitest' },
] as const;

/**
 * Build mode selector fieldset with wall-clock, absolute, and timer radio options.
 * @remarks
 * Clones template and dynamically generates options from `getAllModeConfigs()`.
 * @returns Fieldset element with mode radio buttons
 */
export function buildModeSelector(): HTMLFieldSetElement {
  const fieldset = cloneTemplate<HTMLFieldSetElement>('mode-selector-template');
  const modeGroup = fieldset.querySelector('.landing-mode-group') as HTMLElement;

  // Generate mode options from config
  for (const { mode, config } of getAllModeConfigs()) {
    const { icon, displayName, subtitle, testIdPrefix, description } = config;
    const optionDiv = document.createElement('div');
    optionDiv.className = 'landing-mode-option';
    optionDiv.innerHTML = `
      <input 
        type="radio" 
        name="mode" 
        value="${mode}" 
        id="mode-${mode}"
        data-testid="${testIdPrefix}"
        aria-label="${displayName} mode: ${description}"
      />
      <label class="landing-mode-label" for="mode-${mode}">
        <span class="landing-mode-check">
          ${getIconSvg('check', 16)}
        </span>
        <span class="landing-mode-icon">${icon}</span>
        <span class="landing-mode-text-container">
          <span class="landing-mode-text">${displayName}</span>
          <span class="landing-mode-subtitle">${subtitle}</span>
          <span class="landing-mode-description">${description}</span>
        </span>
      </label>
    `;
    modeGroup.appendChild(optionDiv);
  }

  return fieldset;
}

/**
 * Build completion message section (unified for all modes).
 * @returns Section element with message textarea
 */
export function buildCompletionMessageSection(): HTMLElement {
  return cloneTemplate<HTMLElement>('completion-message-template');
}

/** Default completion message for date mode countdowns. */
export const DATE_MODE_DEFAULT_MESSAGE = 'Hooray!';

/** Completion message specifically for New Year countdowns. */
export const NEW_YEAR_MESSAGE = 'Happy New Year!';

/**
 * Build date section with datetime-local input.
 * @returns Section element with date input and error display
 */
export function buildDateSection(): HTMLElement {
  return cloneTemplate<HTMLElement>('date-section-template');
}

/**
 * Build timer section with duration inputs.
 * @returns Section element with duration inputs and error display
 */
export function buildTimerSection(): HTMLElement {
  return cloneTemplate<HTMLElement>('timer-section-template');
}

/**
 * Build footer with attribution and technology credits.
 * @remarks
 * Clones template and injects tech list from `CORE_DEPENDENCIES`.
 * @returns Footer element with links and credits
 */
export function buildFooter(): HTMLElement {
  const footer = cloneTemplate<HTMLElement>('landing-footer-template');
  const techList = footer.querySelector('.landing-footer-tech-list') as HTMLElement;
  const copilotLink = footer.querySelector('.landing-footer-copilot-link') as HTMLAnchorElement;
  const starLink = footer.querySelector('.landing-footer-star-link') as HTMLAnchorElement;
  const themeLink = footer.querySelector('.landing-footer-theme-link') as HTMLAnchorElement;

  // Inject Copilot icon and text
  copilotLink.innerHTML = `${getIconSvg('copilot', 16)}<span>GitHub Copilot</span>`;

  // Inject GitHub icon into star link (prepend before text)
  const starText = starLink.querySelector('span')!;
  starLink.insertBefore(
    Object.assign(document.createElement('span'), { innerHTML: getIconSvg('mark-github', 20) }).firstElementChild!,
    starText
  );

  // Inject plus icon into theme link (prepend before text)
  const themeText = themeLink.querySelector('span')!;
  themeLink.insertBefore(
    Object.assign(document.createElement('span'), { innerHTML: getIconSvg('plus', 20) }).firstElementChild!,
    themeText
  );

  // Generate tech list HTML from CORE_DEPENDENCIES
  const techListHtml = CORE_DEPENDENCIES
    .map((dep, index) => {
      const separator = index < CORE_DEPENDENCIES.length - 1 
        ? '<span class="landing-footer-separator">•</span>' 
        : '';
      return `<a href="${dep.url}" target="_blank" rel="noopener noreferrer" aria-label="${dep.label}">${dep.label}</a>${separator}`;
    })
    .join('\n');
  techList.innerHTML = techListHtml;

  return footer;
}
