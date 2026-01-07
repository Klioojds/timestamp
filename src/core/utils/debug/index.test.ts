import { describe, it, expect, vi, afterEach } from 'vitest';

const importDebug = async () => {
  vi.resetModules();
  return import('./index');
};

describe('debug utilities', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('logs messages when dev mode is enabled', async () => {
    vi.stubEnv('DEV', 'true');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { createDebugLogger, debugLog } = await importDebug();
    const logger = createDebugLogger('[TestModule]');

    logger.log('method', 'message');
    logger.warn('method', 'warn');
    logger.error('method', 'error');
    logger.state('state', { foo: 'bar' });
    debugLog('[TestModule]', 'method', 'inline');

    expect(logSpy).toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
    expect(logger.enabled).toBe(true);
  });

  it('suppresses logging when dev mode is disabled', async () => {
    vi.stubEnv('DEV', '');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { createDebugLogger, debugLog } = await importDebug();
    const logger = createDebugLogger('[TestModule]');

    logger.log('method', 'message');
    logger.warn('method', 'warn');
    logger.error('method', 'error');
    logger.state('state', { foo: 'bar' });
    debugLog('[TestModule]', 'method', 'inline');

    expect(logger.enabled).toBe(false);
    expect(logSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });
});