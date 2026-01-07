/**
 * Timezone Selector List Renderer Tests
 * Tests for list rendering, grouping, and empty states.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderList } from './list-renderer';
import type { TimezoneOption } from './options';
import { createOptionsFixture } from './test-fixtures';
import { GROUP_LABELS, EMPTY_STATE_MESSAGE } from './constants';

// Mock dependencies
vi.mock('@core/time/timezone', () => ({
  formatOffsetLabel: vi.fn(() => '-5 hours'),
}));

describe('Timezone Selector List Renderer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('renderList', () => {
    const options: TimezoneOption[] = createOptionsFixture();

    it('should render empty state when no options', () => {
      const html = renderList([], 'America/New_York', 'America/New_York');
      expect(html).toContain('dropdown-empty');
      expect(html).toContain(EMPTY_STATE_MESSAGE);
    });

    it('should render all groups in correct order', () => {
      const html = renderList(options, 'America/New_York', 'America/New_York');

      // Check order by finding positions
      const celebratingPos = html.indexOf(GROUP_LABELS.celebrating);
      const userZonePos = html.indexOf(GROUP_LABELS.userZone);
      const featuredPos = html.indexOf(GROUP_LABELS.featured);
      const othersPos = html.indexOf(GROUP_LABELS.others);

      expect(celebratingPos).toBeLessThan(userZonePos);
      expect(userZonePos).toBeLessThan(featuredPos);
      expect(featuredPos).toBeLessThan(othersPos);
    });

    it('should include all options', () => {
      const html = renderList(options, 'America/New_York', 'America/New_York');

      expect(html).toContain('data-value="Pacific/Auckland"');
      expect(html).toContain('data-value="America/New_York"');
      expect(html).toContain('data-value="Europe/London"');
      expect(html).toContain('data-value="Europe/Paris"');
    });

    it('should generate sequential IDs across groups', () => {
      const html = renderList(options, 'America/New_York', 'America/New_York');

      // IDs should be sequential: 0, 1, 2, 3
      expect(html).toContain('id="tz-option-0"');
      expect(html).toContain('id="tz-option-1"');
      expect(html).toContain('id="tz-option-2"');
      expect(html).toContain('id="tz-option-3"');
    });
  });
});
