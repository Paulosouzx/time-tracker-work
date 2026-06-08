import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import './NotesPanel.css';
import { Note } from '../../types';

function execCommand(editorRef: React.RefObject<HTMLDivElement>, command: string, value?: string) {
  document.execCommand(command, false, value);
  editorRef.current?.focus();
}

function handleListTab(event: React.KeyboardEvent) {
  if (event.key !== 'Tab') return;
  event.preventDefault();
  const selection = window.getSelection();
  if (!selection?.rangeCount) return;

  const range = selection.getRangeAt(0);
  const container = range.startContainer;
  const listItem = (container.nodeType === Node.TEXT_NODE ? container.parentElement : container as Element)?.closest('li');

  if (listItem) {
    if (!event.shiftKey) {
      const previous = listItem.previousElementSibling as HTMLElement | null;
      if (previous) {
        let nested = previous.querySelector(':scope > ul, :scope > ol') as HTMLElement | null;
        if (!nested) {
          nested = document.createElement('ul');
          previous.appendChild(nested);
        }
        nested.appendChild(listItem);
      }
    } else {
      const parent = listItem.parentElement as HTMLElement;
      const parentItem = parent.parentElement?.closest('li');
      if (parentItem) {
        parentItem.parentElement!.insertBefore(listItem, parentItem.nextSibling);
        if (!parent.children.length) parent.remove();
      }
    }
    return;
  }

  if (container.nodeType === Node.TEXT_NODE) {
    const text = container.textContent || '';
    const offset = range.startOffset;
    if (text.substring(0, offset).trim() === '-') {
      range.setStart(container, text.lastIndexOf('-', offset - 1));
      range.setEnd(container, offset);
      range.deleteContents();
      document.execCommand('insertUnorderedList', false);
      return;
    }
  }

  document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
}

function RTE({ editorRef }: { editorRef: React.RefObject<HTMLDivElement> }) {
  return (
    <>
      <div className="rte-toolbar">
        <select
          className="rte-select"
          onChange={e => {
            const value = e.target.value;
            if (value) execCommand(editorRef, 'formatBlock', `<${value}>`);
            (e.target as HTMLSelectElement).value = '';
          }}
        >
          <option value="">Parágrafo</option>
          <option value="h1">Título 1</option>
          <option value="h2">Título 2</option>
        </select>

        <div className="rte-sep" />
        <button className="rte-btn" title="Negrito" type="button" onClick={() => execCommand(editorRef, 'bold')}><b>B</b></button>
        <button className="rte-btn" title="Itálico" type="button" onClick={() => execCommand(editorRef, 'italic')}><i>I</i></button>
        <button className="rte-btn" title="Sublinhado" type="button" onClick={() => execCommand(editorRef, 'underline')}><u>U</u></button>
        <button className="rte-btn" title="Rasurado" type="button" onClick={() => execCommand(editorRef, 'strikeThrough')}><s>S</s></button>

        <div className="rte-sep" />
        <button className="rte-btn" title="Lista" type="button" onClick={() => execCommand(editorRef, 'insertUnorderedList')}><i className="ti ti-list" /></button>
        <button className="rte-btn" title="Citação" type="button" onClick={() => execCommand(editorRef, 'formatBlock', '<blockquote>')}><i className="ti ti-quote" /></button>

        <div className="rte-sep" />
        <button className="rte-btn" title="Esquerda" type="button" onClick={() => execCommand(editorRef, 'justifyLeft')}><i className="ti ti-align-left" /></button>
        <button className="rte-btn" title="Centro" type="button" onClick={() => execCommand(editorRef, 'justifyCenter')}><i className="ti ti-align-center" /></button>
        <button className="rte-btn" title="Direita" type="button" onClick={() => execCommand(editorRef, 'justifyRight')}><i className="ti ti-align-right" /></button>
      </div>

      <div
        ref={editorRef}
        className="rte-editor"
        contentEditable
        data-placeholder="Escreve a tua anotação (podes usar '-' e Tab para listas)…"
        onKeyDown={handleListTab}
        suppressContentEditableWarning
      />
    </>
  );
}

