import { ThemeMode } from '../types';

const THEME_KEY = 'tt_theme';
const DARK_LEGACY = new Set(['dark', 'midnight']);
const darkQuery = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null;

function isDarkHex(hex: string): boolean {
  const h = hex.replace('#', '');
  if (h.length !== 6) return false;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16));
  return 0.299 * r + 0.587 * g + 0.114 * b < 128;
}

export function migrateThemeValue(value: unknown, customThemes?: unknown): ThemeMode {
  if (value === 'light' || value === 'dark' || value === 'system') return value;
  if (typeof value !== 'string' || !value) return 'system';
  if (DARK_LEGACY.has(value)) return 'dark';
  if (value.startsWith('custom') && Array.isArray(customThemes)) {
    const custom = customThemes.find((t: any) => t?.id === value) as any;
    if (custom?.colors?.bg) return isDarkHex(custom.colors.bg) ? 'dark' : 'light';
  }
  if (value === 'custom' || value.startsWith('custom')) {
    try {
      const stored = JSON.parse(localStorage.getItem('tt_custom_themes') || '[]');
      const custom = stored.find((t: any) => t?.id === value);
      if (custom?.colors?.bg) return isDarkHex(custom.colors.bg) ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  }
  return 'light';
}

export function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') return darkQuery?.matches ? 'dark' : 'light';
  return mode;
}

export function applyTheme(mode: ThemeMode) {
  const resolved = resolveTheme(mode);
  document.documentElement.setAttribute('data-theme', resolved);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? '#0F1714' : '#F7F4E9');
  localStorage.setItem(THEME_KEY, mode);
}

export function getSavedTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  return migrateThemeValue(localStorage.getItem(THEME_KEY));
}

export function onSystemThemeChange(cb: () => void) {
  darkQuery?.addEventListener('change', cb);
  return () => darkQuery?.removeEventListener('change', cb);
}

export function cleanupLegacyThemeStorage() {
  ['tt_custom_themes', 'tt_custom_font_enabled', 'tt_custom_font'].forEach((k) => localStorage.removeItem(k));
  document.documentElement.removeAttribute('style');
}
