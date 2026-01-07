/**
 * DOM builders for share menu
 * Verifies ARIA wiring and icon injection.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createShareMenuDOM } from './share-menu-dom';

describe('createShareMenuDOM', () => {
  const originalNow = Date.now;

  beforeEach(() => {
    vi.useFakeTimers();
    Date.now = vi.fn(() => 1234567890);
  });

  afterEach(() => {
    Date.now = originalNow;
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('should wire trigger button to generated menu id', () => {
    const { container, button, menu } = createShareMenuDOM();
    document.body.appendChild(container);

    expect(menu.id).toBe('share-menu-1234567890');
    expect(button.getAttribute('aria-controls')).toBe(menu.id);
  });

  it('should inject link and chevron icons into trigger', () => {
    const { container, button } = createShareMenuDOM();
    document.body.appendChild(container);

    const svgs = button.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(2);
    expect(Array.from(svgs).some((svg) => svg.classList.contains('share-menu-chevron'))).toBe(true);
  });

  it('should add share icons to each menu item with labels intact', () => {
    const { container, menuItems } = createShareMenuDOM();
    document.body.appendChild(container);

    const items = [menuItems.selectedTz, menuItems.localTz, menuItems.withoutTz];
    items.forEach((item) => {
      const icon = item.querySelector('svg');
      const label = item.querySelector('.share-menu-item-label');
      expect(icon).not.toBeNull();
      expect(label?.textContent).toBeTruthy();
    });
  });
});
