/**
 * Performance Overlay Drag Handler
 *
 * Reusable drag functionality for the performance overlay.
 * Extracted from perf-overlay.ts for better separation of concerns.
 *
 * @remarks
 * Handles mouse-based dragging of the overlay panel.
 * Returns a cleanup function for proper resource disposal.
 */

/**
 * Setup dragging functionality for an element.
 * @param container - The element to make draggable
 * @param header - The drag handle element
 * @returns Cleanup function to remove event listeners
 */
export function setupDragging(
  container: HTMLElement,
  header: HTMLElement
): () => void {
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  const handleMouseDown = (event: MouseEvent): void => {
    // Prevent drag from starting when clicking buttons (close, clear)
    if ((event.target as HTMLElement).closest('button')) return;

    isDragging = true;
    startX = event.clientX;
    startY = event.clientY;

    const rect = container.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;

    header.style.cursor = 'grabbing';
  };

  const handleMouseMove = (event: MouseEvent): void => {
    if (!isDragging) return;

    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;

    container.style.left = `${startLeft + deltaX}px`;
    container.style.top = `${startTop + deltaY}px`;
    container.style.right = 'auto';
  };

  const handleMouseUp = (): void => {
    if (isDragging) {
      isDragging = false;
      header.style.cursor = 'grab';
    }
  };

  // Attach listeners
  header.addEventListener('mousedown', handleMouseDown);
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);

  // Return cleanup function
  return () => {
    header.removeEventListener('mousedown', handleMouseDown);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
}
