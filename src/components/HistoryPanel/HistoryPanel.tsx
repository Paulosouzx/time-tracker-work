import { useMemo, useState } from 'react';
import { IconDatabaseOff } from '@tabler/icons-react';
import { useApp } from '../../context/AppContext';
import { getWeekKey, weekRangeLabel, getWeekNumber, fmtH, dateSortKey, sortEntriesDesc } from '../../utils';
import { Entry } from '../../types';
import EntryCard from '../Entries/EntryCard';
import EntryEditModal from '../Entries/EntryEditModal';
import './HistoryPanel.css';

export default function HistoryPanel() {
  const { entries, saveEntries, showSync } = useApp();
  const [weekFilter, setWeekFilter] = useState('all');
  const [editEntry, setEditEntry] = useState<Entry | null>(null);

  const weekKeys = useMemo(
    () => [...new Set(entries.map((entry) => getWeekKey(entry.date)))].sort((a, b) => dateSortKey(b).localeCompare(dateSortKey(a))),
    [entries],
  );

  const groups = useMemo(() => {
    const list = weekFilter === 'all' ? entries : entries.filter((entry) => getWeekKey(entry.date) === weekFilter);
    const map = new Map<string, Entry[]>();
    sortEntriesDesc(list).forEach((entry) => {
      const key = getWeekKey(entry.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(entry);
    });
    return [...map.entries()].map(([key, items]) => ({
      key,
      items,
      total: items.reduce((sum, item) => sum + item.h, 0),
    }));
  }, [entries, weekFilter]);

  function updateSync(entry: Entry, checked: boolean) {
    saveEntries(entries.map((item) => (item.id === entry.id ? { ...item, sync: checked } : item)));
  }

  return (
    <div className="history">
      <div className="history-filter">
        <label className="field-label" htmlFor="histWeek">Semana</label>
        <select id="histWeek" className="week-select" value={weekFilter} onChange={(e) => setWeekFilter(e.target.value)}>
          <option value="all">Todas as semanas</option>
          {weekKeys.map((key) => (
            <option key={key} value={key}>
              Semana {getWeekNumber(key)} ({weekRangeLabel(key)})
            </option>
          ))}
        </select>
      </div>

      {groups.length === 0 ? (
        <div className="card empty-state">
          <span className="empty-icon"><IconDatabaseOff size={26} stroke={1.75} /></span>
          Nenhuma entrada registada
        </div>
      ) : (
        groups.map((group) => {
          const status = group.total >= 40 ? 'ok' : group.total >= 32 ? 'warn' : 'short';
          return (
            <section key={group.key} className="day-group" aria-labelledby={`wk-${group.key}`}>
              <div className="day-group-head">
                <h2 className="day-group-title" id={`wk-${group.key}`}>
                  Semana {getWeekNumber(group.key)} <span className="history-range tabular">{weekRangeLabel(group.key)}</span>
                </h2>
                <span className={`week-total-badge ${status} tabular`}>{fmtH(group.total)}</span>
              </div>
              <div className="entry-list">
                {group.items.map((entry) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    showSync={showSync}
                    showDate
                    onEdit={setEditEntry}
                    onToggleSync={updateSync}
                  />
                ))}
              </div>
            </section>
          );
        })
      )}

      {editEntry && <EntryEditModal entry={editEntry} onClose={() => setEditEntry(null)} />}
    </div>
  );
}
