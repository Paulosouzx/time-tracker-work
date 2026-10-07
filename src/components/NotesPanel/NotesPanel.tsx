import { useMemo, useRef, useState } from 'react';
import {
  IconGripVertical,
  IconCheck,
  IconRotateClockwise,
  IconChevronDown,
  IconChevronUp,
  IconPencil,
  IconTrash,
  IconPlus,
  IconNotesOff,
} from '@tabler/icons-react';
import { useApp } from '../../context/AppContext';
import RichTextEditor from '../NoteEditor/RichTextEditor';
import { Note } from '../../types';
import './NotesPanel.css';

interface DragHandlers {
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

function NoteCard({
  note,
  onEdit,
  onDelete,
  onToggleDone,
  defaultCollapsed,
  showDone,
  editing,
  dragHandlers,
}: {
  note: Note;
  onEdit: () => void;
  onDelete: () => void;
  onToggleDone: () => void;
  defaultCollapsed: boolean;
  showDone: boolean;
  editing: boolean;
  dragHandlers: DragHandlers;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const bodyId = `note-body-${note.id}`;

  return (
    <article
      className={`card note-card ${note.done ? 'done' : ''} ${editing ? 'editing' : ''}`}
      data-id={note.id}
      draggable
      {...dragHandlers}
    >
      <div className="note-card-head">
        <span className="note-drag-handle" title="Arrastar para reordenar" aria-hidden="true">
          <IconGripVertical size={18} stroke={1.75} />
        </span>
        <button
          type="button"
          className="note-card-title"
          onClick={() => setCollapsed((prev) => !prev)}
          aria-expanded={!collapsed}
          aria-controls={bodyId}
        >
          {note.title}
        </button>
        <span className="note-card-date tabular">{note.date}</span>
      </div>

      {!collapsed && (
        <div id={bodyId} className="note-card-body rich-content" dangerouslySetInnerHTML={{ __html: note.body }} />
      )}

      <div className="note-card-actions">
        {showDone && (
          <button
            className={`btn-icon ${note.done ? 'done-active' : ''}`}
            type="button"
            onClick={onToggleDone}
            aria-label={note.done ? 'Marcar como pendente' : 'Marcar como feita'}
            title={note.done ? 'Marcar como pendente' : 'Marcar como feita'}
          >
            {note.done ? <IconRotateClockwise size={18} stroke={1.75} /> : <IconCheck size={18} stroke={1.75} />}
          </button>
        )}
        <button className="btn-icon" type="button" onClick={() => setCollapsed((prev) => !prev)} aria-label={collapsed ? 'Expandir' : 'Colapsar'} title="Expandir/Colapsar">
          {collapsed ? <IconChevronDown size={18} stroke={1.75} /> : <IconChevronUp size={18} stroke={1.75} />}
        </button>
        <button className="btn-icon" type="button" onClick={onEdit} aria-label={`Editar ${note.title}`} title="Editar">
          <IconPencil size={18} stroke={1.75} />
        </button>
        <button className="btn-icon del" type="button" onClick={onDelete} aria-label={`Eliminar ${note.title}`} title="Eliminar">
          <IconTrash size={18} stroke={1.75} />
        </button>
      </div>
    </article>
  );
}

export default function NotesPanel() {
  const { notes, saveNotes, notesCollapsed, showNotesDone, noteOrder, setNoteOrder, savePrefs } = useApp();
  const [title, setTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const dragSource = useRef<string | null>(null);

  const sortedNotes = useMemo(() => {
    if (!noteOrder?.length) return [...notes].reverse();
    const ordered: Note[] = [];
    noteOrder.forEach((id) => {
      const note = notes.find((item) => item.id === id);
      if (note) ordered.push(note);
    });
    notes.forEach((note) => {
      if (!noteOrder.includes(note.id)) ordered.unshift(note);
    });
    return ordered;
  }, [notes, noteOrder]);

  function persistOrder(ids: string[]) {
    setNoteOrder(ids);
    localStorage.setItem('tt_note_order', JSON.stringify(ids));
    savePrefs();
  }

  function resetEditor() {
    setTitle('');
    setEditingId(null);
    setError('');
    if (editorRef.current) editorRef.current.innerHTML = '';
  }

  function saveNote(event: React.FormEvent) {
    event.preventDefault();
    const body = editorRef.current?.innerHTML.trim() || '';
    if (!title.trim() && (!body || body === '<br>')) {
      setError('Preencha o título ou o conteúdo.');
      titleRef.current?.focus();
      return;
    }

    const notePayload = { title: title.trim() || 'Sem título', body };

    if (editingId) {
      saveNotes(notes.map((note) => (note.id === editingId ? { ...note, ...notePayload } : note)));
    } else {
      saveNotes([
        ...notes,
        {
          id: `n_${Date.now()}`,
          ...notePayload,
          date: new Date().toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }

    resetEditor();
  }

  function editNote(note: Note) {
    setTitle(note.title);
    setEditingId(note.id);
    setError('');
    if (editorRef.current) editorRef.current.innerHTML = note.body;
    titleRef.current?.focus();
    titleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function removeNote(id: string) {
    if (!confirm('Deseja eliminar esta nota?')) return;
    if (editingId === id) resetEditor();
    saveNotes(notes.filter((note) => note.id !== id));
  }

  function toggleNoteDone(id: string) {
    saveNotes(notes.map((note) => (note.id === id ? { ...note, done: !note.done } : note)));
  }

  function createDragHandlers(noteId: string): DragHandlers {
    return {
      onDragStart: () => { dragSource.current = noteId; },
      onDragEnd: () => { dragSource.current = null; },
      onDragOver: (event) => { event.preventDefault(); },
      onDrop: (event) => {
        event.preventDefault();
        if (!dragSource.current || dragSource.current === noteId) return;

        const orderedIds = sortedNotes.map((note) => note.id);
        const sourceIndex = orderedIds.indexOf(dragSource.current);
        const targetIndex = orderedIds.indexOf(noteId);
        if (sourceIndex < 0 || targetIndex < 0) return;

        const targetRect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        const insertAfter = event.clientY >= targetRect.top + targetRect.height / 2;
        orderedIds.splice(sourceIndex, 1);
        const adjustedTarget = orderedIds.indexOf(noteId);
        orderedIds.splice(insertAfter ? adjustedTarget + 1 : adjustedTarget, 0, dragSource.current);
        persistOrder(orderedIds);
      },
    };
  }

  return (
    <div className="notes-page">
      <form className="card notes-form-card" onSubmit={saveNote} aria-label={editingId ? 'Editar nota' : 'Nova nota'} noValidate>
        <input
          ref={titleRef}
          className="notes-title-input"
          type="text"
          placeholder="Título da anotação…"
          aria-label="Título da nota"
          value={title}
          onChange={(event) => { setTitle(event.target.value); if (error) setError(''); }}
        />

        <RichTextEditor editorRef={editorRef} onInput={() => error && setError('')} />

        {error && <p className="form-error" role="alert">{error}</p>}

        <div className="notes-form-actions">
          {editingId && (
            <button className="btn-secondary" type="button" onClick={resetEditor}>
              Cancelar edição
            </button>
          )}
          <button className="btn-primary" type="submit">
            {editingId ? <IconCheck size={18} stroke={2} /> : <IconPlus size={18} stroke={2} />}
            {editingId ? 'Guardar edição' : 'Adicionar nota'}
          </button>
        </div>
      </form>

      <section className="notes-list" aria-label="Notas">
        {sortedNotes.length === 0 ? (
          <div className="card empty-state">
            <span className="empty-icon"><IconNotesOff size={26} stroke={1.75} /></span>
            Ainda não tens notas
          </div>
        ) : (
          sortedNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              editing={editingId === note.id}
              onEdit={() => editNote(note)}
              onDelete={() => removeNote(note.id)}
              onToggleDone={() => toggleNoteDone(note.id)}
              defaultCollapsed={notesCollapsed}
              showDone={showNotesDone}
              dragHandlers={createDragHandlers(note.id)}
            />
          ))
        )}
      </section>
    </div>
  );
}
