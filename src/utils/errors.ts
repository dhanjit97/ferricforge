/**
 * Shared error sanitization utilities.
 * Strips stack traces and internal details from error messages
 * before they reach the client.
 */

export function safeError(message: string): string {
  return String(message)
    .replace(/at [^\n]*/g, '')
    .replace(/Error: /g, '')
    .trim() || 'An unexpected error occurred.';
}
