import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  transitionToCelebrated,
  transitionToCelebrating,
  transitionToCounting,
} from './celebration-transitions';

interface CelebrationStateManagerMock {
  setCelebrationState: ReturnType<typeof vi.fn>;
  markCelebrated: ReturnType<typeof vi.fn>;
  setComplete: ReturnType<typeof vi.fn>;
  resetCelebration: ReturnType<typeof vi.fn>;
}

describe('celebration-transitions', () => {
  let container: HTMLElement;
  let stateManager: CelebrationStateManagerMock;

  beforeEach(() => {
    container = document.createElement('div');
    stateManager = {
      setCelebrationState: vi.fn(),
      markCelebrated: vi.fn(),
      setComplete: vi.fn(),
      resetCelebration: vi.fn(),
    };
  });

  it('should transition directly to celebrated state', () => {
    transitionToCelebrated(stateManager, container, 'UTC');

    expect(stateManager.setCelebrationState).toHaveBeenCalledWith('celebrated');
    expect(stateManager.markCelebrated).toHaveBeenCalledWith('UTC');
    expect(stateManager.setComplete).toHaveBeenCalledWith(true);
    expect(container.getAttribute('data-celebrating')).toBe('true');
  });

  it('should mark celebrating state and set container attribute', () => {
    transitionToCelebrating(stateManager, container, 'America/New_York');

    expect(stateManager.setCelebrationState).toHaveBeenCalledWith('celebrating');
    expect(stateManager.markCelebrated).toHaveBeenCalledWith('America/New_York');
    expect(stateManager.setComplete).toHaveBeenCalledWith(true);
    expect(container.getAttribute('data-celebrating')).toBe('true');
  });

  it('should reset celebration state back to counting', () => {
    container.setAttribute('data-celebrating', 'true');

    transitionToCounting(stateManager, container);

    expect(stateManager.resetCelebration).toHaveBeenCalled();
    expect(stateManager.setComplete).toHaveBeenCalledWith(false);
    expect(container.hasAttribute('data-celebrating')).toBe(false);
  });
});
