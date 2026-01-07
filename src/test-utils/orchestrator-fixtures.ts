import { vi } from 'vitest';
import type {
  TimePageRenderer,
  ThemeId,
  ThemeLifecycleState,
  TimeRemaining,
  CountdownConfig,
  WallClockTime,
} from '@/core/types';
import type { AccessibilityManager } from '@/core/utils/accessibility';
import type { StateManager } from '@/core/state';
import type { TimeEventHandlerOptions } from '@/app/orchestrator/time-manager/event-handlers';
import { createChromeController, type ChromeControllerOptions } from '@/app/orchestrator/ui/ui-chrome-visibility-manager';
import { createOrchestrator } from '@/app/orchestrator';
import type { ThemeTransitionOptions } from '@/app/orchestrator/theme-manager/theme-switcher';
import type { TimezoneManager } from '@/app/orchestrator/time-manager/timezone-state-manager';
import { createSafeMessageFromText } from '@/core/utils/text';
import {
  createMockTimePageRenderer,
  createTestContainer,
  removeTestContainer,
  mockMatchMedia,
  mockRequestAnimationFrame,
  cleanupOrchestratorDom,
} from './theme-test-helpers';
import { cleanupDOM, captureOverflow } from './dom-helpers';
import type { UIComponents } from '@/app/orchestrator/ui/ui-factory';

type AppState = ReturnType<StateManager['getState']>;

export interface CountdownHandlersFixture {
  container: HTMLElement;
  options: TimeEventHandlerOptions;
  mocks: {
    theme: TimePageRenderer;
    stateManager: StateManager;
    accessibilityManager: AccessibilityManager;
    timezoneManager: TimezoneManager | null;
    celebrationDisplay: { text: string; fullMessage: string };
  };
  cleanup: () => void;
}

export function createCountdownHandlersFixture(
  overrides: Partial<TimeEventHandlerOptions> & {
    celebrationState?: 'counting' | 'celebrating' | 'celebrated';
    completionMessage?: string;
    targetDate?: Date;
    timezone?: string;
  } = {}
): CountdownHandlersFixture {
  const container = createTestContainer('countdown-handlers-fixture');
  const theme = createMockTimePageRenderer();

  const stateManager: StateManager = {
    getState: vi.fn(() => ({ isComplete: false } as AppState)),
    setTheme: vi.fn(),
    setTimezone: vi.fn(),
    setTargetDate: vi.fn(),
    setComplete: vi.fn(),
    setCountdownMode: vi.fn(),
    setCompletionMessage: vi.fn(),
    setDurationSeconds: vi.fn(),
    getCelebrationState: vi.fn(() => overrides.celebrationState ?? 'counting'),
    setCelebrationState: vi.fn(),
    hasCelebrated: vi.fn(() => false),
    markCelebrated: vi.fn(),
    resetCelebration: vi.fn(),
    subscribe: vi.fn(() => vi.fn()),
    destroy: vi.fn(),
  } as unknown as StateManager;

  const accessibilityManager: AccessibilityManager = {
    init: vi.fn(),
    destroy: vi.fn(),
    announceLoaded: vi.fn(),
    announceThemeChange: vi.fn(),
    announceCelebration: vi.fn(),
    announceCountdown: vi.fn(),
  };

  const timezoneManager: TimezoneManager | null = overrides.getTimezoneManager
    ? null
    : {
        getTargetDate: () => overrides.targetDate ?? new Date(2026, 0, 1),
        getCurrentTimezone: () => overrides.timezone ?? 'America/New_York',
        getWallClockTarget: () => ({
          year: 2026,
          month: 0,
          day: 1,
          hours: 0,
          minutes: 0,
          seconds: 0,
        }),
        setTimezone: vi.fn(),
      } as unknown as TimezoneManager;

  const celebrationDisplay = {
    message: createSafeMessageFromText(
      overrides.completionMessage ? overrides.completionMessage.toUpperCase() : 'DONE!'
    ),
    fullMessage: overrides.completionMessage ?? 'Done!',
  };

  const options: TimeEventHandlerOptions = {
    container,
    getCurrentTheme: () => theme,
    getCurrentThemeId: () => 'contribution-graph',
    stateManager,
    accessibilityManager,
    getTimezoneManager: () => timezoneManager,
    initialTimezone: overrides.timezone ?? 'America/New_York',
    config: overrides.config ?? ({ completionMessage: overrides.completionMessage } as CountdownConfig | undefined),
    getCelebrationDisplay: overrides.getCelebrationDisplay ?? (() => celebrationDisplay),
    ...overrides,
  };

  const cleanup = (): void => {
    removeTestContainer(container);
    cleanupDOM();
    vi.useRealTimers();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  };

  return {
    container,
    options,
    mocks: {
      theme,
      stateManager,
      accessibilityManager,
      timezoneManager,
      celebrationDisplay,
    },
    cleanup,
  };
}

