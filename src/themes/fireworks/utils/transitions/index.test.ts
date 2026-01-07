/** Tests for fireworks transitions barrel exports. */

import { describe, it, expect } from 'vitest';
import * as transitionsExports from './index';

describe('fireworks/utils/transitions barrel exports', () => {
  it('should export celebration functions', () => {
    expect(transitionsExports.triggerMaximumFireworks).toBeDefined();
    expect(transitionsExports.showStaticCelebration).toBeDefined();
    expect(transitionsExports.resetToCountdownDisplay).toBeDefined();
    expect(typeof transitionsExports.triggerMaximumFireworks).toBe('function');
    expect(typeof transitionsExports.showStaticCelebration).toBe('function');
    expect(typeof transitionsExports.resetToCountdownDisplay).toBe('function');
  });

  it('should export lifecycle functions', () => {
    expect(transitionsExports.setupFireworksCanvas).toBeDefined();
    expect(transitionsExports.reconnectFireworksCanvas).toBeDefined();
    expect(transitionsExports.destroyFireworksCanvas).toBeDefined();
    expect(transitionsExports.handleFireworksAnimationStateChange).toBeDefined();
    expect(typeof transitionsExports.setupFireworksCanvas).toBe('function');
    expect(typeof transitionsExports.reconnectFireworksCanvas).toBe('function');
    expect(typeof transitionsExports.destroyFireworksCanvas).toBe('function');
    expect(typeof transitionsExports.handleFireworksAnimationStateChange).toBe('function');
  });
});
