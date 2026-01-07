/** Simple Share Button Component - Single button for timer/absolute modes - copies URL to clipboard on click. */

import '@/styles/components/countdown-ui.css';

import { cloneTemplate } from '@core/utils/dom/template-utils';

import { cancelAll, createResourceTracker, type ResourceTracker, safeSetTimeout } from '@/core/resource-tracking';

import { DEFAULT_SHARE_LABEL, FEEDBACK_DURATION_MS } from '../constants';
import { copyShareUrlToClipboard, createShareLinkIcon } from './share-utils';
import type { ShareController, ShareTargetsGetter } from './types';

/** Options for creating a simple share button. */
export interface SimpleShareButtonOptions {
  /** Function to get current share URLs (called on-demand when clicked) */
  getShareTargets: ShareTargetsGetter;
  /** Optional callback when link is copied */
  onCopy?: (url: string) => void;
}

/**
 * Create simple share button for timer/absolute modes (copies URL on click).
 * @returns Controller with getElement and destroy methods
 */
export function createSimpleShareButton(options: SimpleShareButtonOptions): ShareController {
  const { getShareTargets, onCopy } = options;
  
  const button = cloneTemplate<HTMLButtonElement>('simple-share-button-template');
  
  // Inject icon (must be done via JS as SVGs are dynamic)
  const icon = createShareLinkIcon();
  const text = button.querySelector('.share-button-text') as HTMLSpanElement;
  button.insertBefore(icon, text);

  const resourceTracker: ResourceTracker = createResourceTracker();

  function showFeedback(success: boolean): void {
    // Clear any existing feedback timeout
    cancelAll(resourceTracker);
    
    // Apply CSS-driven feedback via data attribute
    button.dataset.feedback = success ? 'success' : 'error';
    text.textContent = success ? 'Copied!' : 'Failed';
    
    // Reset after duration
    safeSetTimeout(() => {
      delete button.dataset.feedback;
      text.textContent = DEFAULT_SHARE_LABEL;
    }, FEEDBACK_DURATION_MS, resourceTracker);
  }

  async function handleClick(): Promise<void> {
    try {
      const targets = getShareTargets();
      const url = targets.withSelectedTimezone;
      await copyShareUrlToClipboard(url);
      showFeedback(true);
      onCopy?.(url);
    } catch (error) {
      showFeedback(false);
      console.error('Failed to copy URL to clipboard:', error);
    }
  }

  button.addEventListener('click', handleClick);

  return {
    getElement(): HTMLElement {
      return button;
    },
    
    destroy(): void {
      cancelAll(resourceTracker);
      button.removeEventListener('click', handleClick);
    },
  };
}