export interface ThemeTransitionFixture {
  container: HTMLElement;
  options: ThemeTransitionOptions;
  mocks: {
    currentTheme: TimePageRenderer;
    newTheme: TimePageRenderer;
    setCurrentTheme: ReturnType<typeof vi.fn>;
  };
  cleanup: () => void;
}

export function createThemeTransitionFixture(
  overrides: Partial<ThemeTransitionOptions> & {
    themeId?: ThemeId;
    wallClockTarget?: WallClockTime;
    lastTime?: TimeRemaining;
  } = {}
): ThemeTransitionFixture {
  const container = createTestContainer('theme-transition-fixture');
  const currentTheme = createMockTimePageRenderer();
  const newTheme = createMockTimePageRenderer();

  let currentThemeId: ThemeId = overrides.themeId ?? 'contribution-graph';
  const setCurrentTheme = vi.fn((theme: TimePageRenderer, id: ThemeId) => {
    currentThemeId = id;
  });

  const options: ThemeTransitionOptions = {
    container,
    getCurrentTheme: () => currentTheme,
    setCurrentTheme,
    getCurrentThemeId: () => currentThemeId,
    getLastTime: () =>
      overrides.lastTime ?? ({ days: 5, hours: 3, minutes: 30, seconds: 15, total: 500000000 } as TimeRemaining),
    isComplete: () => false,
    loadTheme: vi.fn(() => Promise.resolve(newTheme)),
    loadThemeConfig: vi.fn(() =>
      Promise.resolve({
        id: 'fireworks',
        name: 'Fireworks',
        description: 'Test theme',
        optionalComponents: {},
      })
    ),
    getCelebrationDisplay: () => ({ 
      message: createSafeMessageFromText('2026'), 
      fullMessage: 'Happy New Year 2026!' 
    }),
    announceThemeChange: vi.fn(),
    setLastAriaLabel: vi.fn(),
    setThemeInState: vi.fn(),
    config: {
      mode: 'wall-clock',
      targetDate: overrides.config?.targetDate ?? new Date(2026, 0, 1),
      theme: currentThemeId,
      timezone: 'America/New_York',
      ...(overrides.config as CountdownConfig),
    },
    getCurrentTimezone: () => overrides.config?.timezone ?? 'America/New_York',
    getWallClockTarget: () => overrides.wallClockTarget ?? new Date(2026, 0, 1),
    getTargetDate: () => overrides.config?.targetDate ?? new Date(2026, 0, 1),
    getMountContext: () => ({ reducedMotion: false }),
    onThemeSwitchComplete: vi.fn(),
    ...overrides,
  };

  const cleanup = (): void => {
    removeTestContainer(container);
    cleanupDOM();
    vi.useRealTimers();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  };

  return {
    container,
    options,
    mocks: { currentTheme, newTheme, setCurrentTheme },
    cleanup,
  };
}

export interface ChromeControllerFixture {
  container: HTMLElement;
  controller: ReturnType<typeof createChromeController>;
  uiComponents: UIComponents;
  options: ChromeControllerOptions;
  cleanup: () => void;
}

