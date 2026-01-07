/**
 * Reset document.body to clean state.
 * @remarks Use in afterEach() to prevent DOM pollution.
 */
export function cleanupDOM(): void {
  document.body.innerHTML = '';
}

/** Create and attach container element for DOM tests. */
export function createAttachedContainer(id = 'app'): HTMLElement {
  const container = document.createElement('div');
  container.id = id;
  document.body.appendChild(container);
  return container;
}

/** Capture current overflow styles and return restore callback. */
export function captureOverflow(): () => void {
  const previousHtmlOverflow = document.documentElement.style.overflow;
  const previousBodyOverflow = document.body.style.overflow;

  return () => {
    document.documentElement.style.overflow = previousHtmlOverflow;
    document.body.style.overflow = previousBodyOverflow;
  };
}
