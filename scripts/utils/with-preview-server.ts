#!/usr/bin/env npx tsx
// Stryker disable all: Script file content is tested via file content assertions

/**
 * Cross-Platform Preview Server Helper
 *
 * Starts Vite preview server, runs a script, then cleans up.
 * Works on Windows, macOS, and Linux.
 *
 * Usage:
 *   npx tsx scripts/with-preview-server.ts <script-path> [script-args...]
 *
 * Environment Variables:
 *   OG_PORT - Specify a port (default: 5173, auto-finds available port)
 *
 * Example:
 *   npx tsx scripts/with-preview-server.ts scripts/generate-og-images.ts
 *   npx tsx scripts/with-preview-server.ts scripts/generate-theme-previews.ts --theme=fireworks
 *   OG_PORT=3000 npx tsx scripts/with-preview-server.ts scripts/generate-og-images.ts
 */

import { spawn, ChildProcess } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { createServer } from 'node:net';

// =============================================================================
// Configuration
// =============================================================================

const DEFAULT_PORT = 5173;
const MAX_PORT_ATTEMPTS = 10;
const STARTUP_DELAY_MS = 3000;
const MAX_WAIT_MS = 30000;
const POLL_INTERVAL_MS = 500;

// =============================================================================
// Port Detection
// =============================================================================

/**
 * Check if a port is available by attempting to bind to it.
 * Uses Node.js net.Server to test port availability.
 *
 * @param port - Port number to check (1-65535)
 * @returns Promise resolving to true if available, false if in use or error
 */
function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();

    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        // Other errors - assume port is not available
        resolve(false);
      }
    });

    server.once('listening', () => {
      server.close(() => {
        resolve(true);
      });
    });

    server.listen(port, '127.0.0.1');
  });
}

/**
 * Find an available port by sequentially testing a range.
 * Starts at startPort and increments until finding an available port.
 *
 * @param startPort - Port to start searching from
 * @param maxAttempts - Maximum number of ports to test
 * @returns Available port number, or null if none found in range
 */
async function findAvailablePort(startPort: number, maxAttempts: number): Promise<number | null> {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i;
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  return null;
}

/**
 * Resolve the port to use for the preview server.
 * Handles both explicit port requests (OG_PORT env var) and auto-selection.
 *
 * Behavior:
 * - If OG_PORT is set: Validate it's available or exit with error
 * - If default port: Auto-find available port or exit with error
 *
 * @returns Object with port number, base URL, and wasExplicit flag
 * @throws Never throws - uses process.exit(1) on validation failure
 */
async function resolvePort(): Promise<{ port: number; baseUrl: string; wasExplicit: boolean }> {
  const envPort = process.env.OG_PORT;
  const wasExplicit = !!envPort;
  const requestedPort = envPort ? parseInt(envPort, 10) : DEFAULT_PORT;

  if (wasExplicit) {
    // User explicitly requested this port - check if available
    const available = await isPortAvailable(requestedPort);
    if (!available) {
      console.error(`❌ Port ${requestedPort} is already in use.`);
      console.error('');
      console.error('Options:');
      console.error(`  1. Stop the process using port ${requestedPort}`);
      console.error('  2. Use a different port: OG_PORT=3001 npm run generate:previews');
      console.error('  3. Remove OG_PORT to auto-select an available port');
      process.exit(1);
    }
    return {
      port: requestedPort,
      baseUrl: `http://localhost:${requestedPort}`,
      wasExplicit: true,
    };
  }

  // Default port - try to find an available one
  const available = await isPortAvailable(requestedPort);
  if (available) {
    return {
      port: requestedPort,
      baseUrl: `http://localhost:${requestedPort}`,
      wasExplicit: false,
    };
  }

  // Default port in use, find alternative
  console.log(`⚠️  Default port ${requestedPort} is in use, searching for alternative...`);
  const alternativePort = await findAvailablePort(requestedPort + 1, MAX_PORT_ATTEMPTS);

  if (!alternativePort) {
    console.error(`❌ Could not find an available port (tried ${requestedPort}-${requestedPort + MAX_PORT_ATTEMPTS})`);
    console.error('');
    console.error('Try stopping other development servers or specify a port:');
    console.error('  OG_PORT=3001 npm run generate:previews');
    process.exit(1);
  }

  console.log(`✅ Using port ${alternativePort} instead`);
  return {
    port: alternativePort,
    baseUrl: `http://localhost:${alternativePort}`,
    wasExplicit: false,
  };
}

// =============================================================================
// Server Management
// =============================================================================

/**
 * Start Vite preview server as a background process.
 * Spawns npx vite preview with --strictPort to prevent port conflicts.
 *
 * @param port - Port number for the server
 * @returns ChildProcess instance for the running server
 */
