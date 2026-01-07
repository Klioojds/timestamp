/**
 * Mock implementation of fireworks-js for unit tests.
 *
 * @remarks
 * This mock provides a minimal implementation of the Fireworks class
 * that allows tests to run without the actual canvas animation library.
 *
 * Usage in tests:
 * ```ts
 * vi.mock('fireworks-js', () => import('../test-utils/fireworks-js.mock'));
 * ```
 *
 * @see {@link https://github.com/crashmax-dev/fireworks-js} for the real library
 */
export type FireworksOptions = Record<string, unknown>;

/**
 * Mock Fireworks class that implements the public API without canvas operations.
 */
export class Fireworks {
  options: FireworksOptions;
  canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement, options: FireworksOptions = {}) {
    this.canvas = canvas;
    this.options = options;
  }

  start(): void {}
  stop(): void {}
  clear(): void {}
  updateOptions(options: FireworksOptions): void {
    this.options = options;
  }
  updateSize(_size: { width: number; height: number }): void {}
}
