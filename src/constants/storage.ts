/**
 * Centralized localStorage keys to avoid magic strings
 * scattered across the codebase.
 */

export const STORAGE_KEYS = {
  USER_PROGRESS: 'ferrisforge_user_progress',
  THEME: 'ferrisforge_theme',
  APP_THEME: 'ferrisforge_app_theme',
  LAYOUT_MODE: 'ferrisforge_layout_mode',
} as const;
