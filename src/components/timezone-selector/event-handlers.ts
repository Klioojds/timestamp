/**
 * Timezone Selector Event Handlers - Barrel export file
 *
 * This module re-exports from event-listeners.ts which handles:
 * - Event listener setup
 * - Roving tabindex management
 * - Option click handler attachment
 */

// Re-export event listener setup, handlers, and types
export {
    attachOptionClickHandlers, type EventHandlerCallbacks,
    type EventHandlerController, setupEventListeners, type TimezoneSelectorElements
} from './event-listeners';

