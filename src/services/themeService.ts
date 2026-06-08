import { CustomTheme, ThemeId } from '../types';
import { darkenHex, hexWithAlpha, blendHex } from '../utils';

export const BASE_THEMES = [
  { id: 'light', name: 'Claro', color: '#534AB7', icon: 'ti-sun' },
  { id: 'dark', name: 'Escuro', color: '#1A192A', icon: 'ti-moon' },
  { id: 'nature', name: 'Natureza', color: '#2E8550', icon: 'ti-leaf' },
  { id: 'ocean', name: 'Oceano', color: '#0F609B', icon: 'ti-droplet' },
  { id: 'midnight', name: 'Meia-noite', color: '#0D0D1A', icon: 'ti-stars' },
  { id: 'rose', name: 'Rosa', color: '#E8547A', icon: 'ti-heart' },
  { id: 'amber', name: 'Âmbar', color: '#D97B00', icon: 'ti-flame' },
];

export const FONTS = [
  { id: 'system', name: 'Sistema', stack: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', preview: 'Aa Registo' },
  { id: 'inter', name: 'Inter', stack: '"Inter",sans-serif', preview: 'Aa Registo' },
  { id: 'geist', name: 'Geist', stack: '"Geist",sans-serif', preview: 'Aa Registo' },
  { id: 'mono', name: 'Mono', stack: '"JetBrains Mono","Fira Mono",monospace', preview: 'Aa 08:30' },
  { id: 'serif', name: 'Serif', stack: '"Georgia",serif', preview: 'Aa Registo' },
  { id: 'nunito', name: 'Nunito', stack: '"Nunito",sans-serif', preview: 'Aa Registo' },
];

const THEME_KEY = 'tt_theme';
const CUSTOM_CSS_VARS = [
  '--custom-bg',
  '--custom-surface',
  '--custom-surface2',
  '--custom-text1',
  '--custom-text2',
  '--custom-text3',
  '--custom-border',
  '--custom-input-border',
  '--custom-accent',
  '--custom-accent-dark',
  '--custom-accent-light',
];

function applyCustomCSSVars(colors: CustomTheme['colors']) {
  const root = document.documentElement;
  const accentDark = darkenHex(colors.accent, 20);
  const accentLight = hexWithAlpha(colors.accent, 0.12);
  const surface2 = blendHex(colors.bg, colors.surface, 0.5);
  const inputBorder = hexWithAlpha(colors.accent, 0.2);
  const text3 = blendHex(colors.text2, colors.bg, 0.35);

  root.style.setProperty('--custom-bg', colors.bg);
  root.style.setProperty('--custom-surface', colors.surface);
  root.style.setProperty('--custom-surface2', surface2);
  root.style.setProperty('--custom-text1', colors.text);
  root.style.setProperty('--custom-text2', colors.text2);
  root.style.setProperty('--custom-text3', text3);
  root.style.setProperty('--custom-border', colors.border);
  root.style.setProperty('--custom-input-border', inputBorder);
  root.style.setProperty('--custom-accent', colors.accent);
  root.style.setProperty('--custom-accent-dark', accentDark);
  root.style.setProperty('--custom-accent-light', accentLight);
}

export function applyTheme(id: ThemeId, customThemes: CustomTheme[], persist = true): ThemeId {
  const base = BASE_THEMES.find((t) => t.id === id);
  const custom = customThemes.find((t) => t.id === id);

  if (!base && !custom) {
    id = 'light';
  }

  if (custom) {
    document.documentElement.setAttribute('data-theme', 'custom');
    applyCustomCSSVars(custom.colors);
  } else {
    document.documentElement.setAttribute('data-theme', id);
    CUSTOM_CSS_VARS.forEach((p) => document.documentElement.style.removeProperty(p));
  }

  if (persist) {
    localStorage.setItem(THEME_KEY, id);
  }

  return id;
}

export function getSavedTheme(): ThemeId | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(THEME_KEY) as ThemeId | null;
}

export function applyFont(id: string) {
  const font = FONTS.find((x) => x.id === id) || FONTS[0];
  document.body.style.fontFamily = font.stack;
}
