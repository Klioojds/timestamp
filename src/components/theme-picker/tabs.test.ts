/**
 * Theme Selector Tabs - Unit Tests
 *
 * Tests the WAI-ARIA tab pattern implementation including:
 * - Tab switching and ARIA attribute management
 * - Roving tabindex behavior
 * - Keyboard navigation (Arrow L/R, Home/End)
 * - Panel visibility toggling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildTabList, buildTabPanel } from './tabs';
import type { TabConfig, TabListOptions } from './tabs';

describe('tabs', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('buildTabList', () => {
    const createTabConfig = (overrides: Partial<TabConfig> = {}): TabConfig => ({
      id: 'themes' as const,
      label: 'All Themes',
      selected: false,
      ...overrides,
    });

    it('should create tablist with proper ARIA attributes', () => {
      const tabs: TabConfig[] = [
        createTabConfig({ id: 'themes', selected: true }),
        createTabConfig({ id: 'favorites', label: 'Favorites' }),
      ];

      const controller = buildTabList({
        tabs,
        onTabChange: vi.fn(),
      });

      const tabList = controller.getTabList();
      expect(tabList.getAttribute('role')).toBe('tablist');
      expect(tabList.getAttribute('aria-label')).toBe('Theme selector tabs');
      expect(tabList.className).toBe('theme-selector-tabs');
    });

    it('should render correct number of tabs', () => {
      const tabs: TabConfig[] = [
        createTabConfig({ id: 'themes', selected: true }),
        createTabConfig({ id: 'favorites', label: 'Favorites' }),
      ];

      const controller = buildTabList({
        tabs,
        onTabChange: vi.fn(),
      });

      const tabList = controller.getTabList();
      const tabButtons = tabList.querySelectorAll('[role="tab"]');
      expect(tabButtons).toHaveLength(2);
    });

    it('should set correct ARIA attributes on tabs', () => {
      const tabs: TabConfig[] = [
        createTabConfig({ id: 'themes', label: 'All Themes', selected: true }),
        createTabConfig({ id: 'favorites', label: 'Favorites', selected: false }),
      ];

      const controller = buildTabList({
        tabs,
        onTabChange: vi.fn(),
      });

      const tabList = controller.getTabList();
      const [themesTab, favTab] = tabList.querySelectorAll('[role="tab"]');

      // Themes tab (selected)
      expect(themesTab.getAttribute('id')).toBe('tab-themes');
      expect(themesTab.getAttribute('aria-controls')).toBe('tabpanel-themes');
      expect(themesTab.getAttribute('aria-selected')).toBe('true');
      expect(themesTab.getAttribute('tabindex')).toBe('0');
      expect(themesTab.textContent).toBe('All Themes');

      // Favorites tab (not selected)
      expect(favTab.getAttribute('id')).toBe('tab-favorites');
      expect(favTab.getAttribute('aria-controls')).toBe('tabpanel-favorites');
      expect(favTab.getAttribute('aria-selected')).toBe('false');
      expect(favTab.getAttribute('tabindex')).toBe('-1');
      expect(favTab.textContent).toBe('Favorites');
    });

    it('should implement roving tabindex (only one tab tabbable)', () => {
      const tabs: TabConfig[] = [
        createTabConfig({ id: 'themes', selected: true }),
        createTabConfig({ id: 'favorites', label: 'Favorites' }),
      ];

      const controller = buildTabList({
        tabs,
        onTabChange: vi.fn(),
      });

      const tabList = controller.getTabList();
      const tabButtons = Array.from(tabList.querySelectorAll('[role="tab"]'));
      const tabbableCount = tabButtons.filter(
        tab => tab.getAttribute('tabindex') === '0'
      ).length;

      expect(tabbableCount).toBe(1);
    });

    it('should call onTabChange when tab is clicked', () => {
      const onTabChange = vi.fn();
      const tabs: TabConfig[] = [
        createTabConfig({ id: 'themes', selected: true }),
        createTabConfig({ id: 'favorites', label: 'Favorites' }),
      ];

      const controller = buildTabList({
        tabs,
        onTabChange,
      });

      const tabList = controller.getTabList();
      const favTab = tabList.querySelectorAll('[role="tab"]')[1] as HTMLElement;

      favTab.click();

      expect(onTabChange).toHaveBeenCalledWith('favorites');
    });

    it.each([
      { key: 'Enter', description: 'Enter key' },
      { key: ' ', description: 'Space key' },
    ])('should activate tab on %s', ({ key }) => {
      const onTabChange = vi.fn();
      const tabs: TabConfig[] = [
        createTabConfig({ id: 'themes', selected: true }),
        createTabConfig({ id: 'favorites', label: 'Favorites' }),
      ];

      const controller = buildTabList({
        tabs,
        onTabChange,
      });

      const tabList = controller.getTabList();
      const favTab = tabList.querySelectorAll('[role="tab"]')[1] as HTMLElement;

      const event = new KeyboardEvent('keydown', { key, bubbles: true });
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
      favTab.dispatchEvent(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(onTabChange).toHaveBeenCalledWith('favorites');
    });

    it.each([
      { key: 'ArrowRight', fromIndex: 0, toIndex: 1, startTab: 'themes' },
      { key: 'ArrowLeft', fromIndex: 1, toIndex: 0, startTab: 'favorites' },
    ])('should navigate with $key key', ({ key, fromIndex, toIndex, startTab }) => {
      const tabs: TabConfig[] = [
        createTabConfig({ id: 'themes', selected: startTab === 'themes' }),
        createTabConfig({ id: 'favorites', label: 'Favorites', selected: startTab === 'favorites' }),
      ];

      const controller = buildTabList({
        tabs,
        onTabChange: vi.fn(),
      });

      const tabList = controller.getTabList();
      container.appendChild(tabList);
      const tabButtons = Array.from(tabList.querySelectorAll('[role="tab"]')) as HTMLElement[];

      // Focus starting tab
      tabButtons[fromIndex].focus();

      const event = new KeyboardEvent('keydown', { key, bubbles: true });
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
      tabButtons[fromIndex].dispatchEvent(event);

      expect(event.preventDefault).toHaveBeenCalled();
      // After roving tabindex moves focus, the target tab should have tabindex=0
      expect(tabButtons[toIndex].getAttribute('tabindex')).toBe('0');
      expect(tabButtons[fromIndex].getAttribute('tabindex')).toBe('-1');
    });

    it('should wrap focus from last to first with ArrowRight', () => {
      const tabs: TabConfig[] = [
        createTabConfig({ id: 'themes', selected: true }),
        createTabConfig({ id: 'favorites', label: 'Favorites' }),
      ];

      const controller = buildTabList({
        tabs,
        onTabChange: vi.fn(),
      });

      const tabList = controller.getTabList();
      container.appendChild(tabList);
      const tabButtons = Array.from(tabList.querySelectorAll('[role="tab"]')) as HTMLElement[];

      // Start at last tab
      controller.setActiveTab('favorites');
      tabButtons[1].focus();

      const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
      tabButtons[1].dispatchEvent(event);

      // Should wrap to first tab (index 0)
      expect(tabButtons[0].getAttribute('tabindex')).toBe('0');
      expect(tabButtons[1].getAttribute('tabindex')).toBe('-1');
    });

    it('should wrap focus from first to last with ArrowLeft', () => {
      const tabs: TabConfig[] = [
        createTabConfig({ id: 'themes', selected: true }),
        createTabConfig({ id: 'favorites', label: 'Favorites' }),
      ];

      const controller = buildTabList({
        tabs,
        onTabChange: vi.fn(),
      });

      const tabList = controller.getTabList();
      container.appendChild(tabList);
      const tabButtons = Array.from(tabList.querySelectorAll('[role="tab"]')) as HTMLElement[];

      // Start at first tab
      tabButtons[0].focus();

      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true });
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
      tabButtons[0].dispatchEvent(event);

      // Should wrap to last tab (index 1)
      expect(tabButtons[1].getAttribute('tabindex')).toBe('0');
      expect(tabButtons[0].getAttribute('tabindex')).toBe('-1');
    });

    it('should jump to first tab with Home key', () => {
      const tabs: TabConfig[] = [
        createTabConfig({ id: 'themes', selected: false }),
        createTabConfig({ id: 'favorites', label: 'Favorites', selected: true }),
      ];

      const controller = buildTabList({
        tabs,
        onTabChange: vi.fn(),
      });

      const tabList = controller.getTabList();
      container.appendChild(tabList);
      const tabButtons = Array.from(tabList.querySelectorAll('[role="tab"]')) as HTMLElement[];

      // Start at second tab
      tabButtons[1].focus();

      const event = new KeyboardEvent('keydown', { key: 'Home', bubbles: true });
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
      tabButtons[1].dispatchEvent(event);

      expect(tabButtons[0].getAttribute('tabindex')).toBe('0');
      expect(tabButtons[1].getAttribute('tabindex')).toBe('-1');
    });

    it('should update aria-selected when setActiveTab is called', () => {
      const tabs: TabConfig[] = [
        createTabConfig({ id: 'themes', selected: true }),
        createTabConfig({ id: 'favorites', label: 'Favorites' }),
      ];

      const controller = buildTabList({
        tabs,
        onTabChange: vi.fn(),
      });

      const tabList = controller.getTabList();
      const [themesTab, favTab] = tabList.querySelectorAll('[role="tab"]');

      expect(themesTab.getAttribute('aria-selected')).toBe('true');
      expect(favTab.getAttribute('aria-selected')).toBe('false');

      controller.setActiveTab('favorites');

      expect(themesTab.getAttribute('aria-selected')).toBe('false');
      expect(favTab.getAttribute('aria-selected')).toBe('true');
    });

    it('should not call onTabChange when clicking already selected tab', () => {
      const onTabChange = vi.fn();
      const tabs: TabConfig[] = [
        createTabConfig({ id: 'themes', selected: true }),
        createTabConfig({ id: 'favorites', label: 'Favorites' }),
      ];

      const controller = buildTabList({
        tabs,
        onTabChange,
      });

      const tabList = controller.getTabList();
      const themesTab = tabList.querySelectorAll('[role="tab"]')[0] as HTMLElement;

      themesTab.click();

      expect(onTabChange).not.toHaveBeenCalled();
    });

    it('should cleanup on destroy', () => {
      const tabs: TabConfig[] = [
        createTabConfig({ id: 'themes', selected: true }),
        createTabConfig({ id: 'favorites', label: 'Favorites' }),
      ];

      const controller = buildTabList({
        tabs,
        onTabChange: vi.fn(),
      });

      const tabList = controller.getTabList();
      container.appendChild(tabList);

      expect(() => controller.destroy()).not.toThrow();

      // After destroy, keyboard navigation should not work
      const tabButtons = Array.from(tabList.querySelectorAll('[role="tab"]')) as HTMLElement[];
      tabButtons[0].focus();

      const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
      tabButtons[0].dispatchEvent(event);

      // Tabindex should not change after destroy
      expect(tabButtons[0].getAttribute('tabindex')).toBe('0');
    });
  });

  describe('buildTabPanel', () => {
    it('should create tabpanel with proper ARIA attributes', () => {
      const controller = buildTabPanel({
        id: 'themes',
        visible: true,
      });

      const panel = controller.getPanel();
      expect(panel.getAttribute('role')).toBe('tabpanel');
      expect(panel.getAttribute('id')).toBe('tabpanel-themes');
      expect(panel.getAttribute('aria-labelledby')).toBe('tab-themes');
      expect(panel.getAttribute('tabindex')).toBe('0');
      expect(panel.className).toBe('theme-selector-tabpanel');
    });

    it('should show panel when visible is true', () => {
      const controller = buildTabPanel({
        id: 'themes',
        visible: true,
      });

      const panel = controller.getPanel();
      expect(panel.hidden).toBe(false);
    });

    it('should hide panel when visible is false', () => {
      const controller = buildTabPanel({
        id: 'favorites',
        visible: false,
      });

      const panel = controller.getPanel();
      expect(panel.hidden).toBe(true);
    });

    it('should append content if provided', () => {
      const content = document.createElement('div');
      content.textContent = 'Test content';

      const controller = buildTabPanel({
        id: 'themes',
        visible: true,
        content,
      });

      const panel = controller.getPanel();
      expect(panel.contains(content)).toBe(true);
      expect(panel.textContent).toBe('Test content');
    });

    it('should show/hide panel via controller methods', () => {
      const controller = buildTabPanel({
        id: 'themes',
        visible: false,
      });

      const panel = controller.getPanel();
      expect(panel.hidden).toBe(true);

      controller.show();
      expect(panel.hidden).toBe(false);

      controller.hide();
      expect(panel.hidden).toBe(true);
    });

    it('should replace content with setContent', () => {
      const initialContent = document.createElement('div');
      initialContent.textContent = 'Initial';

      const controller = buildTabPanel({
        id: 'themes',
        visible: true,
        content: initialContent,
      });

      const panel = controller.getPanel();
      expect(panel.textContent).toBe('Initial');

      const newContent = document.createElement('div');
      newContent.textContent = 'Updated';
      controller.setContent(newContent);

      expect(panel.textContent).toBe('Updated');
      expect(panel.contains(initialContent)).toBe(false);
      expect(panel.contains(newContent)).toBe(true);
    });

    it('should keep panel hidden when changing content', () => {
      const controller = buildTabPanel({
        id: 'themes',
        visible: false,
      });

      const panel = controller.getPanel();
      expect(panel.hidden).toBe(true);

      const newContent = document.createElement('div');
      newContent.textContent = 'Content';
      controller.setContent(newContent);

      // Panel should remain hidden after content update
      expect(panel.hidden).toBe(true);
    });
  });
});
