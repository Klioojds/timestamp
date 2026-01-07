import { describe, it, expect } from 'vitest';
import { createInstallPrompt, createOfflineIndicator } from './index';

describe('components/pwa/index exports', () => {
  it('should export createInstallPrompt', () => {
    expect(typeof createInstallPrompt).toBe('function');
  });

  it('should export createOfflineIndicator', () => {
    expect(typeof createOfflineIndicator).toBe('function');
  });
});
