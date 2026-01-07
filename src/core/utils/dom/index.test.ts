import { describe, it, expect, vi } from 'vitest';
import { createIconButton, createTestElement, createDiv } from './index';

describe('createIconButton', () => {
  const createMockIcon = (): SVGSVGElement => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('data-testid', 'mock-icon');
    return svg;
  };

  describe('button element', () => {
    it('creates a button with required attributes', () => {
      const button = createIconButton({
        testId: 'test-button',
        label: 'Test action',
        icon: createMockIcon(),
      });

      expect(button).toBeInstanceOf(HTMLButtonElement);
      expect(button.getAttribute('data-testid')).toBe('test-button');
      expect(button.getAttribute('aria-label')).toBe('Test action');
      expect(button.getAttribute('type')).toBe('button');
      expect(button.tabIndex).toBe(0);
    });

    it('applies default class when className not provided', () => {
      const button = createIconButton({
        testId: 'test-button',
        label: 'Test',
        icon: createMockIcon(),
      });

      expect(button.className).toBe('countdown-button countdown-button--icon-only');
    });

    it('applies custom className when provided', () => {
      const button = createIconButton({
        testId: 'test-button',
        label: 'Test',
        icon: createMockIcon(),
        className: 'custom-class',
      });

      expect(button.className).toBe('custom-class');
    });

    it('appends icon to button', () => {
      const icon = createMockIcon();
      const button = createIconButton({
        testId: 'test-button',
        label: 'Test',
        icon,
      });

      expect(button.contains(icon)).toBe(true);
    });

    it('attaches click handler when provided', () => {
      const onClick = vi.fn();
      const button = createIconButton({
        testId: 'test-button',
        label: 'Test',
        icon: createMockIcon(),
        onClick,
      });

      button.click();
      expect(onClick).toHaveBeenCalledOnce();
    });
  });

  describe('anchor element', () => {
    it('creates an anchor when href is provided', () => {
      const anchor = createIconButton({
        testId: 'test-link',
        label: 'Visit site',
        icon: createMockIcon(),
        href: 'https://example.com',
      });

      expect(anchor).toBeInstanceOf(HTMLAnchorElement);
      expect(anchor.href).toBe('https://example.com/');
    });

    it('sets target and rel attributes', () => {
      const anchor = createIconButton({
        testId: 'test-link',
        label: 'External link',
        icon: createMockIcon(),
        href: 'https://example.com',
        target: '_blank',
        rel: 'noopener noreferrer',
      });

      expect(anchor.target).toBe('_blank');
      expect(anchor.rel).toBe('noopener noreferrer');
    });

    it('does not set type attribute on anchor', () => {
      const anchor = createIconButton({
        testId: 'test-link',
        label: 'Link',
        icon: createMockIcon(),
        href: 'https://example.com',
      });

      expect(anchor.getAttribute('type')).toBeNull();
    });

    it('attaches click handler to anchor', () => {
      const onClick = vi.fn();
      const anchor = createIconButton({
        testId: 'test-link',
        label: 'Link',
        icon: createMockIcon(),
        href: 'https://example.com',
        onClick,
      });

      anchor.click();
      expect(onClick).toHaveBeenCalledOnce();
    });
  });
});

describe('createTestElement', () => {
  it('creates a div with data-testid', () => {
    const div = createTestElement('div', 'test-div');
    
    expect(div).toBeInstanceOf(HTMLDivElement);
    expect(div.getAttribute('data-testid')).toBe('test-div');
  });

  it('creates a span with data-testid', () => {
    const span = createTestElement('span', 'test-span');
    
    expect(span).toBeInstanceOf(HTMLSpanElement);
    expect(span.getAttribute('data-testid')).toBe('test-span');
  });

  it('creates a section with data-testid', () => {
    const section = createTestElement('section', 'test-section');
    
    expect(section).toBeInstanceOf(HTMLElement);
    expect(section.tagName.toLowerCase()).toBe('section');
    expect(section.getAttribute('data-testid')).toBe('test-section');
  });

  it('creates a button with data-testid', () => {
    const button = createTestElement('button', 'test-btn');
    
    expect(button).toBeInstanceOf(HTMLButtonElement);
    expect(button.getAttribute('data-testid')).toBe('test-btn');
  });
});

describe('createDiv', () => {
  it('creates a plain div when called with no args', () => {
    const div = createDiv();
    
    expect(div).toBeInstanceOf(HTMLDivElement);
    expect(div.className).toBe('');
    expect(div.getAttribute('data-testid')).toBeNull();
  });

  it('creates a div with className', () => {
    const div = createDiv('container');
    
    expect(div.className).toBe('container');
  });

  it('creates a div with testId', () => {
    const div = createDiv(undefined, 'my-div');
    
    expect(div.getAttribute('data-testid')).toBe('my-div');
  });

  it('creates a div with className and testId', () => {
    const div = createDiv('wrapper', 'wrapper-div');
    
    expect(div.className).toBe('wrapper');
    expect(div.getAttribute('data-testid')).toBe('wrapper-div');
  });
});
