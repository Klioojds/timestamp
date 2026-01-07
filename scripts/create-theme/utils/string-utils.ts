/**
 * Validate and normalize a GitHub username.
 * Strips leading \@ if present and validates the format.
 *
 * @param author - Raw author input (may include \@ prefix)
 * @returns Normalized GitHub username without \@ prefix, or null if empty/invalid
 * @throws Error if username contains invalid characters after normalization
 *
 * @example
 * normalizeAuthor('\@chrisreddington') // 'chrisreddington'
 * normalizeAuthor('chrisreddington')  // 'chrisreddington'
 * normalizeAuthor('')                 // null
 */
export function normalizeAuthor(author: string | undefined): string | null {
  if (!author || author.trim() === '') {
    return null;
  }

  // Strip leading \@ if present
  let normalized = author.trim();
  if (normalized.startsWith('@')) {
    normalized = normalized.slice(1);
  }

  // Validate GitHub username format (alphanumeric and hyphens, 1-39 chars)
  if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(normalized)) {
    throw new Error(
      `Invalid GitHub username: "${normalized}". ` +
      `Usernames must be 1-39 characters, alphanumeric with hyphens (not at start/end).`
    );
  }

  return normalized;
}

/**
 * Convert any string to kebab-case (lowercase with hyphens).
 *
 * @param str - Input string (e.g., "My Theme" or "myTheme")
 * @returns Kebab-case string (e.g., "my-theme")
 *
 * @example
 * toKebabCase('My Theme')  // 'my-theme'
 * toKebabCase('neonGlow')  // 'neonglow'
 */
export function toKebabCase(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

/**
 * Convert kebab-case string to PascalCase for class/function names.
 *
 * @param str - Kebab-case string (e.g., "my-theme")
 * @returns PascalCase string (e.g., "MyTheme")
 *
 * @example
 * toPascalCase('my-theme')  // 'MyTheme'
 * toPascalCase('neon-glow') // 'NeonGlow'
 */
export function toPascalCase(str: string): string {
  return str.split('-').map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1)).join('');
}

/**
 * Convert kebab-case string to snake_case for constant names.
 *
 * @param str - Kebab-case string (e.g., "my-theme")
 * @returns snake_case string (e.g., "my_theme")
 *
 * @example
 * toSnakeCase('my-theme')  // 'my_theme'
 * toSnakeCase('neon-glow') // 'neon_glow'
 */
export function toSnakeCase(str: string): string {
  return str.replace(/-/g, '_');
}

/**
 * Convert kebab-case string to camelCase for variable/function names.
 *
 * @param str - Kebab-case string (e.g., "my-theme")
 * @returns camelCase string (e.g., "myTheme")
 *
 * @example
 * toCamelCase('my-theme')  // 'myTheme'
 * toCamelCase('neon-glow') // 'neonGlow'
 */
export function toCamelCase(str: string): string {
  return str
    .split('-')
    .map((segment, i) => {
      return i === 0
        ? segment
        : segment.charAt(0).toUpperCase() + segment.slice(1);
    })
    .join('');
}
