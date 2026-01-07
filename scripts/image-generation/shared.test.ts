import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { chromium, type Browser, type Page } from 'playwright';
import {
  TIMER_DURATION_SECONDS,
  CAPTURE_DELAY_MS,
  DEFAULT_PORT,
  extractThemeData,
  buildCountdownUrl,
  resolvePortAndBaseUrl,
  fileExists,
  createBrowser,
  createPage,
} from './shared';
import { createMockRegistry } from './image-generation-helpers';

describe('image-generation/shared', () => {
  describe('constants', () => {
    it('should have correct timer duration in seconds', () => {
      expect(TIMER_DURATION_SECONDS).toBe(1);
    });

    it('should have correct capture delay', () => {
      expect(CAPTURE_DELAY_MS).toBe(1000);
    });

    it('should have correct default port', () => {
      expect(DEFAULT_PORT).toBe('5173');
    });
  });

  describe('extractThemeData', () => {
    it('should extract theme data from registry', () => {
      const registry = createMockRegistry({
        'contribution-graph': { name: 'Contribution Graph' },
        fireworks: { name: 'Fireworks' },
      });

      const result = extractThemeData(registry);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'contribution-graph',
        displayName: 'Contribution Graph',
      });
      expect(result[1]).toEqual({
        id: 'fireworks',
        displayName: 'Fireworks',
      });
    });

    it('should handle empty registry', () => {
      const registry = createMockRegistry({});

      const result = extractThemeData(registry);

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });

    it('should handle single theme', () => {
      const registry = createMockRegistry({
        'test-theme': { name: 'Test Theme' },
      });

      const result = extractThemeData(registry);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'test-theme',
        displayName: 'Test Theme',
      });
    });
  });

  describe('buildCountdownUrl', () => {
    it('should construct URL with correct parameters', () => {
      const baseUrl = 'http://localhost:5173/timestamp';
      const themeId = 'fireworks';
      const message = '00:00';

      const url = buildCountdownUrl(baseUrl, themeId, message);

      expect(url).toBe(
        'http://localhost:5173/timestamp/?mode=timer&duration=1&theme=fireworks&message=00%3A00'
      );
    });

    it('should encode special characters in message', () => {
      const baseUrl = 'http://localhost:5173/timestamp';
      const themeId = 'test';
      const message = 'Happy New Year! 🎉';

      const url = buildCountdownUrl(baseUrl, themeId, message);

      expect(url).toContain('message=Happy%20New%20Year!%20%F0%9F%8E%89');
    });

    it('should handle theme with special characters', () => {
      const baseUrl = 'http://localhost:5173/timestamp';
      const themeId = 'test-theme-1';
      const message = 'Test';

      const url = buildCountdownUrl(baseUrl, themeId, message);

      expect(url).toContain('theme=test-theme-1');
    });
  });

  describe('resolvePortAndBaseUrl', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      vi.resetModules();
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should use default port when no env vars set', () => {
      delete process.env.OG_PORT;
      delete process.env.PORT;

      const { port, baseUrl } = resolvePortAndBaseUrl();

      expect(port).toBe('5173');
      expect(baseUrl).toBe('http://localhost:5173/timestamp');
    });

    it('should use OG_PORT env var when set', () => {
      process.env.OG_PORT = '8080';

      const { port, baseUrl } = resolvePortAndBaseUrl();

      expect(port).toBe('8080');
      expect(baseUrl).toBe('http://localhost:8080/timestamp');
    });

    it('should use PORT env var when OG_PORT not set', () => {
      delete process.env.OG_PORT;
      process.env.PORT = '3000';

      const { port, baseUrl } = resolvePortAndBaseUrl();

      expect(port).toBe('3000');
      expect(baseUrl).toBe('http://localhost:3000/timestamp');
    });

    it('should use OG_BASE_URL when set', () => {
      process.env.OG_BASE_URL = 'https://example.com/timestamp';

      const { baseUrl } = resolvePortAndBaseUrl();

      expect(baseUrl).toBe('https://example.com/timestamp');
    });

    it('prefers OG_BASE_URL over OG_PORT/PORT for baseUrl while keeping provided port', () => {
      process.env.OG_BASE_URL = 'https://base.example.com/timestamp';
      process.env.OG_PORT = '9999';
      process.env.PORT = '8888';

      const { baseUrl, port } = resolvePortAndBaseUrl();

      expect(baseUrl).toBe('https://base.example.com/timestamp');
      expect(port).toBe('9999');
    });
  });

  describe('fileExists', () => {
    it('should return true when file exists', () => {
      const existingPath = process.cwd() + '/package.json';
      expect(fileExists(existingPath)).toBe(true);
    });

    it('should return false when file does not exist', () => {
      const nonExistentPath = '/path/to/nonexistent/file.txt';
      expect(fileExists(nonExistentPath)).toBe(false);
    });
  });

  describe('createBrowser', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should launch chromium in headless mode', async () => {
      const fakeBrowser = {} as unknown as Browser;
      const launchSpy = vi.spyOn(chromium, 'launch').mockResolvedValue(fakeBrowser);

      const browser = await createBrowser();

      expect(browser).toBe(fakeBrowser);
      expect(launchSpy).toHaveBeenCalledWith({ headless: true });
    });
  });

  describe('createPage', () => {
    it('should create a page with the provided viewport dimensions', async () => {
      const fakePage = {} as Page;
      const newPage = vi.fn().mockResolvedValue(fakePage);
      const fakeBrowser = { newPage } as unknown as Browser;

      const page = await createPage(fakeBrowser, 800, 600);

      expect(page).toBe(fakePage);
      expect(newPage).toHaveBeenCalledWith({ viewport: { width: 800, height: 600 } });
    });
  });
});
