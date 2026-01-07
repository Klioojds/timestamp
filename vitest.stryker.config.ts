/**
 * Vitest Configuration for Stryker Mutation Testing
 *
 * @remarks
 * This configuration excludes tests that use dynamic imports which are
 * incompatible with Stryker's code instrumentation. The excluded tests
 * are still run in regular `npm run test` but not during mutation testing.
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
      // Exclude tests that use dynamic imports - incompatible with Stryker instrumentation
      'src/themes/registry/registry-loaders.test.ts',
      'src/app/pwa/index.test.ts',
      'src/components/perf-overlay/index.test.ts',
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
  // CSS/SCSS plugin to return empty modules
  plugins: [
    {
      name: 'css-empty',
      transform(_code: string, id: string) {
        if (id.endsWith('.css') || id.endsWith('.scss')) {
          return { code: 'export default {}', map: null };
        }
      },
    },
  ],
});
