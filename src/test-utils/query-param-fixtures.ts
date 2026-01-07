/**
 * Shared fixtures for query parameter parsing tests.
 */

import { DEFAULT_COMPLETION_MESSAGE } from '@core/config/constants';

export interface ValidQueryFixture {
  description: string;
  url: string;
  expected: {
    mode: 'wall-clock' | 'absolute' | 'timer';
    theme: 'contribution-graph' | 'fireworks';
    timezone: string;
    durationSeconds?: number;
    message?: string;
  };
}

export interface InvalidQueryFixture {
  description: string;
  url: string;
  expectedError: string;
}

export const VALID_QUERY_FIXTURES: ValidQueryFixture[] = [
  {
    description: 'wall-clock mode (legacy date) with explicit target and timezone',
    url: 'https://example.com/?mode=wall-clock&target=2099-01-01T00:00:00&theme=contribution-graph&tz=UTC',
    expected: {
      mode: 'wall-clock',
      theme: 'contribution-graph',
      timezone: 'UTC',
      message: DEFAULT_COMPLETION_MESSAGE,
    },
  },
  {
    description: 'timer mode with duration, theme, message',
    url: 'https://example.com/?mode=timer&duration=300&message=Break%20time!&theme=fireworks&tz=UTC',
    expected: {
      mode: 'timer',
      theme: 'fireworks',
      timezone: 'UTC',
      durationSeconds: 300,
      message: 'Break time!',
    },
  },
];

export const INVALID_QUERY_FIXTURES: InvalidQueryFixture[] = [
  {
    description: 'timer mode missing duration',
    url: 'https://example.com/?mode=timer&skip=true',
    expectedError: 'Duration is required for timer mode.',
  },
  {
    description: 'timer mode with invalid duration (exceeds max)',
    url: 'https://example.com/?mode=timer&duration=99999999',
    expectedError: 'Invalid duration. Must be a positive number of seconds (max 31,536,000).',
  },
  {
    description: 'wall-clock mode missing target',
    url: 'https://example.com/?mode=wall-clock&skip=true',
    expectedError: 'Target date is required for wall-clock mode.',
  },
  {
    description: 'wall-clock mode with Z suffix (should be absolute)',
    url: 'https://example.com/?mode=wall-clock&target=2099-01-01T00:00:00Z',
    expectedError: 'Wall-clock mode requires abstract time (must not end with Z).',
  },
];
