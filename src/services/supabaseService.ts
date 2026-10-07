import { supabase } from '../supabase/supabaseClient';
import { Entry, Note, Holiday } from '../types';

export interface PrefsPayload {
  theme?: string;
  userName?: string;
  showSync?: boolean;
  showNotesDone?: boolean;
  notesCollapsed?: boolean;
  showHolidays?: boolean;
  customThemes?: unknown[];
  noteOrder?: string[] | null;
  holidays?: Holiday[];
  selectedHolidayCountry?: string;
  selectedHolidaySubdivision?: string;
}

export async function loadAppData(uid: string) {
  const [{ data: entriesData }, { data: notesData }, { data: prefsData }] = await Promise.all([
    supabase.from('tt_entries').select('*').eq('user_id', uid),
    supabase.from('tt_notes').select('*').eq('user_id', uid),
    supabase.from('tt_prefs').select('*').eq('user_id', uid).single(),
  ]);

  const entries = Array.isArray(entriesData)
    ? entriesData.map((r: any) => r.data as Entry)
    : [];
  const notes = Array.isArray(notesData)
    ? notesData.map((r: any) => r.data as Note)
    : [];
  const prefs = prefsData?.data as PrefsPayload | undefined;

  return { entries, notes, prefs };
}

export async function saveEntriesToSupabase(uid: string, updated: Entry[]) {
  try {
    await supabase.from('tt_entries').delete().eq('user_id', uid);
    if (updated.length > 0) {
      await supabase.from('tt_entries').insert(
        updated.map((e) => ({ user_id: uid, entry_id: e.id, data: e }))
      );
    }
  } catch (error) {
    console.warn('Entries save error:', error);
  }
}

export async function saveNotesToSupabase(uid: string, updated: Note[]) {
  try {
    await supabase.from('tt_notes').delete().eq('user_id', uid);
    if (updated.length > 0) {
      await supabase.from('tt_notes').insert(
        updated.map((n) => ({ user_id: uid, note_id: n.id, data: n }))
      );
    }
  } catch (error) {
    console.warn('Notes save error:', error);
  }
}

export async function savePrefsToSupabase(uid: string, prefs: PrefsPayload) {
  try {
    await supabase.from('tt_prefs').upsert({ user_id: uid, data: prefs }, { onConflict: 'user_id' });
  } catch (error) {
    console.warn('Prefs save error:', error);
  }
}
