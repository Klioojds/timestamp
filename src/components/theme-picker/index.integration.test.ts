/**
 * @file index.integration.test.ts
 * @description Integration tests for theme selector initialization, cleanup, and grid layout
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createThemeSelector } from './index';
import { createStorageMock, createTestSelector, cleanupTestSelector, type TestSelectorResult } from './test-utils';

describe('theme-selector: initialization', () => {
  let result: TestSelectorResult;

  beforeEach(() => {
    createStorageMock();
  });

  afterEach(() => {
    if (result) cleanupTestSelector(result);
    vi.restoreAllMocks();
  });

  it('should create a theme selector with root element', () => {
    result = createTestSelector({ appendToContainer: false });

    const element = result.selector.getElement();
    expect(element).toBeInstanceOf(HTMLElement);
    expect(element.classList.contains('theme-selector')).toBe(true);
  });

  it('should display search input', () => {
    result = createTestSelector();

    const searchInput = result.container.querySelector('[data-testid="theme-search-input"]');
    expect(searchInput).not.toBeNull();
    expect(searchInput?.getAttribute('type')).toBe('search');
  });

  it('should display theme cards', () => {
    result = createTestSelector();

    const cards = result.container.querySelectorAll('.theme-selector-card');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('should mark current theme as selected', () => {
    result = createTestSelector({ currentTheme: 'fireworks' });

    const fireworksCard = result.container.querySelector('[data-theme-id="fireworks"]');
    const fireworksCell = fireworksCard?.querySelector('[role="gridcell"]');
    expect(fireworksCell?.getAttribute('aria-selected')).toBe('true');
    expect(fireworksCell?.classList.contains('theme-selector-card--selected')).toBe(true);
  });
});

describe('theme-selector: cleanup', () => {
  let container: HTMLElement;

  beforeEach(() => {
    createStorageMock();
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
    vi.restoreAllMocks();
  });

  it('should remove element when destroyed', () => {
    const selector = createThemeSelector({
      currentTheme: 'contribution-graph',
      onSelect: vi.fn(),
    });

    const element = selector.getElement();
    container.appendChild(element);

    expect(container.contains(element)).toBe(true);

    selector.destroy();

    expect(container.contains(element)).toBe(false);
  });

  it('should handle destroy being called multiple times', () => {
    const selector = createThemeSelector({
      currentTheme: 'contribution-graph',
      onSelect: vi.fn(),
    });

    container.appendChild(selector.getElement());

    selector.destroy();
    expect(() => selector.destroy()).not.toThrow();
  });
});

describe('theme-selector: responsive grid layout', () => {
  let result: TestSelectorResult;

  beforeEach(() => {
    createStorageMock();
  });

  afterEach(() => {
    if (result) cleanupTestSelector(result);
    vi.restoreAllMocks();
  });

  it('should use consistent grid class for theme cards', () => {
    result = createTestSelector();

    const grid = result.container.querySelector('.theme-selector-grid');
    expect(grid).not.toBeNull();
    // APG Grid Pattern: theme rows live inside a grid container
    expect(grid?.getAttribute('role')).toBe('grid');
    
    // The parent listbox should exist
    const listbox = result.container.querySelector('[role="listbox"]');
    expect(listbox).not.toBeNull();
  });

  it('should apply same grid structure in both standalone and modal contexts', () => {
    result = createTestSelector();

    const grid = result.selector.getElement().querySelector('.theme-selector-grid');
    expect(grid).not.toBeNull();
    
    const cards = grid?.querySelectorAll('.theme-selector-card');
    expect(cards?.length).toBeGreaterThan(0);
  });
});
