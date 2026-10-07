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
import { Entry, Note, Holiday, ThemeMode, TabId } from '../types';
import { tabFromPath, pushRoute } from '../router';
import { useNotesStore, NotesSaveState } from './useNotesStore';
import { loadJson, loadBool, loadString } from '../services/localStorageService';
import {
  applyTheme,
  getSavedTheme,
  migrateThemeValue,
  onSystemThemeChange,
  cleanupLegacyThemeStorage,
} from '../services/themeService';
import {
  loadAppData,
  saveEntriesToSupabase,
  savePrefsToSupabase,
  PrefsPayload,
} from '../services/supabaseService';

interface AppContextType {
  currentUser: User | null;
  authReady: boolean;
  entries: Entry[];
  notes: Note[];
  holidays: Holiday[];
  setEntries: React.Dispatch<React.SetStateAction<Entry[]>>;
  setHolidays: React.Dispatch<React.SetStateAction<Holiday[]>>;
  saveEntries: (updated: Entry[]) => void;
  saveNotes: (updated: Note[], options?: { immediate?: boolean }) => void;
  notesSaveState: NotesSaveState;
  noteToOpen: string | null;
  openNoteInPage: (id: string) => void;
  clearNoteToOpen: () => void;
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
  noteOrder: string[] | null;
  setNoteOrder: React.Dispatch<React.SetStateAction<string[] | null>>;
  selectedHolidayCountry: string;
  setSelectedHolidayCountry: React.Dispatch<React.SetStateAction<string>>;
  selectedHolidaySubdivision: string;
  setSelectedHolidaySubdivision: React.Dispatch<React.SetStateAction<string>>;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  savePrefs: () => void;
  loadError: string | null;
  retryLoad: () => void;
}

