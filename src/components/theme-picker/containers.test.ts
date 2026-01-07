/**
 * Container builders - Unit Tests
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cloneTemplate } from '@core/utils/dom';
import { buildThemesContainer, createSentinel } from './containers';

vi.mock('@core/utils/dom', () => ({
  cloneTemplate: vi.fn(),
}));

const mockedCloneTemplate = cloneTemplate as unknown as ReturnType<typeof vi.fn>;

describe('containers', () => {
  beforeEach(() => {
    mockedCloneTemplate.mockReset();
  });

  it.each([
    { description: 'themes container', factory: buildThemesContainer, templateId: 'themes-container-template' },
    { description: 'sentinel element', factory: createSentinel, templateId: 'sentinel-template' },
  ])('should build $description by cloning "$templateId"', ({ factory, templateId }) => {
    const element = document.createElement('div');
    mockedCloneTemplate.mockReturnValueOnce(element);

    const result = factory();

    expect(mockedCloneTemplate).toHaveBeenCalledWith(templateId);
    expect(result).toBe(element);
  });

  it('should return fresh clones on repeated builds', () => {
    const firstClone = document.createElement('div');
    const secondClone = document.createElement('div');
    mockedCloneTemplate.mockReturnValueOnce(firstClone).mockReturnValueOnce(secondClone);

    const firstResult = buildThemesContainer();
    const secondResult = buildThemesContainer();

    expect(firstResult).not.toBe(secondResult);
    expect(mockedCloneTemplate).toHaveBeenCalledTimes(2);
  });
});
