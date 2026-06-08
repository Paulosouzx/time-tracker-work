import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../supabase/supabaseClient';
import { Entry, Note, Holiday, CustomTheme, ThemeId, TabId } from '../types';
import { loadJson, loadBool, loadString } from '../services/localStorageService';
import {
  BASE_THEMES,
  FONTS,
  applyTheme as applyThemeService,
  applyFont as applyFontService,
  getSavedTheme,
} from '../services/themeService';
import {
  loadAppData,
  saveEntriesToSupabase,
  saveNotesToSupabase,
  savePrefsToSupabase,
  PrefsPayload,
} from '../services/supabaseService';

const THEME_KEY = 'tt_theme';

export { BASE_THEMES, FONTS };

interface AppContextType {
  currentUser: User | null;
  authReady: boolean;
  entries: Entry[];
  notes: Note[];
  holidays: Holiday[];
  setEntries: React.Dispatch<React.SetStateAction<Entry[]>>;
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  setHolidays: React.Dispatch<React.SetStateAction<Holiday[]>>;
  saveEntries: (updated: Entry[]) => void;
  saveNotes: (updated: Note[]) => void;
  saveHolidays: (updated: Holiday[]) => void;

  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;

  showSync: boolean;
  setShowSync: React.Dispatch<React.SetStateAction<boolean>>;
  showNotesDone: boolean;
  setShowNotesDone: React.Dispatch<React.SetStateAction<boolean>>;
  notesCollapsed: boolean;
  setNotesCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  showHolidays: boolean;
  setShowHolidays: React.Dispatch<React.SetStateAction<boolean>>;
  userName: string;
  setUserName: React.Dispatch<React.SetStateAction<string>>;
  floatStruckNotes: string[];
  setFloatStruckNotes: React.Dispatch<React.SetStateAction<string[]>>;
  noteOrder: string[] | null;
  setNoteOrder: React.Dispatch<React.SetStateAction<string[] | null>>;
  selectedHolidayCountry: string;
  setSelectedHolidayCountry: React.Dispatch<React.SetStateAction<string>>;
  selectedHolidaySubdivision: string;
  setSelectedHolidaySubdivision: React.Dispatch<React.SetStateAction<string>>;
  currentTheme: ThemeId;
  customThemes: CustomTheme[];
  applyTheme: (id: ThemeId) => void;
  addCustomTheme: (theme: CustomTheme) => void;
  deleteCustomTheme: (id: string) => void;
  customFontEnabled: boolean;
  setCustomFontEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  customFont: string;
  applyFont: (id: string) => void;
  savePrefs: () => void;
}

