import { createIcon, createIconButton } from '@core/utils/dom';
import { ICON_SIZES } from '@core/utils/dom';
import type { IconName } from '@core/utils/icons';

import { METRIC_DEFINITIONS, OVERLAY_ACTIONS, STAT_DEFINITIONS } from './constants';

/**
 * Performance Overlay View Module
 *
 * DOM template creation and element references for the performance overlay.
 * Extracted from perf-overlay.ts for better separation of concerns.
 *
 * @remarks
 * This module handles:
 * - Creating the overlay DOM structure
 * - Looking up element references
 * - Managing expand/collapse state
 */

/**
 * Element references for the overlay.
 */
export interface OverlayElements {
  container: HTMLDivElement;
  fpsMetric: HTMLElement | null;
  frameMetric: HTMLElement | null;
  domMetric: HTMLElement | null;
  inpMetric: HTMLElement | null;
  statsContainer: HTMLElement | null;
  operationsContainer: HTMLElement | null;
  detailsSection: HTMLElement | null;
  expandButton: HTMLElement | null;
}

function createMetricElement(definition: (typeof METRIC_DEFINITIONS)[number]): HTMLDivElement {
  const metricElement = document.createElement('div');
  metricElement.className = 'perf-overlay__metric';
  metricElement.dataset.metric = definition.key;

  const valueElement = document.createElement('div');
  valueElement.className = 'perf-overlay__metric-value';
  valueElement.textContent = '--';

  const labelElement = document.createElement('div');
  labelElement.className = 'perf-overlay__metric-label';
  labelElement.textContent = definition.label;

  metricElement.append(valueElement, labelElement);
  return metricElement;
}

function createStatElement(key: string, label: string): HTMLDivElement {
  const statElement = document.createElement('div');
  statElement.className = 'perf-overlay__stat';

  const statLabel = document.createElement('div');
  statLabel.className = 'perf-overlay__stat-label';
  statLabel.textContent = label;

  const statValue = document.createElement('div');
  statValue.className = 'perf-overlay__stat-value';
  statValue.dataset.stat = key;
  statValue.textContent = '--';

  statElement.append(statLabel, statValue);
  return statElement;
}

function createControlButton(options: {
  iconName: IconName;
  label: string;
  testId: string;
  action: (typeof OVERLAY_ACTIONS)[keyof typeof OVERLAY_ACTIONS];
}): HTMLButtonElement {
  const icon = createIcon({
    name: options.iconName,
    size: ICON_SIZES.MD as 16,
    label: options.label,
    className: 'perf-overlay__btn-icon',
  });

  const button = createIconButton({
    icon,
    label: options.label,
    testId: options.testId,
    className: 'perf-overlay__btn',
  });

  button.dataset.action = options.action;
  return button;
}

/** Create the overlay DOM structure. */
export function createOverlayDOM(): HTMLDivElement {
  const container = document.createElement('div');
  container.className = 'perf-overlay';
  container.setAttribute('role', 'complementary');
  container.setAttribute('aria-label', 'Performance Monitor');

  const header = document.createElement('div');
  header.className = 'perf-overlay__header';

  const title = document.createElement('span');
  title.className = 'perf-overlay__title';
  title.textContent = 'Performance';

  const controls = document.createElement('div');
  controls.className = 'perf-overlay__controls';

  const clearButton = createControlButton({
    iconName: 'trash',
    label: 'Clear data',
    testId: 'perf-overlay-clear',
    action: OVERLAY_ACTIONS.clear,
  });

  const closeButton = createControlButton({
    iconName: 'x',
    label: 'Close (Ctrl+Shift+P)',
    testId: 'perf-overlay-close',
    action: OVERLAY_ACTIONS.close,
  });

  controls.append(clearButton, closeButton);
  header.append(title, controls);

  const body = document.createElement('div');
  body.className = 'perf-overlay__body';

  const metricsContainer = document.createElement('div');
  metricsContainer.className = 'perf-overlay__metrics';
  METRIC_DEFINITIONS.forEach((definition) => {
    metricsContainer.appendChild(createMetricElement(definition));
  });

  const expandButton = document.createElement('button');
  expandButton.className = 'perf-overlay__expand-btn';
  expandButton.dataset.action = OVERLAY_ACTIONS.toggleDetails;
  expandButton.textContent = '▼ Show Details';

  const details = document.createElement('div');
  details.className = 'perf-overlay__details';

  const statsTitle = document.createElement('div');
  statsTitle.className = 'perf-overlay__section-title';
  statsTitle.textContent = 'FPS Statistics';

  const statsContainer = document.createElement('div');
  statsContainer.className = 'perf-overlay__stats';
  statsContainer.dataset.stats = 'fps';
  STAT_DEFINITIONS.forEach((stat) => {
    statsContainer.appendChild(createStatElement(stat.key, stat.label));
  });

  const operationsTitle = document.createElement('div');
  operationsTitle.className = 'perf-overlay__section-title';
  operationsTitle.textContent = 'Recent Operations';

  const operationsContainer = document.createElement('div');
  operationsContainer.className = 'perf-overlay__operations';
  operationsContainer.dataset.operations = '';

  details.append(statsTitle, statsContainer, operationsTitle, operationsContainer);
  body.append(metricsContainer, expandButton, details);
  container.append(header, body);

  return container;
}

/**
 * Get element references from the overlay container.
 *
 * @param container - The overlay container element
 * @returns Object with element references
 */
export function getOverlayElements(container: HTMLDivElement): OverlayElements {
  return {
    container,
    fpsMetric: container.querySelector('[data-metric="fps"]'),
    frameMetric: container.querySelector('[data-metric="frame"]'),
    domMetric: container.querySelector('[data-metric="dom"]'),
    inpMetric: container.querySelector('[data-metric="inp"]'),
    statsContainer: container.querySelector('[data-stats="fps"]'),
    operationsContainer: container.querySelector('[data-operations]'),
    detailsSection: container.querySelector('.perf-overlay__details'),
    expandButton: container.querySelector('[data-action="toggle-details"]'),
  };
}

/**
 * Update the expand/collapse state of the details section.
 *
 * @param elements - Overlay element references
 * @param expanded - Whether details should be expanded
 */
export function updateExpandState(elements: OverlayElements, expanded: boolean): void {
  if (elements.detailsSection) {
    elements.detailsSection.classList.toggle('is-expanded', expanded);
  }
  if (elements.expandButton) {
    elements.expandButton.textContent = expanded ? '▲ Hide Details' : '▼ Show Details';
  }
}
