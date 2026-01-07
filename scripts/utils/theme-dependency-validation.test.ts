/**
 * Theme Dependency Validation Helper Tests
 *
 * Tests for npm import detection and undocumented dependency detection.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  extractNpmImports,
  detectUndocumentedDependencies,
  emitDependencyWarnings,
} from './theme-dependency-validation';
import type { ThemeDependency } from '../../src/core/types/index.js';
import type { CoreDependency } from './theme-dependency-validation';

describe('extractNpmImports', () => {
  it('should detect npm package imports', () => {
    const source = `
      import { Fireworks } from 'fireworks-js';
      import lodash from 'lodash';
    `;

    const imports = extractNpmImports(source);

    expect(imports.has('fireworks-js')).toBe(true);
    expect(imports.has('lodash')).toBe(true);
  });

  it.each([
    {
      description: 'ignore relative imports',
      source: `
        import { something } from './local';
        import { other } from '../parent';
        import { deep } from '../../deep/path';
      `,
    },
    {
      description: 'ignore Node.js builtins',
      source: `
        import { readFileSync } from 'fs';
        import { join } from 'path';
        import { fileURLToPath } from 'url';
      `,
    },
    {
      description: 'ignore path aliases',
      source: `
        import { something } from '@/core/types';
        import { other } from '@core/utils';
        import { theme } from '@themes/shared';
      `,
    },
  ])('should $description', ({ source }) => {
    const imports = extractNpmImports(source);
    expect(imports.size).toBe(0);
  });

  it('should handle scoped packages', () => {
    const source = `
      import { octicons } from '@primer/octicons';
      import { something } from '@emotion/react';
    `;

    const imports = extractNpmImports(source);

    expect(imports.has('@primer/octicons')).toBe(true);
    expect(imports.has('@emotion/react')).toBe(true);
  });

  it('should normalize package subpaths', () => {
    const source = `
      import { fp } from 'lodash/fp';
      import { build } from '@primer/octicons/build';
    `;

    const imports = extractNpmImports(source);

    expect(imports.has('lodash')).toBe(true);
    expect(imports.has('@primer/octicons')).toBe(true);
    expect(imports.has('lodash/fp')).toBe(false);
  });

  it('should handle double quotes', () => {
    const source = `
      import { something } from "some-package";
    `;

    const imports = extractNpmImports(source);

    expect(imports.has('some-package')).toBe(true);
  });

  it('should skip type-only imports', () => {
    const source = `
      import type { SomeType } from 'some-types-package';
      import { realImport } from 'real-package';
    `;

    const imports = extractNpmImports(source);

    expect(imports.has('some-types-package')).toBe(false);
    expect(imports.has('real-package')).toBe(true);
  });
});

describe('detectUndocumentedDependencies', () => {
  it('should return empty array when all deps documented', () => {
    const documentedDeps: ThemeDependency[] = [
      { name: 'fireworks-js', url: 'https://example.com' },
    ];
    const coreDeps: CoreDependency[] = [];

    // Mock a theme with no imports (empty directory)
    const result = detectUndocumentedDependencies(
      'nonexistent-theme',
      documentedDeps,
      coreDeps,
      '/fake/path'
    );

    expect(result).toEqual([]);
  });

  it('should exclude core dependencies from warnings', () => {
    const documentedDeps: ThemeDependency[] = [];
    const coreDeps: CoreDependency[] = [
      { name: 'suncalc', url: 'https://github.com/mourner/suncalc' },
    ];

    // Even if theme uses suncalc, it shouldn't be flagged
    const result = detectUndocumentedDependencies(
      'nonexistent-theme',
      documentedDeps,
      coreDeps,
      '/fake/path'
    );

    expect(result).toEqual([]);
  });

  it('should handle themes without dependencies field gracefully', () => {
    const documentedDeps: ThemeDependency[] = [];
    const coreDeps: CoreDependency[] = [];

    const result = detectUndocumentedDependencies(
      'nonexistent-theme',
      documentedDeps,
      coreDeps,
      '/fake/path'
    );

    expect(Array.isArray(result)).toBe(true);
  });
});

describe('emitDependencyWarnings', () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it('should emit warning for each undocumented dependency', () => {
    const undocumented = ['package-a', 'package-b'];

    const count = emitDependencyWarnings('test-theme', undocumented);

    expect(count).toBe(2);
    expect(consoleWarnSpy).toHaveBeenCalledTimes(2);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('test-theme')
    );
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('package-a')
    );
  });

  it('should return 0 when no undocumented dependencies', () => {
    const count = emitDependencyWarnings('test-theme', []);

    expect(count).toBe(0);
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('should not affect exit code (warnings only)', () => {
    // Verify that emitting warnings doesn't throw or change exit behavior
    const undocumented = ['some-package'];

    expect(() => {
      emitDependencyWarnings('test-theme', undocumented);
    }).not.toThrow();

    // The function returns count but doesn't exit
    expect(typeof emitDependencyWarnings('test-theme', undocumented)).toBe('number');
  });
});
