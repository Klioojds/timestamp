import { describe, it, expect, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  mockShowErrorToast: vi.fn(),
  mockShowInfoToast: vi.fn(),
  mockShowPermissionToast: vi.fn(),
  mockShowSuccessToast: vi.fn(),
  mockToastManager: {
    show: vi.fn(),
    dismiss: vi.fn(),
    dismissAll: vi.fn(),
    getCount: vi.fn(),
    destroy: vi.fn(),
  },
}));

vi.mock('./toast-manager', () => ({
  showErrorToast: mocks.mockShowErrorToast,
  showInfoToast: mocks.mockShowInfoToast,
  showPermissionToast: mocks.mockShowPermissionToast,
  showSuccessToast: mocks.mockShowSuccessToast,
  toastManager: mocks.mockToastManager,
}));

import {
  showErrorToast,
  showInfoToast,
  showPermissionToast,
  showSuccessToast,
  toastManager,
  TOAST_DEFAULTS,
} from './index';
import { TOAST_DEFAULTS as TYPES_DEFAULTS } from './types';

describe('toast index exports', () => {
  it('forwards toast manager singleton', () => {
    expect(toastManager).toBe(mocks.mockToastManager);
  });

  it('forwards convenience helpers to toast manager module', () => {
    showErrorToast('oops');
    showInfoToast('info');
    showPermissionToast('perm', { label: 'Allow', onClick: vi.fn() });
    showSuccessToast('great');

    expect(mocks.mockShowErrorToast).toHaveBeenCalledWith('oops');
    expect(mocks.mockShowInfoToast).toHaveBeenCalledWith('info');
    expect(mocks.mockShowPermissionToast).toHaveBeenCalledWith('perm', { label: 'Allow', onClick: expect.any(Function) });
    expect(mocks.mockShowSuccessToast).toHaveBeenCalledWith('great');
  });

  it('re-exports TOAST_DEFAULTS from types', () => {
    expect(TOAST_DEFAULTS).toBe(TYPES_DEFAULTS);
    expect(TOAST_DEFAULTS.maxVisible).toBeGreaterThan(0);
  });
});
