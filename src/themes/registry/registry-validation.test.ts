/**
 * Tests for Theme Registry Validation Utilities
 */
import { describe, it, expect } from 'vitest';
import {
  getThemeIds,
  getValidThemes,
  isValidThemeId,
  validateThemeId,
  validateTimePageRenderer,
  validateLandingPageRenderer,
} from './registry-validation';
import { DEFAULT_THEME_ID } from './registry-core';
import type { TimePageRenderer, LandingPageRenderer } from '@core/types';

describe('Registry Validation', () => {
  describe('getThemeIds', () => {
    it('should return an array of theme IDs', () => {
      const ids = getThemeIds();
      expect(Array.isArray(ids)).toBe(true);
      expect(ids.length).toBeGreaterThan(0);
    });

    it('should include contribution-graph and fireworks', () => {
      const ids = getThemeIds();
      expect(ids).toContain('contribution-graph');
      expect(ids).toContain('fireworks');
    });

    it('should return fresh array on each call', () => {
      const ids1 = getThemeIds();
      const ids2 = getThemeIds();
      expect(ids1).not.toBe(ids2);
      expect(ids1).toEqual(ids2);
    });
  });

  describe('getValidThemes', () => {
    it('should return a Set of theme IDs', () => {
      const themes = getValidThemes();
      expect(themes instanceof Set).toBe(true);
      expect(themes.size).toBeGreaterThan(0);
    });

    it('should contain all registered themes', () => {
      const themes = getValidThemes();
      expect(themes.has('contribution-graph')).toBe(true);
      expect(themes.has('fireworks')).toBe(true);
    });

    it('should have same size as getThemeIds array', () => {
      const themes = getValidThemes();
      const ids = getThemeIds();
      expect(themes.size).toBe(ids.length);
    });
  });

  describe('isValidThemeId', () => {
    it.each([
      { value: 'contribution-graph', expected: true },
      { value: 'fireworks', expected: true },
      { value: 'invalid-theme', expected: false },
      { value: '', expected: false },
      { value: null, expected: false },
      { value: undefined, expected: false },
      { value: 123, expected: false },
      { value: {}, expected: false },
      { value: [], expected: false },
      { value: true, expected: false },
    ])('should return $expected for "$value"', ({ value, expected }) => {
      expect(isValidThemeId(value)).toBe(expected);
    });

    it('should work as type guard', () => {
      const value: unknown = 'contribution-graph';
      if (isValidThemeId(value)) {
        // TypeScript should know value is ThemeId here
        expect(value).toBe('contribution-graph');
      }
    });
  });

  describe('validateThemeId', () => {
    it('should return the same value for valid theme IDs', () => {
      expect(validateThemeId('contribution-graph')).toBe('contribution-graph');
      expect(validateThemeId('fireworks')).toBe('fireworks');
    });

    it.each([
      { value: 'invalid', description: 'invalid string' },
      { value: '', description: 'empty string' },
      { value: null, description: 'null' },
      { value: undefined, description: 'undefined' },
      { value: 123, description: 'number' },
      { value: {}, description: 'object' },
      { value: [], description: 'array' },
    ])('should return DEFAULT_THEME_ID for $description', ({ value }) => {
      expect(validateThemeId(value)).toBe(DEFAULT_THEME_ID);
    });

    it('should always return a valid theme ID', () => {
      const result = validateThemeId('completely-invalid-theme');
      expect(isValidThemeId(result)).toBe(true);
    });
  });

  describe('validateTimePageRenderer', () => {
    const createValidRenderer = (): TimePageRenderer => ({
      mount: () => {},
      destroy: async () => {},
      updateTime: () => {},
      onAnimationStateChange: () => {},
      onCounting: () => {},
      onCelebrating: () => {},
      onCelebrated: () => {},
      updateContainer: () => {},
      getResourceTracker: () => ({
        intervals: [],
        timeouts: [],
        rafs: [],
        observers: [],
        listeners: [],
      }),
    });

    it('should not throw for valid renderer with all required hooks', () => {
      const renderer = createValidRenderer();
      expect(() => validateTimePageRenderer(renderer, 'test-theme')).not.toThrow();
    });

    it.each([
      'onAnimationStateChange',
      'mount',
      'destroy',
      'updateTime',
      'onCounting',
      'onCelebrating',
      'onCelebrated',
      'updateContainer',
      'getResourceTracker',
    ] as const)('should throw when %s hook is missing', (missingHook) => {
      const renderer = createValidRenderer();
      // @ts-expect-error - intentionally breaking the interface for testing
      renderer[missingHook] = undefined;

      expect(() => validateTimePageRenderer(renderer, 'test-theme')).toThrow(
        `Theme "test-theme" TimePageRenderer is missing required hook: ${missingHook}.`
      );
    });
  });

  describe('validateLandingPageRenderer', () => {
    const createValidRenderer = (): LandingPageRenderer => ({
      mount: () => {},
      destroy: () => {},
      setSize: () => {},
      onAnimationStateChange: () => {},
      getElementCount: () => ({ total: 0, animated: 0 }),
    });

    it('should not throw for valid renderer with all required hooks', () => {
      const renderer = createValidRenderer();
      expect(() => validateLandingPageRenderer(renderer, 'test-theme')).not.toThrow();
    });

    it.each([
      'onAnimationStateChange',
      'mount',
      'destroy',
      'setSize',
      'getElementCount',
    ] as const)('should throw when %s hook is missing', (missingHook) => {
      const renderer = createValidRenderer();
      // @ts-expect-error - intentionally breaking the interface for testing
      renderer[missingHook] = undefined;

      expect(() => validateLandingPageRenderer(renderer, 'test-theme')).toThrow(
        `Theme "test-theme" LandingPageRenderer is missing required hook: ${missingHook}.`
      );
    });
  });
});
