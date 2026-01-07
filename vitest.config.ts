/**
 * Vitest Test Configuration
 *
 * @remarks
 * This configuration defines how unit and integration tests are run:
 *
 * **Global Constants:**
 * - `__PROFILING__`: Always `true` in tests to enable performance measurement code paths
 *
 * **Path Aliases:**
 * - `@/` → `src/`
 * - `@app/` → `src/app/`
 * - `@core/` → `src/core/`
 * - `@themes/` → `src/themes/`
 *
 * **Test Includes:**
 * - Source tests in `src/`
 * - Build script tests in `scripts/`
 *
 * @see {@link https://vitest.dev/config/} for Vitest configuration options
 */
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    reporters: ['dot'],
    testTimeout: 5000,
    hookTimeout: 10000,
    retry: 0,
    onConsoleLog: () => false,
    onStackTrace: () => false,
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'scripts/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    exclude: [
      'node_modules/**',
      '**/e2e/**',
    ],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/**/*.test.ts', 'scripts/**/*.test.ts'],
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@app': fileURLToPath(new URL('./src/app', import.meta.url)),
      '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
      '@core': fileURLToPath(new URL('./src/core', import.meta.url)),
      '@themes': fileURLToPath(new URL('./src/themes', import.meta.url)),
      '@styles': fileURLToPath(new URL('./src/styles', import.meta.url)),
    },
  },
});
