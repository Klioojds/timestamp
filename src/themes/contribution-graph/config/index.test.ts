import { describe, it, expect } from 'vitest';
import { CONTRIBUTION_GRAPH_CONFIG } from './index';

describe('Contribution Graph Config', () => {
  describe('Theme Configuration', () => {
    it('should have valid theme ID', () => {
      // Note: folder is contribution-graph, but theme ID is contribution-graph
      expect(CONTRIBUTION_GRAPH_CONFIG.id).toBe('contribution-graph');
    });

    it('should have required config properties', () => {
      expect(CONTRIBUTION_GRAPH_CONFIG.name).toBeDefined();
      expect(CONTRIBUTION_GRAPH_CONFIG.name).toMatch(/^[A-Z]/);
      expect(CONTRIBUTION_GRAPH_CONFIG.description).toBeDefined();
      expect(CONTRIBUTION_GRAPH_CONFIG.publishedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(CONTRIBUTION_GRAPH_CONFIG.author).toBeDefined();
    });

    it('should have sensible supportsWorldMap setting', () => {
      expect(typeof CONTRIBUTION_GRAPH_CONFIG.supportsWorldMap).toBe('boolean');
    });

    it('should have optional components configuration', () => {
      expect(CONTRIBUTION_GRAPH_CONFIG.optionalComponents).toBeDefined();
      expect(typeof CONTRIBUTION_GRAPH_CONFIG.optionalComponents.timezoneSelector).toBe('boolean');
      expect(typeof CONTRIBUTION_GRAPH_CONFIG.optionalComponents.worldMap).toBe('boolean');
    });

    it('should have colors defined for both modes', () => {
      expect(CONTRIBUTION_GRAPH_CONFIG.colors).toBeDefined();
      expect(CONTRIBUTION_GRAPH_CONFIG.colors?.dark).toBeDefined();
      expect(CONTRIBUTION_GRAPH_CONFIG.colors?.light).toBeDefined();
      expect(CONTRIBUTION_GRAPH_CONFIG.colors?.dark?.accentPrimary).toBeDefined();
      expect(CONTRIBUTION_GRAPH_CONFIG.colors?.light?.accentPrimary).toBeDefined();
    });
  });
});
