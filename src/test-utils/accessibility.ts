import { vi } from 'vitest';

export interface MatchMediaMockControls {
  restore: () => void;
  setMatches: (matches: boolean) => void;
}

/** Mock window.matchMedia with configurable matches flag. */
export function mockMatchMedia(matches = false): MatchMediaMockControls {
  const original = window.matchMedia;
  let currentMatches = matches;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();

  const mock = vi.fn().mockImplementation((query: string) => ({
    matches: currentMatches,
    media: query,
    addEventListener: (_: 'change', listener: (event: MediaQueryListEvent) => void) => listeners.add(listener),
    removeEventListener: (_: 'change', listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener),
    dispatchEvent: (event: MediaQueryListEvent) => {
      listeners.forEach((listener) => listener(event));
      return true;
    },
  }));

  window.matchMedia = mock as unknown as typeof window.matchMedia;

  return {
    setMatches(next: boolean) {
      currentMatches = next;
      const event = { matches: currentMatches } as MediaQueryListEvent;
      mock().dispatchEvent(event);
    },
    restore() {
      window.matchMedia = original;
      listeners.clear();
    },
  };
}
