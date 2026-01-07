/**
 * Share Menu Component
 * Dropdown menu for wall-clock mode with timezone sharing options.
 * Delegates to: share-menu-dom.ts (DOM), share-menu-keyboard.ts (keyboard nav), share-utils.ts (clipboard).
 */

import '../../../styles/components/countdown-ui.css';

import { createFocusTrap, type FocusTrapController } from '@core/utils/accessibility';

import { cancelAll, createResourceTracker, type ResourceTracker, safeSetTimeout } from '@/core/resource-tracking';

import { DEFAULT_SHARE_LABEL, FEEDBACK_DURATION_MS } from '../constants';
import { createShareMenuDOM } from './share-menu-dom';
import {
  handleButtonKeydown as handleButtonKeydownImpl,
  handleMenuKeydown as handleMenuKeydownImpl,
  isInMobileMenu,
  type MenuKeyboardCallbacks,
  type MenuKeyboardState,
  updateMobileContext,
} from './share-menu-keyboard';
import { copyShareUrlToClipboard } from './share-utils';
import type { ShareController, ShareTargetsGetter, ShareTargetType } from './types';

/** Options for creating a share menu. */
export interface ShareMenuOptions {
  /** Function to get current share URLs (called on-demand when menu item clicked) */
  getShareTargets: ShareTargetsGetter;
  /** Optional callback when a link is copied */
  onCopy?: (url: string, type: ShareTargetType) => void;
}

/**
 * Create share menu for wall-clock mode with three timezone options.
 * @returns Controller with getElement and destroy methods
 */
export function createShareMenu(options: ShareMenuOptions): ShareController {
  const { getShareTargets, onCopy } = options;

  const { container, button, buttonText, menu, menuItems } = createShareMenuDOM();
  const menuItemsArray = [menuItems.selectedTz, menuItems.localTz, menuItems.withoutTz];

  let isOpen = false;
  let focusTrap: FocusTrapController | null = null;
  let currentFocusedIndex = 0;
  
  const resourceTracker: ResourceTracker = createResourceTracker();
  const itemResourceTrackers = new Map<HTMLButtonElement, ResourceTracker>();

  const getKeyboardState = (): MenuKeyboardState => ({
    currentFocusedIndex,
    menuItems: menuItemsArray,
    isOpen,
  });

  const keyboardCallbacks: MenuKeyboardCallbacks = {
    openMenu,
    closeMenu,
    setFocusedIndex: (index: number) => {
      currentFocusedIndex = index;
    },
  };

  function openMenu(): void {
    if (isOpen) return;
    
    isOpen = true;
    button.setAttribute('aria-expanded', 'true');
    menu.classList.add('share-menu-dropdown--open');
    
    focusTrap = createFocusTrap({
      container: menu,
      initialFocus: menuItems.selectedTz,
      onEscape: closeMenu,
      onClickOutside: closeMenu,
    });
    focusTrap.activate();
    
    currentFocusedIndex = 0;
    menuItemsArray.forEach((item, i) => {
      item.tabIndex = i === 0 ? 0 : -1;
    });
    menuItems.selectedTz.focus();
  }

  function closeMenu(): void {
    if (!isOpen) return;
    
    isOpen = false;
    button.setAttribute('aria-expanded', 'false');
    menu.classList.remove('share-menu-dropdown--open');
    
    if (focusTrap) {
      focusTrap.deactivate();
      focusTrap = null;
    }
    
    button.focus();
  }

  function toggleMenu(): void {
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  function showFeedback(success: boolean): void {
    // Clear existing feedback
    cancelAll(resourceTracker);
    
    // Apply CSS-driven feedback via data attribute
    button.dataset.feedback = success ? 'success' : 'error';
    buttonText.textContent = success ? 'Copied!' : 'Failed';
    
    // Reset after duration
    safeSetTimeout(() => {
      delete button.dataset.feedback;
      buttonText.textContent = DEFAULT_SHARE_LABEL;
    }, FEEDBACK_DURATION_MS, resourceTracker);
  }

  /** Show feedback on menu item (mobile context). */
  function showMenuItemFeedback(menuItem: HTMLButtonElement, success: boolean): void {
    const originalLabel = menuItem.getAttribute('data-original-label') || '';
    const labelSpan = menuItem.querySelector<HTMLSpanElement>('.share-menu-item-label');
    if (!labelSpan) return;

    // Get or create resource tracker for this item
    let itemHandles = itemResourceTrackers.get(menuItem);
    if (!itemHandles) {
      itemHandles = createResourceTracker();
      itemResourceTrackers.set(menuItem, itemHandles);
    }
    
    // Clear existing feedback
    cancelAll(itemHandles);
    
    // Apply CSS-driven feedback via data attribute
    menuItem.dataset.feedback = success ? 'success' : 'error';
    labelSpan.textContent = success ? 'Copied!' : 'Failed';
    
    // Reset after duration
    safeSetTimeout(() => {
      delete menuItem.dataset.feedback;
      labelSpan.textContent = originalLabel || DEFAULT_SHARE_LABEL;
    }, FEEDBACK_DURATION_MS, itemHandles);
  }

  /** Copy URL and show appropriate feedback based on context. */
  async function handleCopy(type: ShareTargetType, clickedItem?: HTMLButtonElement): Promise<void> {
    try {
      const shareTargets = getShareTargets();
      const url = shareTargets[type];
      await copyShareUrlToClipboard(url);
      
      if (clickedItem && isInMobileMenu(container)) {
        showMenuItemFeedback(clickedItem, true);
      } else {
        showFeedback(true);
      }
      onCopy?.(url, type);
    } catch (error) {
      if (clickedItem && isInMobileMenu(container)) {
        showMenuItemFeedback(clickedItem, false);
      } else {
        showFeedback(false);
      }
      console.error('Failed to copy URL to clipboard:', error);
    }
    
    if (!isInMobileMenu(container)) {
      closeMenu();
    }
  }

  button.addEventListener('click', toggleMenu);
  button.addEventListener('keydown', (e) =>
    handleButtonKeydownImpl(e, getKeyboardState(), keyboardCallbacks)
  );
  menu.addEventListener('keydown', (e) =>
    handleMenuKeydownImpl(e, getKeyboardState(), keyboardCallbacks)
  );

  menuItems.selectedTz.addEventListener('click', () =>
    handleCopy('withSelectedTimezone', menuItems.selectedTz)
  );
  menuItems.localTz.addEventListener('click', () =>
    handleCopy('withLocalTimezone', menuItems.localTz)
  );
  menuItems.withoutTz.addEventListener('click', () =>
    handleCopy('withoutTimezone', menuItems.withoutTz)
  );

  const contextObserver = new MutationObserver(() => {
    updateMobileContext(container, menuItemsArray, isOpen);
  });
  contextObserver.observe(document.body, { childList: true, subtree: true });
  requestAnimationFrame(() => updateMobileContext(container, menuItemsArray, isOpen));

  return {
    getElement(): HTMLElement {
      return container;
    },
    
    destroy(): void {
      cancelAll(resourceTracker);
      itemResourceTrackers.forEach((handles) => cancelAll(handles));
      itemResourceTrackers.clear();
      if (focusTrap) focusTrap.deactivate();
      contextObserver.disconnect();
      button.removeEventListener('click', toggleMenu);
    },
  };
}
