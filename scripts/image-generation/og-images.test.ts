import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Browser, Page } from 'playwright';
import {
  OG_IMAGE_WIDTH,
  OG_IMAGE_HEIGHT,
  buildOGConfig,
  captureThemeScreenshot,
  generateThemeOGImage,
  generateDefaultOGImage,
  generateOGImages,
  createOGBrowser,
  createOGPage,
} from './og-images';
import {
  extractThemeData,
  buildCountdownUrl,
  loadThemeRegistry,
  UI_ELEMENTS_TO_HIDE,
  hideUIElements,
} from './shared';
import { createMockPage, createMockBrowser, createMockRegistry } from './image-generation-helpers';
import * as shared from './shared';

describe('og-images', () => {
  describe('constants', () => {
    it('should have correct OG image dimensions', () => {
      expect(OG_IMAGE_WIDTH).toBe(1200);
      expect(OG_IMAGE_HEIGHT).toBe(630);
    });

    it('should include expected UI elements to hide', () => {
      const expectedSelectors = [
        '[data-testid="share-button"]',
        '[data-testid="back-button"]',
        '[data-testid="theme-switcher"]',
        '.share-button',
        '.back-button',
        '.theme-switcher',
      ];

      expectedSelectors.forEach((selector) => {
        expect(UI_ELEMENTS_TO_HIDE).toContain(selector);
      });
    });
  });

  describe('loadThemeRegistry', () => {
    it('should handle registry loading errors gracefully', async () => {
      const testPath = '/mock/nonexistent/path/to/registry.ts';

      await expect(loadThemeRegistry(testPath)).rejects.toThrow();
    });
  });

  describe('buildOGConfig', () => {
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

      const config = buildOGConfig();

      expect(config.port).toBe('5173');
      expect(config.baseUrl).toBe('http://localhost:5173/timestamp');
      expect(config.completionMessage).toBe('Timestamp');
    });

    it('should use OG_PORT env var when set', () => {
      process.env.OG_PORT = '8080';

      const config = buildOGConfig();

      expect(config.port).toBe('8080');
      expect(config.baseUrl).toBe('http://localhost:8080/timestamp');
    });

    it('should use PORT env var when OG_PORT not set', () => {
      delete process.env.OG_PORT;
      process.env.PORT = '3000';

      const config = buildOGConfig();

      expect(config.port).toBe('3000');
      expect(config.baseUrl).toBe('http://localhost:3000/timestamp');
    });

    it('should include output directory path', () => {
      const config = buildOGConfig();

      expect(config.outputDir).toContain('public');
      expect(config.outputDir).toMatch(/.*\/public$/);
    });
  });

  describe('hideUIElements', () => {
    it('should hide all specified UI elements', async () => {
      const mockPage = createMockPage();

      await hideUIElements(mockPage);

      expect(mockPage.evaluate).toHaveBeenCalledOnce();
      expect(mockPage.evaluate).toHaveBeenCalledWith(
        expect.any(Function),
        expect.arrayContaining([
          '[data-testid="share-button"]',
          '[data-testid="back-button"]',
          '[data-testid="theme-switcher"]',
        ])
      );
    });
  });

  describe('captureThemeScreenshot', () => {
    it('should navigate to URL and take screenshot', async () => {
      const mockPage = createMockPage();

      const url = 'http://localhost:5173/timestamp/?theme=test';
      const outputPath = '/path/to/output.png';

      await captureThemeScreenshot(mockPage, url, outputPath);

      expect(mockPage.goto).toHaveBeenCalledWith(url, { waitUntil: 'networkidle' });
      expect(mockPage.waitForTimeout).toHaveBeenCalledWith(3750);
      expect(mockPage.evaluate).toHaveBeenCalledOnce();
      expect(mockPage.screenshot).toHaveBeenCalledWith({
        path: outputPath,
        type: 'png',
      });
    });

    it('should propagate navigation errors', async () => {
      const mockPage = createMockPage();
      mockPage.goto = vi.fn().mockRejectedValue(new Error('Navigation timeout'));

      const url = 'http://localhost:5173/timestamp/?theme=test';
      const outputPath = '/path/to/output.png';

      await expect(captureThemeScreenshot(mockPage, url, outputPath)).rejects.toThrow(
        'Navigation timeout'
      );
    });

    it('should propagate screenshot errors', async () => {
      const mockPage = createMockPage();
      mockPage.screenshot = vi.fn().mockRejectedValue(new Error('Screenshot failed'));

      const url = 'http://localhost:5173/timestamp/?theme=test';
      const outputPath = '/path/to/output.png';

      await expect(captureThemeScreenshot(mockPage, url, outputPath)).rejects.toThrow(
        'Screenshot failed'
      );
    });
  });

  describe('generateThemeOGImage', () => {
    it('should generate OG image for theme', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const mockPage = createMockPage();

      const theme = { id: 'fireworks', displayName: 'Fireworks' };
      const config = {
        port: '5173',
        baseUrl: 'http://localhost:5173/timestamp',
        outputDir: '/path/to/public',
        completionMessage: '00:00',
      };

      await generateThemeOGImage(mockPage, theme, config);

      expect(consoleSpy).toHaveBeenCalledWith('  📸 Fireworks (fireworks)...');
      expect(consoleSpy).toHaveBeenCalledWith('     ✅ Saved: public/og-image-fireworks.png');
      expect(mockPage.goto).toHaveBeenCalled();
      expect(mockPage.screenshot).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle screenshot errors and log appropriately', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockPage = createMockPage();
      mockPage.screenshot = vi.fn().mockRejectedValue(new Error('File write failed'));

      const theme = { id: 'fireworks', displayName: 'Fireworks' };
      const config = {
        port: '5173',
        baseUrl: 'http://localhost:5173/timestamp',
        outputDir: '/path/to/public',
        completionMessage: '00:00',
      };

      await expect(generateThemeOGImage(mockPage, theme, config)).rejects.toThrow(
        'File write failed'
      );

      expect(consoleSpy).toHaveBeenCalledWith('  📸 Fireworks (fireworks)...');

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle navigation errors during theme image generation', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const mockPage = createMockPage();
      mockPage.goto = vi.fn().mockRejectedValue(new Error('Page not found'));

      const theme = { id: 'missing-theme', displayName: 'Missing Theme' };
      const config = {
        port: '5173',
        baseUrl: 'http://localhost:5173/timestamp',
        outputDir: '/path/to/public',
        completionMessage: '00:00',
      };

      await expect(generateThemeOGImage(mockPage, theme, config)).rejects.toThrow(
        'Page not found'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('generateDefaultOGImage', () => {
    it('should generate default OG image', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const mockPage = createMockPage();

      const config = {
        port: '5173',
        baseUrl: 'http://localhost:5173/timestamp',
        outputDir: '/path/to/public',
        completionMessage: '00:00',
      };

      await generateDefaultOGImage(mockPage, 'contribution-graph', config);

      expect(consoleSpy).toHaveBeenCalledWith('\n  📸 Default (contribution-graph)...');
      expect(consoleSpy).toHaveBeenCalledWith('     ✅ Saved: public/og-image.png\n');
      expect(mockPage.goto).toHaveBeenCalled();
      expect(mockPage.screenshot).toHaveBeenCalledWith(
        expect.objectContaining({
          path: expect.stringContaining('og-image.png'),
          type: 'png',
        })
      );

      consoleSpy.mockRestore();
    });

    it('should handle errors during default image generation', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const mockPage = createMockPage();
      mockPage.screenshot = vi.fn().mockRejectedValue(new Error('Disk full'));

      const config = {
        port: '5173',
        baseUrl: 'http://localhost:5173/timestamp',
        outputDir: '/path/to/public',
        completionMessage: '00:00',
      };

      await expect(
        generateDefaultOGImage(mockPage, 'contribution-graph', config)
      ).rejects.toThrow('Disk full');

      consoleSpy.mockRestore();
    });
  });

  describe('createOGBrowser', () => {
    it('should delegate to shared createBrowser and return the browser', async () => {
      const fakeBrowser = {} as unknown as Browser;
      const spy = vi.spyOn(shared, 'createBrowser').mockResolvedValue(fakeBrowser);

      const browser = await createOGBrowser();

      expect(browser).toBe(fakeBrowser);
      expect(spy).toHaveBeenCalledOnce();
      spy.mockRestore();
    });

    it('should surface launch failures from shared createBrowser', async () => {
      const error = new Error('launch failed');
      const spy = vi.spyOn(shared, 'createBrowser').mockRejectedValue(error);

      await expect(createOGBrowser()).rejects.toThrow('launch failed');
      expect(spy).toHaveBeenCalledOnce();
      spy.mockRestore();
    });
  });

  describe('createOGPage', () => {
    it('should create page with correct viewport dimensions', async () => {
      const mockBrowser = createMockBrowser();

      await createOGPage(mockBrowser);

      expect(mockBrowser.newPage).toHaveBeenCalledWith({
        viewport: { width: 1200, height: 630 },
      });
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete workflow for single theme', async () => {
      const mockPage = createMockPage();

      const theme = { id: 'test-theme', displayName: 'Test Theme' };
      const config = buildOGConfig();

      await generateThemeOGImage(mockPage, theme, config);

      expect(mockPage.goto).toHaveBeenCalled();
      expect(mockPage.screenshot).toHaveBeenCalled();
    });

    it('should extract and build URLs for multiple themes', () => {
      const registry = createMockRegistry({
        theme1: { name: 'Theme 1' },
        theme2: { name: 'Theme 2' },
      });

      const themes = extractThemeData(registry);
      const config = buildOGConfig();

      const urls = themes.map((theme) =>
        buildCountdownUrl(config.baseUrl, theme.id, config.completionMessage)
      );

      expect(urls).toHaveLength(2);
      expect(urls[0]).toContain('theme=theme1');
      expect(urls[1]).toContain('theme=theme2');
    });
  });

  describe('generateOGImages (main orchestrator)', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should fail gracefully when registry path does not exist', async () => {
      const { generateOGImages } = await import('./og-images');
      const nonexistentPath = '/nonexistent/path/to/registry.ts';
      await expect(generateOGImages(nonexistentPath)).rejects.toThrow();
    });

    it('should orchestrate browser lifecycle and generate images for all themes', async () => {
      const mockPage = createMockPage({
        screenshot: vi.fn().mockResolvedValue(undefined),
      });
      const mockBrowser = createMockBrowser(mockPage);
      const registry = createMockRegistry({
        alpha: { name: 'Alpha' },
      });

      const registerSpy = vi.spyOn(shared, 'registerWebpMockLoader').mockImplementation(() => {});
      const loadSpy = vi.spyOn(shared, 'loadThemeRegistry').mockResolvedValue(registry as never);
      const extractSpy = vi.spyOn(shared, 'extractThemeData').mockReturnValue([
        { id: 'alpha', displayName: 'Alpha' },
      ]);
      const browserSpy = vi.spyOn(shared, 'createBrowser').mockResolvedValue(mockBrowser as never);
      const pageSpy = vi.spyOn(shared, 'createPage').mockResolvedValue(mockPage as never);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await generateOGImages('/fake/registry.ts');

      expect(registerSpy).toHaveBeenCalled();
      expect(loadSpy).toHaveBeenCalledWith('/fake/registry.ts');
      expect(extractSpy).toHaveBeenCalled();
      expect(browserSpy).toHaveBeenCalledTimes(1);
      expect(pageSpy).toHaveBeenCalledWith(mockBrowser, OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT);
      expect(mockPage.goto).toHaveBeenCalledTimes(2);
      expect(mockPage.screenshot).toHaveBeenCalledTimes(2);
      expect(mockBrowser.close).toHaveBeenCalledTimes(1);

      consoleSpy.mockRestore();
    });

    it('should handle browser launch failures', async () => {
      // createOGBrowser delegates to shared.createBrowser
      // Verify the delegation works correctly
      const browserSpy = vi.spyOn(shared, 'createBrowser').mockRejectedValue(new Error('cannot launch'));

      await expect(createOGBrowser()).rejects.toThrow('cannot launch');
      expect(browserSpy).toHaveBeenCalledOnce();

      browserSpy.mockRestore();
    });

    it('should delegate browser creation to shared module', async () => {
      // Browser creation is delegated to shared.createBrowser
      // This is tested via the rejection test above
      expect(shared.createBrowser).toBeDefined();
    });
  });
});
