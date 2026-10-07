import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  IconNotes,
  IconX,
  IconMinus,
  IconSearch,
  IconPlus,
  IconArrowLeft,
  IconArrowUpRight,
  IconMaximize,
  IconCloudCheck,
  IconCloudUpload,
  IconAlertCircle,
  IconCircle,
  IconCircleCheckFilled,
  IconPencilPlus,
} from '@tabler/icons-react';
import { useApp } from '../../context/AppContext';
import RichTextEditor from '../NoteEditor/RichTextEditor';
import { Note } from '../../types';
import './FloatingNotes.css';

type Mode = 'closed' | 'open' | 'minimized';
const NEW_NOTE = '__new__';
const STORAGE_KEY = 'tt_float_notes';
const MARGIN = 16;
const DEFAULT_SIZE = { w: 380, h: 520 };
const AUTOSAVE_MS = 800;

interface FloatState {
  mode: Mode;
  activeId: string | null;
  x: number | null;
  y: number | null;
  w: number;
  h: number;
}

function loadState(): FloatState {
  const fallback: FloatState = { mode: 'closed', activeId: null, x: null, y: null, ...DEFAULT_SIZE };
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    return raw ? { ...fallback, ...raw } : fallback;
  } catch {
    return fallback;
  }
}

function useIsDesktop() {
  const query = '(min-width: 900px)';
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  return matches;
}

