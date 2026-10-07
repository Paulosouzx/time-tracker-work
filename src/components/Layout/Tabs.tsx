import { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { todayStr, toDStr, getWeekKey, fmtH } from '../../utils';
import { TabId } from '../../types';
import './Tabs.css';

const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

function getWeekStartDate(weekKey: string) {
  const [day, month, year] = weekKey.split('/').map(Number);
  return new Date(year, month - 1, day);
}

export function WeekSummary() {
  const { entries, holidays, showHolidays, setActiveTab, activeTab } = useApp();
  const today = todayStr();
  const weekKey = getWeekKey(today);
  const weekStart = useMemo(() => getWeekStartDate(weekKey), [weekKey]);

  const weekEntries = useMemo(
    () => entries.filter(entry => getWeekKey(entry.date) === weekKey),
    [entries, weekKey],
  );

  const totalWeek = useMemo(
    () => weekEntries.reduce((sum, entry) => sum + entry.h, 0),
    [weekEntries],
  );

  const progressColor = totalWeek >= 40 ? 'var(--ok)' : totalWeek >= 32 ? 'var(--warn)' : 'var(--primary)';

  const dayChips = useMemo(
    () => DAYS.map((label, index) => {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + index);
      const dateKey = toDStr(dayDate);
      const dayHours = entries.filter(entry => entry.date === dateKey).reduce((sum, entry) => sum + entry.h, 0);
      const holiday = showHolidays ? holidays.find(item => item.date === dateKey) : undefined;
      return { label, dateKey, hours: dayHours, holiday, date: dayDate };
    }),
    [entries, holidays, showHolidays, weekStart],
  );

  function selectDay(date: Date) {
    if (activeTab !== 'reg') setActiveTab('reg');
    window.dispatchEvent(new CustomEvent('tt:selectDate', { detail: { date } }));
  }

  return (
    <div className="week-block">
      <div className="week-row">
        <div>
          <div className="week-label">Esta semana</div>
          <div className="week-sub">{fmtH(totalWeek)} de 40h registadas</div>
        </div>
        <div className="week-hours" style={{ color: progressColor }}>{fmtH(totalWeek)}</div>
      </div>
      <div className="week-bar-bg">
        <div className="week-bar-fill" style={{ width: `${Math.min(100, Math.round((totalWeek / 40) * 100))}%`, background: progressColor }} />
      </div>
      <div className="week-chips">
        {dayChips.map(({ label, dateKey, hours, holiday, date }) => (
          <button
            key={dateKey}
            type="button"
            className={`chip ${dateKey === today ? 'active' : ''} ${holiday ? 'holiday' : ''}`}
            title={holiday?.name}
            onClick={() => !holiday && selectDay(date)}
          >
            {label} {fmtH(hours)}
            {holiday && <span className="holiday-badge" title={holiday.name}>F</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Tabs() {
  const { activeTab, setActiveTab, notes } = useApp();
  const activeNotes = useMemo(() => notes.filter(note => !note.done).length, [notes]);

  const tabs: { id: TabId; label: string }[] = [
    { id: 'reg', label: 'Registar' },
    { id: 'dash', label: 'Dashboard' },
    { id: 'hist', label: 'Histórico' },
    { id: 'notes', label: 'Notas' },
  ];

  return (
    <div className="tabs">
      {tabs.map(tab => (
        <button
          key={tab.id}
          type="button"
          className={`tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.label}
          {tab.id === 'notes' && activeNotes > 0 && <span className="notes-badge">{activeNotes}</span>}
        </button>
      ))}
    </div>
  );
}
