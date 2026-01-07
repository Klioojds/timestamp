import { describe, expect, it, vi } from 'vitest';

import { createFireworksTestContainer, mountFireworksBackground, renderStarsFragment } from './index';

const {
  createTestContainerMock,
  removeTestContainerMock,
  mountMock,
} = vi.hoisted(() => ({
  createTestContainerMock: vi.fn(),
  removeTestContainerMock: vi.fn(),
  mountMock: vi.fn(),
}));

vi.mock('@/test-utils/theme-test-helpers', () => ({
  createTestContainer: createTestContainerMock,
  removeTestContainer: removeTestContainerMock,
}));

vi.mock('../renderers/landing-page-renderer', () => ({
  fireworksLandingPageRenderer: vi.fn(() => ({ mount: mountMock })),
}));

describe('fireworks test utils', () => {
  it.each([
    { id: undefined, expectedId: 'fireworks-test-container' },
    { id: 'custom-id', expectedId: 'custom-id' },
  ])('should create test container when id is $expectedId', ({ id, expectedId }) => {
    const container = document.createElement('div');
    createTestContainerMock.mockReturnValueOnce(container);

    const { container: created, cleanup } = createFireworksTestContainer(id as string | undefined);

    expect(createTestContainerMock).toHaveBeenCalledWith(expectedId);
    expect(created).toBe(container);

    cleanup();
    expect(removeTestContainerMock).toHaveBeenCalledWith(container);
  });

  it('should mount landing page background into provided container', () => {
    const container = document.createElement('div');

    const renderer = mountFireworksBackground(container);

    expect(renderer.mount).toHaveBeenCalledWith(container);
    expect(mountMock).toHaveBeenCalledWith(container);
  });

  it('should render star fragment wrapper and star elements', () => {
    const { wrapper, stars } = renderStarsFragment('<div class="star"></div><div class="star"></div>');

    expect(wrapper.querySelectorAll('.star')).toHaveLength(2);
    expect(stars).toHaveLength(2);
  });
});
