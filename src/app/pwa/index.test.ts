import { beforeEach, describe, expect, it, vi } from 'vitest';

const registerServiceWorkerMock = vi.fn();
const createInstallPromptMock = vi.fn();
const createUpdatePromptMock = vi.fn();
const createUpdateManagerMock = vi.fn();

vi.mock('./registration', () => ({
  registerServiceWorker: registerServiceWorkerMock,
}));

vi.mock('@components/pwa', () => ({
  createInstallPrompt: createInstallPromptMock,
}));

vi.mock('./update-prompt', () => ({
  createUpdatePrompt: createUpdatePromptMock,
}));

vi.mock('./update-manager', () => ({
  createUpdateManager: createUpdateManagerMock,
}));

describe('initPWA / destroyPWA', () => {
  let installElement: HTMLElement;
  let updateElement: HTMLElement;
  let installPromptController: {
    getElement: () => HTMLElement;
    init: ReturnType<typeof vi.fn>;
    destroy: ReturnType<typeof vi.fn>;
  };
  let updatePromptController: {
    getElement: () => HTMLElement;
    init: ReturnType<typeof vi.fn>;
    destroy: ReturnType<typeof vi.fn>;
  };
  let updateManagerController: {
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    document.body.innerHTML = '';

    installElement = document.createElement('div');
    installElement.id = 'install-prompt';
    updateElement = document.createElement('div');
    updateElement.id = 'update-prompt';

    installPromptController = {
      getElement: vi.fn(() => installElement),
      init: vi.fn(),
      destroy: vi.fn(() => installElement.remove()),
    };

    updatePromptController = {
      getElement: vi.fn(() => updateElement),
      init: vi.fn(),
      destroy: vi.fn(() => updateElement.remove()),
    };

    updateManagerController = {
      start: vi.fn(),
      stop: vi.fn(),
    };

    registerServiceWorkerMock.mockResolvedValue({ success: true, registration: null });
    createInstallPromptMock.mockImplementation(() => installPromptController);
    createUpdatePromptMock.mockImplementation(() => updatePromptController);
    createUpdateManagerMock.mockImplementation(() => updateManagerController);
  });

  it('initializes PWA features and starts update manager', async () => {
    const { initPWA } = await import('./index');

    await initPWA();

    expect(registerServiceWorkerMock).toHaveBeenCalledTimes(1);
    expect(createInstallPromptMock).toHaveBeenCalledTimes(1);
    expect(createUpdatePromptMock).toHaveBeenCalledTimes(1);
    expect(createUpdateManagerMock).toHaveBeenCalledWith({
      checkInterval: 60 * 60 * 1000,
      autoReload: false,
    });
    expect(installPromptController.init).toHaveBeenCalledTimes(1);
    expect(updatePromptController.init).toHaveBeenCalledTimes(1);
    expect(updateManagerController.start).toHaveBeenCalledTimes(1);
    expect(document.body.contains(installElement)).toBe(true);
    expect(document.body.contains(updateElement)).toBe(true);
  });

  it('cleans up controllers and is idempotent on destroy', async () => {
    const { initPWA, destroyPWA } = await import('./index');

    await initPWA();
    await destroyPWA();
    await destroyPWA();

    expect(installPromptController.destroy).toHaveBeenCalledTimes(1);
    expect(updatePromptController.destroy).toHaveBeenCalledTimes(1);
    expect(updateManagerController.stop).toHaveBeenCalledTimes(1);
    expect(document.body.contains(installElement)).toBe(false);
    expect(document.body.contains(updateElement)).toBe(false);
  });
});
