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
  const [entriesRes, notesRes, prefsRes] = await Promise.all([
    supabase.from('tt_entries').select('*').eq('user_id', uid),
    supabase.from('tt_notes').select('*').eq('user_id', uid),
    supabase.from('tt_prefs').select('*').eq('user_id', uid).maybeSingle(),
  ]);
  const failed = entriesRes.error || notesRes.error || prefsRes.error;
  if (failed) throw failed;
  const entriesData = entriesRes.data;
  const notesData = notesRes.data;
  const prefsData = prefsRes.data;

  const entries = Array.isArray(entriesData)
    ? entriesData.map((r: any) => r.data as Entry)
    : [];
  const notes = Array.isArray(notesData)
    ? notesData.map((r: any) => r.data as Note)
    : [];
  const noteRowIds: Record<string, string> = {};
  if (Array.isArray(notesData)) notesData.forEach((r: any) => { noteRowIds[r.id] = r.note_id; });
  const prefs = prefsData?.data as PrefsPayload | undefined;

  return { entries, notes, prefs, noteRowIds };
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

export async function saveNoteRow(uid: string, note: Note): Promise<string | null> {
  const { data, error } = await supabase
    .from('tt_notes')
    .update({ data: note })
    .eq('user_id', uid)
    .eq('note_id', note.id)
    .select('id');
  if (error) throw error;
  if (data && data.length > 0) return data[0].id;

  const inserted = await supabase
    .from('tt_notes')
    .insert({ user_id: uid, note_id: note.id, data: note })
    .select('id');
  if (inserted.error) throw inserted.error;
  return inserted.data?.[0]?.id ?? null;
}

export async function deleteNoteRow(uid: string, noteId: string) {
  const { error } = await supabase.from('tt_notes').delete().eq('user_id', uid).eq('note_id', noteId);
  if (error) throw error;
}

export function subscribeToNotes(
  uid: string,
  handlers: {
    onUpsert: (rowId: string, note: Note) => void;
    onDelete: (rowId: string) => void;
  },
) {
  const channel = supabase
    .channel(`tt_notes:${uid}`)
    .on(
      'postgres_changes' as any,
      { event: '*', schema: 'public', table: 'tt_notes', filter: `user_id=eq.${uid}` },
      (payload: any) => {
        if (payload.eventType === 'DELETE') {
          if (payload.old?.id) handlers.onDelete(payload.old.id);
        } else if (payload.new?.data) {
          handlers.onUpsert(payload.new.id, payload.new.data as Note);
        }
      },
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

export async function savePrefsToSupabase(uid: string, prefs: PrefsPayload) {
  try {
    await supabase.from('tt_prefs').upsert({ user_id: uid, data: prefs }, { onConflict: 'user_id' });
  } catch (error) {
    console.warn('Prefs save error:', error);
  }
}
