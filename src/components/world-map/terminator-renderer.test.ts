/**
 * Tests for terminator renderer
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTerminatorRenderer } from './terminator-renderer';
import type { TerminatorRendererOptions, TerminatorRendererController } from './terminator-renderer';
import type { CityMarker } from '@/app/data/cities';
import { createMarkerElements, createNightOverlay } from './test-helpers';

describe('TerminatorRenderer', () => {
  let renderer: TerminatorRendererController;
  let mockNightOverlay: SVGPathElement;
  let markerElements: Map<string, HTMLButtonElement>;
  let mockCities: readonly CityMarker[];
  let mockGetCurrentTime: () => Date;
  let fixedDate: Date;

  beforeEach(() => {
    vi.useFakeTimers();

    // Fixed date for consistent testing (noon UTC)
    fixedDate = new Date('2025-01-01T12:00:00Z');
    mockGetCurrentTime = vi.fn(() => fixedDate);

    // Create mock SVG path element
    mockNightOverlay = createNightOverlay();

    // Create marker elements
    markerElements = createMarkerElements([
      { name: 'New York', timezone: 'America/New_York', lat: 40.7128, lng: -74.006 },
      { name: 'London', timezone: 'Europe/London', lat: 51.5074, lng: -0.1278 },
    ]);

    // Mock cities
    mockCities = [
      { name: 'New York', timezone: 'America/New_York', lat: 40.7128, lng: -74.006 },
      { name: 'London', timezone: 'Europe/London', lat: 51.5074, lng: -0.1278 },
    ] as const;
  });

  afterEach(() => {
    renderer?.destroy();
    vi.useRealTimers();
  });

  describe('Initialization', () => {
    it('should update terminator immediately on creation', () => {
      renderer = createTerminatorRenderer({
        nightOverlay: mockNightOverlay,
        markerElements,
        cities: mockCities,
        getCurrentTime: mockGetCurrentTime,
      });

      expect(mockNightOverlay.setAttribute).toHaveBeenCalledWith('d', expect.any(String));
      expect(mockGetCurrentTime).toHaveBeenCalled();
    });

    it('should start automatic updates with default interval', async () => {
      renderer = createTerminatorRenderer({
        nightOverlay: mockNightOverlay,
        markerElements,
        cities: mockCities,
        getCurrentTime: mockGetCurrentTime,
      });

      expect(renderer.isActive()).toBe(true);
      
      // Clear initial update
      vi.clearAllMocks();

      // Advance by default interval (60 seconds)
      vi.advanceTimersByTime(60000);
      await vi.runOnlyPendingTimersAsync();

      expect(mockGetCurrentTime).toHaveBeenCalled();
    });

    it('should use custom update interval when provided', async () => {
      renderer = createTerminatorRenderer({
        nightOverlay: mockNightOverlay,
        markerElements,
        cities: mockCities,
        updateInterval: 30000,
        getCurrentTime: mockGetCurrentTime,
      });

      vi.clearAllMocks();

      // Advance by custom interval (30 seconds)
      vi.advanceTimersByTime(30000);
      await vi.runOnlyPendingTimersAsync();

      expect(mockGetCurrentTime).toHaveBeenCalled();
    });

    it('should set night state on city markers', () => {
      renderer = createTerminatorRenderer({
        nightOverlay: mockNightOverlay,
        markerElements,
        cities: mockCities,
        getCurrentTime: mockGetCurrentTime,
      });

      const nycMarker = markerElements.get('America/New_York')!;
      const londonMarker = markerElements.get('Europe/London')!;

      // Both should have data-night attribute set
      expect(nycMarker.hasAttribute('data-night')).toBe(true);
      expect(londonMarker.hasAttribute('data-night')).toBe(true);
    });
  });

  describe('Manual updates', () => {
    it('should update terminator when update() is called', () => {
      renderer = createTerminatorRenderer({
        nightOverlay: mockNightOverlay,
        markerElements,
        cities: mockCities,
        getCurrentTime: mockGetCurrentTime,
      });

      vi.clearAllMocks();

      renderer.update();

      // Note: With fake timers, RAF executes immediately
      // We verify the function was called by checking the result
      expect(mockNightOverlay.setAttribute).toHaveBeenCalledWith('d', expect.any(String));
      expect(mockGetCurrentTime).toHaveBeenCalled();
    });
  });

  describe('Pause and Resume', () => {
    it('should pause automatic updates', () => {
      renderer = createTerminatorRenderer({
        nightOverlay: mockNightOverlay,
        markerElements,
        cities: mockCities,
        getCurrentTime: mockGetCurrentTime,
      });

      renderer.pause();

      expect(renderer.isActive()).toBe(false);
    });

    it('should not update when paused', async () => {
      renderer = createTerminatorRenderer({
        nightOverlay: mockNightOverlay,
        markerElements,
        cities: mockCities,
        getCurrentTime: mockGetCurrentTime,
      });

      renderer.pause();
      vi.clearAllMocks();

      // Advance time while paused
      vi.advanceTimersByTime(120000); // 2 minutes
      await vi.runOnlyPendingTimersAsync();

      // Should not update
      expect(mockGetCurrentTime).not.toHaveBeenCalled();
    });

    it('should resume automatic updates', () => {
      renderer = createTerminatorRenderer({
        nightOverlay: mockNightOverlay,
        markerElements,
        cities: mockCities,
        getCurrentTime: mockGetCurrentTime,
      });

      renderer.pause();
      expect(renderer.isActive()).toBe(false);

      renderer.resume();

      expect(renderer.isActive()).toBe(true);
      // Testing that isActive() returns true is sufficient proof
      // that resume() worked - actual updates are tested elsewhere
    });

    it('should continue automatic updates after resume', async () => {
      renderer = createTerminatorRenderer({
        nightOverlay: mockNightOverlay,
        markerElements,
        cities: mockCities,
        updateInterval: 30000,
        getCurrentTime: mockGetCurrentTime,
      });

      renderer.pause();
      renderer.resume();

      vi.clearAllMocks();

      // Advance by interval
      vi.advanceTimersByTime(30000);

      expect(mockGetCurrentTime).toHaveBeenCalled();
    });

    it.each([
      {
        description: 'pause called multiple times remains inactive',
        action: (instance: TerminatorRendererController) => {
          instance.pause();
          instance.pause();
          instance.pause();
        },
        expectedActive: false,
      },
      {
        description: 'resume called multiple times restarts updates',
        action: (instance: TerminatorRendererController) => {
          instance.pause();
          instance.resume();
          instance.resume();
          instance.resume();
        },
        expectedActive: true,
      },
    ])('should handle $description', ({ action, expectedActive }) => {
      renderer = createTerminatorRenderer({
        nightOverlay: mockNightOverlay,
        markerElements,
        cities: mockCities,
        getCurrentTime: mockGetCurrentTime,
      });

      expect(() => action(renderer)).not.toThrow();
      expect(renderer.isActive()).toBe(expectedActive);
    });

    it('should not schedule updates when calling update() while paused', () => {
      const rafSpy = vi.spyOn(global, 'requestAnimationFrame');

      renderer = createTerminatorRenderer({
        nightOverlay: mockNightOverlay,
        markerElements,
        cities: mockCities,
        getCurrentTime: mockGetCurrentTime,
      });

      renderer.pause();
      vi.clearAllMocks();

      renderer.update();

      // Should not schedule RAF when paused
      expect(rafSpy).not.toHaveBeenCalled();
    });
  });

  describe('Destroy', () => {
    it('should stop updates when destroyed', async () => {
      renderer = createTerminatorRenderer({
        nightOverlay: mockNightOverlay,
        markerElements,
        cities: mockCities,
        getCurrentTime: mockGetCurrentTime,
      });

      renderer.destroy();

      vi.clearAllMocks();

      // Advance time after destroy
      vi.advanceTimersByTime(120000);
      await vi.runOnlyPendingTimersAsync();

      expect(mockGetCurrentTime).not.toHaveBeenCalled();
    });

    it('should set isActive to false after destroy', () => {
      renderer = createTerminatorRenderer({
        nightOverlay: mockNightOverlay,
        markerElements,
        cities: mockCities,
        getCurrentTime: mockGetCurrentTime,
      });

      renderer.destroy();

      expect(renderer.isActive()).toBe(false);
    });

    it('should handle destroy when already destroyed', () => {
      renderer = createTerminatorRenderer({
        nightOverlay: mockNightOverlay,
        markerElements,
        cities: mockCities,
        getCurrentTime: mockGetCurrentTime,
      });

      expect(() => {
        renderer.destroy();
        renderer.destroy();
      }).not.toThrow();
    });

    it('should not crash when update() is called after destroy', () => {
      renderer = createTerminatorRenderer({
        nightOverlay: mockNightOverlay,
        markerElements,
        cities: mockCities,
        getCurrentTime: mockGetCurrentTime,
      });

      renderer.destroy();

      expect(() => {
        renderer.update();
      }).not.toThrow();
    });
  });

  describe('Edge cases', () => {
    it('should handle missing marker element gracefully', () => {
      const citiesWithMissingMarker = [
        { name: 'New York', timezone: 'America/New_York', lat: 40.7128, lng: -74.006 },
        { name: 'Tokyo', timezone: 'Asia/Tokyo', lat: 35.6762, lng: 139.6503 },
      ] as const;

      expect(() => {
        renderer = createTerminatorRenderer({
          nightOverlay: mockNightOverlay,
          markerElements, // Only has NYC and London, not Tokyo
          cities: citiesWithMissingMarker,
          getCurrentTime: mockGetCurrentTime,
        });
      }).not.toThrow();

      // Should only set night state on NYC (has marker)
      const nycMarker = markerElements.get('America/New_York')!;
      expect(nycMarker.hasAttribute('data-night')).toBe(true);
    });

    it('should handle empty cities array', () => {
      expect(() => {
        renderer = createTerminatorRenderer({
          nightOverlay: mockNightOverlay,
          markerElements,
          cities: [],
          getCurrentTime: mockGetCurrentTime,
        });
      }).not.toThrow();

      expect(mockNightOverlay.setAttribute).toHaveBeenCalledWith('d', expect.any(String));
    });

    it('should update path even with no markers', () => {
      renderer = createTerminatorRenderer({
        nightOverlay: mockNightOverlay,
        markerElements: new Map(),
        cities: mockCities,
        getCurrentTime: mockGetCurrentTime,
      });

      expect(mockNightOverlay.setAttribute).toHaveBeenCalledWith('d', expect.any(String));
    });

    it('should handle time changes correctly', async () => {
      let currentTime = new Date('2025-01-01T00:00:00Z'); // Midnight
      mockGetCurrentTime = vi.fn(() => currentTime);

      renderer = createTerminatorRenderer({
        nightOverlay: mockNightOverlay,
        markerElements,
        cities: mockCities,
        getCurrentTime: mockGetCurrentTime,
      });

      const firstPath = (mockNightOverlay.setAttribute as any).mock.calls[0][1];

      // Advance time to noon
      currentTime = new Date('2025-01-01T12:00:00Z');
      renderer.update();
      await vi.runOnlyPendingTimersAsync();

      const secondPath = (mockNightOverlay.setAttribute as any).mock.calls[1][1];

      // Paths should be different for midnight vs noon
      expect(firstPath).not.toBe(secondPath);
    });
  });

  describe('Performance', () => {
    it('should clean up pending RAF on destroy', () => {
      renderer = createTerminatorRenderer({
        nightOverlay: mockNightOverlay,
        markerElements,
        cities: mockCities,
        getCurrentTime: mockGetCurrentTime,
      });

      // Schedule an update
      renderer.update();

      // Destroy before RAF executes
      renderer.destroy();

      vi.clearAllMocks();

      // Run pending RAF
      vi.runOnlyPendingTimers();

      // Should not update after destroy
      expect(mockGetCurrentTime).not.toHaveBeenCalled();
    });
  });
});
