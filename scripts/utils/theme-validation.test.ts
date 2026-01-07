/**
 * Unit tests for theme configuration validation utilities.
 *
 * @module scripts/utils/theme-validation.test
 */

import { describe, it, expect } from 'vitest';
import {
  validatePublishedDateFormat,
  validateAuthorFormat,
  validatePreviewExists,
  validateRequiredFields,
  validateColors,
  validateRegistryMatch,
  checkSuspiciousPatterns,
  type ThemeConfigForValidation,
} from './theme-validation';

// =============================================================================
// DATE VALIDATION TESTS
// =============================================================================

describe('validatePublishedDateFormat', () => {
  it('should pass for valid ISO 8601 date (AC5.1)', () => {
    const result = validatePublishedDateFormat('2024-12-18');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it.each([
    '12/18/2024',
    'Dec 18 2024',
    '2024-1-1',
  ])('should fail for invalid date format %s (AC5.2)', (date) => {
    const result = validatePublishedDateFormat(date);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].type).toBe('INVALID_FORMAT');
  });

  it('should fail for invalid calendar date', () => {
    const result = validatePublishedDateFormat('2024-13-45');
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].type).toBe('INVALID_DATE');
    expect(result.errors[0].message).toContain('not a valid calendar date');
  });
});

// =============================================================================
// AUTHOR VALIDATION TESTS
// =============================================================================

describe('validateAuthorFormat', () => {
  it.each([
    'chrisreddington',
    'chris-reddington',
  ])('should pass for valid GitHub username pattern %s (AC8.5)', (author) => {
    const result = validateAuthorFormat(author);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should pass for null author (AC8.5)', () => {
    const result = validateAuthorFormat(null);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should fail for consecutive hyphens', () => {
    const result = validateAuthorFormat('invalid--username');
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].type).toBe('INVALID_FORMAT');
    expect(result.errors[0].field).toBe('author');
    expect(result.errors[0].message).toContain('Invalid GitHub username format');
  });

  it.each([
    '-invalid',
    'invalid-',
    'invalid@username',
  ])('should fail for invalid username pattern %s', (author) => {
    const result = validateAuthorFormat(author);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
  });
});

// =============================================================================
// PREVIEW FILE VALIDATION TESTS
// =============================================================================

describe('validatePreviewExists', () => {
  it.each(['fireworks', 'contribution-graph'])('should pass for existing theme previews (AC6.1): %s', async (themeId) => {
    const result = await validatePreviewExists(themeId);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should fail for missing preview files (AC6.2)', async () => {
    const result = await validatePreviewExists('nonexistent-theme');
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].type).toBe('MISSING_FILE');
    expect(result.errors[0].field).toBe('preview');
    expect(result.errors[0].message).toContain('Missing preview files');
    expect(result.errors[0].suggestion).toContain('npm run generate:previews');
  });
});

// =============================================================================
// REQUIRED FIELDS VALIDATION TESTS
// =============================================================================

describe('validateRequiredFields', () => {
  it('should pass for complete config', () => {
    const config: ThemeConfigForValidation = {
      id: 'test',
      name: 'Test Theme',
      description: 'A test theme for validation',
      publishedDate: '2024-12-18',
      author: 'test-user',
    };

    const result = validateRequiredFields(config);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should fail for missing required field (AC3.1)', () => {
    const config = {
      id: 'test',
      name: 'Test Theme',
      // Missing description, publishedDate, author
    };

    const result = validateRequiredFields(config);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);

    const missingFields = result.errors.map((e) => e.field);
    expect(missingFields).toContain('description');
    expect(missingFields).toContain('publishedDate');
    expect(missingFields).toContain('author');
  });

  it('should fail for null config', () => {
    const result = validateRequiredFields(null);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].type).toBe('INVALID_TYPE');
  });

  it('should fail for non-object config', () => {
    const result = validateRequiredFields('not an object');
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].type).toBe('INVALID_TYPE');
  });
});

// =============================================================================
// COLORS VALIDATION TESTS
// =============================================================================

describe('validateColors', () => {
  it('should pass for complete colors object (AC10.1, AC10.2)', () => {
    const colors = {
      dark: {
        accentPrimary: '#fbbf24',
        accentSecondary: '#58a6ff',
      },
      light: {
        accentPrimary: '#d97706',
        accentSecondary: '#0969da',
      },
    };

    const result = validateColors(colors);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should pass for undefined colors', () => {
    const result = validateColors(undefined);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should fail for only dark mode (AC10.1)', () => {
    const colors = {
      dark: {
        accentPrimary: '#fbbf24',
      },
    };

    const result = validateColors(colors);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].type).toBe('MISSING_MODE');
    expect(result.errors[0].field).toBe('colors.light');
  });

  it('should fail for only light mode (AC10.1)', () => {
    const colors = {
      light: {
        accentPrimary: '#d97706',
      },
    };

    const result = validateColors(colors);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].type).toBe('MISSING_MODE');
    expect(result.errors[0].field).toBe('colors.dark');
  });

  it('should fail for dark mode missing accentPrimary (AC10.2)', () => {
    const colors = {
      dark: {},
      light: {
        accentPrimary: '#d97706',
      },
    };

    const result = validateColors(colors);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === 'colors.dark.accentPrimary')).toBe(true);
  });

  it('should fail for light mode missing accentPrimary (AC10.2)', () => {
    const colors = {
      dark: {
        accentPrimary: '#fbbf24',
      },
      light: {},
    };

    const result = validateColors(colors);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === 'colors.light.accentPrimary')).toBe(true);
  });
});

