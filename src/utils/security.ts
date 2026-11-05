/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Enterprise-grade client security utilities.
 * Comprehensive defenses against XSS, Prototype Pollution, Path Traversal,
 * Buffer Overflow / Memory Exhaustion, and Malicious Input.
 */

const DANGEROUS_OBJECT_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

const RUST_RESERVED_KEYWORDS = new Set([
  'as', 'break', 'const', 'continue', 'crate', 'else', 'enum', 'extern',
  'false', 'fn', 'for', 'if', 'impl', 'in', 'let', 'loop', 'match',
  'mod', 'move', 'mut', 'pub', 'ref', 'return', 'self', 'Self', 'static',
  'struct', 'super', 'trait', 'true', 'type', 'unsafe', 'use', 'where',
  'while', 'async', 'await', 'dyn'
]);

/**
 * Escape HTML special characters to prevent XSS when rendering user-provided text.
 */
export function htmlEscape(text: string): string {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sanitize file names strictly:
 * Only alphanumeric, underscores, and must end with .rs (or be Cargo.toml).
 * Rejects path traversal (../, \\, /) and control characters.
 */
export function sanitizeFileName(rawName: string): { valid: boolean; sanitized: string; error?: string } {
  if (typeof rawName !== 'string') {
    return { valid: false, sanitized: '', error: 'File name must be a string' };
  }

  let cleaned = rawName.trim().replace(/\0/g, '');

  // Prevent path traversal
  if (cleaned.includes('..') || cleaned.includes('/') || cleaned.includes('\\')) {
    return { valid: false, sanitized: '', error: 'Path traversal characters (.., /, \\) are prohibited' };
  }

  if (cleaned === 'Cargo.toml') {
    return { valid: true, sanitized: 'Cargo.toml' };
  }

  if (!cleaned.endsWith('.rs')) {
    cleaned += '.rs';
  }

  const baseName = cleaned.replace(/\.rs$/, '');
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(baseName)) {
    return {
      valid: false,
      sanitized: '',
      error: 'Module name must start with letter/underscore and contain only alphanumeric/underscore characters',
    };
  }

  if (baseName.length > 32) {
    return { valid: false, sanitized: '', error: 'Module name cannot exceed 32 characters' };
  }

  if (RUST_RESERVED_KEYWORDS.has(baseName)) {
    return { valid: false, sanitized: '', error: `'${baseName}' is a reserved Rust keyword` };
  }

  return { valid: true, sanitized: cleaned };
}

/**
 * Sanitize a code snippet before sending it to an external compiler or processing it.
 * Strips null bytes, limits maximum code size to 250KB, and prevents DoS.
 */
export function sanitizeCodeInput(code: unknown, maxLength = 250000): string | null {
  if (typeof code !== 'string' || code.length === 0) {
    return null;
  }
  if (code.length > maxLength) {
    return null;
  }
  // Strip null bytes
  const cleaned = code.replace(/\0/g, '');
  return cleaned.length === 0 ? null : cleaned;
}

/**
 * Bounds terminal buffer output to prevent browser tab DOM freeze / memory exhaustion.
 * Truncates to maxLines and maxBytes.
 */
export function safeBoundedOutput(raw: string, maxLines = 2500, maxBytes = 150000): string {
  if (!raw) return '';
  let str = raw;
  if (str.length > maxBytes) {
    str = '... [Output truncated to prevent memory exhaustion]\n' + str.slice(-maxBytes);
  }
  const lines = str.split('\n');
  if (lines.length > maxLines) {
    return (
      `... [${lines.length - maxLines} preceding lines omitted to maintain browser stability]\n` +
      lines.slice(-maxLines).join('\n')
    );
  }
  return str;
}

/**
 * Defend against Prototype Pollution when parsing untrusted JSON.
 */
export function safeJsonParse<T>(jsonStr: string, fallback: T): T {
  try {
    const parsed = JSON.parse(jsonStr);
    if (parsed && typeof parsed === 'object') {
      stripPrototypePollution(parsed);
    }
    return parsed as T;
  } catch {
    return fallback;
  }
}

function stripPrototypePollution(obj: Record<string, any>): void {
  for (const key of Object.keys(obj)) {
    if (DANGEROUS_OBJECT_KEYS.has(key)) {
      delete obj[key];
      continue;
    }
    if (obj[key] && typeof obj[key] === 'object') {
      stripPrototypePollution(obj[key]);
    }
  }
}

/**
 * Safely read and parse a value from localStorage with prototype protection.
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
    return safeJsonParse<T>(raw, defaultValue);
  } catch (e) {
    console.warn(`Failed to read localStorage key "${key}":`, e);
    return defaultValue;
  }
}

/**
 * Safely write a value to localStorage.
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
 * Copy text to clipboard safely.
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