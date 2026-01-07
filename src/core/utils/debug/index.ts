/**
 * Debug logging utilities.
 *
 * Provides structured, dev-only logging with timestamps and prefixes.
 * All logging is stripped in production builds.
 */

/** Check if debug mode is enabled (dev mode only). */
const DEBUG_ENABLED = import.meta.env.DEV;

/**
 * Create a scoped debug logger for a specific module.
 *
 * @param prefix - Module prefix for log messages (e.g., '[MyModule]')
 * @returns Object with log methods that only execute in dev mode
 *
 * @example
 * ```typescript
 * const debug = createDebugLogger('[MyTheme]');
 * debug.log('methodName', 'message', { data });
 * debug.warn('methodName', 'warning message');
 * debug.error('methodName', 'error message', error);
 * ```
 */
export function createDebugLogger(prefix: string) {
  const formatMessage = (method: string) =>
    `${prefix} [${new Date().toISOString()}] ${method}:`;

  return {
    /**
     * Log a debug message (dev mode only).
     * @param method - Method or context name
     * @param args - Additional arguments to log
     */
    log(method: string, ...args: unknown[]): void {
      if (!DEBUG_ENABLED) return;
      console.log(formatMessage(method), ...args);
    },

    /**
     * Log a warning message (dev mode only).
     * @param method - Method or context name
     * @param args - Additional arguments to log
     */
    warn(method: string, ...args: unknown[]): void {
      if (!DEBUG_ENABLED) return;
      console.warn(formatMessage(method), ...args);
    },

    /**
     * Log an error message (dev mode only).
     * @param method - Method or context name
     * @param args - Additional arguments to log
     */
    error(method: string, ...args: unknown[]): void {
      if (!DEBUG_ENABLED) return;
      console.error(formatMessage(method), ...args);
    },

    /**
     * Log with a custom label (dev mode only).
     * Useful for state dumps or grouped information.
     * @param label - Custom label for the log group
     * @param data - Data object to log
     */
    state(label: string, data: Record<string, unknown>): void {
      if (!DEBUG_ENABLED) return;
      console.log(`${prefix} ${label}:`, data);
    },

    /** Whether debug logging is enabled. */
    get enabled(): boolean {
      return DEBUG_ENABLED;
    },
  };
}

/**
 * Simple debug log function (dev mode only).
 * @param prefix - Module prefix
 * @param method - Method or context name
 * @param args - Additional arguments to log
 */
export function debugLog(prefix: string, method: string, ...args: unknown[]): void {
  if (!DEBUG_ENABLED) return;
  console.log(`${prefix} [${new Date().toISOString()}] ${method}:`, ...args);
}
