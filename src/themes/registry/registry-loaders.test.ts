/**
 * Tests for Theme Registry Loaders
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  loadThemeSafe,
  getLandingPageRendererFactory,
} from './registry-loaders';
import { THEME_REGISTRY } from './registry-core';

describe('Registry Loaders', () => {
  // Store originals to restore after mocking
  const originalLoaders: Record<string, any> = {};

  afterEach(() => {
    // Restore all mocked loaders
    for (const [themeId, originalLoader] of Object.entries(originalLoaders)) {
      THEME_REGISTRY[themeId as keyof typeof THEME_REGISTRY].loadTheme = originalLoader;
    }
    // Clear the storage
    for (const key in originalLoaders) {
      delete originalLoaders[key];
    }
  });
  describe('loadThemeSafe', () => {
    it.each([
      { themeId: 'contribution-graph', expectedName: 'Contribution Graph' },
      { themeId: 'fireworks', expectedName: 'Fireworks Celebration' },
    ])('should return config for $themeId', async ({ themeId, expectedName }) => {
      const { config } = await loadThemeSafe(themeId);
      expect(config).toBeDefined();
      expect(config.name).toBe(expectedName);
    });

    it('should return all required factories and config', async () => {
      const result = await loadThemeSafe('contribution-graph');
      expect(typeof result.timePageRenderer).toBe('function');
      expect(typeof result.landingPageRenderer).toBe('function');
      expect(result.config).toBeDefined();
    });

    it('should return factory that creates time page renderer', async () => {
      const { timePageRenderer } = await loadThemeSafe('contribution-graph');
      const targetDate = new Date();
      const renderer = timePageRenderer(targetDate);
      
      // Verify renderer has required methods
      expect(typeof renderer.mount).toBe('function');
      expect(typeof renderer.destroy).toBe('function');
      expect(typeof renderer.updateTime).toBe('function');
    });

    it('should return landingPageRenderer that creates landing page renderer', async () => {
      const { landingPageRenderer } = await loadThemeSafe('fireworks');
      const container = document.createElement('div');
      const renderer = landingPageRenderer(container);
      
      // Verify renderer has required methods
      expect(typeof renderer.destroy).toBe('function');
      
      // Clean up
      renderer.destroy();
    });

    it('should fallback to default theme when loading fails', async () => {
      // Arrange - Mock loadTheme to fail for fireworks (not default)
      originalLoaders['fireworks'] = THEME_REGISTRY['fireworks'].loadTheme;
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      THEME_REGISTRY['fireworks'].loadTheme = vi.fn().mockRejectedValue(
        new Error('Network error')
      );

      // Act
      const result = await loadThemeSafe('fireworks');

      // Assert - Should fallback to default theme (contribution-graph)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load theme "fireworks"'),
        expect.any(Error)
      );
      expect(result.config.name).toBe('Contribution Graph'); // Default theme

      // Cleanup
      consoleErrorSpy.mockRestore();
    });

    it('should throw error when default theme fails to load', async () => {
      // Arrange - Mock loadTheme to fail for the default theme
      originalLoaders['contribution-graph'] = THEME_REGISTRY['contribution-graph'].loadTheme;
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      THEME_REGISTRY['contribution-graph'].loadTheme = vi.fn().mockRejectedValue(
        new Error('Critical failure')
      );

      // Act & Assert
      await expect(loadThemeSafe('contribution-graph')).rejects.toThrow(
        'Failed to load default theme'
      );

      // Cleanup
      consoleErrorSpy.mockRestore();
    });
  });

  describe('getLandingPageRendererFactory', () => {
    it.each(['contribution-graph', 'fireworks'])('should return a function for %s', async (themeId) => {
      const factory = await getLandingPageRendererFactory(themeId);
      expect(typeof factory).toBe('function');
    });

    it('should return different factories for different themes', async () => {
      const [graphFactory, fireworksFactory] = await Promise.all([
        getLandingPageRendererFactory('contribution-graph'),
        getLandingPageRendererFactory('fireworks'),
      ]);
      expect(graphFactory).not.toBe(fireworksFactory);
    });

    it('should return factory that creates valid landing page renderer', async () => {
      const factory = await getLandingPageRendererFactory('contribution-graph');
      const container = document.createElement('div');
      const renderer = factory(container);
      
      expect(renderer).toBeDefined();
      expect(typeof renderer.destroy).toBe('function');
      
      // Clean up
      renderer.destroy();
    });
  });
});
