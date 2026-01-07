import { describe, it, expect } from 'vitest';

import * as urlModule from './url';
import * as indexModule from './index';

describe('url index exports', () => {
  it('re-exports url module functions and types', () => {
    expect(indexModule.parseDeepLink).toBe(urlModule.parseDeepLink);
    expect(indexModule.buildCountdownUrl).toBe(urlModule.buildCountdownUrl);
    expect(indexModule.buildShareUrls).toBe(urlModule.buildShareUrls);
    expect(indexModule.parseCountdownMode).toBe(urlModule.parseCountdownMode);
  });

  it('re-exports shared types', () => {
    const shareTargets: indexModule.ShareTargets = {
      withLocalTimezone: 'a',
      withSelectedTimezone: 'b',
      withoutTimezone: 'c',
    };

    const validationResult: indexModule.DateValidationResult = { isValid: true, date: new Date() };

    expect(shareTargets).toBeDefined();
    expect(validationResult.isValid).toBe(true);
  });
});