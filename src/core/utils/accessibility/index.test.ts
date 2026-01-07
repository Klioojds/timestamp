import { describe, it, expect } from 'vitest';

import * as accessibilityIndex from './index';
import * as announcements from './announcements';
import * as focusTrap from './focus-trap';
import * as rovingTabindex from './roving-tabindex';

describe('accessibility index exports', () => {
  it('re-exports focus trap utilities', () => {
    expect(accessibilityIndex.createFocusTrap).toBe(focusTrap.createFocusTrap);
  });

  it('re-exports roving tabindex utilities', () => {
    expect(accessibilityIndex.createRovingTabindex).toBe(rovingTabindex.createRovingTabindex);
  });

  it('re-exports announcement helpers', () => {
    expect(accessibilityIndex.createAccessibilityManager).toBe(announcements.createAccessibilityManager);
    expect(accessibilityIndex.prefersReducedMotion).toBe(announcements.prefersReducedMotion);
    expect(accessibilityIndex.setAttributeIfChanged).toBe(announcements.setAttributeIfChanged);
  });
});