import { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import './HistoryPanel.css';
import { getWeekKey, weekRangeLabel, getWeekNumber, fmtH, toDStr } from '../../utils';
import { Entry } from '../../types';
import { TimePicker, CalendarPicker, FloatInput } from '../Layout/Pickers';

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

  function saveChanges() {
    const updatedEntries = entries.map(item =>
      item.id === entry.id
        ? { ...item, h: hours, proj: project.trim(), desc: description.trim(), link: link.trim(), date: toDStr(date) }
        : item,
    );
    saveEntries(updatedEntries);
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
          <FloatInput label="Projeto" id="hProj" value={project} onChange={setProject} />
        </div>

        <div className="modal-section">
          <CalendarPicker value={date} onChange={setDate} />
        </div>

        <FloatInput label="Descrição" id="hDesc" value={description} onChange={setDescription} style={{ marginBottom: 12 }} />
        <FloatInput
          label="Link da Case (opcional)"
          id="hLink"
          type="url"
          placeholder="https://…"
          value={link}
          onChange={setLink}
          style={{ marginTop: 12 }}
        />

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="btn-save" onClick={saveChanges}>Guardar Alterações</button>
        </div>
      </div>
    </div>
  );
}

function sortByDateDesc(list: Entry[]) {
  return [...list].sort((a, b) => b.date.split('/').reverse().join('').localeCompare(a.date.split('/').reverse().join('')));
}

export default function HistoryPanel() {
  const { entries, saveEntries, showSync } = useApp();
  const [weekFilter, setWeekFilter] = useState('all');
  const [editEntry, setEditEntry] = useState<Entry | null>(null);

  const weekKeys = useMemo(
    () => [...new Set(entries.map(entry => getWeekKey(entry.date)))].sort((a, b) => b.split('/').reverse().join('').localeCompare(a.split('/').reverse().join(''))),
    [entries],
  );

  const filteredEntries = useMemo(() => {
    const list = weekFilter === 'all' ? entries : entries.filter(entry => getWeekKey(entry.date) === weekFilter);
    return sortByDateDesc(list);
  }, [entries, weekFilter]);

  function deleteEntry(entryId: string) {
    if (!confirm('Deseja eliminar este registo?')) return;
    saveEntries(entries.filter(item => item.id !== entryId));
  }

  function updateSync(entryId: string, checked: boolean) {
    saveEntries(entries.map(item => (item.id === entryId ? { ...item, sync: checked } : item)));
  }

  const rows = useMemo(() => {
    const groupRows: JSX.Element[] = [];
    let currentWeek: string | null = null;

    filteredEntries.forEach(entry => {
      const entryWeek = getWeekKey(entry.date);
      if (entryWeek !== currentWeek) {
        currentWeek = entryWeek;
        const weekSum = filteredEntries.filter(item => getWeekKey(item.date) === entryWeek).reduce((sum, item) => sum + item.h, 0);
        const badgeClass = weekSum >= 40 ? 'ok' : weekSum >= 32 ? 'warn' : 'short';
        groupRows.push(
          <tr key={`week-${entryWeek}`} className="week-group-row">
            <td colSpan={showSync ? 7 : 6}>
              Semana {getWeekNumber(entryWeek)} ({weekRangeLabel(entryWeek)})
              <span className={`week-total-badge ${badgeClass}`}>{fmtH(weekSum)}</span>
            </td>
          </tr>,
        );
      }

      groupRows.push(
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
              <a href={entry.link} target="_blank" rel="noopener noreferrer" className="td-link-wrapper" title="Abrir link">
                <i className="ti ti-external-link td-link-icon" />
              </a>
            ) : null}
          </td>
          <td className="td-h">{fmtH(entry.h)}</td>
          <td className="td-actions">
            <button className="btn-icon" onClick={() => setEditEntry(entry)}><i className="ti ti-pencil" /></button>
            <button className="btn-icon del" onClick={() => deleteEntry(entry.id)}><i className="ti ti-trash" /></button>
          </td>
        </tr>,
      );
    });

    return groupRows;
  }, [filteredEntries, showSync, saveEntries]);

  return (
    <div id="panelHist" className="panel active">
      <div className="hist-filter">
        <span className="hist-filter-label">Semana</span>
        <select className="week-select" value={weekFilter} onChange={e => setWeekFilter(e.target.value)}>
          <option value="all">Todas as semanas</option>
          {weekKeys.map(key => (
            <option key={key} value={key}>
              Semana {getWeekNumber(key)} ({weekRangeLabel(key)})
            </option>
          ))}
        </select>
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
          <tbody>{rows}</tbody>
        </table>

        {filteredEntries.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon"><i className="ti ti-database-off" /></div>
            Nenhuma entrada registada
          </div>
        )}
      </div>

      {editEntry && <EditModal entry={editEntry} onClose={() => setEditEntry(null)} />}
    </div>
  );
}
