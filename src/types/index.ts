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
  updatedAt?: number;
}

export interface Holiday {
  date: string; // dd/mm/yyyy
  name: string;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export type TabId = 'reg' | 'cal' | 'dash' | 'hist' | 'notes' | 'profile';