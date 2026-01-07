/**
 * Lightweight helpers for deterministic time-based tests.
 */
import { vi } from 'vitest';

/**
 * Run callback with fake timers and system clock set to specific moment.
 * @remarks Prefer this over manual vi.useFakeTimers() to prevent leaks.
 */
export async function withFakeNow<T>(now: Date, run: () => T | Promise<T>): Promise<T> {
  vi.useFakeTimers();
  vi.setSystemTime(now);

  try {
    return await run();
  } finally {
    vi.useRealTimers();
  }
}

/**
 * Install fake timers for callback duration and restore afterward.
 * @remarks Use when tests need deterministic timers without pinning system clock.
 */
export async function withFakeTimers<T>(run: () => T | Promise<T>): Promise<T> {
  vi.useFakeTimers();

  try {
    return await run();
  } finally {
    vi.useRealTimers();
  }
}

/**
 * Run callback with fake timers and clock set to ISO 8601 timestamp.
 * @remarks Convenience wrapper around withFakeNow for string-based dates.
 */
export async function withIsoTime<T>(
  isoTimestamp: string,
  run: () => T | Promise<T>
): Promise<T> {
  return withFakeNow(new Date(isoTimestamp), run);
}
