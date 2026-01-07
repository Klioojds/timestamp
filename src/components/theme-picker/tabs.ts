/**
 * Theme Selector Tabs - WAI-ARIA tabs pattern with keyboard navigation.
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
 */

import type { RovingTabindexController } from '@core/utils/accessibility/roving-tabindex';
import { createRovingTabindex } from '@core/utils/accessibility/roving-tabindex';

import type { ThemeTab } from './types';

/**
 * Configuration for a single tab.
 */
export interface TabConfig {
  /** Unique tab identifier */
  id: ThemeTab;
  /** Display label for the tab */
  label: string;
  /** Whether this tab is initially selected */
  selected: boolean;
}

/**
 * Options for creating a tab list.
 */
export interface TabListOptions {
  /** Tab configurations */
  tabs: TabConfig[];
  /** Callback when a tab is activated */
  onTabChange: (tabId: ThemeTab) => void;
}

/**
 * Controller for managing tab UI and keyboard navigation.
 */
export interface TabController {
  /** Get the tab list element */
  getTabList(): HTMLElement;
  /** Set active tab programmatically */
  setActiveTab(tabId: ThemeTab): void;
  /** Clean up resources */
  destroy(): void;
}

/**
 * Build tablist with WAI-ARIA attributes and keyboard navigation.
 * @param options - Tab configurations and change callback
 * @returns Controller for tab management
 * @remarks Roving tabindex ensures only one tab is tabbable at a time
 */
export function buildTabList(options: TabListOptions): TabController {
  const { tabs, onTabChange } = options;

  const tabList = document.createElement('div');
  tabList.setAttribute('role', 'tablist');
  tabList.setAttribute('aria-label', 'Theme selector tabs');
  tabList.className = 'theme-selector-tabs';

  const tabElements = new Map<ThemeTab, HTMLElement>();
  let rovingController: RovingTabindexController | null = null;
  let currentTabId: ThemeTab = tabs.find(t => t.selected)?.id ?? tabs[0].id;
  tabs.forEach((tab) => {
    const button = document.createElement('button');
    button.setAttribute('role', 'tab');
    button.setAttribute('id', `tab-${tab.id}`);
    button.setAttribute('aria-controls', `tabpanel-${tab.id}`);
    button.setAttribute('aria-selected', tab.selected ? 'true' : 'false');
    button.setAttribute('tabindex', tab.selected ? '0' : '-1');
    button.className = 'theme-selector-tab';
    button.textContent = tab.label;

    button.addEventListener('click', () => {
      activateTab(tab.id);
    });

    button.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        activateTab(tab.id);
      }
    });

    tabElements.set(tab.id, button);
    tabList.appendChild(button);
  });

  function activateTab(tabId: ThemeTab): void {
    const previousTabId = currentTabId;
    if (previousTabId === tabId) return;

    currentTabId = tabId;

    tabElements.forEach((element, id) => {
      const isSelected = id === tabId;
      element.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    });

    onTabChange(tabId);
  }

  function setActiveTab(tabId: ThemeTab): void {
    const tabElement = tabElements.get(tabId);
    if (!tabElement) return;

    const tabArray = Array.from(tabElements.values());
    const index = tabArray.indexOf(tabElement);

    if (index !== -1 && rovingController) {
      activateTab(tabId);
      rovingController.focusIndex(index);
    }
  }

  rovingController = createRovingTabindex({
    container: tabList,
    selector: '[role="tab"]',
    initialIndex: tabs.findIndex(t => t.selected),
    wrap: true,
    orientation: 'horizontal',
  });

  return {
    getTabList(): HTMLElement {
      return tabList;
    },

    setActiveTab(tabId: ThemeTab): void {
      setActiveTab(tabId);
    },

    destroy(): void {
      rovingController?.destroy();
      tabElements.clear();
    },
  };
}

/**
 * Options for creating a tab panel.
 */
export interface TabPanelOptions {
  /** Unique panel identifier (matches tab id) */
  id: ThemeTab;
  /** Whether this panel is initially visible */
  visible: boolean;
  /** Content to display in the panel */
  content?: HTMLElement;
}

/**
 * Controller for managing a tab panel's visibility.
 */
export interface TabPanelController {
  /** Get the panel element */
  getPanel(): HTMLElement;
  /** Show the panel */
  show(): void;
  /** Hide the panel */
  hide(): void;
  /** Set panel content */
  setContent(content: HTMLElement): void;
}

/**
 * Build tabpanel with ARIA attributes and visibility management.
 * @param options - Panel ID, visibility, and optional content
 * @returns Controller for panel management
 * @remarks Hidden panels use `hidden` attribute to remove from accessibility tree
 */
export function buildTabPanel(options: TabPanelOptions): TabPanelController {
  const { id, visible, content } = options;

  const panel = document.createElement('div');
  panel.setAttribute('role', 'tabpanel');
  panel.setAttribute('id', `tabpanel-${id}`);
  panel.setAttribute('aria-labelledby', `tab-${id}`);
  panel.className = 'theme-selector-tabpanel';
  panel.setAttribute('tabindex', '0');

  if (!visible) {
    panel.hidden = true;
  }

  if (content) {
    panel.appendChild(content);
  }

  return {
    getPanel(): HTMLElement {
      return panel;
    },

    show(): void {
      panel.hidden = false;
    },

    hide(): void {
      panel.hidden = true;
    },

    setContent(newContent: HTMLElement): void {
      panel.innerHTML = '';
      panel.appendChild(newContent);
    },
  };
}
