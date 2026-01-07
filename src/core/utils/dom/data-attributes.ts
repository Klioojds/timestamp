/**
 * Data Attribute Management Utilities
 * Standardized helpers for setting/removing data-* attributes across the application.
 */

/**
 * Sets a data-* attribute on an element.
 * Automatically prefixes attribute name with 'data-'.
 * 
 * @param element - Target element
 * @param name - Attribute name (without 'data-' prefix)
 * @param value - Attribute value (boolean or string)
 * 
 * @example
 * ```typescript
 * // Sets data-celebrating="true"
 * setDataAttribute(container, 'celebrating', true);
 * 
 * // Sets data-theme="fireworks"
 * setDataAttribute(container, 'theme', 'fireworks');
 * ```
 */
export function setDataAttribute(
  element: HTMLElement,
  name: string,
  value: string | boolean
): void {
  const stringValue = typeof value === 'boolean' ? String(value) : value;
  element.setAttribute(`data-${name}`, stringValue);
}

/**
 * Removes a data-* attribute from an element.
 * Automatically prefixes attribute name with 'data-'.
 * 
 * @param element - Target element
 * @param name - Attribute name (without 'data-' prefix)
 * 
 * @example
 * ```typescript
 * // Removes data-celebrating
 * removeDataAttribute(container, 'celebrating');
 * ```
 */
export function removeDataAttribute(element: HTMLElement, name: string): void {
  element.removeAttribute(`data-${name}`);
}

/**
 * Gets a data-* attribute value from an element.
 * Automatically prefixes attribute name with 'data-'.
 * 
 * @param element - Target element
 * @param name - Attribute name (without 'data-' prefix)
 * @returns Attribute value or null if not present
 * 
 * @example
 * ```typescript
 * const theme = getDataAttribute(container, 'theme');
 * // Returns 'fireworks' or null
 * ```
 */
export function getDataAttribute(element: HTMLElement, name: string): string | null {
  return element.getAttribute(`data-${name}`);
}

/**
 * Checks if a data-* attribute exists on an element.
 * Automatically prefixes attribute name with 'data-'.
 * 
 * @param element - Target element
 * @param name - Attribute name (without 'data-' prefix)
 * @returns True if attribute exists
 * 
 * @example
 * ```typescript
 * if (hasDataAttribute(container, 'celebrating')) {
 *   // Handle celebration state
 * }
 * ```
 */
export function hasDataAttribute(element: HTMLElement, name: string): boolean {
  return element.hasAttribute(`data-${name}`);
}
