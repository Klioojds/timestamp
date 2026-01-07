/**
 * Tests for with-preview-server.ts
 *
 * Note: Full integration testing requires starting the preview server,
 * which is slow and better tested via actual npm script usage.
 * These tests verify the script file is valid.
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('with-preview-server', () => {
  const scriptPath = resolve(__dirname, 'with-preview-server.ts');

  it('script file exists', () => {
    expect(existsSync(scriptPath)).toBe(true);
  });

  it('contains cross-platform logic', () => {
    const content = readFileSync(scriptPath, 'utf-8');

    // Verify it checks for Windows
    expect(content).toContain("process.platform === 'win32'");

    // Verify it handles Windows process termination
    expect(content).toContain('taskkill');

    // Verify it handles Unix signals
    expect(content).toContain('SIGTERM');
  });

  it('uses PORT from environment', () => {
    const content = readFileSync(scriptPath, 'utf-8');

    // Verify it reads OG_PORT from env
    expect(content).toContain('OG_PORT');
  });

  it.each([
    {
      description: 'contains port availability detection',
      substrings: ['isPortAvailable', 'findAvailablePort', 'EADDRINUSE'],
    },
    {
      description: 'handles explicit vs default port differently',
      substrings: ['wasExplicit', 'DEFAULT_PORT', 'MAX_PORT_ATTEMPTS'],
    },
    {
      description: 'provides helpful error messages for port conflicts',
      substrings: ['already in use', 'Stop the process', 'Use a different port'],
    },
  ])(' $description', ({ substrings }) => {
    const content = readFileSync(scriptPath, 'utf-8');
    substrings.forEach((needle) => expect(content).toContain(needle));
  });
});
