/**
 * Tests for GitHub Button Component
 * Verifies creation, interaction, and styling of the GitHub button.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createGitHubButton } from './github-button';

describe('GitHub Button', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  describe('createGitHubButton', () => {
    it('should create an anchor element with correct testid', () => {
      const button = createGitHubButton();
      container.appendChild(button);

      const element = container.querySelector('[data-testid="github-button"]');
      expect(element).toBeTruthy();
      expect(element?.tagName).toBe('A');
    });

    it('should link to the countdown repository', () => {
      const button = createGitHubButton();
      expect(button.href).toBe('https://github.com/chrisreddington/timestamp');
    });

    it('should open in a new tab with security attributes', () => {
      const button = createGitHubButton();
      expect(button.target).toBe('_blank');
      expect(button.rel).toBe('noopener noreferrer');
    });

    it('should have descriptive aria-label', () => {
      const button = createGitHubButton();
      expect(button.getAttribute('aria-label')).toBe('View on GitHub (opens in new tab)');
    });

    it('should include GitHub logo for recognizability', () => {
      const button = createGitHubButton();
      const svg = button.querySelector('svg');
      expect(svg).toBeTruthy();
      expect(svg?.getAttribute('aria-hidden')).toBe('true');
    });
  });
});
