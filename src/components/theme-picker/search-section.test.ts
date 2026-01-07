/**
 * Search section builder - Unit Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cloneTemplate } from '@core/utils/dom';
import { buildResultsCount, buildSearchSection } from './search-section';

vi.mock('@core/utils/dom', () => ({
  cloneTemplate: vi.fn(),
}));

const mockedCloneTemplate = cloneTemplate as unknown as ReturnType<typeof vi.fn>;

describe('search-section', () => {
  beforeEach(() => {
    mockedCloneTemplate.mockReset();
  });

  it('should wire input and keydown handlers to search input', () => {
    const template = document.createElement('template');
    const section = document.createElement('section');
    const input = document.createElement('input');
    input.id = 'theme-search';
    section.appendChild(input);
    template.content.appendChild(section);
    mockedCloneTemplate.mockReturnValueOnce(section);

    const onInput = vi.fn();
    const onKeydown = vi.fn();

    const { section: builtSection, searchInput } = buildSearchSection(onInput, onKeydown);

    expect(builtSection).toBe(section);
    expect(searchInput).toBe(input);

    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(onInput).toHaveBeenCalledTimes(1);
    expect(onKeydown).toHaveBeenCalledTimes(1);
  });

  it('should throw when template is missing search input', () => {
    const templateContent = document.createElement('section');
    mockedCloneTemplate.mockReturnValueOnce(templateContent);

    expect(() => buildSearchSection(vi.fn(), vi.fn())).toThrowError('Search input not found in template');
  });

  it('should build results count live region from template', () => {
    const liveRegion = document.createElement('div');
    mockedCloneTemplate.mockReturnValueOnce(liveRegion);

    const element = buildResultsCount();

    expect(mockedCloneTemplate).toHaveBeenCalledWith('results-count-template');
    expect(element).toBe(liveRegion);
  });
});
