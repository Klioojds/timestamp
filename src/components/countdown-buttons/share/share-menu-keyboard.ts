/** Keyboard navigation handlers for share menu. */

export interface MenuKeyboardState {
  currentFocusedIndex: number;
  menuItems: HTMLButtonElement[];
  isOpen: boolean;
}

export interface MenuKeyboardCallbacks {
  openMenu: () => void;
  closeMenu: () => void;
  setFocusedIndex: (index: number) => void;
}

/**
 * Handle ARIA menu keyboard navigation (Arrow keys, Home, End).
 * @param event - Keyboard event
 * @param state - Current menu state
 * @param callbacks - State update callbacks
 */
export function handleMenuKeydown(
  event: KeyboardEvent,
  state: MenuKeyboardState,
  callbacks: MenuKeyboardCallbacks
): void {
  const { menuItems, currentFocusedIndex } = state;
  const { setFocusedIndex } = callbacks;

  switch (event.key) {
    case 'ArrowDown': {
      event.preventDefault();
      const nextIndex = (currentFocusedIndex + 1) % menuItems.length;
      setFocusedIndex(nextIndex);
      menuItems[nextIndex].focus();
      break;
    }
    case 'ArrowUp': {
      event.preventDefault();
      const prevIndex = (currentFocusedIndex - 1 + menuItems.length) % menuItems.length;
      setFocusedIndex(prevIndex);
      menuItems[prevIndex].focus();
      break;
    }
    case 'Home':
      event.preventDefault();
      setFocusedIndex(0);
      menuItems[0].focus();
      break;
    case 'End': {
      event.preventDefault();
      const lastIndex = menuItems.length - 1;
      setFocusedIndex(lastIndex);
      menuItems[lastIndex].focus();
      break;
    }
  }
}

/**
 * Handle trigger button keyboard (ArrowDown/Enter/Space opens, Escape closes).
 * @param event - Keyboard event
 * @param state - Current menu state
 * @param callbacks - State update callbacks
 */
export function handleButtonKeydown(
  event: KeyboardEvent,
  state: MenuKeyboardState,
  callbacks: MenuKeyboardCallbacks
): void {
  const { isOpen } = state;
  const { openMenu, closeMenu } = callbacks;

  if ((event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') && !isOpen) {
    event.preventDefault();
    openMenu();
  } else if (event.key === 'Escape' && isOpen) {
    event.preventDefault();
    closeMenu();
  }
}

export function isInMobileMenu(container: HTMLElement): boolean {
  return container.closest('.mobile-menu-actions') !== null;
}

export function updateMobileContext(
  container: HTMLElement,
  menuItems: HTMLButtonElement[],
  isOpen: boolean
): void {
  const inMobile = isInMobileMenu(container);
  const tabIndex = inMobile ? 0 : isOpen ? undefined : -1;
  
  if (tabIndex !== undefined) {
    menuItems.forEach((item) => { item.tabIndex = tabIndex; });
  }
}
