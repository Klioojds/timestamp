/**
 * Timezone Selector DOM Builders Tests
 * Tests for DOM element construction functions.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildSelectorDOM, buildOptionHTML, applyThemeStyles } from './dom-builders';
import type { TimezoneOption } from './options';

// Mock formatOffsetLabel
vi.mock('@core/time/timezone', () => ({
  formatOffsetLabel: vi.fn((tz: string, _ref: string) => {
    const offsets: Record<string, string> = {
      'America/New_York': '-5 hours',
      'Europe/London': 'Your timezone',
    };
    return offsets[tz] ?? '+0 hours';
  }),
}));

describe('Timezone Selector DOM Builders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('buildSelectorDOM', () => {
    it('should create trigger, dropdown, search input, and list container', () => {
      const wrapper = document.createElement('div');

      const refs = buildSelectorDOM(wrapper, false);

      expect(refs.trigger.classList.contains('timezone-selector-trigger')).toBe(true);
      expect(refs.dropdown.getAttribute('role')).toBe('listbox');
      expect(refs.searchInput.getAttribute('aria-label')).toBe('Search timezones');
      expect(wrapper.querySelector('.dropdown-list')).toBe(refs.listContainer);
      expect(wrapper.querySelector('.selector-value')).toBe(refs.valueDisplay);
    });

    it('should wire aria attributes on trigger', () => {
      const wrapper = document.createElement('div');

      const { trigger } = buildSelectorDOM(wrapper, false);

      expect(trigger.getAttribute('aria-haspopup')).toBe('listbox');
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });

    it('should apply position variant class based on inline mode', () => {
      const inlineWrapper = document.createElement('div');
      const fixedWrapper = document.createElement('div');

      buildSelectorDOM(inlineWrapper, true);
      buildSelectorDOM(fixedWrapper, false);

      expect(inlineWrapper.classList.contains('timezone-selector-wrapper--inline')).toBe(true);
      expect(fixedWrapper.classList.contains('timezone-selector-wrapper--fixed')).toBe(true);
    });

    it('should not inject inline styles (uses external CSS)', () => {
      const wrapper = document.createElement('div');
      buildSelectorDOM(wrapper, false);

      // No <style> element should be injected - styles come from external CSS
      const styleElement = wrapper.querySelector('style');
      expect(styleElement).toBeNull();
    });
  });

  describe('buildOptionHTML', () => {
    const option: TimezoneOption = {
      value: 'America/New_York',
      label: 'New York (-5 hours)',
      city: 'New York',
      isFeatured: true,
      isUserZone: false,
      isCelebrating: false,
    };

    it('should create button with correct attributes', () => {
      const html = buildOptionHTML(option, 0, 'Europe/London', 'Europe/London');
      expect(html).toContain('class="dropdown-option');
      expect(html).toContain('data-value="America/New_York"');
      expect(html).toContain('role="option"');
    });

    it('should add unique ID based on index', () => {
      const html1 = buildOptionHTML(option, 0, 'Europe/London', 'Europe/London');
      const html2 = buildOptionHTML(option, 5, 'Europe/London', 'Europe/London');

      expect(html1).toContain('id="tz-option-0"');
      expect(html2).toContain('id="tz-option-5"');
    });

    it.each([
      {
        description: 'selected option',
        current: 'America/New_York',
        expectedClass: true,
        expectedAria: 'true',
      },
      {
        description: 'unselected option',
        current: 'Europe/London',
        expectedClass: false,
        expectedAria: 'false',
      },
    ])('should render $description state', ({ current, expectedClass, expectedAria }) => {
      const html = buildOptionHTML(option, 0, current, 'Europe/London');

      expect(html.includes('class="dropdown-option selected"')).toBe(expectedClass);
      expect(html).toContain(`aria-selected="${expectedAria}"`);
    });

    it('should add celebrating class for celebrating timezones', () => {
      const celebratingOption: TimezoneOption = {
        ...option,
        isCelebrating: true,
      };
      const html = buildOptionHTML(
        celebratingOption,
        0,
        'Europe/London',
        'Europe/London'
      );
      expect(html).toContain('class="option-indicator celebrating"');
    });

    it('should use city name as display text when available', () => {
      const html = buildOptionHTML(option, 0, 'Europe/London', 'Europe/London');
      expect(html).toContain('<span class="option-label">New York</span>');
    });

    it('should use label when city is not available', () => {
      const noCityOption: TimezoneOption = {
        ...option,
        city: undefined,
      };
      const html = buildOptionHTML(
        noCityOption,
        0,
        'Europe/London',
        'Europe/London'
      );
      expect(html).toContain('New York (-5 hours)');
    });
  });

  describe('applyThemeStyles', () => {
    it('should apply CSS custom properties to element', () => {
      const wrapper = document.createElement('div');
      const styles = {
        '--theme-tz-bg': 'red',
        '--theme-tz-border': 'blue',
      };

      applyThemeStyles(wrapper, styles);

      expect(wrapper.style.getPropertyValue('--theme-tz-bg')).toBe('red');
      expect(wrapper.style.getPropertyValue('--theme-tz-border')).toBe('blue');
    });

    it('should handle empty styles object', () => {
      const wrapper = document.createElement('div');
      applyThemeStyles(wrapper, {});
      expect(wrapper.style.cssText).toBe('');
    });
  });
});
