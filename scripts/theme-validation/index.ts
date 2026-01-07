/**
 * Theme Validation Module
 *
 * Consolidates all theme validation operations:
 * - Color contrast validation
 * - Configuration validation
 */

export { runConfigValidation, type ConfigValidationOptions } from './config.js';

// Re-export color validation from theme-colors module
export { runValidation as runColorValidation, validateThemes } from '../theme-colors/index.js';
export type { ValidationOptions as ColorValidationOptions } from '../theme-colors/index.js';