export function createChromeControllerFixture(
  overrides: Partial<ChromeControllerOptions> & { autoInit?: boolean } = {}
): ChromeControllerFixture {
  const container = createTestContainer('chrome-controller-fixture');
  const options: ChromeControllerOptions = {
    container,
    mode: 'wall-clock',
    hasBackButton: true,
    showWorldMap: true,
    ...overrides,
  };

  const uiComponents: UIComponents = {
    buttonContainer: document.createElement('div'),
    timezoneSelector: {
      getElement: () => document.createElement('div'),
      setTimezone: vi.fn(),
      getTimezone: vi.fn(() => 'UTC'),
      setVisible: vi.fn(),
      destroy: vi.fn(),
      setThemeStyles: vi.fn(),
    },
    worldMap: {
      getElement: () => document.createElement('div'),
      setTimezone: vi.fn(),
      setVisible: vi.fn(),
      destroy: vi.fn(),
      setThemeStyles: vi.fn(),
    },
    share: undefined,
    favoriteButton: undefined,
    githubButton: undefined,
    offlineIndicator: undefined,
    themeSwitcher: undefined,
    backButton: undefined,
  };

  const controller = createChromeController(options);
  if (overrides.autoInit ?? true) {
    controller.init(uiComponents);
  }

  const cleanup = (): void => {
    controller.destroy();
    removeTestContainer(container);
    cleanupDOM();
    vi.useRealTimers();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  };

  return { container, controller, uiComponents, options, cleanup };
}

/**
 * @deprecated Use createChromeControllerFixture instead
 */
export const createChromeManagerFixture = createChromeControllerFixture;

export interface DomSetupFixture {
  container: HTMLElement;
  accessibilityManager: AccessibilityManager;
  restoreOverflow: () => void;
  cleanup: () => void;
}

export function createDomSetupFixture(): DomSetupFixture {
  const container = createTestContainer('dom-setup-fixture');
  const restoreOverflow = captureOverflow();

  const accessibilityManager: AccessibilityManager = {
    init: vi.fn(),
    destroy: vi.fn(),
    announceLoaded: vi.fn(),
    announceThemeChange: vi.fn(),
    announceCelebration: vi.fn(),
  };

  const cleanup = (): void => {
    restoreOverflow();
    removeTestContainer(container);
    cleanupDOM();
    document.documentElement.style.cssText = '';
    document.body.style.cssText = '';
    vi.useRealTimers();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  };

  return { container, accessibilityManager, restoreOverflow, cleanup };
}

// =============================================================================
// Orchestrator harness helpers
// =============================================================================

export type ThemeInstanceMap = Partial<Record<ThemeId, TimePageRenderer & { _state: ThemeLifecycleState }>>;

/**
 * Create an empty theme instance map for orchestrator tests.
 *
 * @returns Mutable map keyed by theme ID used to track mounted mock controllers
 */
export function createThemeInstanceMap(): ThemeInstanceMap {
  return {};
}

/**
 * Build mock theme controller with lifecycle state tracking.
 * @param id - Theme identifier
 * @param themeInstances - Map to store constructed controller
 * @returns Mocked TimePageRenderer with state tracking
 */
export function buildMockTheme(
  id: ThemeId,
  themeInstances: ThemeInstanceMap
): TimePageRenderer & { _state: ThemeLifecycleState } {
  let state: ThemeLifecycleState = 'CREATED';
  let container: HTMLElement | null = null;
  // NOTE: Use let to avoid TDZ in callbacks (assigned after baseController creation)
  // eslint-disable-next-line prefer-const
  let controller: TimePageRenderer & { _state: ThemeLifecycleState };

  const handles = {
    intervals: [] as number[],
    timeouts: [] as number[],
    rafs: [] as number[],
    observers: [] as { disconnect: () => void }[],
    listeners: [] as { remove: () => void }[],
  };

  const setState = (nextState: ThemeLifecycleState): void => {
    state = nextState;
    if (controller) {
      controller._state = nextState;
    }
  };

  const baseController = createMockTimePageRenderer({
    mount: (containerEl: HTMLElement) => {
      container = containerEl;
      setState('MOUNTED');
      const button = document.createElement('button');
      button.textContent = `${id}-focusable`;
      button.setAttribute('data-theme-button', id);
      container.appendChild(button);
    },
    destroy: async () => {
      setState('DESTROYED');
      if (container) {
        container.innerHTML = '';
      }
    },
    updateContainer: (newContainer: HTMLElement) => {
      container = newContainer;
    },
    updateTime: vi.fn((_time: TimeRemaining) => {
      if (state === 'MOUNTED') {
        setState('ACTIVE');
      }
    }),
    onReducedMotionChange: vi.fn(),
    onCounting: vi.fn(() => {
      setState('ACTIVE');
    }),
    onCelebrating: vi.fn(() => {
      setState('CELEBRATING');
    }),
    onCelebrated: vi.fn(() => {
      setState('CELEBRATING');
    }),
    getResourceTracker: () => handles,
  });

  controller = baseController as TimePageRenderer & { _state: ThemeLifecycleState };
  controller._state = state;

  themeInstances[id] = controller;
  return controller;
}

