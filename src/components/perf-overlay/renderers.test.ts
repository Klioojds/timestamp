/**
 * @file renderers.test.ts
 * @description Unit tests for the perf-overlay renderers module
 */

import { describe, it, expect } from 'vitest';
import { renderPerfOverlay } from '@/test-utils/perf-test-helpers';
import {
  updateMetrics,
  updateStats,
  updateOperations,
  getTimingClass,
  formatNumber,
} from './renderers';

/** Test snapshot shape matching PerfSnapshot type */
interface TestPerfSnapshot {
  fps: number;
  frameTime: number;
  domNodes: number;
  memoryMB: number | null;
  inp: number | null;
  longTaskCount: number;
  stats: Record<string, { p50: number; p95: number; p99: number; min: number; max: number; avg: number; count: number }>;
  operations: Array<{ label: string; duration: number; timestamp: number }>;
}

/** Test stats shape matching MetricStats type */
interface TestMetricStats {
  p50: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
  avg: number;
  count: number;
}

describe('Perf Overlay Renderers', () => {
  describe('formatNumber', () => {
    it.each([
      { value: 42, expected: '42' },
      { value: 999, expected: '999' },
      { value: 1000, expected: '1.0K' },
      { value: 5500, expected: '5.5K' },
      { value: 999999, expected: '1000.0K' },
      { value: 1000000, expected: '1.0M' },
      { value: 2500000, expected: '2.5M' },
    ])('should format $value as $expected', ({ value, expected }) => {
      expect(formatNumber(value)).toBe(expected);
    });
  });

  describe('getTimingClass', () => {
    it.each([
      { duration: 5, expectedClass: 'perf-overlay__metric--good' },
      { duration: 15, expectedClass: 'perf-overlay__metric--good' },
      { duration: 16, expectedClass: 'perf-overlay__metric--warn' },
      { duration: 50, expectedClass: 'perf-overlay__metric--warn' },
      { duration: 99, expectedClass: 'perf-overlay__metric--warn' },
      { duration: 100, expectedClass: 'perf-overlay__metric--bad' },
      { duration: 500, expectedClass: 'perf-overlay__metric--bad' },
    ])('should return $expectedClass for duration=$duration', ({ duration, expectedClass }) => {
      expect(getTimingClass(duration)).toBe(expectedClass);
    });
  });

  describe('updateMetrics', () => {
    const makeSnapshot = (overrides: Partial<TestPerfSnapshot> = {}): TestPerfSnapshot => ({
      fps: 60,
      frameTime: 16.7,
      domNodes: 1000,
      memoryMB: null,
      inp: null,
      longTaskCount: 0,
      stats: {},
      operations: [],
      ...overrides,
    });

    it.each([
      {
        fps: 60,
        expectedClass: 'perf-overlay__metric--good',
        expectedText: '60',
      },
      {
        fps: 48,
        expectedClass: 'perf-overlay__metric--warn',
      },
      {
        fps: 30,
        expectedClass: 'perf-overlay__metric--bad',
      },
    ])('should apply $expectedClass when fps=$fps', ({ fps, expectedClass, expectedText }) => {
      const { elements, cleanup } = renderPerfOverlay();

      updateMetrics(elements, makeSnapshot({ fps }));

      if (expectedText) {
        const value = elements.fpsMetric?.querySelector('.perf-overlay__metric-value');
        expect(value?.textContent).toBe(expectedText);
      }

      expect(elements.fpsMetric?.classList.contains(expectedClass)).toBe(true);
      cleanup();
    });

    it('should update DOM nodes metric', () => {
      const { elements, cleanup } = renderPerfOverlay();

      updateMetrics(elements, makeSnapshot({ domNodes: 5000 }));

      const value = elements.domMetric?.querySelector('.perf-overlay__metric-value');
      expect(value?.textContent).toBe('5.0K');
      cleanup();
    });
  });

  describe('updateStats', () => {
    it('should update stats values', () => {
      const { elements, container, cleanup } = renderPerfOverlay();
      const stats: TestMetricStats = {
        p50: 55,
        p95: 48,
        p99: 45,
        min: 40,
        max: 60,
        avg: 52,
        count: 100,
      };

      updateStats(elements.statsContainer, stats);

      const p50 = container.querySelector('[data-stat="p50"]');
      const p95 = container.querySelector('[data-stat="p95"]');
      const min = container.querySelector('[data-stat="min"]');
      const max = container.querySelector('[data-stat="max"]');

      expect(p50?.textContent).toBe('55');
      expect(p95?.textContent).toBe('48');
      expect(min?.textContent).toBe('40');
      expect(max?.textContent).toBe('60');
      cleanup();
    });

    it('should handle null stats container', () => {
      // Should not throw
      expect(() => updateStats(null, undefined)).not.toThrow();
    });
  });

  describe('updateOperations', () => {
    it('should show empty message for no operations', () => {
      const { elements, cleanup } = renderPerfOverlay();
      updateOperations(elements.operationsContainer, []);

      expect(elements.operationsContainer?.textContent).toContain('No operations recorded');
      cleanup();
    });

    it('should render operations list', () => {
      const { elements, cleanup } = renderPerfOverlay();
      const operations = [
        { label: 'theme-switch', duration: 25.5, timestamp: Date.now() },
        { label: 'grid-rebuild', duration: 12.3, timestamp: Date.now() },
      ];

      updateOperations(elements.operationsContainer, operations);

      expect(elements.operationsContainer?.textContent).toContain('theme-switch');
      expect(elements.operationsContainer?.textContent).toContain('25.5ms');
      expect(elements.operationsContainer?.textContent).toContain('grid-rebuild');
      expect(elements.operationsContainer?.textContent).toContain('12.3ms');
      cleanup();
    });

    it('should limit to 10 most recent operations', () => {
      const { elements, cleanup } = renderPerfOverlay();
      const operations = Array.from({ length: 15 }, (_, i) => ({
        label: `op-${i}`,
        duration: i,
        timestamp: Date.now(),
      }));

      updateOperations(elements.operationsContainer, operations);

      // Should show ops 5-14 (most recent 10)
      const ops = elements.operationsContainer?.querySelectorAll('.perf-overlay__op');
      expect(ops?.length).toBe(10);
      cleanup();
    });

    it('should handle null container', () => {
      // Should not throw
      expect(() => updateOperations(null, [])).not.toThrow();
    });
  });
});
