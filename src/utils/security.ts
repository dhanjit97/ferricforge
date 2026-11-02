/**
 * Client-side security utilities.
 * Defense-in-depth for localStorage access, XSS prevention, and safe clipboard handling.
 */

/**
 * Escape HTML special characters to prevent XSS when rendering user-provided text.
 * React escapes by default, but this is an additional safeguard for any
 * edge case where text might be inserted into attribute contexts.
 */
export function htmlEscape(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Safely read and parse a value from localStorage.
 * Returns the default value if the key is missing, unparseable, or access is blocked.
 */
export function safeLocalStorageGet<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined' || !window.localStorage) {
    return defaultValue;
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null || raw === undefined) {
      return defaultValue;
    }
    const parsed = JSON.parse(raw);
    return parsed as T;
  } catch (e) {
    console.warn(`Failed to read localStorage key "${key}":`, e);
    return defaultValue;
  }
}

/**
 * Safely write a value to localStorage.
 * Silently fails if access is blocked or quota is exceeded.
 */
export function safeLocalStorageSet<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn(`Failed to write localStorage key "${key}":`, e);
    return false;
  }
}

/**
 * Safely remove a key from localStorage.
 */
export function safeLocalStorageRemove(key: string): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch (e) {
    console.warn(`Failed to remove localStorage key "${key}":`, e);
    return false;
  }
}

/**
 * Sanitize a code snippet before it is sent to an external compiler.
 * Strips null bytes and enforces a maximum length.
 */
export function sanitizeCodeInput(code: unknown, maxLength = 250000): string | null {
  if (typeof code !== 'string' || code.length === 0) {
    return null;
  }
  if (code.length > maxLength) {
    return null;
  }
  // Strip null bytes which can confuse some parsers
  const cleaned = code.replace(/\0/g, '');
  return cleaned.length === 0 ? null : cleaned;
}

/**
 * Copy text to clipboard safely. Never throws.
 */
export async function safeClipboardWrite(text: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    return false;
  }
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    console.warn('Clipboard write failed:', e);
    return false;
  }
}

/**
 * Validate that a URL is same-origin or uses https.
 * Prevents open-redirect style issues if any redirect logic is added later.
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.origin === window.location.origin;
  } catch {
    return false;
  }
}