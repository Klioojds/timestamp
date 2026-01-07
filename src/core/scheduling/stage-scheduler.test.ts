/**
 * Tests for stage scheduler utilities.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  parseThreshold,
  createStageScheduler,
  type StageDefinition,
} from './stage-scheduler';

describe('parseThreshold', () => {
  describe('percentage thresholds', () => {
    it.each([
      { label: '50% of 5 minutes', threshold: '50%' as const, duration: 300000, expected: 150000 },
      { label: '100%', threshold: '100%' as const, duration: 300000, expected: 300000 },
      { label: '0%', threshold: '0%' as const, duration: 300000, expected: 0 },
      { label: 'decimal percentages', threshold: '25.5%' as const, duration: 1000, expected: 255 },
    ])('parses $label correctly', ({ threshold, duration, expected }) => {
      expect(parseThreshold(threshold, duration)).toBe(expected);
    });

    it.each([
      { label: 'negative percentage', threshold: '-10%' as const },
      { label: 'invalid percentage format', threshold: 'abc%' as const },
    ])('throws on $label', ({ threshold }) => {
      expect(() => parseThreshold(threshold, 300000)).toThrow('Invalid percentage threshold');
    });
  });

  describe('seconds thresholds', () => {
    it.each([
      { label: '60s', threshold: '60s' as const, expected: 60000 },
      { label: '0s', threshold: '0s' as const, expected: 0 },
      { label: 'decimal seconds', threshold: '1.5s' as const, expected: 1500 },
    ])('parses $label correctly', ({ threshold, expected }) => {
      expect(parseThreshold(threshold, 300000)).toBe(expected);
    });

    it.each([
      { label: 'negative seconds', threshold: '-5s' as const },
      { label: 'invalid seconds format', threshold: 'abcs' as const },
    ])('throws on $label', ({ threshold }) => {
      expect(() => parseThreshold(threshold, 300000)).toThrow('Invalid seconds threshold');
    });
  });

  describe('invalid formats', () => {
    it.each([
      { label: 'plain number', threshold: '50' as const },
      { label: 'empty string', threshold: '' as const },
    ])('throws on $label', ({ threshold }) => {
      expect(() => parseThreshold(threshold, 300000)).toThrow('Invalid threshold format');
    });
  });
});

describe('createStageScheduler', () => {
  const percentageStages: StageDefinition<{ intensity: number }>[] = [
    { name: 'calm', at: '100%', values: { intensity: 0.2 } },
    { name: 'rising', at: '50%', values: { intensity: 0.5 } },
    { name: 'peak', at: '10%', values: { intensity: 1.0 } },
  ];

  const secondsStages: StageDefinition<{ show: boolean; flash?: boolean }>[] = [
    { name: 'early', at: '300s', values: { show: false } },
    { name: 'countdown', at: '60s', values: { show: true } },
    { name: 'finale', at: '10s', values: { show: true, flash: true } },
  ];

  describe('getStage with percentage thresholds', () => {
    const scheduler = createStageScheduler(percentageStages);

    beforeEach(() => {
      scheduler.clearCache();
    });

    it.each([
      {
        timeRemaining: 240000,
        durationMs: 300000,
        expectedName: 'calm',
        expectedIntensity: 0.2,
        expectedStageIndex: 0,
      },
      {
        timeRemaining: 150000,
        durationMs: 300000,
        expectedName: 'rising',
        expectedProgress: 0,
      },
      {
        timeRemaining: 90000,
        durationMs: 300000,
        expectedName: 'rising',
        expectedIntensity: 0.5,
      },
      {
        timeRemaining: 15000,
        durationMs: 300000,
        expectedName: 'peak',
        expectedIntensity: 1,
      },
      {
        timeRemaining: 0,
        durationMs: 300000,
        expectedName: 'peak',
        expectedProgress: 1,
      },
      {
        timeRemaining: -1000,
        durationMs: 300000,
        expectedName: 'peak',
        expectedProgress: 1,
      },
    ])(
      'returns $expectedName stage for $timeRemaining ms remaining',
      ({ timeRemaining, durationMs, expectedName, expectedIntensity, expectedStageIndex, expectedProgress }) => {
        const snapshot = scheduler.getStage(timeRemaining, durationMs);

        expect(snapshot.name).toBe(expectedName);
        if (expectedIntensity !== undefined) {
          expect(snapshot.values.intensity).toBe(expectedIntensity);
        }
        if (expectedStageIndex !== undefined) {
          expect(snapshot.stageIndex).toBe(expectedStageIndex);
        }
        if (expectedProgress !== undefined) {
          expect(snapshot.progress).toBeCloseTo(expectedProgress, 2);
        }
      }
    );

    it('calculates progress within stage correctly', () => {
      const snapshot = scheduler.getStage(225000, 300000);
      expect(snapshot.name).toBe('calm');
      expect(snapshot.progress).toBeCloseTo(0.5, 2);
    });
  });

  describe('getStage with seconds thresholds', () => {
    const scheduler = createStageScheduler(secondsStages);

    beforeEach(() => {
      scheduler.clearCache();
    });

    it.each([
      { timeRemaining: 400000, expectedName: 'early', expectedShow: false },
      { timeRemaining: 120000, expectedName: 'early', expectedShow: false },
      { timeRemaining: 60000, expectedName: 'countdown', expectedShow: true },
      { timeRemaining: 30000, expectedName: 'countdown', expectedShow: true },
      { timeRemaining: 5000, expectedName: 'finale', expectedShow: true, expectedFlash: true },
    ])('returns $expectedName stage for $timeRemaining ms remaining', ({ timeRemaining, expectedName, expectedShow, expectedFlash }) => {
      const snapshot = scheduler.getStage(timeRemaining, 600000);

      expect(snapshot.name).toBe(expectedName);
      expect(snapshot.values.show).toBe(expectedShow);
      if (expectedFlash !== undefined) {
        expect(snapshot.values.flash).toBe(expectedFlash);
      }
    });
  });

  describe('memoization', () => {
    it('returns cached result for same time bucket', () => {
      const scheduler = createStageScheduler(percentageStages, {
        memoizationBucketMs: 50,
      });

      const result1 = scheduler.getStage(100010, 300000);
      const result2 = scheduler.getStage(100025, 300000);

      expect(result1).toBe(result2);
    });

    it('computes fresh result for different time bucket', () => {
      const scheduler = createStageScheduler(percentageStages, {
        memoizationBucketMs: 50,
      });

      const result1 = scheduler.getStage(100010, 300000);
      const result2 = scheduler.getStage(100060, 300000);

      expect(result1).not.toBe(result2);
    });

    it('invalidates cache when duration changes', () => {
      const scheduler = createStageScheduler(percentageStages);

      const result1 = scheduler.getStage(150000, 300000);
      const result2 = scheduler.getStage(150000, 600000);

      expect(result1).not.toBe(result2);
    });

    it('clearCache resets memoization', () => {
      const scheduler = createStageScheduler(percentageStages);

      const result1 = scheduler.getStage(150000, 300000);
      scheduler.clearCache();
      const result2 = scheduler.getStage(150000, 300000);

      expect(result1).not.toBe(result2);
      expect(result1).toEqual(result2);
    });

    it('uses 50ms bucket by default', () => {
      const scheduler = createStageScheduler(percentageStages);

      const result1 = scheduler.getStage(100000, 300000);
      const result2 = scheduler.getStage(100049, 300000);
      expect(result1).toBe(result2);

      const result3 = scheduler.getStage(100050, 300000);
      expect(result1).not.toBe(result3);
    });
  });

  describe('edge cases', () => {
    it('throws when no stages defined', () => {
      const scheduler = createStageScheduler([]);
      expect(() => scheduler.getStage(100000, 300000)).toThrow('No stages defined');
    });

    it('handles single stage', () => {
      const singleStage: StageDefinition<{ level: number }>[] = [
        { name: 'only', at: '100%', values: { level: 1 } },
      ];
      const scheduler = createStageScheduler(singleStage);

      const snapshot = scheduler.getStage(150000, 300000);
      expect(snapshot.name).toBe('only');
      expect(snapshot.stageIndex).toBe(0);
    });

    it.each([
      { description: 'very short duration', timeRemaining: 500, durationMs: 1000 },
      { description: 'very long duration', timeRemaining: 24 * 60 * 60 * 1000 * 0.3, durationMs: 24 * 60 * 60 * 1000 },
    ])('handles $description', ({ timeRemaining, durationMs }) => {
      const scheduler = createStageScheduler(percentageStages);
      const snapshot = scheduler.getStage(timeRemaining, durationMs);
      expect(snapshot.name).toBe('rising');
    });

    it('limits stage cache size to prevent memory growth', () => {
      const scheduler = createStageScheduler(percentageStages);

      for (let i = 1; i <= 15; i++) {
        scheduler.getStage(50000, i * 100000);
      }

      const snapshot = scheduler.getStage(50000, 300000);
      expect(snapshot.name).toBeDefined();
    });
  });

  describe('adapter behavior pinning', () => {
    it('provides discrete stage name for fireworks-style adapter', () => {
      const scheduler = createStageScheduler(percentageStages);

      const snapshot = scheduler.getStage(75000, 300000);
      expect(snapshot.name).toBe('rising');
    });

    it('provides interpolation details for contribution-graph adapter', () => {
      const scheduler = createStageScheduler(percentageStages);

      const snapshot = scheduler.getStage(90000, 300000);
      expect(snapshot.name).toBe('rising');
      expect(snapshot.progress).toBeCloseTo(0.5, 2);
      expect(snapshot.stageIndex).toBe(1);
    });
  });
});
