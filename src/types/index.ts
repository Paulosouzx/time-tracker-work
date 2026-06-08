export interface Entry {
  id: string;
  h: number;
  proj: string;
  date: string; // dd/mm/yyyy
  desc: string;
  link?: string;
  sync?: boolean;
}

export interface Note {
  id: string;
  title: string;
  body: string;
  date: string;
  done?: boolean;
}

export interface Holiday {
  date: string; // dd/mm/yyyy
  name: string;
}

export interface CustomTheme {
  id: string;
  name: string;
  colors: {
    bg: string;
    surface: string;
    accent: string;
    text: string;
    text2: string;
    border: string;
  };
}

export type ThemeId =
  | 'light'
  | 'dark'
  | 'nature'
  | 'ocean'
  | 'midnight'
  | 'rose'
  | 'amber'
  | string; // custom_*

export type TabId = 'reg' | 'dash' | 'hist' | 'notes';