/**
 * Template Utilities Tests
 */

import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { cloneTemplate, cloneTemplateOrNull, hasTemplate } from './template-utils';

describe('template-utils', () => {
  // Helper to create and inject a test template
  function createTestTemplate(id: string, content: string): void {
    const template = document.createElement('template');
    template.id = id;
    template.innerHTML = content;
    document.body.appendChild(template);
  }

  // Note: Templates from test-utils/templates.ts are injected by vitest.setup.ts
  // These tests use local templates for isolated testing

  afterEach(() => {
    // Clean up any templates created during tests (except global ones from setup)
    const localTemplates = document.querySelectorAll('body > template:not(#test-templates template)');
    localTemplates.forEach((t) => t.remove());
  });

  describe('cloneTemplate', () => {
    it('clones template content successfully', () => {
      createTestTemplate('test-clone', '<div class="cloned">Hello</div>');

      const result = cloneTemplate<HTMLDivElement>('test-clone');

      expect(result).toBeInstanceOf(HTMLDivElement);
      expect(result.className).toBe('cloned');
      expect(result.textContent).toBe('Hello');
    });

    it('throws error when template not found', () => {
      expect(() => cloneTemplate('nonexistent-template')).toThrow(
        'Template not found: #nonexistent-template'
      );
    });

    it('throws error when element is not a template', () => {
      const div = document.createElement('div');
      div.id = 'not-a-template';
      document.body.appendChild(div);

      try {
        expect(() => cloneTemplate('not-a-template')).toThrow(
          'Element #not-a-template is not a <template> element'
        );
      } finally {
        div.remove();
      }
    });

    it('throws error when template is empty', () => {
      createTestTemplate('empty-template', '');

      expect(() => cloneTemplate('empty-template')).toThrow(
        'Template #empty-template is empty'
      );
    });

    it('returns deep clone - modifications do not affect original', () => {
      createTestTemplate('deep-clone', '<div class="original"><span>Text</span></div>');

      const first = cloneTemplate<HTMLDivElement>('deep-clone');
      first.className = 'modified';
      first.querySelector('span')!.textContent = 'Changed';

      const second = cloneTemplate<HTMLDivElement>('deep-clone');

      expect(second.className).toBe('original');
      expect(second.querySelector('span')!.textContent).toBe('Text');
    });

    it('works with global templates from vitest.setup.ts', () => {
      // These templates are injected by vitest.setup.ts beforeEach hook
      const result = cloneTemplate<HTMLElement>('completion-message-template');

      expect(result.tagName).toBe('SECTION');
      expect(result.dataset.testid).toBe('landing-message-section');
    });
  });

  describe('cloneTemplateOrNull', () => {
    it('returns cloned element when template exists', () => {
      createTestTemplate('test-optional', '<span class="optional">Content</span>');

      const result = cloneTemplateOrNull<HTMLSpanElement>('test-optional');

      expect(result).toBeInstanceOf(HTMLSpanElement);
      expect(result?.className).toBe('optional');
    });

    it('returns null when template not found', () => {
      const result = cloneTemplateOrNull('nonexistent');

      expect(result).toBeNull();
    });

    it('returns null when template is empty', () => {
      createTestTemplate('empty-optional', '');

      const result = cloneTemplateOrNull('empty-optional');

      expect(result).toBeNull();
    });
  });

  describe('hasTemplate', () => {
    it('returns true when template exists', () => {
      createTestTemplate('exists', '<div></div>');

      expect(hasTemplate('exists')).toBe(true);
    });

    it('returns false when template does not exist', () => {
      expect(hasTemplate('does-not-exist')).toBe(false);
    });

    it('returns false when element exists but is not a template', () => {
      const div = document.createElement('div');
      div.id = 'just-a-div';
      document.body.appendChild(div);

      try {
        expect(hasTemplate('just-a-div')).toBe(false);
      } finally {
        div.remove();
      }
    });
  });
});
