/**
 * Unified URL management tests.
 * Tests parsing, validation, serialization, and history state management.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { withFakeNow } from '@/test-utils/time-helpers';
import type { CountdownConfig } from '@core/types';
import {
  parseDeepLink,
  validateTargetDate,
  parseCountdownMode,
  parseWallClockFromTarget,
  syncTimezoneToUrl,
  syncThemeToUrl,
  buildCountdownUrl,
  pushCountdownToHistory,
  buildShareUrls,
} from './url';
import { VALID_QUERY_FIXTURES, INVALID_QUERY_FIXTURES } from '@/test-utils/query-param-fixtures';
import { DEFAULT_COMPLETION_MESSAGE } from '@core/config/constants';

const NOW = new Date('2025-12-20T12:00:00Z');

// ============================================================================
// PARSING & VALIDATION TESTS
// ============================================================================

describe('parseDeepLink', () => {
  it('should return timer config when query contains valid timer parameters', async () => {
    await withFakeNow(NOW, () => {
      const fixture = VALID_QUERY_FIXTURES.find((item) => item.expected.mode === 'timer');
      expect(fixture).toBeDefined();
      if (!fixture) throw new Error('Timer fixture is missing');

      const result = parseDeepLink(fixture.url);

      expect(result.isValid).toBe(true);
      expect(result.config?.mode).toBe('timer');
      expect(result.config?.theme).toBe('fireworks');
      expect(result.config?.timezone).toBe('UTC');
      expect(result.config?.durationSeconds).toBe(300);
      expect(result.config?.targetDate.getTime()).toBe(NOW.getTime() + 300_000);
      expect(result.config?.completionMessage).toBe('Break time!');
    });
  });

  it('should return wall-clock config when query contains valid wall-clock parameters', async () => {
    await withFakeNow(NOW, () => {
      const fixture = VALID_QUERY_FIXTURES.find((item) => item.expected.mode === 'wall-clock');
      expect(fixture).toBeDefined();
      if (!fixture) throw new Error('Wall-clock fixture is missing');

      const result = parseDeepLink(fixture.url);

      expect(result.isValid).toBe(true);
      expect(result.config?.mode).toBe('wall-clock');
      expect(result.config?.theme).toBe('contribution-graph');
      expect(result.config?.timezone).toBe('UTC');
      expect(result.config?.wallClockTarget).toBeDefined();
      expect(result.config?.wallClockTarget?.year).toBe(2099);
    });
  });

  it.each(INVALID_QUERY_FIXTURES.map((fixture) => [fixture.description, fixture]))(
    'should return errors when %s',
    async (_description, fixture) => {
      await withFakeNow(NOW, () => {
        const result = parseDeepLink(fixture.url);

        expect(result.isValid).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors).toContain(fixture.expectedError);
      });
    },
  );

  it('should be invalid when query has no parameters', () => {
    const result = parseDeepLink('https://example.com/');

    expect(result.isValid).toBe(false);
    expect(result.errors).toBeUndefined();
  });
});

describe('validateTargetDate', () => {
  it('should accept target date when it is in the future', () => {
    const result = validateTargetDate('2099-01-01T00:00:00Z');

    expect(result.isValid).toBe(true);
    expect(result.date?.toISOString()).toBe('2099-01-01T00:00:00.000Z');
  });

  it('should reject target date when it is in the past', async () => {
    await withFakeNow(NOW, () => {
      const result = validateTargetDate('2020-01-01T00:00:00Z');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Target date must be in the future.');
    });
  });
});

describe('parseWallClockFromTarget', () => {
  it.each([
    {
      target: '2026-01-01T00:00:00',
      expected: {
        year: 2026,
        month: 0,
        day: 1,
        hours: 0,
        minutes: 0,
        seconds: 0,
      },
    },
    {
      target: '2026-12-31T23:59:59',
      expected: {
        year: 2026,
        month: 11,
        day: 31,
        hours: 23,
        minutes: 59,
        seconds: 59,
      },
    },
  ])('should parse wall-clock target $target', ({ target, expected }) => {
    const result = parseWallClockFromTarget(target);

    expect(result).toEqual(expected);
  });

  it.each(['2026-01-01T00:00:00Z', 'invalid'])('should return null for invalid wall-clock target %s', (target) => {
    const result = parseWallClockFromTarget(target);

    expect(result).toBeNull();
  });
});

describe('parseCountdownMode', () => {
  it.each([
    { query: 'mode=timer', expected: 'timer', description: 'explicit timer' },
    { query: 'mode=absolute', expected: 'absolute', description: 'explicit absolute' },
    { query: 'mode=wall-clock', expected: 'wall-clock', description: 'explicit wall-clock' },
    { query: 'duration=00:05:00', expected: 'timer', description: 'duration present' },
    { query: 'mode=invalid&duration=300', expected: 'timer', description: 'invalid mode with duration falls back to timer' },
    { query: 'mode=invalid', expected: 'wall-clock', description: 'invalid mode defaults to wall-clock' },
    { query: '', expected: 'wall-clock', description: 'no mode indicators' },
  ])('should return $expected when $description', ({ query, expected }) => {
    const params = new URLSearchParams(query);

    expect(parseCountdownMode(params)).toBe(expected);
  });
});

describe('Edge Cases and Security', () => {
  describe('malformed URLs', () => {
    it('should handle URLs with invalid characters gracefully', () => {
      const result = parseDeepLink('https://example.com/?mode=timer&duration=300&message=<script>alert(1)</script>');

      expect(result.isValid).toBe(true);
      // Config stores PLAIN TEXT - XSS protection happens at display via SafeMessage
      expect(result.config?.completionMessage).toBe('<script>alert(1)</script>');
    });

    it('should handle extremely long message parameters', () => {
      const longMessage = 'a'.repeat(500);
      const url = `https://example.com/?mode=timer&duration=300&message=${encodeURIComponent(longMessage)}`;

      const result = parseDeepLink(url);

      expect(result.isValid).toBe(true);
      // Message should be truncated to 200 chars
      expect(result.config?.completionMessage.length).toBeLessThanOrEqual(200);
    });

    it('should handle URL with malformed parameter encoding', () => {
      const result = parseDeepLink('https://example.com/?mode=timer&duration=300&message=%ZZ%invalid');

      // decodeURIComponent should fail gracefully and return raw value
      expect(result.isValid).toBe(true);
    });

    it.each([
      {
        description: 'multiple question marks',
        url: 'https://example.com/?mode=timer?duration=00:05:00',
      },
      {
        description: 'empty string parameters',
        url: 'https://example.com/?mode=&duration=&message=',
      },
    ])('should mark deep link invalid when $description', ({ url }) => {
      const result = parseDeepLink(url);

      expect(result.isValid).toBe(false);
    });
  });

  describe('XSS attack vectors', () => {
    it('should store plain text for javascript: protocol', () => {
      const result = parseDeepLink('https://example.com/?mode=timer&duration=300&message=javascript:alert(1)');

      expect(result.isValid).toBe(true);
      // Config stores plain text - SafeMessage handles XSS at display
      expect(result.config?.completionMessage).toBe('javascript:alert(1)');
    });

    it('should store plain text for event handlers', () => {
      const result = parseDeepLink('https://example.com/?mode=timer&duration=300&message=<img src=x onerror=alert(1)>');

      expect(result.isValid).toBe(true);
      // Config stores plain text - SafeMessage handles XSS at display
      expect(result.config?.completionMessage).toBe('<img src=x onerror=alert(1)>');
    });

    it('should handle message with null bytes', () => {
      const result = parseDeepLink('https://example.com/?mode=timer&duration=300&message=test%00injection');

      expect(result.isValid).toBe(true);
      expect(result.config?.completionMessage).toBeDefined();
    });
  });

  describe('boundary conditions', () => {
    it.each([
      {
        description: 'duration at maximum valid value (99:59:59)',
        url: 'https://example.com/?mode=timer&duration=31536000',
        expectedDuration: 31536000,
      },
      {
        description: 'duplicate parameters (last wins)',
        url: 'https://example.com/?mode=timer&duration=300&duration=600',
        expectedDuration: 600,
      },
    ])('should handle $description', async ({ url, expectedDuration }) => {
      await withFakeNow(NOW, () => {
        const result = parseDeepLink(url);

        expect(result.isValid).toBe(true);
        expect(result.config?.durationSeconds).toBe(expectedDuration);
      });
    });

    it('should reject duration over maximum (100:00:00)', () => {
      const result = parseDeepLink('https://example.com/?mode=timer&duration=31536001');

      // Duration validation may return different error message
      expect(result.isValid).toBe(false);
      expect(result.errors?.length).toBeGreaterThan(0);
    });

    it('should handle zero duration', async () => {
      await withFakeNow(NOW, () => {
        const result = parseDeepLink('https://example.com/?mode=timer&duration=0');

        expect(result.isValid).toBe(false); // Zero duration should be invalid
      });
    });

    it('should handle target date far in the future (year 9999)', () => {
      const result = parseDeepLink('https://example.com/?mode=absolute&target=9999-12-31T23:59:59Z');

      expect(result.isValid).toBe(true);
      expect(result.config?.targetDate.getFullYear()).toBe(9999);
    });

    it('should handle invalid theme ID gracefully', async () => {
      await withFakeNow(NOW, () => {
        const result = parseDeepLink('https://example.com/?mode=timer&duration=300&theme=non-existent-theme');

        expect(result.isValid).toBe(true);
        expect(result.config?.theme).toBe('contribution-graph');
      });
    });

    it('should handle invalid timezone ID gracefully', async () => {
      await withFakeNow(NOW, () => {
        const result = parseDeepLink('https://example.com/?mode=timer&duration=300&tz=Invalid/Timezone');

        expect(result.isValid).toBe(true);
        expect(result.config?.timezone).toBe('Invalid/Timezone');
      });
    });
  });

  describe('configure parameter', () => {
    it.each([
      { query: 'configure=true', expected: true, description: 'configure=true' },
      { query: 'configure=1', expected: true, description: 'configure=1' },
      { query: 'configure=false', expected: false, description: 'configure=false' },
      { query: undefined, expected: false, description: 'configure omitted defaults to false' },
    ])('should set shouldShowConfiguration=%s when %s', async ({ query, expected }) => {
      await withFakeNow(NOW, () => {
        const url = `https://example.com/?mode=timer&duration=300${query ? `&${query}` : ''}`;

        const result = parseDeepLink(url);

        expect(result.isValid).toBe(true);
        expect(result.shouldShowConfiguration).toBe(expected);
      });
    });
  });
});

// ============================================================================
// URL ROUND-TRIP TESTS
// ============================================================================

describe('URL Round-Trip', () => {
  const mockWallClockConfig: CountdownConfig = {
    mode: 'wall-clock',
    targetDate: new Date('2026-01-01T00:00:00Z'),
    wallClockTarget: { year: 2026, month: 0, day: 1, hours: 0, minutes: 0, seconds: 0 },
    theme: 'contribution-graph',
    timezone: 'America/New_York',
    completionMessage: DEFAULT_COMPLETION_MESSAGE,
    showWorldMap: true,
  };

  it('should survive round-trip: config → URL → parsed config', () => {
    const url = buildCountdownUrl(mockWallClockConfig);
    const parsed = parseDeepLink(url.toString());

    expect(parsed.isValid).toBe(true);
    expect(parsed.config?.mode).toBe(mockWallClockConfig.mode);
    expect(parsed.config?.theme).toBe(mockWallClockConfig.theme);
    expect(parsed.config?.timezone).toBe(mockWallClockConfig.timezone);
    expect(parsed.config?.wallClockTarget).toEqual(mockWallClockConfig.wallClockTarget);
  });

  it('should preserve custom completion message in round-trip', () => {
    const customConfig = { ...mockWallClockConfig, completionMessage: 'Happy New Year!' };
    const url = buildCountdownUrl(customConfig);
    const parsed = parseDeepLink(url.toString());

    expect(parsed.isValid).toBe(true);
    expect(parsed.config?.completionMessage).toBe('Happy New Year!');
  });
});

// ============================================================================
// SERIALIZATION & URL BUILDING TESTS
// ============================================================================

describe('URL State Management', () => {
  // Mock configs for tests
  const mockWallClockConfig: CountdownConfig = {
    mode: 'wall-clock',
    targetDate: new Date('2026-01-01T00:00:00Z'),
    wallClockTarget: { year: 2026, month: 0, day: 1, hours: 0, minutes: 0, seconds: 0 },
    theme: 'contribution-graph',
    timezone: 'America/New_York',
    completionMessage: DEFAULT_COMPLETION_MESSAGE,
    showWorldMap: true,
  };

  const mockAbsoluteConfig: CountdownConfig = {
    mode: 'absolute',
    targetDate: new Date('2026-01-01T00:00:00Z'),
    theme: 'contribution-graph',
    timezone: 'America/New_York',
    completionMessage: DEFAULT_COMPLETION_MESSAGE,
    showWorldMap: false,
  };

  const mockTimerConfig: CountdownConfig = {
    mode: 'timer',
    targetDate: new Date(Date.now() + 300000),
    durationSeconds: 300,
    theme: 'fireworks',
    timezone: 'UTC',
    completionMessage: 'Timer complete!',
    showWorldMap: false,
  };

  beforeEach(() => {
    // Reset URL before each test
    window.history.replaceState(null, '', '/');
    // Mock history methods
    vi.spyOn(window.history, 'replaceState');
    vi.spyOn(window.history, 'pushState');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('syncTimezoneToUrl', () => {
    it('should update tz parameter without adding history entry', () => {
      syncTimezoneToUrl('America/Los_Angeles', mockWallClockConfig);

      expect(window.history.replaceState).toHaveBeenCalledTimes(1);
      const call = (window.history.replaceState as ReturnType<typeof vi.spyOn>).mock.calls[0];
      expect(call[2]).toContain('tz=America%2FLos_Angeles');
    });

    it('should preserve existing theme parameter', () => {
      syncTimezoneToUrl('Europe/London', mockWallClockConfig);

      const call = (window.history.replaceState as ReturnType<typeof vi.spyOn>).mock.calls[0];
      expect(call[2]).toContain('theme=contribution-graph');
    });

    it('should include showWorldMap=false when explicitly set', () => {
      const configWithMapDisabled = { ...mockWallClockConfig, showWorldMap: false };
      syncTimezoneToUrl('Asia/Tokyo', configWithMapDisabled);

      const call = (window.history.replaceState as ReturnType<typeof vi.spyOn>).mock.calls[0];
      expect(call[2]).toContain('showWorldMap=false');
    });

    it('should omit showWorldMap when true', () => {
      syncTimezoneToUrl('Australia/Sydney', mockWallClockConfig);

      const call = (window.history.replaceState as ReturnType<typeof vi.spyOn>).mock.calls[0];
      expect(call[2]).not.toContain('showWorldMap');
    });

    it('should update history state with new config', () => {
      syncTimezoneToUrl('America/Chicago', mockWallClockConfig);

      const call = (window.history.replaceState as ReturnType<typeof vi.spyOn>).mock.calls[0];
      expect(call[0]).toEqual({
        config: {
          ...mockWallClockConfig,
          timezone: 'America/Chicago',
        },
        view: 'countdown',
      });
    });
  });

  describe('syncThemeToUrl', () => {
    it('should update theme parameter without adding history entry', () => {
      syncThemeToUrl('fireworks', mockWallClockConfig);

      expect(window.history.replaceState).toHaveBeenCalledTimes(1);
      const call = (window.history.replaceState as ReturnType<typeof vi.spyOn>).mock.calls[0];
      expect(call[2]).toContain('theme=fireworks');
    });

    it('should preserve existing timezone parameter', () => {
      syncThemeToUrl('fireworks', mockWallClockConfig);

      const call = (window.history.replaceState as ReturnType<typeof vi.spyOn>).mock.calls[0];
      expect(call[2]).toContain('tz=America%2FNew_York');
    });

    it('should include showWorldMap=false when explicitly set', () => {
      const configWithMapDisabled = { ...mockWallClockConfig, showWorldMap: false };
      syncThemeToUrl('fireworks', configWithMapDisabled);

      const call = (window.history.replaceState as ReturnType<typeof vi.spyOn>).mock.calls[0];
      expect(call[2]).toContain('showWorldMap=false');
    });

    it('should update history state with new config', () => {
      syncThemeToUrl('fireworks', mockWallClockConfig);

      const call = (window.history.replaceState as ReturnType<typeof vi.spyOn>).mock.calls[0];
      expect(call[0]).toEqual({
        config: {
          ...mockWallClockConfig,
          theme: 'fireworks',
        },
        view: 'countdown',
      });
    });
  });

  describe('buildCountdownUrl', () => {
    it.each([
      { description: 'base path deployment', initialPath: '/countdown/', expectedPathname: '/countdown/' },
      { description: 'root deployment', initialPath: '/', expectedPathname: '/' },
    ])('should preserve pathname when $description', ({ initialPath, expectedPathname }) => {
      window.history.replaceState(null, '', initialPath);

      const url = buildCountdownUrl(mockWallClockConfig);

      expect(url.pathname).toBe(expectedPathname);
    });

    it('should build complete URL for wall-clock mode', () => {
      const url = buildCountdownUrl(mockWallClockConfig);

      expect(url.searchParams.get('mode')).toBe('wall-clock');
      expect(url.searchParams.get('theme')).toBe('contribution-graph');
      expect(url.searchParams.get('tz')).toBe('America/New_York');
      expect(url.searchParams.get('target')).toBe('2026-01-01T00:00:00');
      expect(url.searchParams.get('target')).not.toContain('Z');
      expect(url.searchParams.has('duration')).toBe(false);
      expect(url.searchParams.has('message')).toBe(false);
    });

    it('should use local time components in fallback for wall-clock mode without wallClockTarget', () => {
      // This tests the fallback path when wallClockTarget is not set
      const configWithoutWallClock: CountdownConfig = {
        mode: 'wall-clock',
        targetDate: new Date(2026, 0, 1, 0, 0, 0), // Midnight LOCAL time
        theme: 'contribution-graph',
        timezone: 'America/New_York',
        completionMessage: DEFAULT_COMPLETION_MESSAGE,
        showWorldMap: true,
        // Note: no wallClockTarget - triggers fallback path
      };
      
      const url = buildCountdownUrl(configWithoutWallClock);

      // Should extract LOCAL components (midnight = 00:00:00)
      expect(url.searchParams.get('target')).toBe('2026-01-01T00:00:00');
      expect(url.searchParams.get('target')).not.toContain('Z');
    });

    it('should build complete URL for absolute mode with Z suffix', () => {
      const url = buildCountdownUrl(mockAbsoluteConfig);

      expect(url.searchParams.get('mode')).toBe('absolute');
      expect(url.searchParams.get('theme')).toBe('contribution-graph');
      // Absolute mode does not include timezone
      expect(url.searchParams.has('tz')).toBe(false);
      expect(url.searchParams.get('target')).toBe('2026-01-01T00:00:00.000Z');
      expect(url.searchParams.get('target')).toContain('Z');
      expect(url.searchParams.has('duration')).toBe(false);
      expect(url.searchParams.has('message')).toBe(false);
    });

    it('should build complete URL for timer mode', () => {
      const url = buildCountdownUrl(mockTimerConfig);

      expect(url.searchParams.get('mode')).toBe('timer');
      expect(url.searchParams.get('theme')).toBe('fireworks');
      // Timer mode does not include timezone
      expect(url.searchParams.has('tz')).toBe(false);
      expect(url.searchParams.get('duration')).toBe('300');
      expect(url.searchParams.get('message')).toBe('Timer complete!');
      expect(url.searchParams.has('target')).toBe(false);
    });

    it.each([
      { config: mockWallClockConfig, expected: null, description: 'omits flag when true' },
      { config: mockTimerConfig, expected: 'false', description: 'includes flag when disabled' },
    ])('should handle showWorldMap parameter: $description', ({ config, expected }) => {
      const url = buildCountdownUrl(config);

      expect(url.searchParams.get('showWorldMap')).toBe(expected);
    });

    it.each([
      {
        description: 'timer mode',
        config: { ...mockTimerConfig, completionMessage: 'Timer complete!' },
        expectedMessage: 'Timer complete!',
      },
      {
        description: 'wall-clock mode',
        config: { ...mockWallClockConfig, completionMessage: 'Happy New Year!' },
        expectedMessage: 'Happy New Year!',
      },
      {
        description: 'absolute mode',
        config: { ...mockAbsoluteConfig, completionMessage: 'Product launched!' },
        expectedMessage: 'Product launched!',
      },
    ])('should include custom message for $description', ({ config, expectedMessage }) => {
      const url = buildCountdownUrl(config);

      expect(url.searchParams.get('message')).toBe(expectedMessage);
    });

    it.each([
      { description: 'timer mode', config: { ...mockTimerConfig, completionMessage: DEFAULT_COMPLETION_MESSAGE } },
      { description: 'wall-clock mode', config: mockWallClockConfig },
      { description: 'absolute mode', config: mockAbsoluteConfig },
    ])('should omit default message for $description', ({ config }) => {
      const url = buildCountdownUrl(config);

      expect(url.searchParams.has('message')).toBe(false);
    });
  });

  describe('buildShareUrls', () => {
    it('should generate timezone variants for wall-clock mode', () => {
      vi.spyOn(Intl, 'DateTimeFormat').mockReturnValue({
        resolvedOptions: () => ({ timeZone: 'Asia/Tokyo' }),
      } as unknown as Intl.DateTimeFormat);

      const urls = buildShareUrls(mockWallClockConfig);

      expect(urls.withSelectedTimezone).toContain('tz=America%2FNew_York');
      expect(urls.withLocalTimezone).toContain('tz=Asia%2FTokyo');
      expect(urls.withoutTimezone).not.toContain('tz=');
    });

    it('should return identical URLs when timezone is not relevant', () => {
      const urls = buildShareUrls(mockTimerConfig);

      expect(urls.withSelectedTimezone).toBe(urls.withLocalTimezone);
      expect(urls.withoutTimezone).toBe(urls.withLocalTimezone);
      expect(urls.withSelectedTimezone).not.toContain('tz=');
    });
  });

  describe('pushCountdownToHistory', () => {
    it('should add new history entry with pushState', () => {
      pushCountdownToHistory(mockWallClockConfig);

      expect(window.history.pushState).toHaveBeenCalledTimes(1);
      const call = (window.history.pushState as ReturnType<typeof vi.spyOn>).mock.calls[0];
      expect(call[0]).toEqual({
        config: mockWallClockConfig,
        view: 'countdown',
      });
    });

    it('should build correct URL for history entry', () => {
      pushCountdownToHistory(mockWallClockConfig);

      const call = (window.history.pushState as ReturnType<typeof vi.spyOn>).mock.calls[0];
      const url = call[2] as string;
      expect(url).toContain('mode=wall-clock');
      expect(url).toContain('theme=contribution-graph');
      expect(url).toContain('tz=America%2FNew_York');
    });
  });
});
