import { describe, it, expect, afterEach, vi } from 'vitest';
import { prepareContainer, restoreContainer, hideLoadingElement } from './container-preparation';
import { createDomSetupFixture } from '@/test-utils/orchestrator-fixtures';

describe('dom-setup', () => {
  let fixture: ReturnType<typeof createDomSetupFixture> | null = null;

  afterEach(() => {
    fixture?.cleanup();
    fixture = null;
  });

  it('should prepare container with countdown styles and initialize accessibility', () => {
    fixture = createDomSetupFixture();

    prepareContainer(fixture.container, fixture.accessibilityManager);

    expect(fixture.container.classList.contains('countdown-view')).toBe(true);
    expect(document.documentElement.style.overflow).toBe('hidden');
    expect(document.body.style.overflow).toBe('hidden');
    expect(fixture.accessibilityManager.init).toHaveBeenCalledWith(fixture.container);
  });

  it('should reset scroll position to top when preparing container', () => {
    fixture = createDomSetupFixture();
    
    // Simulate scroll position from landing page
    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    
    prepareContainer(fixture.container, fixture.accessibilityManager);
    
    expect(scrollToSpy).toHaveBeenCalledWith(0, 0);
    scrollToSpy.mockRestore();
  });

  it('should restore container and overflow settings', () => {
    fixture = createDomSetupFixture();

    prepareContainer(fixture.container, fixture.accessibilityManager);
    restoreContainer(fixture.container);

    expect(fixture.container.classList.contains('countdown-view')).toBe(false);
    expect(document.documentElement.style.overflow).toBe('');
    expect(document.body.style.overflow).toBe('');
  });

  it('should hide the loading element when present', () => {
    fixture = createDomSetupFixture();
    const loading = document.createElement('div');
    loading.id = 'loading';
    document.body.appendChild(loading);

    hideLoadingElement();

    expect(loading.classList.contains('hidden')).toBe(true);
    expect(loading.hidden).toBe(true);
  });
});
