/**
 * Accessible Tooltip Component
 *
 * Shows on focus/hover, hides on blur/escape, respects reduced-motion.
 */

import { reducedMotionManager } from '@core/utils/accessibility';
import { cloneTemplate } from '@core/utils/dom';

/** Tooltip position relative to the trigger element */
export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

/** Options for creating a tooltip */
export interface TooltipOptions {
  /** The element that triggers the tooltip */
  trigger: HTMLElement;
  /** The content to display in the tooltip (string or HTML element) */
  content: string | HTMLElement;
  /** Position of the tooltip relative to the trigger (default: 'bottom') */
  position?: TooltipPosition;
}

/** Tooltip controller with show/hide/destroy methods */
export interface TooltipController {
  /** Show the tooltip */
  show(): void;
  /** Hide the tooltip */
  hide(): void;
  /** Destroy the tooltip and clean up all event listeners */
  destroy(): void;
}

/** Counter for generating unique tooltip IDs */
let tooltipIdCounter = 0;

/**
 * Reset the tooltip ID counter (for testing purposes only).
 * @internal
 */
export function resetTooltipIdCounter(): void {
  tooltipIdCounter = 0;
}

/**
 * Create an accessible tooltip attached to a trigger element.
 *
 * @param options - Configuration options for the tooltip
 * @returns Controller with show, hide, and destroy methods
 *
 * @example
 * ```typescript
 * const tooltip = createTooltip({
 *   trigger: buttonElement,
 *   content: 'Powered by: fireworks-js',
 *   position: 'bottom',
 * });
 *
 * // Later:
 * tooltip.destroy();
 * ```
 */
export function createTooltip(options: TooltipOptions): TooltipController {
  const { trigger, content, position = 'bottom' } = options;

  // Generate unique ID for ARIA
  const tooltipId = `tooltip-${++tooltipIdCounter}`;

  // Clone tooltip template and configure
  const tooltipEl = cloneTemplate<HTMLDivElement>('tooltip-template');
  tooltipEl.id = tooltipId;
  tooltipEl.classList.add(`tooltip--${position}`);

  // Set content
  if (typeof content === 'string') {
    tooltipEl.textContent = content;
  } else {
    tooltipEl.appendChild(content);
  }

  // Append to DOM immediately (hidden via CSS)
  document.body.appendChild(tooltipEl);

  // Set up ARIA relationship
  trigger.setAttribute('aria-describedby', tooltipId);

  // Track visibility state
  let isVisible = false;

  // Subscribe to reduced motion preference
  let isReducedMotion = reducedMotionManager.isActive();
  const unsubscribeMotion = reducedMotionManager.subscribe((reduced) => {
    isReducedMotion = reduced;
  });

  /**
   * Position the tooltip relative to the trigger.
   */
  function updatePosition(): void {
    const triggerRect = trigger.getBoundingClientRect();
    const tooltipRect = tooltipEl.getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = triggerRect.top + scrollY - tooltipRect.height - 8;
        left = triggerRect.left + scrollX + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + scrollY + 8;
        left = triggerRect.left + scrollX + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = triggerRect.top + scrollY + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.left + scrollX - tooltipRect.width - 8;
        break;
      case 'right':
        top = triggerRect.top + scrollY + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.right + scrollX + 8;
        break;
    }

    // NOTE: Clamp tooltip position to prevent overflow outside viewport (8px padding for visual comfort)
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Clamp horizontal position
    if (left < 8) {
      left = 8;
    } else if (left + tooltipRect.width > viewportWidth - 8) {
      left = viewportWidth - tooltipRect.width - 8;
    }

    // Clamp vertical position
    if (top < 8) {
      top = 8;
    } else if (top + tooltipRect.height > viewportHeight + scrollY - 8) {
      top = viewportHeight + scrollY - tooltipRect.height - 8;
    }

    tooltipEl.style.top = `${top}px`;
    tooltipEl.style.left = `${left}px`;
  }

  /**
   * Show the tooltip.
   */
  function show(): void {
    if (isVisible) return;
    isVisible = true;

    // Update position
    updatePosition();

    // Show with or without animation based on reduced motion preference
    tooltipEl.setAttribute('aria-hidden', 'false');
    if (isReducedMotion) {
      tooltipEl.classList.add('tooltip--visible', 'tooltip--no-animation');
    } else {
      tooltipEl.classList.add('tooltip--visible');
      tooltipEl.classList.remove('tooltip--no-animation');
    }
  }

  /**
   * Hide the tooltip.
   */
  function hide(): void {
    if (!isVisible) return;
    isVisible = false;

    tooltipEl.setAttribute('aria-hidden', 'true');
    tooltipEl.classList.remove('tooltip--visible');
  }

  /**
   * Handle keydown events for Escape key.
   */
  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && isVisible) {
      hide();
      event.preventDefault();
    }
  }

  /**
   * Handle focus in (show tooltip).
   */
  function handleFocusIn(): void {
    show();
  }

  /**
   * Handle focus out (hide tooltip).
   */
  function handleFocusOut(): void {
    hide();
  }

  /**
   * Handle mouse enter (show tooltip).
   */
  function handleMouseEnter(): void {
    show();
  }

  /**
   * Handle mouse leave (hide tooltip).
   */
  function handleMouseLeave(): void {
    // Only hide if not focused
    if (document.activeElement !== trigger) {
      hide();
    }
  }

  // Attach event listeners
  trigger.addEventListener('focusin', handleFocusIn);
  trigger.addEventListener('focusout', handleFocusOut);
  trigger.addEventListener('mouseenter', handleMouseEnter);
  trigger.addEventListener('mouseleave', handleMouseLeave);
  trigger.addEventListener('keydown', handleKeydown);

  /**
   * Destroy the tooltip and clean up all resources.
   */
  function destroy(): void {
    // Remove event listeners
    trigger.removeEventListener('focusin', handleFocusIn);
    trigger.removeEventListener('focusout', handleFocusOut);
    trigger.removeEventListener('mouseenter', handleMouseEnter);
    trigger.removeEventListener('mouseleave', handleMouseLeave);
    trigger.removeEventListener('keydown', handleKeydown);

    // Unsubscribe from reduced motion manager
    unsubscribeMotion();

    // Remove ARIA attribute
    trigger.removeAttribute('aria-describedby');

    // Remove tooltip from DOM
    tooltipEl.remove();
  }

  return {
    show,
    hide,
    destroy,
  };
}
