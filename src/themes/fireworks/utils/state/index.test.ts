/** Tests for fireworks state barrel exports. */

import { describe, it, expect } from 'vitest';
import * as stateExports from './index';

describe('fireworks/utils/state barrel exports', () => {
  it('should export base state factory', () => {
    expect(stateExports.createBaseRendererState).toBeDefined();
    expect(typeof stateExports.createBaseRendererState).toBe('function');
  });

  it('should export time renderer state factory', () => {
    expect(stateExports.createRendererState).toBeDefined();
    expect(typeof stateExports.createRendererState).toBe('function');
  });

  it('should export landing renderer state factory', () => {
    expect(stateExports.createLandingRendererState).toBeDefined();
    expect(typeof stateExports.createLandingRendererState).toBe('function');
  });

  it('should export type guards', () => {
    expect(stateExports.isRendererReady).toBeDefined();
    expect(stateExports.isCanvasReady).toBeDefined();
    expect(stateExports.isLandingRendererReady).toBeDefined();
    expect(typeof stateExports.isRendererReady).toBe('function');
  });
});
