/**
 * Verifies createThemePicker renders an accessible button that opens a modal dialog.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupThemePickerTestDom, type ThemePickerTestContext } from '@/test-utils/theme-picker-fixtures';
import { createThemePicker } from './picker-button';

describe('createThemePicker', () => {
  let container: HTMLElement;
  let testContext: ThemePickerTestContext;

  beforeEach(() => {
    testContext = setupThemePickerTestDom();
    container = testContext.container;
  });

  afterEach(() => {
    testContext.restore();
  });

  it('should render button with accessible attributes when initialized', () => {
    // Arrange
    const onSwitch = vi.fn();

    // Act
    const switcher = createThemePicker(container, {
      initialTheme: 'contribution-graph',
      onSwitch,
    });
    const button = container.querySelector('[data-testid="theme-switcher"]');

    // Assert
    expect(button).not.toBeNull();
    expect(button?.getAttribute('type')).toBe('button');
    expect(button?.getAttribute('aria-label')).toContain('Contribution Graph');

    switcher.destroy();
  });

  it('should open modal when button is clicked', async () => {
    // Arrange
    const onSwitch = vi.fn();
    const switcher = createThemePicker(container, {
      initialTheme: 'contribution-graph',
      onSwitch,
    });
    const button = container.querySelector('[data-testid="theme-switcher"]') as HTMLButtonElement;

    // Act - async click handler (lazy-loads modal)
    button.click();
    await vi.waitFor(() => {
      expect(document.querySelector('[data-testid="theme-modal"]')).not.toBeNull();
    });

    // Assert - modal should be visible
    const modal = document.querySelector('[data-testid="theme-modal"]');
    expect(modal).not.toBeNull();

    switcher.destroy();
  });

  it('should call onSwitch when theme is selected in modal', async () => {
    // Arrange
    const onSwitch = vi.fn();
    const switcher = createThemePicker(container, {
      initialTheme: 'contribution-graph',
      onSwitch,
    });
    const button = container.querySelector('[data-testid="theme-switcher"]') as HTMLButtonElement;

    // Act - open modal (async due to lazy-loading)
    button.click();
    await vi.waitFor(() => {
      expect(document.querySelector('[data-testid="theme-modal"]')).not.toBeNull();
    });

    // Select fireworks theme in modal
    const fireworksCell = document.querySelector('[data-theme-id="fireworks"] [role="gridcell"]') as HTMLElement;
    fireworksCell.click();

    // Assert
    expect(onSwitch).toHaveBeenCalledWith('fireworks');

    switcher.destroy();
  });

  it('should await async onSwitch before closing modal to prevent theme flash', async () => {
    // Arrange
    let resolveSwitch: () => void;
    const switchPromise = new Promise<void>((resolve) => {
      resolveSwitch = resolve;
    });
    const onSwitch = vi.fn().mockImplementation(() => switchPromise);
    
    const switcher = createThemePicker(container, {
      initialTheme: 'contribution-graph',
      onSwitch,
    });
    const button = container.querySelector('[data-testid="theme-switcher"]') as HTMLButtonElement;

    // Act - open modal (async due to lazy-loading)
    button.click();
    await vi.waitFor(() => {
      expect(document.querySelector('[data-testid="theme-modal"]')).not.toBeNull();
    });

    // Select fireworks theme in modal
    const fireworksCell = document.querySelector('[data-theme-id="fireworks"] [role="gridcell"]') as HTMLElement;
    fireworksCell.click();

    // Assert - modal should still be open while onSwitch is pending
    expect(document.querySelector('[data-testid="theme-modal"]')).not.toBeNull();
    expect(onSwitch).toHaveBeenCalledWith('fireworks');

    // Resolve the switch
    resolveSwitch!();
    await switchPromise;
    
    // Use setTimeout to allow microtasks to complete
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Assert - modal should be closed after onSwitch resolves
    expect(document.querySelector('[data-testid="theme-modal"]')).toBeNull();

    switcher.destroy();
  });

  it('should update button aria-label when setTheme is invoked', () => {
    // Arrange
    const onSwitch = vi.fn();
    const switcher = createThemePicker(container, {
      initialTheme: 'contribution-graph',
      onSwitch,
    });
    const button = container.querySelector('[data-testid="theme-switcher"]') as HTMLButtonElement;

    // Assert initial state
    expect(button.getAttribute('aria-label')).toContain('Contribution Graph');

    // Act
    switcher.setTheme('fireworks');

    // Assert
    expect(button.getAttribute('aria-label')).toContain('Fireworks');

    switcher.destroy();
  });

  it('should remove button and clean up modal when destroyed', async () => {
    // Arrange
    const onSwitch = vi.fn();
    const switcher = createThemePicker(container, {
      initialTheme: 'contribution-graph',
      onSwitch,
    });
    const button = container.querySelector('[data-testid="theme-switcher"]') as HTMLButtonElement;

    // Open modal (async due to lazy-loading)
    button.click();
    await vi.waitFor(() => {
      expect(document.querySelector('[data-testid="theme-modal"]')).not.toBeNull();
    });

    // Act
    switcher.destroy();

    // Assert - button and modal should be removed
    expect(container.querySelector('[data-testid="theme-switcher"]')).toBeNull();
    expect(document.querySelector('[data-testid="theme-modal"]')).toBeNull();
  });

  it('should close modal and not call onSwitch if modal is closed without selection', async () => {
    // Arrange
    const onSwitch = vi.fn();
    const switcher = createThemePicker(container, {
      initialTheme: 'contribution-graph',
      onSwitch,
    });
    const button = container.querySelector('[data-testid="theme-switcher"]') as HTMLButtonElement;

    // Act - open modal (async due to lazy-loading)
    button.click();
    await vi.waitFor(() => {
      expect(document.querySelector('[data-testid="theme-modal"]')).not.toBeNull();
    });

    // Close modal without selecting a theme (Escape key)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    // Assert - onSwitch should not be called
    expect(onSwitch).not.toHaveBeenCalled();

    switcher.destroy();
  });
});
