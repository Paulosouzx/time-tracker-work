import { useEffect, useRef, useState } from 'react';
import { IconTrash, IconX } from '@tabler/icons-react';
import { useApp } from '../../context/AppContext';
import { Entry } from '../../types';
import { parseDStr, toDStr } from '../../utils';
import { TimePicker, CalendarPicker, FloatInput } from '../Layout/Pickers';
import './Entries.css';

export default function EntryEditModal({ entry, onClose }: { entry: Entry; onClose: () => void }) {
  const { entries, saveEntries } = useApp();
  const [hours, setHours] = useState(entry.h);
  const [project, setProject] = useState(entry.proj);
  const [description, setDescription] = useState(entry.desc);
  const [link, setLink] = useState(entry.link || '');
  const [date, setDate] = useState(parseDStr(entry.date));
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<Element | null>(document.activeElement);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    dialogRef.current?.querySelector<HTMLElement>('input')?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onCloseRef.current();
    }
    document.addEventListener('keydown', onKey);
    const previous = returnFocus.current;
    return () => {
      document.removeEventListener('keydown', onKey);
      (previous as HTMLElement | null)?.focus?.();
    };
  }, []);

  function saveEntry() {
    saveEntries(entries.map((current) =>
      current.id === entry.id
        ? { ...current, h: hours, proj: project.trim(), desc: description.trim(), link: link.trim(), date: toDStr(date) }
        : current,
    ));
    onClose();
  }

  function deleteEntry() {
    if (!confirm('Deseja eliminar este registo?')) return;
    saveEntries(entries.filter((current) => current.id !== entry.id));
    onClose();
  }

  return (
    <div className="modal-bg open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="entryEditTitle" ref={dialogRef}>
        <div className="modal-header">
          <h2 id="entryEditTitle">Editar entrada</h2>
          <button type="button" className="btn-icon" onClick={onClose} aria-label="Fechar">
            <IconX size={20} stroke={1.75} />
          </button>
        </div>

        <div className="entry-form-grid">
          <TimePicker value={hours} onChange={setHours} />
          <CalendarPicker value={date} onChange={setDate} alignRight />
        </div>
        <div className="entry-form-stack">
          <FloatInput label="Projeto" id="editProj" value={project} onChange={setProject} />
          <FloatInput label="Descrição" id="editDesc" value={description} onChange={setDescription} />
          <FloatInput label="Link da case (opcional)" id="editLink" type="url" placeholder="https://…" value={link} onChange={setLink} />
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-secondary entry-delete" onClick={deleteEntry}>
            <IconTrash size={18} stroke={1.75} /> Eliminar
          </button>
          <button type="button" className="btn-primary" onClick={saveEntry}>Guardar</button>
        </div>
      </div>
    </div>
  );
}
