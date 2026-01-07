/**
 * Validate theme name meets requirements and doesn't conflict with existing themes.
 *
 * Requirements:
 * - Must be kebab-case (lowercase letters, numbers, hyphens)
 * - Must start with a letter
 * - Must not already exist in src/themes/
 *
 * @param name - Theme name to validate
 * @throws Error if validation fails
 */
import fs from 'fs';
import path from 'path';
import { THEMES_DIR } from './registry';

export function validateThemeName(name: string): void {
  if (!name || !/^[a-z][a-z0-9-]*$/.test(name)) {
    throw new Error('Theme name must be kebab-case (e.g., "my-theme")');
  }

  const existingPath = path.join(THEMES_DIR, name);
  if (fs.existsSync(existingPath)) {
    throw new Error(`Theme "${name}" already exists at ${existingPath}`);
  }
}
