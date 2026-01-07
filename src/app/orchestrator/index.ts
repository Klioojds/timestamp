/**
 * Orchestrator Module
 * Public API for theme orchestration and countdown lifecycle management.
 */

// Main orchestrator - primary public API
export {
  createOrchestrator,
  type Orchestrator,
  type OrchestratorOptions,
} from './orchestrator';

// Types re-exported for external consumers
export type { CelebrationDisplay } from './types';
export type { UIComponents, UIFactoryOptions } from './ui/ui-factory';