function NoteCard({
  note,
  onEdit,
  onDelete,
  onToggleDone,
  defaultCollapsed,
  showDone,
  dragHandlers,
}: {
  note: Note;
  onEdit: () => void;
  onDelete: () => void;
  onToggleDone: () => void;
  defaultCollapsed: boolean;
  showDone: boolean;
  dragHandlers: {
    onDragStart: () => void;
    onDragEnd: () => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: () => void;
    onDrop: (e: React.DragEvent) => void;
  };
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div
      className={`note-card ${note.done ? 'done' : ''} ${collapsed ? 'collapsed' : ''}`}
      data-id={note.id}
      draggable
      {...dragHandlers}
    >
      <div className="note-card-head">
        <i className="ti ti-grip-vertical note-drag-handle" title="Arrastar para reordenar" />
        <div className="note-card-title" onClick={() => setCollapsed(prev => !prev)}>
          {note.title}
        </div>
        <div className="note-card-meta">
          <span className="note-card-date">{note.date}</span>
          {showDone && (
            <button
              className={`note-done-btn ${note.done ? 'done-active' : ''}`}
              type="button"
              onClick={onToggleDone}
              title={note.done ? 'Marcar como pendente' : 'Marcar como feita'}
            >
              <i className={`ti ti-${note.done ? 'rotate-clockwise' : 'check'}`} />
            </button>
          )}
          <button className="note-collapse-btn" type="button" onClick={() => setCollapsed(prev => !prev)} title="Expandir/Colapsar">
            <i className={`ti ti-chevron-${collapsed ? 'down' : 'up'}`} />
          </button>
          <button className="btn-icon" type="button" onClick={onEdit} title="Editar"><i className="ti ti-pencil" /></button>
          <button className="btn-icon del" type="button" onClick={onDelete} title="Eliminar"><i className="ti ti-trash" /></button>
        </div>
      </div>
      <div
        className="note-card-body"
        style={{ maxHeight: collapsed ? 0 : undefined, opacity: collapsed ? 0 : 1 }}
        dangerouslySetInnerHTML={{ __html: note.body }}
      />
    </div>
  );
}