function startPreviewServer(port: number): ChildProcess {
  const isWindows = process.platform === 'win32';

  // Use npx to run vite, works cross-platform
  const command = isWindows ? 'npx.cmd' : 'npx';
  const args = ['vite', 'preview', '--port', String(port), '--strictPort'];

  const server = spawn(command, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: isWindows, // Use shell on Windows for better compatibility
    env: { ...process.env, OG_PORT: String(port) },
  });

  // Log server output for debugging (but don't clutter console)
  server.stdout?.on('data', (data: Buffer) => {
    const line = data.toString().trim();
    if (line.includes('Local:') || line.includes('ready')) {
      console.log(`  [preview] ${line}`);
    }
  });

  server.stderr?.on('data', (data: Buffer) => {
    const line = data.toString().trim();
    // Filter out the "port in use" error since we pre-check
    if (!line.includes('Port') || !line.includes('already in use')) {
      console.error(`  [preview] ${line}`);
    }
  });

  return server;
}

/**
 * Wait for preview server to become ready by polling HTTP endpoint.
 * Retries for up to MAX_WAIT_MS with POLL_INTERVAL_MS between attempts.
 *
 * @param baseUrl - Base URL to poll (e.g., http://localhost:5173)
 * @returns Promise resolving to true if server ready, false if timeout
 */
async function waitForServer(baseUrl: string): Promise<boolean> {
  const startTime = Date.now();

  // Initial delay to let server start
  await delay(STARTUP_DELAY_MS);

  while (Date.now() - startTime < MAX_WAIT_MS) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) {
        return true;
      }
    } catch {
      // Server not ready yet, continue polling
    }
    await delay(POLL_INTERVAL_MS);
  }

  return false;
}

/**
 * Gracefully stop the preview server process.
 * Uses SIGTERM on Unix and taskkill on Windows for clean shutdown.
 *
 * @param server - ChildProcess instance to terminate
 */
function stopServer(server: ChildProcess): void {
  if (server.killed || server.exitCode !== null) {
    return; // Already stopped
  }

  // Try graceful shutdown first
  const isWindows = process.platform === 'win32';
  if (isWindows) {
    // On Windows, use taskkill for the process tree
    spawn('taskkill', ['/pid', String(server.pid), '/f', '/t'], {
      stdio: 'ignore',
    });
  } else {
    // On Unix, send SIGTERM
    server.kill('SIGTERM');

    // If still running after 2 seconds, force kill
    setTimeout(() => {
      if (!server.killed && server.exitCode === null) {
        server.kill('SIGKILL');
      }
    }, 2000);
  }
}

// =============================================================================
// Script Execution
// =============================================================================

/**
 * Run the target script with provided arguments.
 * Spawns npx tsx to execute TypeScript scripts directly.
 *
 * @param scriptPath - Path to the script to execute
 * @param args - Command-line arguments to pass to the script
 * @param port - Port number (set in OG_PORT env var for the script)
 * @returns Promise resolving to the script's exit code
 */
async function runScript(scriptPath: string, args: string[], port: number): Promise<number> {
  return new Promise((resolve) => {
    const isWindows = process.platform === 'win32';
    const command = isWindows ? 'npx.cmd' : 'npx';

    const child = spawn(command, ['tsx', scriptPath, ...args], {
      stdio: 'inherit',
      shell: isWindows,
      env: { ...process.env, OG_PORT: String(port) },
    });

    child.on('close', (code) => {
      resolve(code ?? 1);
    });

    child.on('error', (err) => {
      console.error(`Failed to run script: ${err.message}`);
      resolve(1);
    });
  });
}

// =============================================================================
// Main
// =============================================================================

/**
 * Main entry point for preview server wrapper.
 * Coordinates port resolution, server startup, script execution, and cleanup.
 *
 * @throws Never throws - uses process.exit() for all error conditions
 */
async function main(): Promise<void> {
  const [, , scriptPath, ...scriptArgs] = process.argv;

  if (!scriptPath) {
    console.error('Usage: npx tsx scripts/with-preview-server.ts <script-path> [args...]');
    console.error('');
    console.error('Example:');
    console.error('  npx tsx scripts/with-preview-server.ts scripts/generate-og-images.ts');
    console.error('  npx tsx scripts/with-preview-server.ts scripts/generate-theme-previews.ts --theme=fireworks');
    console.error('');
    console.error('Environment Variables:');
    console.error('  OG_PORT - Specify exact port (error if in use)');
    console.error('           Without OG_PORT, auto-selects available port');
    process.exit(1);
  }

  // Check port availability before starting server
  console.log('🔍 Checking port availability...');
  const { port, baseUrl } = await resolvePort();

  console.log(`📦 Starting preview server on port ${port}...`);
  const server = startPreviewServer(port);

  // Ensure cleanup on unexpected exit
  const cleanup = () => {
    stopServer(server);
  };
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', cleanup);

  try {
    console.log(`⏳ Waiting for server at ${baseUrl}...`);
    const isReady = await waitForServer(baseUrl);

    if (!isReady) {
      console.error('❌ Preview server failed to start within timeout');
      stopServer(server);
      process.exit(1);
    }

    console.log('✅ Server ready');
    console.log(`🚀 Running: ${scriptPath} ${scriptArgs.join(' ')}`);
    console.log('');

    const exitCode = await runScript(scriptPath, scriptArgs, port);

    console.log('');
    console.log('🧹 Stopping preview server...');
    stopServer(server);

    process.exit(exitCode);
  } catch (error) {
    console.error('❌ Error:', error);
    stopServer(server);
    process.exit(1);
  }
}

main();