function useViewport() {
  const [size, setSize] = useState(() => ({ vw: window.innerWidth, vh: window.innerHeight }));
  useEffect(() => {
    const onResize = () => setSize({ vw: window.innerWidth, vh: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return size;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function plainText(html: string) {
  return html.replace(/<(br|\/p|\/div|\/li|\/h\d)>/gi, ' ').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
}

function noteTimestamp(note: Note) {
  if (note.updatedAt) return note.updatedAt;
  const fromId = Number(note.id.replace(/^\D+/, ''));
  return Number.isFinite(fromId) ? fromId : 0;
}

function nowLabel() {
  return new Date().toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function SaveIndicator({ pending }: { pending: boolean }) {
  const { notesSaveState } = useApp();
  let content: React.ReactNode = null;
  if (pending || notesSaveState === 'saving') content = <><IconCloudUpload size={15} stroke={1.75} /> A guardar…</>;
  else if (notesSaveState === 'error') content = <><IconAlertCircle size={15} stroke={1.75} /> Erro ao guardar</>;
  else if (notesSaveState === 'saved') content = <><IconCloudCheck size={15} stroke={1.75} /> Guardado</>;
  return (
    <span className={`fn-save ${notesSaveState === 'error' && !pending ? 'error' : ''}`} aria-live="polite">
      {content}
    </span>
  );
}

function DoneToggle({ note, onToggle }: { note: Note; onToggle: (id: string) => void }) {
  const label = note.done ? `Marcar "${note.title}" como pendente` : `Marcar "${note.title}" como concluída`;
  return (
    <button
      type="button"
      className={`fn-done ${note.done ? 'checked' : ''}`}
      onClick={() => onToggle(note.id)}
      aria-pressed={!!note.done}
      aria-label={label}
      title={note.done ? 'Marcar como pendente' : 'Marcar como concluída'}
    >
      {note.done ? <IconCircleCheckFilled size={22} /> : <IconCircle size={22} stroke={1.75} />}
    </button>
  );
}

function NoteList({
  onOpen,
  onCreate,
  onToggleDone,
  searchRef,
}: {
  onOpen: (id: string) => void;
  onCreate: (title?: string) => void;
  onToggleDone: (id: string) => void;
  searchRef: React.RefObject<HTMLInputElement>;
}) {
  const { notes, saveNotes } = useApp();
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');

  function quickAdd(event: React.FormEvent) {
    event.preventDefault();
    const title = draft.trim();
    if (!title) return;
    saveNotes([...notes, { id: `n_${Date.now()}`, title, body: '', date: nowLabel() }], { immediate: true });
    setDraft('');
  }

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...notes]
      .sort((a, b) => Number(!!a.done) - Number(!!b.done) || noteTimestamp(b) - noteTimestamp(a))
      .map((note) => ({ note, text: plainText(note.body) }))
      .filter(({ note, text }) => !q || note.title.toLowerCase().includes(q) || text.toLowerCase().includes(q))
      .slice(0, q ? 50 : 20);
  }, [notes, query]);

  return (
    <div className="fn-list-view">
      <div className="fn-search">
        <IconSearch size={18} stroke={1.75} aria-hidden="true" />
        <input
          ref={searchRef}
          type="search"
          placeholder="Pesquisar notas…"
          aria-label="Pesquisar notas"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <form className="fn-quick-add" onSubmit={quickAdd}>
        <input
          type="text"
          placeholder="Adicionar nota…"
          aria-label="Adicionar nota rápida (Enter para guardar)"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <button type="submit" className="fn-quick-btn primary" aria-label="Adicionar nota" title="Adicionar (Enter)" disabled={!draft.trim()}>
          <IconPlus size={18} stroke={2} />
        </button>
        <button
          type="button"
          className="fn-quick-btn"
          aria-label="Nova nota com editor"
          title="Escrever nota completa"
          onClick={() => { onCreate(draft.trim() || undefined); setDraft(''); }}
        >
          <IconPencilPlus size={18} stroke={1.75} />
        </button>
      </form>
      <ul className="fn-list" aria-label={query ? 'Resultados' : 'Notas recentes'}>
        {items.length === 0 ? (
          <li className="fn-empty">{query ? 'Nenhuma nota encontrada' : 'Ainda não tens notas'}</li>
        ) : (
          items.map(({ note, text }) => (
            <li key={note.id} className={`fn-row ${note.done ? 'done' : ''}`}>
              <DoneToggle note={note} onToggle={onToggleDone} />
              <button type="button" className="fn-item" onClick={() => onOpen(note.id)}>
                <span className="fn-item-title">{note.title || 'Sem título'}</span>
                {text && <span className="fn-item-snippet">{text}</span>}
                <span className="fn-item-date tabular">{note.date}</span>
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function NoteEditorView({
  noteId,
  initialTitle,
  onCreated,
  onPendingChange,
  titleRef,
}: {
  noteId: string;
  initialTitle?: string;
  onCreated: (id: string) => void;
  onPendingChange: (pending: boolean) => void;
  titleRef: React.RefObject<HTMLInputElement>;
}) {
  const { notes, saveNotes } = useApp();
  const note = noteId === NEW_NOTE ? undefined : notes.find((item) => item.id === noteId);
  const [title, setTitle] = useState(note?.title ?? initialTitle ?? '');
  const editorRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const idRef = useRef<string | null>(noteId === NEW_NOTE ? null : noteId);
  const titleValue = useRef(title);
  const synced = useRef({ title: note?.title ?? '', body: note?.body ?? '' });
  const notesRef = useRef(notes);
  notesRef.current = notes;
  const callbacks = useRef({ saveNotes, onCreated, onPendingChange });
  callbacks.current = { saveNotes, onCreated, onPendingChange };

  const commit = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = undefined;
    const body = editorRef.current?.innerHTML.trim() ?? '';
    const cleanBody = body === '<br>' ? '' : body;
    const cleanTitle = titleValue.current.trim();
    const { saveNotes: save, onCreated: created, onPendingChange: pendingChange } = callbacks.current;
    pendingChange(false);

    if (!idRef.current) {
      if (!cleanTitle && !cleanBody) return;
      const id = `n_${Date.now()}`;
      idRef.current = id;
      synced.current = { title: cleanTitle || 'Sem título', body: cleanBody };
      save([...notesRef.current, { id, title: cleanTitle || 'Sem título', body: cleanBody, date: nowLabel() }], { immediate: true });
      created(id);
      return;
    }

    const current = notesRef.current.find((item) => item.id === idRef.current);
    if (!current) return;
    const nextTitle = cleanTitle || 'Sem título';
    if (current.title === nextTitle && current.body === cleanBody) return;
    synced.current = { title: nextTitle, body: cleanBody };
    save(notesRef.current.map((item) => (item.id === idRef.current ? { ...item, title: nextTitle, body: cleanBody } : item)), { immediate: true });
  }, []);

  const scheduleSave = useCallback(() => {
    callbacks.current.onPendingChange(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(commit, AUTOSAVE_MS);
  }, [commit]);

  useLayoutEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = note?.body ?? '';
  }, []);

  useEffect(() => () => {
    if (timer.current) commit();
  }, [commit]);

  useEffect(() => {
    if (!note || timer.current) return;
    if (note.body !== synced.current.body && editorRef.current && document.activeElement !== editorRef.current) {
      editorRef.current.innerHTML = note.body;
      synced.current.body = note.body;
    }
    if (note.title !== synced.current.title && document.activeElement !== titleRef.current) {
      setTitle(note.title);
      titleValue.current = note.title;
      synced.current.title = note.title;
    }
  }, [note, titleRef]);

  const deleted = noteId !== NEW_NOTE && !note;

  return (
    <div className="fn-editor-view">
      {deleted && <p className="fn-deleted" role="status">Esta nota foi eliminada.</p>}
      <input
        ref={titleRef}
        className="fn-title-input"
        type="text"
        placeholder="Título da nota…"
        aria-label="Título da nota"
        value={title}
        disabled={deleted}
        onChange={(event) => {
          setTitle(event.target.value);
          titleValue.current = event.target.value;
          scheduleSave();
        }}
      />
      <RichTextEditor editorRef={editorRef} onInput={scheduleSave} compact />
    </div>
  );
}

export default function FloatingNotes() {
  const { activeTab, notes, saveNotes, openNoteInPage, setActiveTab } = useApp();

  const toggleDone = useCallback((id: string) => {
    saveNotes(notes.map((note) => (note.id === id ? { ...note, done: !note.done } : note)), { immediate: true });
  }, [notes, saveNotes]);
  const [state, setState] = useState<FloatState>(loadState);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [pending, setPending] = useState(false);
  const [editorSession, setEditorSession] = useState(0);
  const [newTitle, setNewTitle] = useState<string | undefined>(undefined);
  const dragPosRef = useRef<{ x: number; y: number } | null>(null);
  const isDesktop = useIsDesktop();
  const { vw, vh } = useViewport();

  const panelRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const expandRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const focusAfter = useRef<'panel' | 'fab' | 'bar' | null>(null);
  const drag = useRef<{ dx: number; dy: number; pointerId: number } | null>(null);

  const hidden = activeTab === 'notes';

  const update = useCallback((patch: Partial<FloatState>) => {
    setState((current) => {
      const next = { ...current, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        return next;
      }
      return next;
    });
  }, []);

  const setMode = useCallback((mode: Mode) => {
    focusAfter.current = mode === 'open' ? 'panel' : mode === 'minimized' ? 'bar' : 'fab';
    update({ mode });
  }, [update]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.code !== 'KeyN' || !event.shiftKey || !(event.metaKey || event.ctrlKey || event.altKey)) return;
      if (hidden) return;
      event.preventDefault();
      setMode(state.mode === 'open' ? 'closed' : 'open');
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hidden, state.mode, setMode]);

  useEffect(() => {
    const target = focusAfter.current;
    if (!target || hidden) return;
    focusAfter.current = null;
    requestAnimationFrame(() => {
      if (target === 'fab') fabRef.current?.focus();
      else if (target === 'bar') expandRef.current?.focus();
      else if (state.activeId) titleRef.current?.focus();
      else searchRef.current?.focus();
    });
  }, [state.mode, state.activeId, hidden]);

  const width = Math.min(state.w, vw - MARGIN * 2);
  const height = Math.min(state.h, vh - MARGIN * 2);
  const basePos = {
    x: state.x ?? vw - width - MARGIN - 8,
    y: state.y ?? vh - height - MARGIN - 8,
  };
  const pos = dragPos ?? {
    x: clamp(basePos.x, MARGIN, vw - width - MARGIN),
    y: clamp(basePos.y, MARGIN, vh - height - MARGIN),
  };

  useEffect(() => {
    if (!isDesktop || state.mode !== 'open' || !panelRef.current) return;
    const panel = panelRef.current;
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const w = Math.round(panel.offsetWidth);
        const h = Math.round(panel.offsetHeight);
        setState((current) => {
          if (Math.abs(current.w - w) < 2 && Math.abs(current.h - h) < 2) return current;
          const next = { ...current, w, h };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          return next;
        });
      });
    });
    observer.observe(panel);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [isDesktop, state.mode]);

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!isDesktop || event.button !== 0) return;
    if ((event.target as HTMLElement).closest('button, input, a')) return;
    drag.current = { dx: event.clientX - pos.x, dy: event.clientY - pos.y, pointerId: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
    dragPosRef.current = pos;
    setDragPos(pos);
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    const next = {
      x: clamp(event.clientX - drag.current.dx, 0, vw - width),
      y: clamp(event.clientY - drag.current.dy, 0, vh - height),
    };
    dragPosRef.current = next;
    setDragPos(next);
  }

  function onPointerUp() {
    const last = dragPosRef.current;
    drag.current = null;
    dragPosRef.current = null;
    if (!last) return;
    const snapLeft = last.x + width / 2 < vw / 2;
    const x = snapLeft ? MARGIN : vw - width - MARGIN;
    const y = clamp(last.y, MARGIN, vh - height - MARGIN);
    setDragPos(null);
    update({ x, y });
  }

  function onHeaderKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!isDesktop || !event.altKey) return;
    const step = event.shiftKey ? 64 : 16;
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    update({ x: clamp(pos.x + move[0], MARGIN, vw - width - MARGIN), y: clamp(pos.y + move[1], MARGIN, vh - height - MARGIN) });
  }

  if (hidden) return null;

  const activeNote = state.activeId && state.activeId !== NEW_NOTE ? notes.find((note) => note.id === state.activeId) : undefined;
  const activeTitle = state.activeId === NEW_NOTE ? 'Nova nota' : activeNote?.title || 'Notas';

  if (state.mode === 'closed') {
    return (
      <button
        ref={fabRef}
        type="button"
        className="fn-fab"
        onClick={() => setMode('open')}
        aria-label="Abrir notas rápidas"
        aria-expanded={false}
        aria-controls="floating-notes"
        aria-keyshortcuts="Control+Shift+N Meta+Shift+N Alt+Shift+N"
        title="Notas rápidas (Ctrl/⌘ + Shift + N ou Alt + Shift + N)"
      >
        <IconNotes size={24} stroke={1.75} />
      </button>
    );
  }

  if (state.mode === 'minimized') {
    return (
      <div className="fn-minibar" role="region" aria-label="Notas rápidas minimizadas" id="floating-notes">
        <button ref={expandRef} type="button" className="fn-minibar-main" onClick={() => setMode('open')} aria-label={`Expandir notas: ${activeTitle}`}>
          <IconNotes size={18} stroke={1.75} />
          <span className="fn-minibar-title">{activeTitle}</span>
        </button>
        <SaveIndicator pending={pending} />
        <button type="button" className="btn-icon" onClick={() => setMode('open')} aria-label="Expandir" title="Expandir">
          <IconMaximize size={18} stroke={1.75} />
        </button>
        <button type="button" className="btn-icon" onClick={() => setMode('closed')} aria-label="Fechar notas rápidas" title="Fechar">
          <IconX size={18} stroke={1.75} />
        </button>
      </div>
    );
  }

  const panelStyle: React.CSSProperties = isDesktop
    ? { left: pos.x, top: pos.y, width, height }
    : {};

  return (
    <div
      ref={panelRef}
      id="floating-notes"
      className={`fn-panel ${isDesktop ? 'fn-floating' : 'fn-sheet'} ${dragPos ? 'dragging' : ''}`}
      style={panelStyle}
      role="dialog"
      aria-modal="false"
      aria-labelledby="fnTitle"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          setMode('minimized');
        }
      }}
    >
      <div
        className="fn-header"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onHeaderKeyDown}
      >
        {state.activeId ? (
          <button type="button" className="btn-icon" onClick={() => update({ activeId: null })} aria-label="Voltar à lista de notas" title="Voltar">
            <IconArrowLeft size={18} stroke={1.75} />
          </button>
        ) : (
          <span className="fn-header-icon" aria-hidden="true"><IconNotes size={18} stroke={1.75} /></span>
        )}
        {activeNote && <DoneToggle note={activeNote} onToggle={toggleDone} />}
        <h2 className={`fn-title ${activeNote?.done ? 'done' : ''}`} id="fnTitle">{state.activeId ? activeTitle : 'Notas'}</h2>
        <SaveIndicator pending={pending} />
        <button type="button" className="btn-icon" onClick={() => setMode('minimized')} aria-label="Minimizar (Esc)" title="Minimizar (Esc)">
          <IconMinus size={18} stroke={1.75} />
        </button>
        <button type="button" className="btn-icon" onClick={() => setMode('closed')} aria-label="Fechar notas rápidas" title="Fechar">
          <IconX size={18} stroke={1.75} />
        </button>
      </div>

      <div className="fn-body">
        {state.activeId ? (
          <NoteEditorView
            key={editorSession}
            noteId={state.activeId}
            initialTitle={newTitle}
            titleRef={titleRef}
            onPendingChange={setPending}
            onCreated={(id) => update({ activeId: id })}
          />
        ) : (
          <NoteList
            searchRef={searchRef}
            onToggleDone={toggleDone}
            onOpen={(id) => { focusAfter.current = 'panel'; setNewTitle(undefined); setEditorSession((n) => n + 1); update({ activeId: id }); }}
            onCreate={(title) => { focusAfter.current = 'panel'; setNewTitle(title); setEditorSession((n) => n + 1); update({ activeId: NEW_NOTE }); }}
          />
        )}
      </div>

      <div className="fn-footer">
        <a
          href="/notas"
          className="fn-open-link"
          onClick={(event) => {
            event.preventDefault();
            if (activeNote) openNoteInPage(activeNote.id);
            else setActiveTab('notes');
          }}
        >
          Abrir em Notas <IconArrowUpRight size={16} stroke={1.75} />
        </a>
      </div>
    </div>
  );
}
