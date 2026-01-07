/**
 * Template Utilities
 *
 * Helpers for working with HTML `<template>` elements.
 * Templates are defined in index.html and cloned at runtime.
 *
 * @remarks
 * Using HTML templates provides:
 * - Reduced JS bundle size (HTML parsed by browser, not built by JS)
 * - Faster initial render (HTML pre-parsed, just needs cloning)
 * - Cleaner separation of structure (HTML) and behavior (JS)
 *
 * @example
 * ```ts
 * // In index.html:
 * // <template id="my-widget-template"><div class="widget">...</div></template>
 *
 * // In component:
 * const widget = cloneTemplate<HTMLDivElement>('my-widget-template');
 * widget.querySelector('.title')!.textContent = 'Dynamic Title';
 * container.appendChild(widget);
 * ```
 */

/**
 * Clone a template element by ID and return its first element child.
 *
 * @typeParam T - The expected element type of the template content
 * @param templateId - The ID of the template element (without # prefix)
 * @returns The cloned first element from the template
 * @throws Error if template not found or template is empty
 *
 * @example
 * ```ts
 * const section = cloneTemplate<HTMLElement>('completion-message-template');
 * ```
 */
export function cloneTemplate<T extends Element = Element>(templateId: string): T {
  const template = document.getElementById(templateId);

  if (!template) {
    throw new Error(`Template not found: #${templateId}`);
  }

  if (!(template instanceof HTMLTemplateElement)) {
    throw new Error(`Element #${templateId} is not a <template> element`);
  }

  const clone = template.content.cloneNode(true) as DocumentFragment;
  const element = clone.firstElementChild;

  if (!element) {
    throw new Error(`Template #${templateId} is empty`);
  }

  return element as T;
}

/**
 * Safely clone a template, returning null if not found.
 * Useful when template availability is conditional.
 *
 * @typeParam T - The expected element type of the template content
 * @param templateId - The ID of the template element (without # prefix)
 * @returns The cloned element or null if template not found
 *
 * @example
 * ```ts
 * const section = cloneTemplateOrNull<HTMLElement>('optional-feature-template');
 * if (section) {
 *   container.appendChild(section);
 * }
 * ```
 */
export function cloneTemplateOrNull<T extends Element = Element>(
  templateId: string
): T | null {
  try {
    return cloneTemplate<T>(templateId);
  } catch {
    return null;
  }
}

/**
 * Check if a template exists in the document.
 *
 * @param templateId - The ID of the template element (without # prefix)
 * @returns True if the template exists and is a valid template element
 */
export function hasTemplate(templateId: string): boolean {
  const template = document.getElementById(templateId);
  return template instanceof HTMLTemplateElement;
}
