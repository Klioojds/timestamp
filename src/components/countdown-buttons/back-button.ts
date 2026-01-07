/** Back Button Component - Allows users to return from countdown view to the landing page configuration. */

import '../../styles/components/countdown-ui.css';

import { createIcon, createIconButton, ICON_SIZES } from '@core/utils/dom';

/** Options for creating a back button. */
export interface BackButtonOptions {
  /** Callback invoked when user clicks to return to setup */
  onBack: () => void;
}

/** Back button controller interface. */
export interface BackButtonController {
  /** Remove the button and clean up */
  destroy: () => void;
}

/** Create back button with arrow icon and "Setup" text. @returns Controller with destroy method */
export function createBackButton(
  container: HTMLElement,
  options: BackButtonOptions
): BackButtonController {
  const icon = createIcon({
    name: 'arrow-left',
    size: ICON_SIZES.MD,
  });

  const button = createIconButton({
    testId: 'back-button',
    label: 'Return to countdown setup',
    icon,
    className: 'countdown-button back-button',
    onClick: options.onBack,
  });

  const text = document.createElement('span');
  text.textContent = 'Setup';
  button.appendChild(text);

  container.appendChild(button);

  return {
    destroy(): void {
      button.removeEventListener('click', options.onBack);
      button.remove();
    },
  };
}
