/**
 * Theme Focus Helpers - Unit Tests
 * @module orchestrator/theme-manager/focus-helpers.test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { TimeRemaining, ThemeId } from '@core/types';
import {
  setupThemeContainer,
  preserveFocusWithin,
  restoreFocusWithin,
  getCountdownAccessibleName,
} from './theme-focus-preservation';

describe('setupThemeContainer', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('should set required accessibility attributes when theme container is initialized', () => {
    const ariaLabel = 'Test countdown';
    setupThemeContainer(container, 'contribution-graph', ariaLabel);

    expect(container.getAttribute('data-testid')).toBe('theme-container');
    expect(container.getAttribute('data-theme')).toBe('contribution-graph');
    expect(container.getAttribute('role')).toBe('region');
    expect(container.getAttribute('aria-label')).toBe(ariaLabel);
    expect(container.tabIndex).toBe(-1);
  });

  it('should apply default aria-label when description is missing', () => {
    setupThemeContainer(container, 'fireworks', undefined);
    expect(container.getAttribute('aria-label')).toBe('Countdown display');
  });

  it.each([
    { themeId: 'contribution-graph' as ThemeId, description: 'Contribution Graph theme' },
    { themeId: 'fireworks' as ThemeId, description: 'Fireworks theme' },
  ])('should set data-theme attribute when $description is provided', ({ themeId }) => {
    const localContainer = document.createElement('div');
    setupThemeContainer(localContainer, themeId, 'Theme test');
    expect(localContainer.getAttribute('data-theme')).toBe(themeId);
  });
});

describe('preserveFocusWithin', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
  });

  afterEach(() => {
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  });

  it.each([
    {
      scenario: 'focus is already inside container',
      setup: (root: HTMLElement) => {
        const button = document.createElement('button');
        root.appendChild(button);
        document.body.appendChild(root);
        button.focus();
        return button;
      },
      expected: (element: HTMLElement | null, root: HTMLElement) => element,
    },
    {
      scenario: 'focus is outside container but focusable exists',
      setup: (root: HTMLElement) => {
        const button = document.createElement('button');
        root.appendChild(button);
        return button;
      },
      expected: (_element: HTMLElement | null, root: HTMLElement) => root.querySelector('button'),
    },
    {
      scenario: 'no focusable elements',
      setup: (root: HTMLElement) => root,
      expected: (_element: HTMLElement | null, root: HTMLElement) => root,
    },
  ])('should preserve focus when $scenario', ({ setup, expected }) => {
    const element = setup(container);
    const preserved = preserveFocusWithin(container);
    expect(preserved).toBe(expected(element, container));
  });

  it('should prioritize currently focused element over first focusable option', () => {
    const button1 = document.createElement('button');
    const button2 = document.createElement('button');
    container.appendChild(button1);
    container.appendChild(button2);
    document.body.appendChild(container);
    button2.focus();

    const preserved = preserveFocusWithin(container);
    expect(preserved).toBe(button2);
  });
});

describe('restoreFocusWithin', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
  });

  afterEach(() => {
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  });

  it.each([
    {
      scenario: 'preserved element is still valid',
      setup: (root: HTMLElement) => {
        const button = document.createElement('button');
        root.appendChild(button);
        document.body.appendChild(root);
        return button;
      },
      expected: (root: HTMLElement, preserved: HTMLElement | null) => preserved,
    },
    {
      scenario: 'preserved element is null',
      setup: (root: HTMLElement) => {
        root.tabIndex = -1;
        document.body.appendChild(root);
        return null;
      },
      expected: (root: HTMLElement) => root,
    },
    {
      scenario: 'preserved element is outside container',
      setup: (root: HTMLElement) => {
        const externalButton = document.createElement('button');
        root.tabIndex = -1;
        document.body.appendChild(root);
        document.body.appendChild(externalButton);
        return externalButton;
      },
      expected: (root: HTMLElement) => root,
    },
    {
      scenario: 'preserved element was removed',
      setup: (root: HTMLElement) => {
        const button = document.createElement('button');
        root.appendChild(button);
        document.body.appendChild(root);
        root.removeChild(button);
        root.tabIndex = -1;
        return button;
      },
      expected: (root: HTMLElement) => root,
    },
  ])('should restore focus when $scenario', ({ setup, expected }) => {
    const preserved = setup(container);

    restoreFocusWithin(container, preserved);

    expect(document.activeElement).toBe(expected(container, preserved));

    if (preserved && preserved.parentNode && preserved !== container) {
      preserved.parentNode.removeChild(preserved);
    }
  });
});

describe('getCountdownAccessibleName', () => {
  it.each([
    {
      description: 'multiple units without seconds',
      time: { days: 5, hours: 3, minutes: 45, seconds: 20, total: 450320000 },
      expectedInclusions: ['Countdown:', '5 days', '3 hours', '45 minutes'],
      expectedExclusions: ['seconds'],
    },
    {
      description: 'zero days omitted from label',
      time: { days: 0, hours: 3, minutes: 45, seconds: 20, total: 13520000 },
      expectedInclusions: ['Countdown:', '3 hours', '45 minutes'],
      expectedExclusions: ['0 days', 'seconds'],
    },
    {
      description: 'singular units are correctly pluralized',
      time: { days: 1, hours: 1, minutes: 1, seconds: 30, total: 90090000 },
      expectedInclusions: ['1 day', '1 hour', '1 minute'],
      expectedExclusions: ['second'],
    },
  ])('should format accessible name when $description', ({ time, expectedInclusions, expectedExclusions }) => {
    const name = getCountdownAccessibleName(time as TimeRemaining, false);
    expectedInclusions.forEach((phrase) => expect(name).toContain(phrase));
    expectedExclusions.forEach((phrase) => expect(name).not.toContain(phrase));
  });

  it.each([
    { description: 'countdown completed', time: null, isComplete: true, expected: 'The countdown has completed.' },
    { description: 'time not yet available', time: null, isComplete: false, expected: 'Countdown display' },
  ])('should return correct message when $description', ({ time, isComplete, expected }) => {
    const name = getCountdownAccessibleName(time, isComplete);
    expect(name).toBe(expected);
  });

  it('shows "less than 1 minute" when only seconds remain', () => {
    const time: TimeRemaining = { days: 0, hours: 0, minutes: 0, seconds: 45, total: 45000 };
    const name = getCountdownAccessibleName(time, false);
    expect(name).toBe('Countdown: less than 1 minute');
  });
});

describe('aria-label throttling (Performance)', () => {
  it('produces same string when only seconds change', () => {
    const time1: TimeRemaining = { days: 5, hours: 3, minutes: 45, seconds: 20, total: 450320000 };
    const time2: TimeRemaining = { days: 5, hours: 3, minutes: 45, seconds: 19, total: 450319000 };

    const label1 = getCountdownAccessibleName(time1, false);
    const label2 = getCountdownAccessibleName(time2, false);

    expect(label1).toBe(label2);
    expect(label1).toBe('Countdown: 5 days, 3 hours, 45 minutes');
  });

  it('produces different strings when minutes change', () => {
    const time1: TimeRemaining = { days: 5, hours: 3, minutes: 45, seconds: 20, total: 450320000 };
    const time2: TimeRemaining = { days: 5, hours: 3, minutes: 44, seconds: 59, total: 450299000 };

    const label1 = getCountdownAccessibleName(time1, false);
    const label2 = getCountdownAccessibleName(time2, false);

    expect(label1).not.toBe(label2);
    expect(label1).toContain('45 minutes');
    expect(label2).toContain('44 minutes');
  });
});
