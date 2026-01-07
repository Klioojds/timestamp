/**
 * Safe message handling for untrusted user input.
 *
 * @remarks
 * Themes receive SafeMessage objects, NOT raw strings. This ensures:
 * - XSS protection is handled upstream, themes don't need to think about it
 * - Both textContent and innerHTML usage are safe
 * - Type system guides correct usage
 */

/** Maximum length for user messages. */
export const MAX_MESSAGE_LENGTH = 200;

/**
 * A message that has been sanitized for safe rendering.
 *
 * @remarks
 * Themes should use:
 * - `forTextContent` when setting element.textContent (plain text)
 * - `forInnerHTML` when setting element.innerHTML (HTML-escaped)
 *
 * Both are safe for XSS - the difference is display fidelity:
 * - forTextContent: `Time's up!` displays as `Time's up!`
 * - forInnerHTML: `Time's up!` displays as `Time's up!` (via &#39;)
 */
export interface SafeMessage {
  /** Plain text for textContent - safe because textContent doesn't parse HTML. */
  readonly forTextContent: string;
  /** HTML-escaped string for innerHTML - safe because characters are escaped. */
  readonly forInnerHTML: string;
}

/**
 * Escape HTML special characters.
 * @internal
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Decode URL-encoded string, handling malformed encoding gracefully.
 * @internal
 */
function decodeUrlSafe(encoded: string): string {
  try {
    return decodeURIComponent(encoded);
  } catch {
    return encoded;
  }
}

/**
 * Create a SafeMessage from a URL-encoded untrusted string.
 * @param urlEncodedMessage - URL-encoded message (e.g., from ?message= parameter)
 * @returns SafeMessage with both textContent and innerHTML-safe versions
 * @public
 *
 * @example
 * ```typescript
 * // From URL: ?message=Time%27s%20up%21
 * const msg = createSafeMessage("Time%27s%20up%21");
 * element.textContent = msg.forTextContent; // "Time's up!"
 * element.innerHTML = msg.forInnerHTML;     // "Time&#39;s up!"
 * ```
 */
export function createSafeMessage(urlEncodedMessage: string): SafeMessage {
  // 1. Decode URL encoding
  const decoded = decodeUrlSafe(urlEncodedMessage);

  // 2. Truncate to max length
  const truncated = decoded.slice(0, MAX_MESSAGE_LENGTH);

  // 3. Create both safe versions
  return Object.freeze({
    forTextContent: truncated,
    forInnerHTML: escapeHtml(truncated),
  });
}

/**
 * Create a SafeMessage from already-decoded plain text.
 * @param plainText - Plain text (not URL-encoded)
 * @returns SafeMessage
 * @public
 */
export function createSafeMessageFromText(plainText: string): SafeMessage {
  const truncated = plainText.slice(0, MAX_MESSAGE_LENGTH);
  return Object.freeze({
    forTextContent: truncated,
    forInnerHTML: escapeHtml(truncated),
  });
}

/** Default celebration message. */
export const DEFAULT_SAFE_MESSAGE: SafeMessage = Object.freeze({
  forTextContent: 'Happy New Year!',
  forInnerHTML: 'Happy New Year!',
});
