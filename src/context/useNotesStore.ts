import { useCallback, useEffect, useRef, useState } from 'react';
import { Note } from '../types';
import { saveNoteRow, deleteNoteRow, subscribeToNotes } from '../services/supabaseService';

export type NotesSaveState = 'idle' | 'saving' | 'saved' | 'error';

const SAVE_DELAY = 800;

export function useNotesStore(uid: string | null) {
  const [notes, setNotesState] = useState<Note[]>([]);
  const [saveState, setSaveState] = useState<NotesSaveState>('idle');

  const notesRef = useRef<Note[]>([]);
  const uidRef = useRef(uid);
  uidRef.current = uid;
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const inFlight = useRef(new Map<string, number>());
  const queues = useRef(new Map<string, Promise<void>>());
  const failed = useRef(new Set<string>());
  const rowIds = useRef(new Map<string, string>());

  const commit = useCallback((next: Note[]) => {
    notesRef.current = next;
    setNotesState(next);
    localStorage.setItem('tt_notes', JSON.stringify(next));
  }, []);

  const isPending = (id: string) => timers.current.has(id) || inFlight.current.has(id);

  const refreshState = useCallback(() => {
    if (timers.current.size > 0 || inFlight.current.size > 0) setSaveState('saving');
    else setSaveState(failed.current.size > 0 ? 'error' : 'saved');
  }, []);

  const enqueue = useCallback((op: 'save' | 'delete', id: string) => {
    const userId = uidRef.current;
    if (!userId) return;
    inFlight.current.set(id, (inFlight.current.get(id) || 0) + 1);
    refreshState();

    const previous = queues.current.get(id) || Promise.resolve();
    const run: Promise<void> = previous
      .then(async () => {
        if (op === 'delete') {
          await deleteNoteRow(userId, id);
        } else {
          const note = notesRef.current.find((item) => item.id === id);
          if (!note) return;
          const rowId = await saveNoteRow(userId, note);
          if (rowId) rowIds.current.set(rowId, id);
        }
        failed.current.delete(id);
      })
      .catch((error) => {
        console.warn('Note save error:', error);
        failed.current.add(id);
      })
      .finally(() => {
        const count = (inFlight.current.get(id) || 1) - 1;
        if (count <= 0) inFlight.current.delete(id);
        else inFlight.current.set(id, count);
        if (queues.current.get(id) === run) queues.current.delete(id);
        refreshState();
      });
    queues.current.set(id, run);
  }, [refreshState]);

  const schedule = useCallback((id: string, delay: number) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    if (delay <= 0) {
      enqueue('save', id);
      return;
    }
    timers.current.set(id, setTimeout(() => {
      timers.current.delete(id);
      enqueue('save', id);
    }, delay));
    refreshState();
  }, [enqueue, refreshState]);

  const saveNotes = useCallback((updated: Note[], options?: { immediate?: boolean }) => {
    const previous = new Map(notesRef.current.map((note) => [note.id, note]));
    const now = Date.now();
    const changed: string[] = [];

    const next = updated.map((note) => {
      const before = previous.get(note.id);
      if (before === note) return note;
      if (before && JSON.stringify(before) === JSON.stringify(note)) return note;
      changed.push(note.id);
      return { ...note, updatedAt: now };
    });

    const nextIds = new Set(next.map((note) => note.id));
    const removed = [...previous.keys()].filter((id) => !nextIds.has(id));

    commit(next);
    changed.forEach((id) => schedule(id, options?.immediate ? 0 : SAVE_DELAY));
    removed.forEach((id) => {
      clearTimeout(timers.current.get(id));
      timers.current.delete(id);
      enqueue('delete', id);
    });
  }, [commit, schedule, enqueue]);

  const ingest = useCallback((loaded: Note[], loadedRowIds: Record<string, string>) => {
    rowIds.current = new Map(Object.entries(loadedRowIds));
    commit(loaded);
  }, [commit]);

  const flush = useCallback(() => {
    [...timers.current.keys()].forEach((id) => schedule(id, 0));
  }, [schedule]);

  useEffect(() => {
    const onHide = () => { if (document.visibilityState === 'hidden') flush(); };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [flush]);

  useEffect(() => {
    if (!uid) return;
    return subscribeToNotes(uid, {
      onUpsert(rowId, remote) {
        rowIds.current.set(rowId, remote.id);
        if (isPending(remote.id)) return;
        const local = notesRef.current.find((note) => note.id === remote.id);
        if (local && (local.updatedAt || 0) > (remote.updatedAt || 0)) return;
        if (local && JSON.stringify(local) === JSON.stringify(remote)) return;
        commit(local
          ? notesRef.current.map((note) => (note.id === remote.id ? remote : note))
          : [...notesRef.current, remote]);
      },
      onDelete(rowId) {
        const id = rowIds.current.get(rowId);
        if (!id) return;
        rowIds.current.delete(rowId);
        if (isPending(id) || !notesRef.current.some((note) => note.id === id)) return;
        commit(notesRef.current.filter((note) => note.id !== id));
      },
    });
  }, [uid, commit]);

  return { notes, saveNotes, saveState, ingest, flush };
}