interface OrchestratorHarnessOptions {
  containerId?: string;
  initialTheme?: ThemeId;
  config?: Parameters<typeof createOrchestrator>[0]['config'];
  useRealTimers?: boolean;
}

type OrchestratorHarness = ReturnType<typeof createOrchestratorHarness>;

/**
 * Lightweight orchestrator harness for unit tests.
 * - Defaults to fake timers unless `useRealTimers` is true.
 * - Always mounts into a fresh DOM container; caller must await cleanup.
 */
function createOrchestratorHarness(options: OrchestratorHarnessOptions = {}) {
  const container = createTestContainer(options.containerId ?? 'orchestrator-container');
  const themeInstances = createThemeInstanceMap();

  const rafMock = mockRequestAnimationFrame();
  const matchMediaMock = mockMatchMedia();

  if (!options.useRealTimers) {
    vi.useFakeTimers();
  }

  const orchestrator = createOrchestrator({
    container,
    initialTheme: options.initialTheme,
    config: options.config,
  });

  const advanceTimers = (ms: number): void => {
    if (!options.useRealTimers) {
      vi.advanceTimersByTime(ms);
    }
  };

  const start = async (): Promise<void> => {
    await orchestrator.start();
  };

  const cleanup = async (): Promise<void> => {
    await orchestrator.destroy();
    cleanupOrchestratorDom();
    removeTestContainer(container);
    rafMock.restore();
    matchMediaMock.restore();
    if (!options.useRealTimers) {
      vi.useRealTimers();
    }
    vi.restoreAllMocks();
  };

  return {
    orchestrator,
    container,
    themeInstances,
    advanceTimers,
    start,
    cleanup,
  };
}

export interface OrchestratorTestHarness extends OrchestratorHarness {
  /**
   * Auto-start helper to mirror the common arrange/act/cleanup flow in orchestrator tests.
   */
  startAndCleanup: (run: (harness: OrchestratorHarness) => Promise<void> | void) => Promise<void>;
}

/**
 * Create orchestrator harness with built-in start/cleanup helper.
 * @returns Harness plus startAndCleanup helper for one-shot execution
 */
export function createOrchestratorTestHarness(
  options: OrchestratorHarnessOptions = {}
): OrchestratorTestHarness {
  const harness = createOrchestratorHarness(options);

  const startAndCleanup = async (
    run: (innerHarness: OrchestratorHarness) => Promise<void> | void
  ): Promise<void> => {
    try {
      await harness.start();
      await run(harness);
    } finally {
      await harness.cleanup();
    }
  };

  return { ...harness, startAndCleanup };
}

/**
 * Create, start, run, and cleanup orchestrator harness.
 * @returns Promise that resolves after cleanup
 */
async function withOrchestratorHarness(
  run: (harness: OrchestratorHarness) => Promise<void> | void,
  options: OrchestratorHarnessOptions = {}
): Promise<void> {
  const harness = createOrchestratorHarness(options);
  try {
    await harness.start();
    await run(harness);
  } finally {
    await harness.cleanup();
  }
}
