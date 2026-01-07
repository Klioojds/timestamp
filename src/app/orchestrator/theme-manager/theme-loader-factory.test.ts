/**
 * @file theme-resolver.test.ts
 * @description Unit tests for the theme resolver module
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createThemeRenderer, getThemeConfig, getCelebrationDisplay } from './theme-loader-factory';
import { createMockTimePageRenderer } from '@/test-utils/theme-test-helpers';

// Mock the theme registry
vi.mock('@themes/registry', () => {
  const DEFAULT_THEME_ID = 'contribution-graph' as const;
  const THEME_REGISTRY = {
    'contribution-graph': {
      displayName: 'Contribution Graph',
      description: 'Test theme',
      author: { name: 'Test Author', github: 'testauthor' },
      showsWorldMap: true,
    },
    fireworks: {
      displayName: 'Fireworks',
      description: 'Test theme',
      author: { name: 'Test Author', github: 'testauthor' },
      showsWorldMap: true,
    },
  };

  const loadThemeSafe = vi.fn(async (themeId: string) => ({
    timePageRenderer: vi.fn(() => createMockTimePageRenderer()),
    config: THEME_REGISTRY[themeId as keyof typeof THEME_REGISTRY],
  }));

  return { THEME_REGISTRY, loadThemeSafe, DEFAULT_THEME_ID };
});

// Mock time utilities
vi.mock('@/core/time/time', () => ({
  isNewYearMidnight: vi.fn((date: Date) => {
    return date.getMonth() === 0 && date.getDate() === 1 && 
           date.getHours() === 0 && date.getMinutes() === 0;
  }),
}));

// Mock constants
vi.mock('@/core/config/constants', () => ({
  DEFAULT_COMPLETION_MESSAGE: "Time's up!",
}));

describe('getCelebrationDisplay', () => {
  it.each([
    {
      description: 'timer mode with custom message',
      config: { mode: 'timer', completionMessage: 'Done!' },
      date: new Date('2026-06-15'),
      expectedText: 'DONE!',
      expectedFull: 'Done!',
    },
    {
      description: 'timer mode without custom message uses default',
      config: { mode: 'timer' },
      date: new Date('2026-06-15'),
      expectedText: "TIME'S UP!",
      expectedFull: "Time's up!",
    },
    {
      description: 'New Year countdown returns upcoming year',
      config: undefined,
      date: new Date('2026-01-01T00:00:00'),
      expectedText: '2026',
      expectedFull: 'Happy New Year! Welcome to 2026!',
    },
    {
      description: 'wall-clock mode defaults when not New Year',
      config: { mode: 'wall-clock' },
      date: new Date('2026-06-15'),
      expectedText: 'COMPLETE!',
      expectedFull: 'Complete!',
    },
    {
      description: 'wall-clock mode honors custom message',
      config: { mode: 'wall-clock', completionMessage: 'Launch day' },
      date: new Date('2026-06-15'),
      expectedText: 'LAUNCH DAY',
      expectedFull: 'Launch day',
    },
  ])('should build celebration display for $description', ({ config, date, expectedText, expectedFull }) => {
    const result = getCelebrationDisplay(config as any, date);

    // SafeMessage is returned - check forTextContent for plain text
    expect(result.message.forTextContent).toBe(expectedText);
    expect(result.fullMessage).toBe(expectedFull);
  });
});

describe('createThemeRenderer', () => {
  let targetDate: Date;

  beforeEach(() => {
    targetDate = new Date('2026-01-01');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create theme instance', async () => {
    const theme = await createThemeRenderer('contribution-graph', targetDate);
    expect(theme).toBeDefined();
    expect(typeof theme.mount).toBe('function');
    expect(typeof theme.updateTime).toBe('function');
  });
});

describe('getThemeConfig', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should get theme config', async () => {
    const config = await getThemeConfig('fireworks');
    expect(config).toBeDefined();
    expect(config.displayName).toBe('Fireworks');
  });
});
