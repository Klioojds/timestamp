export type { CreateIconOptions,IconName, IconSize } from '../icons';
export { createIcon, getIconSvg, ICON_SIZES } from '../icons';
export { cloneTemplate, cloneTemplateOrNull, hasTemplate } from './template-utils';

// ============================================================================
// Button Creation Utilities
// ============================================================================

interface BaseIconButtonOptions {
  /** data-testid attribute for testing */
  testId: string;
  /** Accessible label describing the button action */
  label: string;
  /** SVG element rendered before any optional text */
  icon: SVGElement;
  /** Additional class names to apply */
  className?: string;
  /** Optional click handler */
  onClick?: () => void;
}

interface AnchorIconButtonOptions extends BaseIconButtonOptions {
  /** Renders an anchor element instead of a button */
  href: string;
  /** Target for anchor elements (e.g., `_blank`) */
  target?: string;
  /** Rel attribute for anchor security settings */
  rel?: string;
}

export type IconButtonOptions = BaseIconButtonOptions | AnchorIconButtonOptions;

/**
 * Create accessible icon button with ARIA attributes and consistent styling.
 * @param options - Button configuration (icon, label, testId)
 */
export function createIconButton(options: AnchorIconButtonOptions): HTMLAnchorElement;
export function createIconButton(options: BaseIconButtonOptions): HTMLButtonElement;
export function createIconButton(options: IconButtonOptions): HTMLButtonElement | HTMLAnchorElement {
  const { testId, label, icon, className, onClick } = options;
  const isAnchor = 'href' in options;

  const element = document.createElement(isAnchor ? 'a' : 'button') as HTMLAnchorElement | HTMLButtonElement;
  element.setAttribute('data-testid', testId);
  element.setAttribute('aria-label', label);
  element.tabIndex = 0;
  element.className = className ?? 'countdown-button countdown-button--icon-only';
  element.appendChild(icon);

  if (isAnchor && element instanceof HTMLAnchorElement) {
    element.href = options.href;
    if (options.target) element.target = options.target;
    if (options.rel) element.rel = options.rel;
  } else if (element instanceof HTMLButtonElement) {
    element.type = 'button';
  }

  if (onClick) element.addEventListener('click', onClick);

  return element;
}

// ============================================================================
// Generic DOM Element Utilities
// ============================================================================

/**
 * Create an element with a data-testid attribute.
 * @param tag - HTML element tag name
 * @param testId - Value for data-testid attribute
 */
export function createTestElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  testId: string
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  element.setAttribute('data-testid', testId);
  return element;
}

/**
 * Create a div element with optional class name and test ID.
 * @param className - Optional CSS class name
 * @param testId - Optional data-testid attribute
 */
export function createDiv(className?: string, testId?: string): HTMLDivElement {
  const div = document.createElement('div');
  if (className) div.className = className;
  if (testId) div.setAttribute('data-testid', testId);
  return div;
}
