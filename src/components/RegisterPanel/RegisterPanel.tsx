import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import './RegisterPanel.css';
import { TimePicker, CalendarPicker, FloatInput } from '../Layout/Pickers';
import { todayStr, toDStr, fmtH } from '../../utils';
import { Entry } from '../../types';

function parseDate(dateString: string) {
  const [day, month, year] = dateString.split('/').map(Number);
  return new Date(year, month - 1, day);
}

function EditModal({ entry, onClose }: { entry: Entry; onClose: () => void }) {
  const { entries, saveEntries } = useApp();
  const [hours, setHours] = useState(entry.h);
  const [project, setProject] = useState(entry.proj);
  const [description, setDescription] = useState(entry.desc);
  const [link, setLink] = useState(entry.link || '');
  const [date, setDate] = useState(parseDate(entry.date));

  function saveEntry() {
    const updated = entries.map(current =>
      current.id === entry.id
        ? { ...current, h: hours, proj: project.trim(), desc: description.trim(), link: link.trim(), date: toDStr(date) }
        : current,
    );
    saveEntries(updated);
    onClose();
  }

  return (
    <div className="modal-bg open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>Editar entrada</h2>
          <button className="btn-icon" onClick={onClose}><i className="ti ti-x" /></button>
        </div>

        <div className="modal-grid">
          <TimePicker value={hours} onChange={setHours} />
          <FloatInput label="Projeto" id="mProj" value={project} onChange={setProject} />
        </div>

        <div className="modal-section">
          <CalendarPicker value={date} onChange={setDate} />
        </div>

        <FloatInput label="Descrição" id="mDesc" value={description} onChange={setDescription} style={{ marginBottom: 12 }} />
        <FloatInput
          label="Link da Case (opcional)"
          id="mLink"
          type="url"
          placeholder="https://…"
          value={link}
          onChange={setLink}
          style={{ marginTop: 12 }}
        />

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="btn-save" onClick={saveEntry}>Guardar Alterações</button>
        </div>
      </div>
    </div>
  );
}

function TodayTable({ onEdit }: { onEdit: (entry: Entry) => void }) {
  const { entries, saveEntries, showSync } = useApp();
  const today = todayStr();

  const todayEntries = useMemo(() => entries.filter(entry => entry.date === today), [entries, today]);
  const totalToday = useMemo(() => todayEntries.reduce((sum, entry) => sum + entry.h, 0), [todayEntries]);
  const progress = Math.min(100, Math.round((totalToday / 8) * 100));
  const progressColor = totalToday >= 8 ? 'var(--ok)' : totalToday >= 6 ? 'var(--warn)' : 'var(--primary)';

  function deleteEntry(entryId: string) {
    if (!confirm('Deseja eliminar este registo?')) return;
    saveEntries(entries.filter(entry => entry.id !== entryId));
  }

  function updateSync(entryId: string, checked: boolean) {
    saveEntries(entries.map(entry => (entry.id === entryId ? { ...entry, sync: checked } : entry)));
  }

  return (
    <>
      <div className="today-bar">
        <span className="today-label">Hoje</span>
        <div className="bar-mini">
          <div className="bar-mini-fill" style={{ width: `${progress}%`, background: progressColor }} />
        </div>
        <span className="today-remaining" style={{ color: progressColor }}>
          {8 - totalToday > 0 ? `${fmtH(8 - totalToday)} restantes` : 'completo!'}
        </span>
        <span className="today-h" style={{ color: progressColor }}>{fmtH(totalToday)}</span>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {showSync && <th className="sync-header"><i className="ti ti-check" /></th>}
              <th>Data</th>
              <th>Projeto</th>
              <th>Descrição</th>
              <th>Link</th>
              <th>Horas</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {todayEntries.map(entry => (
              <tr key={entry.id}>
                {showSync && (
                  <td className="td-sync-cell">
                    <input
                      type="checkbox"
                      checked={!!entry.sync}
                      onChange={event => updateSync(entry.id, event.target.checked)}
                    />
                  </td>
                )}
                <td className="td-date">{entry.date}</td>
                <td className="td-proj">{entry.proj}</td>
                <td className="td-desc">{entry.desc}</td>
                <td className="td-link">
                  {entry.link ? (
                    <a href={entry.link} target="_blank" rel="noopener noreferrer" title={entry.link}>
                      <i className="ti ti-external-link td-link-icon" />
                    </a>
                  ) : null}
                </td>
                <td className="td-h">{fmtH(entry.h)}</td>
                <td className="td-actions">
                  <button className="btn-icon" onClick={() => onEdit(entry)}><i className="ti ti-pencil" /></button>
                  <button className="btn-icon del" onClick={() => deleteEntry(entry.id)}><i className="ti ti-trash" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {todayEntries.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon"><i className="ti ti-clock-pause" /></div>
            Nenhuma entrada hoje ainda
          </div>
        )}
      </div>
    </>
  );
}

export default function RegisterPanel() {
  const { entries, saveEntries } = useApp();
  const [hours, setHours] = useState(1.0);
  const [project, setProject] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [date, setDate] = useState(new Date());
  const [editEntry, setEditEntry] = useState<Entry | null>(null);

  useEffect(() => {
    function handleDateSelect(event: Event) {
      const customEvent = event as CustomEvent<{ date: string | Date }>;
      setDate(new Date(customEvent.detail.date));
    }

    window.addEventListener('tt:selectDate', handleDateSelect);
    return () => window.removeEventListener('tt:selectDate', handleDateSelect);
  }, []);

  function addEntry() {
    if (!project.trim()) {
      alert('Por favor, preencha o nome do projeto.');
      return;
    }

    saveEntries([
      ...entries,
      {
        id: `t_${Date.now()}`,
        h: hours,
        proj: project.trim(),
        date: toDStr(date),
        desc: description.trim(),
        link: link.trim(),
        sync: false,
      },
    ]);

    setProject('');
    setDescription('');
    setLink('');
    setHours(1.0);
    setDate(new Date());
  }

  return (
    <div id="panelReg" className="panel active">
      <div className="form-card">
        <div className="form-grid">
          <TimePicker value={hours} onChange={setHours} />
          <FloatInput label="Projeto" id="eProj" placeholder="ex: Firstbike" value={project} onChange={setProject} />
          <CalendarPicker value={date} onChange={setDate} alignRight />
        </div>

        <div className="form-full">
          <FloatInput label="Descrição" id="eDesc" placeholder="O que foi feito…" value={description} onChange={setDescription} style={{ marginBottom: 14 }} />
          <FloatInput
            label="Link da Case (opcional)"
            id="eLink"
            type="url"
            placeholder="https://…"
            value={link}
            onChange={setLink}
            style={{ marginBottom: 14 }}
          />
        </div>

        <button className="btn-add" onClick={addEntry}>
          <i className="ti ti-plus" /> Registar Entrada
        </button>
      </div>

      <TodayTable onEdit={setEditEntry} />
      {editEntry && <EditModal entry={editEntry} onClose={() => setEditEntry(null)} />}
    </div>
  );
}
