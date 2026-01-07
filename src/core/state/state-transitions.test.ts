/**
 * Celebration State Transitions Tests
 * Tests for transition validation logic.
 */
import { describe, it, expect } from 'vitest';
import { isValidTransition, getAllowedTransitions, CELEBRATION_STATE_TRANSITIONS } from './state-transitions';

describe('state-transitions', () => {
  describe('CELEBRATION_STATE_TRANSITIONS table', () => {
    it('should define valid transitions for each state', () => {
      expect(CELEBRATION_STATE_TRANSITIONS).toEqual({
        counting: ['celebrating', 'celebrated'],
        celebrating: ['celebrated'],
        celebrated: ['counting'],
      });
    });
  });

  describe('isValidTransition', () => {
    it.each([
      { from: 'counting', to: 'celebrating', expected: true, description: 'counting → celebrating' },
      { from: 'counting', to: 'celebrated', expected: true, description: 'counting → celebrated (skip animation)' },
      { from: 'celebrating', to: 'celebrated', expected: true, description: 'celebrating → celebrated' },
      { from: 'celebrated', to: 'counting', expected: true, description: 'celebrated → counting (timezone switch)' },
      { from: 'counting', to: 'counting', expected: false, description: 'counting → counting (invalid loop)' },
      { from: 'celebrating', to: 'counting', expected: false, description: 'celebrating → counting (invalid reverse)' },
      { from: 'celebrated', to: 'celebrating', expected: false, description: 'celebrated → celebrating (invalid)' },
    ] as const)('should return $expected for $description', ({ from, to, expected }) => {
      expect(isValidTransition(from, to)).toBe(expected);
    });
  });

  describe('getAllowedTransitions', () => {
    it('should return valid next states for counting', () => {
      expect(getAllowedTransitions('counting')).toEqual(['celebrating', 'celebrated']);
    });

    it('should return valid next states for celebrating', () => {
      expect(getAllowedTransitions('celebrating')).toEqual(['celebrated']);
    });

    it('should return valid next states for celebrated', () => {
      expect(getAllowedTransitions('celebrated')).toEqual(['counting']);
    });
  });
});
