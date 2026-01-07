/**
 * Performance Overlay Component
 *
 * Dev-only UI overlay showing real-time performance metrics.
 * Toggle with Ctrl+Shift+P or URL param ?perf=1
 *
 * @remarks
 * Features:
 * - Real-time FPS, frame time, memory display
 * - Expandable operation log with timing
 * - Draggable/collapsible panel
 * - Respects prefers-reduced-motion
 * - Zero production footprint (tree-shaken)
 *
 * This module uses extracted sub-modules:
 * - view.ts: DOM template creation
 * - drag.ts: Drag functionality
 * - renderers.ts: Metric rendering
 * - perf-overlay.css: Styles (extracted to CSS file)
 */

// Static CSS import - Vite will tree-shake in production
import '../../styles/components/perf-overlay.css';

import { perfMonitor, type PerfSnapshot } from '@core/perf/perf-monitor';
import { prefersReducedMotion } from '@core/utils/accessibility';

import { OVERLAY_ACTIONS } from './constants';
import { setupDragging } from './drag';
import { updateMetrics, updateOperations, updateStats } from './renderers';
import {
    createOverlayDOM,
    getOverlayElements,
    type OverlayElements,
    updateExpandState,
} from './view';

/** Check if profiling is enabled */
const ENABLE_PROFILING =
  typeof __PROFILING__ !== 'undefined' && __PROFILING__ && import.meta.env?.DEV;

/** Overlay state */
interface OverlayState {
  visible: boolean;
  expanded: boolean;
}

/**
 * Performance Overlay Controller
 *
 * Manages the lifecycle and state of the performance monitoring overlay.
 */
class PerfOverlay {
  private elements: OverlayElements | null = null;
  private state: OverlayState = { visible: false, expanded: false };
  private unsubscribe: (() => void) | null = null;
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;
  private cleanupDrag: (() => void) | null = null;

  /**
   * Initialize the overlay.
   * Called automatically on module load in dev mode.
   */
  init(): void {
    if (!ENABLE_PROFILING) return;

    // Check URL param for auto-enable
    const params = new URLSearchParams(window.location.search);
    if (params.get('perf') === '1') {
      this.show();
    }

    // Register keyboard shortcut (Ctrl+Shift+P)
    this.keydownHandler = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'P') {
        event.preventDefault();
        this.toggle();
      }
    };
    document.addEventListener('keydown', this.keydownHandler);

    console.log('[PerfOverlay] Available. Press Ctrl+Shift+P or add ?perf=1 to URL');
  }

  /**
   * Show the overlay.
   */
  show(): void {
    if (!ENABLE_PROFILING || this.state.visible) return;

    this.state.visible = true;
    this.createOverlay();
    perfMonitor.start();

    // Subscribe to updates
    this.unsubscribe = perfMonitor.subscribe((snapshot) => {
      this.updateDisplay(snapshot);
    });

    // Initial update
    this.updateDisplay(perfMonitor.getSnapshot());
  }

  /**
   * Hide the overlay.
   */
  hide(): void {
    if (!this.state.visible) return;

    this.state.visible = false;
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.cleanupDrag?.();
    this.cleanupDrag = null;
    this.elements?.container.remove();
    this.elements = null;
    perfMonitor.stop();
  }

  /**
   * Toggle overlay visibility.
   */
  toggle(): void {
    if (this.state.visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Clean up resources.
   */
  destroy(): void {
    this.hide();
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }
  }

  /**
   * Create the overlay DOM using extracted view module.
   */
  private createOverlay(): void {
    const container = createOverlayDOM();
    this.elements = getOverlayElements(container);

    // Event listeners
    container.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const action = target.closest('[data-action]')?.getAttribute('data-action');

      switch (action) {
        case OVERLAY_ACTIONS.close:
          this.hide();
          break;
        case OVERLAY_ACTIONS.clear:
          perfMonitor.clear();
          break;
        case OVERLAY_ACTIONS.toggleDetails:
          this.state.expanded = !this.state.expanded;
          if (this.elements) {
            updateExpandState(this.elements, this.state.expanded);
          }
          break;
      }
    });

    // Setup dragging (skip if reduced motion)
    if (!prefersReducedMotion()) {
      const header = container.querySelector('.perf-overlay__header') as HTMLElement;
      if (header) {
        this.cleanupDrag = setupDragging(container, header);
      }
    }

    document.body.appendChild(container);
  }

  /**
   * Update the display with new snapshot data using extracted renderers.
   */
  private updateDisplay(snapshot: PerfSnapshot): void {
    if (!this.elements) return;

    // Update all metrics
    updateMetrics(this.elements, snapshot);

    // Update stats and operations if expanded
    if (this.state.expanded) {
      updateStats(this.elements.statsContainer, snapshot.stats.fps);
      updateOperations(this.elements.operationsContainer, snapshot.operations);
    }
  }
}

/** Global overlay instance */
let overlayInstance: PerfOverlay | null = null;

/**
 * Get or create the performance overlay instance.
 * Only available in dev mode with profiling enabled.
 */
function getPerfOverlay(): PerfOverlay | null {
  if (!ENABLE_PROFILING) return null;

  if (!overlayInstance) {
    overlayInstance = new PerfOverlay();
  }
  return overlayInstance;
}

/**
 * Initialize the performance overlay.
 * Call this once from your app entry point.
 */
export function initPerfOverlay(): void {
  getPerfOverlay()?.init();
}

/**
 * Destroy the performance overlay.
 */
export function destroyPerfOverlay(): void {
  overlayInstance?.destroy();
  overlayInstance = null;
}
