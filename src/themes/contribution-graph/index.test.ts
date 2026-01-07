import { describe, expect, it } from 'vitest';
import * as entrypoint from './index';
import { CONTRIBUTION_GRAPH_CONFIG } from './config';
import { contributionGraphTimePageRenderer } from './renderers/time-page-renderer';
import { contributionGraphLandingPageRenderer } from './renderers/landing-page-renderer';

/** Tests for contribution-graph theme entry point exports. */
describe('contribution-graph index', () => {
  it('should export configuration and renderer factories when the entry module loads', () => {
    expect(entrypoint.CONTRIBUTION_GRAPH_CONFIG).toBe(CONTRIBUTION_GRAPH_CONFIG);
    expect(entrypoint.contributionGraphTimePageRenderer).toBe(contributionGraphTimePageRenderer);
    expect(entrypoint.contributionGraphLandingPageRenderer).toBe(contributionGraphLandingPageRenderer);
  });

  it('should expose export names expected by the registry when importing the theme module', () => {
    const { CONTRIBUTION_GRAPH_CONFIG: config, contributionGraphTimePageRenderer: timeRenderer, contributionGraphLandingPageRenderer: landingRenderer } = entrypoint;

    expect(config).toBeDefined();
    expect(typeof timeRenderer).toBe('function');
    expect(typeof landingRenderer).toBe('function');
  });
});