const AppContext = createContext<AppContextType>(null!);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [entries, setEntries] = useState<Entry[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>(() => loadJson('tt_holidays', []));

  const [showSync, setShowSync] = useState(() => loadBool('tt_show_sync'));
  const [showNotesDone, setShowNotesDone] = useState(() => loadBool('tt_notes_done'));
  const [notesCollapsed, setNotesCollapsed] = useState(() => loadBool('tt_notes_collapsed'));
  const [showHolidays, setShowHolidays] = useState(() => loadBool('tt_show_holidays'));
  const [userName, setUserName] = useState(() => loadString('tt_user_name'));
  const [floatStruckNotes, setFloatStruckNotes] = useState<string[]>(() => loadJson('tt_float_struck', []));
  const [noteOrder, setNoteOrder] = useState<string[] | null>(() => loadJson('tt_note_order', null));
  const [selectedHolidayCountry, setSelectedHolidayCountry] = useState(() => loadString('tt_holiday_country'));
  const [selectedHolidaySubdivision, setSelectedHolidaySubdivision] = useState(() => loadString('tt_holiday_subdivision'));

  const [currentTheme, setCurrentTheme] = useState<ThemeId>(() => getSavedTheme() || 'light');
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>(() => loadJson('tt_custom_themes', []));

  const [customFontEnabled, setCustomFontEnabled] = useState(() => loadBool('tt_custom_font_enabled'));
  const [customFont, setCustomFont] = useState(() => loadString('tt_custom_font', 'system'));

  const [activeTab, setActiveTab] = useState<TabId>('reg');

  const saveEntriesTimer = useRef<ReturnType<typeof setTimeout>>();
  const saveNotesTimer = useRef<ReturnType<typeof setTimeout>>();
  const savePrefsTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: any, session: Session | null) => {
      if (session?.user) {
        setCurrentUser(session.user);
        await loadFromSupabase(session.user.id);
      } else {
        setCurrentUser(null);
      }
      setAuthReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function loadFromSupabase(uid: string) {
    try {
      const { entries: entriesData, notes: notesData, prefs } = await loadAppData(uid);

      setEntries(entriesData);
      setNotes(notesData);

      if (prefs) {
        if (prefs.theme) { applyTheme(prefs.theme, false); }
        if (prefs.userName !== undefined) setUserName(prefs.userName);
        if (prefs.showSync !== undefined) setShowSync(prefs.showSync);
        if (prefs.showNotesDone !== undefined) setShowNotesDone(prefs.showNotesDone);
        if (prefs.notesCollapsed !== undefined) setNotesCollapsed(prefs.notesCollapsed);
        if (prefs.showHolidays !== undefined) setShowHolidays(prefs.showHolidays);
        if (prefs.customThemes !== undefined) setCustomThemes(prefs.customThemes as CustomTheme[]);
        if (prefs.customFontEnabled !== undefined) setCustomFontEnabled(prefs.customFontEnabled);
        if (prefs.customFont !== undefined) { setCustomFont(prefs.customFont); applyFontService(prefs.customFont); }
        if (prefs.noteOrder !== undefined) setNoteOrder(prefs.noteOrder);
        if (prefs.holidays !== undefined) setHolidays(prefs.holidays);
        if (prefs.floatStruckNotes !== undefined) setFloatStruckNotes(prefs.floatStruckNotes);
        if (prefs.selectedHolidayCountry !== undefined) setSelectedHolidayCountry(prefs.selectedHolidayCountry);
        if (prefs.selectedHolidaySubdivision !== undefined) setSelectedHolidaySubdivision(prefs.selectedHolidaySubdivision);
      }
    } catch (e) {
      console.warn('Supabase load error:', e);
    }
  }

  const applyTheme = useCallback((id: ThemeId, persist = true) => {
    const next = applyThemeService(id, customThemes, persist);
    setCurrentTheme(next);
  }, [customThemes]);

  useEffect(() => {
    const saved = getSavedTheme();
    applyTheme(saved || (window.matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light'), false);
  }, [applyTheme]);

  const addCustomTheme = (theme: CustomTheme) => {
    const next = [...customThemes, theme];
    setCustomThemes(next);
    localStorage.setItem('tt_custom_themes', JSON.stringify(next));
    applyTheme(theme.id);
  };

  const deleteCustomTheme = (id: string) => {
    const next = customThemes.filter((t) => t.id !== id);
    setCustomThemes(next);
    localStorage.setItem('tt_custom_themes', JSON.stringify(next));
    if (currentTheme === id) applyTheme('light');
  };

  const applyFont = (id: string) => {
    setCustomFont(id);
    localStorage.setItem('tt_custom_font', id);
    applyFontService(id);
  };

  useEffect(() => {
    if (customFontEnabled) applyFontService(customFont);
    else document.body.style.fontFamily = '';
  }, [customFontEnabled, customFont]);

  const saveEntries = useCallback((updated: Entry[]) => {
    setEntries(updated);
    localStorage.setItem('tt_v3', JSON.stringify(updated));
    if (!currentUser) return;
    clearTimeout(saveEntriesTimer.current);
    saveEntriesTimer.current = setTimeout(() => {
      saveEntriesToSupabase(currentUser.id, updated);
    }, 800);
  }, [currentUser]);

  const saveNotes = useCallback((updated: Note[]) => {
    setNotes(updated);
    localStorage.setItem('tt_notes', JSON.stringify(updated));
    if (!currentUser) return;
    clearTimeout(saveNotesTimer.current);
    saveNotesTimer.current = setTimeout(() => {
      saveNotesToSupabase(currentUser.id, updated);
    }, 800);
  }, [currentUser]);

  const saveHolidays = useCallback((updated: Holiday[]) => {
    setHolidays(updated);
    localStorage.setItem('tt_holidays', JSON.stringify(updated));
  }, []);

  const savePrefs = useCallback(() => {
    if (!currentUser) return;
    clearTimeout(savePrefsTimer.current);
    savePrefsTimer.current = setTimeout(() => {
      const uid = currentUser.id;
      const prefs: PrefsPayload = {
        theme: localStorage.getItem(THEME_KEY) ?? undefined,
        userName,
        showSync,
        showNotesDone,
        notesCollapsed,
        showHolidays,
        customThemes,
        customFontEnabled,
        customFont,
        noteOrder,
        holidays,
        floatStruckNotes,
        selectedHolidayCountry,
        selectedHolidaySubdivision,
      };
      savePrefsToSupabase(uid, prefs);
    }, 1000);
  }, [currentUser, userName, showSync, showNotesDone, notesCollapsed, showHolidays,
    customThemes, customFontEnabled, customFont, noteOrder, holidays,
    floatStruckNotes, selectedHolidayCountry, selectedHolidaySubdivision]);

  return (
    <AppContext.Provider value={{
      currentUser, authReady,
      entries, notes, holidays,
      setEntries, setNotes, setHolidays,
      saveEntries, saveNotes, saveHolidays,
      activeTab, setActiveTab,
      showSync, setShowSync,
      showNotesDone, setShowNotesDone,
      notesCollapsed, setNotesCollapsed,
      showHolidays, setShowHolidays,
      userName, setUserName,
      floatStruckNotes, setFloatStruckNotes,
      noteOrder, setNoteOrder,
      selectedHolidayCountry, setSelectedHolidayCountry,
      selectedHolidaySubdivision, setSelectedHolidaySubdivision,
      currentTheme, customThemes,
      applyTheme, addCustomTheme, deleteCustomTheme,
      customFontEnabled, setCustomFontEnabled,
      customFont, applyFont,
      savePrefs,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
