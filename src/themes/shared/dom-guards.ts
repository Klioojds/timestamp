/**
 * DOM Write Guards
 *
 * @remarks
 * SSR-safe utilities that prevent unnecessary DOM writes by checking if values
 * have actually changed. Reduces layout thrashing and improves performance.
 *
 * @packageDocumentation
 */

/**
 * Set text content only if changed. SSR-safe (handles null elements).
 * @public
 */
export function setTextIfChanged(element: HTMLElement | null, value: string): boolean {
  if (!element || element.textContent === value) {
    return false;
  }
  element.textContent = value;
  return true;
}

/**
 * Set hidden property only if changed. SSR-safe (handles null elements).
 * @public
 */
export function setHiddenIfChanged(element: HTMLElement | null, shouldHide: boolean): boolean {
  if (!element || element.hidden === shouldHide) {
    return false;
  }
  element.hidden = shouldHide;
  return true;
}