const AppContext = createContext<AppContextType>(null!);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [entries, setEntries] = useState<Entry[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>(() => loadJson('tt_holidays', []));

  const [showSync, setShowSync] = useState(() => loadBool('tt_show_sync'));
  const [showNotesDone, setShowNotesDone] = useState(() => loadBool('tt_notes_done'));
  const [notesCollapsed, setNotesCollapsed] = useState(() => loadBool('tt_notes_collapsed'));
  const [showHolidays, setShowHolidays] = useState(() => loadBool('tt_show_holidays'));
  const [userName, setUserName] = useState(() => loadString('tt_user_name'));
  const [noteOrder, setNoteOrder] = useState<string[] | null>(() => loadJson('tt_note_order', null));
  const [selectedHolidayCountry, setSelectedHolidayCountry] = useState(() => loadString('tt_holiday_country'));
  const [selectedHolidaySubdivision, setSelectedHolidaySubdivision] = useState(() => loadString('tt_holiday_subdivision'));

  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const mode = getSavedTheme();
    applyTheme(mode);
    cleanupLegacyThemeStorage();
    return mode;
  });

  const { notes, saveNotes, saveState: notesSaveState, ingest: ingestNotes } = useNotesStore(currentUser?.id ?? null);
  const [noteToOpen, setNoteToOpen] = useState<string | null>(null);

  const [activeTab, setActiveTabState] = useState<TabId>(() => tabFromPath(window.location.pathname));

  useEffect(() => {
    const onPop = () => setActiveTabState(tabFromPath(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const setActiveTab = useCallback((tab: TabId) => {
    pushRoute(tab);
    setActiveTabState(tab);
    window.scrollTo({ top: 0 });
  }, []);

  const saveEntriesTimer = useRef<ReturnType<typeof setTimeout>>();
  const savePrefsTimer = useRef<ReturnType<typeof setTimeout>>();

  const prefsRef = useRef<PrefsPayload>({});
  prefsRef.current = {
    theme: themeMode,
    userName,
    showSync,
    showNotesDone,
    notesCollapsed,
    showHolidays,
    noteOrder,
    holidays,
    selectedHolidayCountry,
    selectedHolidaySubdivision,
  };

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

  useEffect(() => {
    applyTheme(themeMode);
    if (themeMode !== 'system') return;
    return onSystemThemeChange(() => applyTheme('system'));
  }, [themeMode]);

  async function loadFromSupabase(uid: string) {
    setLoadError(null);
    try {
      const { entries: entriesData, notes: notesData, prefs, noteRowIds } = await loadAppData(uid);

      setEntries(entriesData);
      ingestNotes(notesData, noteRowIds);

      if (prefs) {
        if (prefs.theme) {
          setThemeModeState(migrateThemeValue(prefs.theme, prefs.customThemes));
        }
        if (prefs.userName !== undefined) {
          setUserName(prefs.userName);
          localStorage.setItem('tt_user_name', prefs.userName);
        }
        if (prefs.showSync !== undefined) {
          setShowSync(prefs.showSync);
          localStorage.setItem('tt_show_sync', String(prefs.showSync));
        }
        if (prefs.showNotesDone !== undefined) {
          setShowNotesDone(prefs.showNotesDone);
          localStorage.setItem('tt_notes_done', String(prefs.showNotesDone));
        }
        if (prefs.notesCollapsed !== undefined) {
          setNotesCollapsed(prefs.notesCollapsed);
          localStorage.setItem('tt_notes_collapsed', String(prefs.notesCollapsed));
        }
        if (prefs.showHolidays !== undefined) {
          setShowHolidays(prefs.showHolidays);
          localStorage.setItem('tt_show_holidays', String(prefs.showHolidays));
        }
        if (prefs.noteOrder !== undefined) {
          setNoteOrder(prefs.noteOrder);
          localStorage.setItem('tt_note_order', JSON.stringify(prefs.noteOrder));
        }
        if (prefs.holidays !== undefined) {
          setHolidays(prefs.holidays);
          localStorage.setItem('tt_holidays', JSON.stringify(prefs.holidays));
        }
        if (prefs.selectedHolidayCountry !== undefined) {
          setSelectedHolidayCountry(prefs.selectedHolidayCountry);
          localStorage.setItem('tt_holiday_country', prefs.selectedHolidayCountry);
        }
        if (prefs.selectedHolidaySubdivision !== undefined) {
          setSelectedHolidaySubdivision(prefs.selectedHolidaySubdivision);
          localStorage.setItem('tt_holiday_subdivision', prefs.selectedHolidaySubdivision);
        }
      }
    } catch (e) {
      console.warn('Supabase load error:', e);
      setLoadError('Não foi possível carregar os teus dados. Verifica a ligação e tenta novamente.');
    }
  }

  const saveEntries = useCallback((updated: Entry[]) => {
    setEntries(updated);
    localStorage.setItem('tt_v3', JSON.stringify(updated));
    if (!currentUser) return;
    clearTimeout(saveEntriesTimer.current);
    saveEntriesTimer.current = setTimeout(() => {
      saveEntriesToSupabase(currentUser.id, updated);
    }, 800);
  }, [currentUser]);

  const saveHolidays = useCallback((updated: Holiday[]) => {
    setHolidays(updated);
    localStorage.setItem('tt_holidays', JSON.stringify(updated));
  }, []);

  const savePrefs = useCallback(() => {
    if (!currentUser) return;
    clearTimeout(savePrefsTimer.current);
    const uid = currentUser.id;
    savePrefsTimer.current = setTimeout(() => {
      savePrefsToSupabase(uid, prefsRef.current);
    }, 1000);
  }, [currentUser]);

  const openNoteInPage = useCallback((id: string) => {
    setNoteToOpen(id);
    setActiveTab('notes');
  }, [setActiveTab]);

  const clearNoteToOpen = useCallback(() => setNoteToOpen(null), []);

  const retryLoad = useCallback(() => {
    if (currentUser) loadFromSupabase(currentUser.id);
  }, [currentUser]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    savePrefs();
  }, [savePrefs]);

  return (
    <AppContext.Provider value={{
      currentUser, authReady,
      entries, notes, holidays,
      setEntries, setHolidays,
      saveEntries, saveNotes, saveHolidays,
      notesSaveState, noteToOpen, openNoteInPage, clearNoteToOpen,
      activeTab, setActiveTab,
      showSync, setShowSync,
      showNotesDone, setShowNotesDone,
      notesCollapsed, setNotesCollapsed,
      showHolidays, setShowHolidays,
      userName, setUserName,
      noteOrder, setNoteOrder,
      selectedHolidayCountry, setSelectedHolidayCountry,
      selectedHolidaySubdivision, setSelectedHolidaySubdivision,
      themeMode, setThemeMode,
      savePrefs,
      loadError, retryLoad,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
