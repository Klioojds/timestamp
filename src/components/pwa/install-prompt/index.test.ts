import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createInstallPrompt } from './index';

const mocks = vi.hoisted(() => ({
  isIOS: vi.fn(() => false),
  incrementVisitCount: vi.fn(),
  shouldShowPrompt: vi.fn(() => false),
  markDismissed: vi.fn(),
  handleNativeInstall: vi.fn(async () => true),
  setDeferredPrompt: vi.fn<(prompt: Event) => void>(),
  showPromptCallback: vi.fn(),
  createLifecycleController: vi.fn(),
}));

let overlay: HTMLElement;
let dialog: HTMLElement;
let lifecycle: { show: () => void; hide: () => void; destroy: () => void };

vi.mock('./dom-builders', () => ({
  isIOS: (...args: unknown[]) => mocks.isIOS(...args),
  createOverlay: () => overlay,
  createDialog: () => dialog,
}));

vi.mock('./install-handler', () => ({
  incrementVisitCount: (...args: unknown[]) => mocks.incrementVisitCount(...args),
  shouldShowPrompt: (...args: unknown[]) => mocks.shouldShowPrompt(...args),
  markDismissed: (...args: unknown[]) => mocks.markDismissed(...args),
  handleNativeInstall: (...args: unknown[]) => mocks.handleNativeInstall(...args),
  createBeforeInstallPromptHandler: (
    setDeferredPrompt: (prompt: Event) => void,
    showPrompt: () => void
  ) => {
    mocks.setDeferredPrompt.mockImplementation(setDeferredPrompt);
    mocks.showPromptCallback.mockImplementation(showPrompt);
    return (event: Event) => {
      setDeferredPrompt(event);
      if (mocks.shouldShowPrompt.mock.calls.length === 0 || mocks.shouldShowPrompt(event)) {
        showPrompt();
      }
    };
  },
}));

vi.mock('./lifecycle', () => ({
  createLifecycleController: (...args: unknown[]) => mocks.createLifecycleController(...args),
}));

describe('createInstallPrompt (index)', () => {
  beforeEach(() => {
    overlay = document.createElement('div');
    dialog = document.createElement('div');

    // Buttons expected by createInstallPrompt
    const dismiss = document.createElement('button');
    dismiss.className = 'install-prompt-secondary';
    dialog.appendChild(dismiss);

    const install = document.createElement('button');
    install.className = 'install-prompt-primary';
    dialog.appendChild(install);

    lifecycle = {
      show: vi.fn(),
      hide: vi.fn(),
      destroy: vi.fn(),
    };

    mocks.isIOS.mockReturnValue(false);
    mocks.incrementVisitCount.mockClear();
    mocks.shouldShowPrompt.mockClear().mockReturnValue(false);
    mocks.markDismissed.mockClear();
    mocks.handleNativeInstall.mockClear().mockResolvedValue(true);
    mocks.setDeferredPrompt.mockClear();
    mocks.showPromptCallback.mockClear();
    mocks.createLifecycleController.mockClear().mockReturnValue(lifecycle);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should increment visits and show prompt on iOS when eligible', () => {
    mocks.isIOS.mockReturnValue(true);
    mocks.shouldShowPrompt.mockReturnValue(true);

    const controller = createInstallPrompt();
    controller.init();

    expect(mocks.incrementVisitCount).toHaveBeenCalled();
    expect(lifecycle.show).toHaveBeenCalled();
  });

  it('should wire beforeinstallprompt handler and remove it on destroy', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const controller = createInstallPrompt();
    controller.init();

    expect(addSpy).toHaveBeenCalledWith('beforeinstallprompt', expect.any(Function));

    controller.destroy();

    expect(removeSpy).toHaveBeenCalledWith('beforeinstallprompt', expect.any(Function));
    expect(lifecycle.destroy).toHaveBeenCalled();
  });

  it('should dismiss prompt when secondary button is clicked', () => {
    const controller = createInstallPrompt();
    controller.init();

    const dismissButton = dialog.querySelector('.install-prompt-secondary') as HTMLButtonElement;
    dismissButton.click();

    expect(mocks.markDismissed).toHaveBeenCalled();
    expect(lifecycle.hide).toHaveBeenCalled();
  });

  it('should handle native install when primary button clicked', async () => {
    const controller = createInstallPrompt();
    controller.init();

    const deferredEvent = new Event('beforeinstallprompt');
    mocks.setDeferredPrompt(deferredEvent);

    const installButton = dialog.querySelector('.install-prompt-primary') as HTMLButtonElement;
    await installButton.click();

    expect(mocks.handleNativeInstall).toHaveBeenCalledWith(deferredEvent);
    expect(lifecycle.hide).toHaveBeenCalled();
  });

  it('should show prompt when beforeinstallprompt fires and threshold met', () => {
    mocks.shouldShowPrompt.mockReturnValue(true);

    const addSpy = vi.spyOn(window, 'addEventListener');

    const controller = createInstallPrompt();
    controller.init();

    const handler = addSpy.mock.calls.find((call) => call[0] === 'beforeinstallprompt')?.[1] as
      | ((event: Event) => void)
      | undefined;

    handler?.(new Event('beforeinstallprompt'));

    expect(lifecycle.show).toHaveBeenCalled();
  });
});
