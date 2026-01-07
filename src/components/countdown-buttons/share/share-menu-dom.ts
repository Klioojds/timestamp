/** DOM builders for share menu. */

import { createIcon, ICON_SIZES } from '@core/utils/dom';
import { cloneTemplate } from '@core/utils/dom/template-utils';

import { createShareLinkIcon } from './share-utils';

/**
 * Create complete share menu DOM structure from template.
 * @returns Object containing container, button, menu, and menu items
 */
export function createShareMenuDOM(): {
  container: HTMLDivElement;
  button: HTMLButtonElement;
  buttonText: HTMLSpanElement;
  menu: HTMLDivElement;
  menuItems: { selectedTz: HTMLButtonElement; localTz: HTMLButtonElement; withoutTz: HTMLButtonElement };
} {
  const container = cloneTemplate<HTMLDivElement>('share-menu-template');

  // Generate unique menu ID for ARIA association
  const menuId = `share-menu-${Date.now()}`;
  const menu = container.querySelector('.share-menu-dropdown') as HTMLDivElement;
  menu.id = menuId;

  const button = container.querySelector('[data-testid="share-button"]') as HTMLButtonElement;
  button.setAttribute('aria-controls', menuId);

  // Inject icons into button (must be done via JS as SVGs are dynamic)
  const shareIcon = createShareLinkIcon();
  const chevronIcon = createIcon({ name: 'chevron-down', size: ICON_SIZES.SM, className: 'share-menu-chevron' });
  const buttonText = button.querySelector('.share-menu-button-text') as HTMLSpanElement;
  
  button.insertBefore(shareIcon, buttonText);
  button.appendChild(chevronIcon);

  // Inject icons into menu items
  const menuItems = container.querySelectorAll('.share-menu-item') as NodeListOf<HTMLButtonElement>;
  menuItems.forEach((item) => {
    const icon = createShareLinkIcon('share-link-icon');
    const label = item.querySelector('.share-menu-item-label') as HTMLSpanElement;
    item.insertBefore(icon, label);
  });

  const menuItemSelectedTz = container.querySelector('[data-testid="share-selected-timezone"]') as HTMLButtonElement;
  const menuItemLocalTz = container.querySelector('[data-testid="share-local-timezone"]') as HTMLButtonElement;
  const menuItemWithoutTz = container.querySelector('[data-testid="share-without-timezone"]') as HTMLButtonElement;

  return {
    container,
    button,
    buttonText,
    menu,
    menuItems: { selectedTz: menuItemSelectedTz, localTz: menuItemLocalTz, withoutTz: menuItemWithoutTz },
  };
}
