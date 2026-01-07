/**
 * Tooltip Component Tests
 *
 * Tests for the accessible tooltip component.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTooltip, resetTooltipIdCounter } from './tooltip';

// Mock the reduced motion manager
vi.mock('@core/utils/accessibility', () => ({
  reducedMotionManager: {
    isActive: vi.fn(() => false),
    subscribe: vi.fn(() => vi.fn()),
  },
}));

describe('Tooltip', () => {
  let trigger: HTMLElement;

  beforeEach(() => {
    // Create a trigger element
    trigger = document.createElement('button');
    trigger.textContent = 'Hover me';
    document.body.appendChild(trigger);

    // Reset tooltip ID counter for predictable IDs
    resetTooltipIdCounter();
  });

  afterEach(() => {
    // Clean up DOM
    document.body.innerHTML = '';
  });

  describe('createTooltip', () => {
    it('should create a tooltip with correct ARIA attributes', () => {
      const tooltip = createTooltip({
        trigger,
        content: 'Test tooltip content',
      });

      // Tooltip should be in the DOM
      const tooltipEl = document.getElementById('tooltip-1');
      expect(tooltipEl).not.toBeNull();
      expect(tooltipEl?.getAttribute('role')).toBe('tooltip');
      expect(tooltipEl?.getAttribute('aria-hidden')).toBe('true');

      // Trigger should reference the tooltip
      expect(trigger.getAttribute('aria-describedby')).toBe('tooltip-1');

      tooltip.destroy();
    });

    it('should set text content when content is a string', () => {
      const tooltip = createTooltip({
        trigger,
        content: 'Hello World',
      });

      tooltip.show();

      const tooltipEl = document.getElementById('tooltip-1');
      expect(tooltipEl?.textContent).toBe('Hello World');

      tooltip.destroy();
    });

    it('should append element when content is an HTMLElement', () => {
      const contentEl = document.createElement('span');
      contentEl.textContent = 'Custom element';

      const tooltip = createTooltip({
        trigger,
        content: contentEl,
      });

      tooltip.show();

      const tooltipEl = document.getElementById('tooltip-1');
      expect(tooltipEl?.querySelector('span')?.textContent).toBe('Custom element');

      tooltip.destroy();
    });

    it('should apply correct position class', () => {
      const tooltip = createTooltip({
        trigger,
        content: 'Test',
        position: 'top',
      });

      tooltip.show();

      const tooltipEl = document.getElementById('tooltip-1');
      expect(tooltipEl?.classList.contains('tooltip--top')).toBe(true);

      tooltip.destroy();
    });

    it('should default to bottom position', () => {
      const tooltip = createTooltip({
        trigger,
        content: 'Test',
      });

      tooltip.show();

      const tooltipEl = document.getElementById('tooltip-1');
      expect(tooltipEl?.classList.contains('tooltip--bottom')).toBe(true);

      tooltip.destroy();
    });
  });

  describe('show/hide', () => {
    it('should show tooltip on show()', () => {
      const tooltip = createTooltip({
        trigger,
        content: 'Test',
      });

      tooltip.show();

      const tooltipEl = document.getElementById('tooltip-1');
      expect(tooltipEl?.classList.contains('tooltip--visible')).toBe(true);
      expect(tooltipEl?.getAttribute('aria-hidden')).toBe('false');

      tooltip.destroy();
    });

    it('should hide tooltip on hide()', () => {
      const tooltip = createTooltip({
        trigger,
        content: 'Test',
      });

      tooltip.show();
      tooltip.hide();

      const tooltipEl = document.getElementById('tooltip-1');
      expect(tooltipEl?.classList.contains('tooltip--visible')).toBe(false);
      expect(tooltipEl?.getAttribute('aria-hidden')).toBe('true');

      tooltip.destroy();
    });

    it('should be idempotent when showing multiple times', () => {
      const tooltip = createTooltip({
        trigger,
        content: 'Test',
      });

      tooltip.show();
      tooltip.show();
      tooltip.show();

      const tooltipEl = document.getElementById('tooltip-1');
      expect(tooltipEl?.classList.contains('tooltip--visible')).toBe(true);

      tooltip.destroy();
    });

    it('should be idempotent when hiding multiple times', () => {
      const tooltip = createTooltip({
        trigger,
        content: 'Test',
      });

      tooltip.hide();
      tooltip.hide();

      const tooltipEl = document.getElementById('tooltip-1');
      expect(tooltipEl?.getAttribute('aria-hidden')).toBe('true');

      tooltip.destroy();
    });
  });

  describe('event listeners', () => {
    it('should show tooltip on focusin', () => {
      const tooltip = createTooltip({
        trigger,
        content: 'Test',
      });

      trigger.dispatchEvent(new FocusEvent('focusin'));

      const tooltipEl = document.getElementById('tooltip-1');
      expect(tooltipEl?.classList.contains('tooltip--visible')).toBe(true);

      tooltip.destroy();
    });

    it('should hide tooltip on focusout', () => {
      const tooltip = createTooltip({
        trigger,
        content: 'Test',
      });

      trigger.dispatchEvent(new FocusEvent('focusin'));
      trigger.dispatchEvent(new FocusEvent('focusout'));

      const tooltipEl = document.getElementById('tooltip-1');
      expect(tooltipEl?.classList.contains('tooltip--visible')).toBe(false);

      tooltip.destroy();
    });

    it('should show tooltip on mouseenter', () => {
      const tooltip = createTooltip({
        trigger,
        content: 'Test',
      });

      trigger.dispatchEvent(new MouseEvent('mouseenter'));

      const tooltipEl = document.getElementById('tooltip-1');
      expect(tooltipEl?.classList.contains('tooltip--visible')).toBe(true);

      tooltip.destroy();
    });

    it('should hide tooltip on mouseleave when not focused', () => {
      const tooltip = createTooltip({
        trigger,
        content: 'Test',
      });

      trigger.dispatchEvent(new MouseEvent('mouseenter'));
      trigger.dispatchEvent(new MouseEvent('mouseleave'));

      const tooltipEl = document.getElementById('tooltip-1');
      expect(tooltipEl?.classList.contains('tooltip--visible')).toBe(false);

      tooltip.destroy();
    });

    it('should hide tooltip on Escape key', () => {
      const tooltip = createTooltip({
        trigger,
        content: 'Test',
      });

      tooltip.show();
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      const tooltipEl = document.getElementById('tooltip-1');
      expect(tooltipEl?.classList.contains('tooltip--visible')).toBe(false);

      tooltip.destroy();
    });

    it('should not hide on other keys', () => {
      const tooltip = createTooltip({
        trigger,
        content: 'Test',
      });

      tooltip.show();
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

      const tooltipEl = document.getElementById('tooltip-1');
      expect(tooltipEl?.classList.contains('tooltip--visible')).toBe(true);

      tooltip.destroy();
    });
  });

  describe('destroy', () => {
    it('should remove tooltip from DOM', () => {
      const tooltip = createTooltip({
        trigger,
        content: 'Test',
      });

      tooltip.show();
      tooltip.destroy();

      const tooltipEl = document.getElementById('tooltip-1');
      expect(tooltipEl).toBeNull();
    });

    it('should remove aria-describedby from trigger', () => {
      const tooltip = createTooltip({
        trigger,
        content: 'Test',
      });

      tooltip.destroy();

      expect(trigger.getAttribute('aria-describedby')).toBeNull();
    });

    it('should remove event listeners', () => {
      const tooltip = createTooltip({
        trigger,
        content: 'Test',
      });

      tooltip.destroy();

      // These events should not create errors or show tooltip
      trigger.dispatchEvent(new FocusEvent('focusin'));
      trigger.dispatchEvent(new MouseEvent('mouseenter'));

      // Tooltip should not exist
      const tooltipEl = document.getElementById('tooltip-1');
      expect(tooltipEl).toBeNull();
    });
  });

  describe('unique IDs', () => {
    it('should generate unique IDs for multiple tooltips', () => {
      const trigger2 = document.createElement('button');
      document.body.appendChild(trigger2);

      const tooltip1 = createTooltip({
        trigger,
        content: 'First',
      });

      const tooltip2 = createTooltip({
        trigger: trigger2,
        content: 'Second',
      });

      expect(trigger.getAttribute('aria-describedby')).toBe('tooltip-1');
      expect(trigger2.getAttribute('aria-describedby')).toBe('tooltip-2');

      tooltip1.destroy();
      tooltip2.destroy();
    });
  });
});