// =============================================================================
// REGISTRY MATCHING VALIDATION TESTS
// =============================================================================

describe('validateRegistryMatch', () => {
  it('should pass when registry and config match (AC9.1-AC9.4)', () => {
    const registryEntry = {
      id: 'fireworks',
      displayName: 'Fireworks Celebration',
      author: 'chrisreddington',
    };

    const themeConfig: ThemeConfigForValidation = {
      id: 'fireworks',
      name: 'Fireworks Celebration',
      description: 'Countdown with fireworks',
      publishedDate: '2024-12-18',
      author: 'chrisreddington',
    };

    const result = validateRegistryMatch(registryEntry, themeConfig);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
  it.each([
    { field: 'id', registry: { id: 'fireworks', displayName: 'Fireworks', author: 'test' }, config: { id: 'rockets', name: 'Fireworks', description: 'Test', publishedDate: '2024-12-18', author: 'test' } },
    { field: 'name', registry: { id: 'fireworks', displayName: 'Fireworks Display', author: 'test' }, config: { id: 'fireworks', name: 'Fireworks Celebration', description: 'Test', publishedDate: '2024-12-18', author: 'test' } },
    { field: 'author', registry: { id: 'fireworks', displayName: 'Fireworks', author: 'author1' }, config: { id: 'fireworks', name: 'Fireworks', description: 'Test', publishedDate: '2024-12-18', author: 'author2' } },
  ])('should fail when %s mismatches (AC9.x)', ({ field, registry, config }) => {
    const result = validateRegistryMatch(registry, config as ThemeConfigForValidation);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === field)).toBe(true);
  });

  it('should fail with multiple mismatches (AC9.4)', () => {
    const registryEntry = {
      id: 'fireworks',
      displayName: 'Fireworks Display',
      author: 'author1',
    };

    const themeConfig: ThemeConfigForValidation = {
      id: 'rockets',
      name: 'Rockets Show',
      description: 'Test',
      publishedDate: '2024-12-18',
      author: 'author2',
    };

    const result = validateRegistryMatch(registryEntry, themeConfig);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });
});

// =============================================================================
// SUSPICIOUS PATTERN TESTS
// =============================================================================

describe('checkSuspiciousPatterns', () => {
  it('should warn for short description (AC12.1)', () => {
    const config: ThemeConfigForValidation = {
      id: 'test',
      name: 'Test Theme',
      description: 'Short', // <20 chars
      publishedDate: '2024-12-18',
      author: 'test',
    };

    const result = checkSuspiciousPatterns(config);
    expect(result.valid).toBe(true); // Warnings don't fail validation
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0].type).toBe('SUSPICIOUS_PATTERN');
    expect(result.warnings[0].field).toBe('description');
    expect(result.warnings[0].message).toContain('very short');
  });

  it('should warn for name/ID mismatch (AC12.2)', () => {
    const config: ThemeConfigForValidation = {
      id: 'fireworks',
      name: 'Rockets Display', // Doesn't match 'fireworks'
      description: 'A theme with rockets',
      publishedDate: '2024-12-18',
      author: 'test',
    };

    const result = checkSuspiciousPatterns(config);
    expect(result.valid).toBe(true); // Warnings don't fail validation
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings.some((w) => w.field === 'name')).toBe(true);
  });

  it('should not warn for valid patterns', () => {
    const config: ThemeConfigForValidation = {
      id: 'fireworks',
      name: 'Fireworks Celebration',
      description: 'Countdown with fireworks that intensify as midnight approaches',
      publishedDate: '2024-12-18',
      author: 'chrisreddington',
    };

    const result = checkSuspiciousPatterns(config);
    expect(result.valid).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  it('should not fail validation even with warnings (AC12.3)', () => {
    const config: ThemeConfigForValidation = {
      id: 'test',
      name: 'Completely Different',
      description: 'Tiny', // Multiple warnings
      publishedDate: '2024-12-18',
      author: 'test',
    };

    const result = checkSuspiciousPatterns(config);
    expect(result.valid).toBe(true); // Still valid despite warnings
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});
