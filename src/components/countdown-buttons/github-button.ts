/** GitHub button - opens repository in new tab. */

import '../../styles/components/countdown-ui.css';

import { createIcon, createIconButton, ICON_SIZES } from '@core/utils/dom';

/**
 * Create GitHub icon button that links to the repository.
 * @returns Anchor element styled as button
 */
export function createGitHubButton(): HTMLAnchorElement {
  return createIconButton({
    testId: 'github-button',
    label: 'View on GitHub (opens in new tab)',
    icon: createIcon({ name: 'mark-github', size: ICON_SIZES.MD }),
    className: 'countdown-button countdown-button--icon-only github-button',
    href: 'https://github.com/chrisreddington/timestamp',
    target: '_blank',
    rel: 'noopener noreferrer',
  });
}