export default function NotesPanel() {
  const { notes, saveNotes, notesCollapsed, showNotesDone, noteOrder, setNoteOrder, savePrefs } = useApp();
  const [title, setTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const dragSource = useRef<string | null>(null);

  const sortedNotes = useMemo(() => {
    if (!noteOrder?.length) return [...notes].reverse();
    const ordered: Note[] = [];
    noteOrder.forEach(id => {
      const note = notes.find(item => item.id === id);
      if (note) ordered.push(note);
    });
    notes.forEach(note => {
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
    if (editorRef.current) editorRef.current.innerHTML = '';
  }

  function saveNote() {
    const body = editorRef.current?.innerHTML.trim() || '';
    if (!title.trim() && (!body || body === '<br>')) {
      alert('Preencha o título ou o conteúdo.');
      return;
    }

    const notePayload = {
      title: title.trim() || 'Sem título',
      body,
    };

    if (editingId) {
      saveNotes(notes.map(note => (note.id === editingId ? { ...note, ...notePayload } : note)));
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
    if (editorRef.current) editorRef.current.innerHTML = note.body;
  }

  function removeNote(id: string) {
    if (!confirm('Deseja eliminar esta nota?')) return;
    saveNotes(notes.filter(note => note.id !== id));
  }

  function toggleNoteDone(id: string) {
    saveNotes(notes.map(note => (note.id === id ? { ...note, done: !note.done } : note)));
  }

  function createDragHandlers(noteId: string) {
    return {
      onDragStart: () => { dragSource.current = noteId; },
      onDragEnd: () => { dragSource.current = null; },
      onDragOver: (event: React.DragEvent) => { event.preventDefault(); },
      onDragLeave: () => {},
      onDrop: (event: React.DragEvent) => {
        event.preventDefault();
        if (!dragSource.current || dragSource.current === noteId) return;

        const orderedIds = sortedNotes.map(note => note.id);
        const sourceIndex = orderedIds.indexOf(dragSource.current);
        const targetIndex = orderedIds.indexOf(noteId);
        if (sourceIndex < 0 || targetIndex < 0) return;

        const targetRect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        const insertAfter = event.clientY >= targetRect.top + targetRect.height / 2;
        orderedIds.splice(sourceIndex, 1);
        orderedIds.splice(insertAfter ? targetIndex + 1 : targetIndex, 0, dragSource.current);
        persistOrder(orderedIds);
      },
    };
  }

  return (
    <div id="panelNotes" className="panel active">
      <div className="notes-form-card">
        <input
          className="notes-title-input"
          type="text"
          placeholder="Título da anotação…"
          value={title}
          onChange={event => setTitle(event.target.value)}
        />

        <RTE editorRef={editorRef} />

        <div className="rte-bottom">
          {editingId && (
            <button className="btn-note-cancel" type="button" onClick={resetEditor}>
              Cancelar Edição
            </button>
          )}
          <button className="btn-note-add" type="button" onClick={saveNote}>
            <i className={`ti ${editingId ? 'ti-check' : 'ti-plus'}`} />
            {editingId ? ' Guardar edição' : ' Adicionar nota'}
          </button>
        </div>
      </div>

      <div className="notes-list">
        {sortedNotes.map(note => (
          <NoteCard
            key={note.id}
            note={note}
            onEdit={() => editNote(note)}
            onDelete={() => removeNote(note.id)}
            onToggleDone={() => toggleNoteDone(note.id)}
            defaultCollapsed={notesCollapsed}
            showDone={showNotesDone}
            dragHandlers={createDragHandlers(note.id)}
          />
        ))}
      </div>
    </div>
  );
}

export function FloatingNotes() {
  const { notes, floatStruckNotes, setFloatStruckNotes, noteOrder, setNoteOrder, savePrefs } = useApp();
  const [collapsed, setCollapsed] = useState(false);
  const floatRef = useRef<HTMLDivElement>(null);
  const dragSource = useRef<string | null>(null);

  useEffect(() => {
    const panel = floatRef.current;
    const handle = panel?.querySelector('.resize-handle') as HTMLElement | null;
    if (!panel || !handle) return;

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let startWidth = 0;
    let startHeight = 0;

    function onMouseDown(event: MouseEvent) {
      if (!panel) return;
      isDragging = true;
      startX = event.clientX;
      startY = event.clientY;
      const style = getComputedStyle(panel);
      startWidth = parseInt(style.width, 10);
      startHeight = parseInt(style.height, 10);
      panel.style.transition = 'none';
      document.body.style.userSelect = 'none';
    }

    function onMouseMove(event: MouseEvent) {
      if (!isDragging || !panel) return;
      const newWidth = startWidth - (event.clientX - startX);
      const newHeight = startHeight + (event.clientY - startY);
      if (newWidth > 250) panel.style.width = `${newWidth}px`;
      if (newHeight > 200) panel.style.height = `${newHeight}px`;
    }

    function onMouseUp() {
      if (!isDragging || !panel) return;
      isDragging = false;
      document.body.style.userSelect = '';
      panel.style.transition = 'transform .4s cubic-bezier(0.175, 0.885, 0.32, 1.2), opacity .3s';
    }

    handle.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      handle.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const visibleNotes = useMemo(() => {
    if (!noteOrder?.length) return [...notes].reverse().filter(note => !note.done);
    const ordered: Note[] = [];
    noteOrder.forEach(id => {
      const note = notes.find(item => item.id === id);
      if (note && !note.done) ordered.push(note);
    });
    notes.forEach(note => {
      if (!note.done && !noteOrder.includes(note.id)) ordered.unshift(note);
    });
    return ordered;
  }, [notes, noteOrder]);

  function toggleStrike(id: string) {
    const next = floatStruckNotes.includes(id)
      ? floatStruckNotes.filter(noteId => noteId !== id)
      : [...floatStruckNotes, id];
    setFloatStruckNotes(next);
    localStorage.setItem('tt_float_struck', JSON.stringify(next));
    savePrefs();
  }

  function createDragHandlers(noteId: string) {
    return {
      onDragStart: () => { dragSource.current = noteId; },
      onDragEnd: () => { dragSource.current = null; },
      onDragOver: (event: React.DragEvent) => { event.preventDefault(); },
      onDragLeave: () => {},
      onDrop: (event: React.DragEvent) => {
        event.preventDefault();
        if (!dragSource.current || dragSource.current === noteId) return;

        const ids = visibleNotes.map(note => note.id);
        const srcIndex = ids.indexOf(dragSource.current);
        const dstIndex = ids.indexOf(noteId);
        if (srcIndex < 0 || dstIndex < 0) return;

        const targetRect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        const insertAfter = event.clientY >= targetRect.top + targetRect.height / 2;
        ids.splice(srcIndex, 1);
        ids.splice(insertAfter ? dstIndex + 1 : dstIndex, 0, dragSource.current);

        setNoteOrder(ids);
        localStorage.setItem('tt_note_order', JSON.stringify(ids));
        savePrefs();
      },
    };
  }

  return (
    <>
      <div ref={floatRef} className={`notes-float ${collapsed ? 'collapsed' : ''}`}>
        <div className="notes-float-header">
          <i className="ti ti-notes" />
          <span className="notes-float-title">Notas ({visibleNotes.length})</span>
          <button className="btn-float-close" type="button" onClick={() => setCollapsed(true)}>
            <i className="ti ti-x" />
          </button>
        </div>

        <div className="notes-float-body">
          {visibleNotes.length === 0 ? (
            <div className="notes-float-empty">Nenhuma nota activa.</div>
          ) : (
            visibleNotes.map(note => {
              const struck = floatStruckNotes.includes(note.id);
              return (
                <div
                  key={note.id}
                  className={`note-float-item ${struck ? 'struck' : ''}`}
                  data-id={note.id}
                  draggable
                  {...createDragHandlers(note.id)}
                >
                  <div className="note-float-item-head">
                    <i className="ti ti-grip-vertical note-drag-handle" title="Arrastar" />
                    <span className="note-float-title">{note.title}</span>
                    <button
                      className={`note-float-strike-btn ${struck ? 'active' : ''}`}
                      type="button"
                      onClick={() => toggleStrike(note.id)}
                      title={struck ? 'Desriscar' : 'Riscar nota'}
                    >
                      <i className={`ti ti-${struck ? 'x' : 'strikethrough'}`} />
                    </button>
                  </div>
                  <div className="note-float-preview" dangerouslySetInnerHTML={{ __html: note.body }} />
                </div>
              );
            })
          )}
        </div>

        <div className="resize-handle" />
      </div>

      <button className={`notes-restore-tab ${collapsed ? '' : 'hidden'}`} type="button" onClick={() => setCollapsed(false)}>
        <i className="ti ti-notes" />
        <span className="notes-restore-label">NOTAS</span>
      </button>
    </>
  );
}
