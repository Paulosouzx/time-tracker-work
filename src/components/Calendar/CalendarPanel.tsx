import { useMemo, useState } from 'react';
import { IconChevronLeft, IconChevronRight, IconPlus, IconConfetti, IconCalendarEvent } from '@tabler/icons-react';
import { useApp } from '../../context/AppContext';
import { Entry } from '../../types';
import { toDStr, todayStr, getWeekKey, parseDStr, fmtH, projectTone, longDayLabel, MONTH_NAMES } from '../../utils';
import { setPendingRegisterDate } from '../../router';
import EntryEditModal from '../Entries/EntryEditModal';
import './CalendarPanel.css';

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const HOUR_PX = 28;

export default function CalendarPanel() {
  const { entries, holidays, showHolidays, setActiveTab } = useApp();
  const [selected, setSelected] = useState(() => new Date());
  const [editEntry, setEditEntry] = useState<Entry | null>(null);

  const today = todayStr();
  const selectedKey = toDStr(selected);
  const weekStart = useMemo(() => parseDStr(getWeekKey(selectedKey)), [selectedKey]);

  const week = useMemo(() => WEEKDAYS.map((label, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    const key = toDStr(date);
    return {
      label,
      date,
      key,
      items: entries.filter((entry) => entry.date === key),
      hours: entries.filter((entry) => entry.date === key).reduce((sum, entry) => sum + entry.h, 0),
      holiday: showHolidays ? holidays.find((item) => item.date === key) : undefined,
    };
  }), [weekStart, entries, holidays, showHolidays]);

  const dayEntries = useMemo(() => entries.filter((entry) => entry.date === selectedKey), [entries, selectedKey]);
  const dayTotal = dayEntries.reduce((sum, entry) => sum + entry.h, 0);
  const holiday = showHolidays ? holidays.find((item) => item.date === selectedKey) : undefined;

  function shiftWeek(delta: number) {
    setSelected((current) => {
      const next = new Date(current);
      next.setDate(next.getDate() + delta * 7);
      return next;
    });
  }

  function addOnDay() {
    setPendingRegisterDate(selected);
    setActiveTab('reg');
  }

  const sunday = week[6].date;
  const monthLabel = weekStart.getMonth() === sunday.getMonth()
    ? `${MONTH_NAMES[weekStart.getMonth()]} ${weekStart.getFullYear()}`
    : `${MONTH_NAMES[weekStart.getMonth()].slice(0, 3)} – ${MONTH_NAMES[sunday.getMonth()].slice(0, 3)} ${sunday.getFullYear()}`;

  return (
    <div className="calendar">
      <section className="card cal-week" aria-label="Semana">
        <div className="cal-week-head">
          <h2 className="cal-week-title">{monthLabel}</h2>
          <div className="cal-week-nav">
            <button type="button" className="btn-icon" onClick={() => shiftWeek(-1)} aria-label="Semana anterior">
              <IconChevronLeft size={20} stroke={1.75} />
            </button>
            <button type="button" className="chip-filter cal-today-btn" onClick={() => setSelected(new Date())}>Hoje</button>
            <button type="button" className="btn-icon" onClick={() => shiftWeek(1)} aria-label="Semana seguinte">
              <IconChevronRight size={20} stroke={1.75} />
            </button>
          </div>
        </div>

        <div className="cal-strip" role="group" aria-label="Dias da semana">
          {week.map((day) => {
            const isToday = day.key === today;
            const isSelected = day.key === selectedKey;
            return (
              <button
                key={day.key}
                type="button"
                className={`cal-strip-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                aria-pressed={isSelected}
                aria-label={`${longDayLabel(day.date)}, ${fmtH(day.hours)}${day.holiday ? `, feriado: ${day.holiday.name}` : ''}`}
                onClick={() => setSelected(day.date)}
              >
                <span className="cal-strip-wday">{day.label}</span>
                <span className="cal-strip-num tabular">{day.date.getDate()}</span>
                <span className={`cal-strip-dot ${day.holiday ? 'holiday' : day.hours > 0 ? 'has-hours' : ''}`} aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </section>

      <section className="cal-board" aria-label="Semana completa">
        {week.map((day) => {
          const isToday = day.key === today;
          const isSelected = day.key === selectedKey;
          return (
            <div key={day.key} className={`cal-col ${isSelected ? 'selected' : ''} ${day.holiday ? 'holiday' : ''}`}>
              <button
                type="button"
                className={`cal-col-head ${isToday ? 'today' : ''}`}
                aria-pressed={isSelected}
                aria-label={`${longDayLabel(day.date)}, ${fmtH(day.hours)}`}
                onClick={() => setSelected(day.date)}
              >
                <span className="cal-strip-wday">{day.label}</span>
                <span className="cal-strip-num tabular">{day.date.getDate()}</span>
                <span className="cal-col-total tabular">{fmtH(day.hours)}</span>
              </button>
              {day.holiday && (
                <div className="cal-col-holiday" title={day.holiday.name}>
                  <IconConfetti size={14} stroke={1.75} /> {day.holiday.name}
                </div>
              )}
              <div className="cal-col-body">
                {day.items.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    className={`cal-block tone-${projectTone(entry.proj)}`}
                    style={{ minHeight: Math.max(56, entry.h * HOUR_PX) }}
                    onClick={() => setEditEntry(entry)}
                    aria-label={`Editar ${entry.desc || entry.proj}, ${fmtH(entry.h)}`}
                  >
                    <span className="cal-block-title">{entry.desc || entry.proj}</span>
                    <span className="cal-block-meta">
                      <span>{entry.proj}</span>
                      <span className="tabular">{fmtH(entry.h)}</span>
                    </span>
                  </button>
                ))}
                <button
                  type="button"
                  className="cal-col-add"
                  onClick={() => { setPendingRegisterDate(day.date); setActiveTab('reg'); }}
                  aria-label={`Registar em ${longDayLabel(day.date)}`}
                >
                  <IconPlus size={16} stroke={2} />
                </button>
              </div>
            </div>
          );
        })}
      </section>

      <section className="cal-dayview" aria-labelledby="calDayTitle">
        <div className="day-group-head">
          <h2 className="day-group-title" id="calDayTitle">{longDayLabel(selected)}</h2>
          <span className="day-group-total tabular">{fmtH(dayTotal)}</span>
        </div>

        {holiday && (
          <div className="cal-holiday" role="note">
            <IconConfetti size={20} stroke={1.75} />
            <span>Feriado · {holiday.name}</span>
          </div>
        )}

        {dayEntries.length > 0 ? (
          <div className="cal-blocks">
            {dayEntries.map((entry) => {
              const tone = projectTone(entry.proj);
              return (
                <button
                  key={entry.id}
                  type="button"
                  className={`cal-block tone-${tone}`}
                  style={{ minHeight: Math.max(64, entry.h * HOUR_PX) }}
                  onClick={() => setEditEntry(entry)}
                  aria-label={`Editar ${entry.desc || entry.proj}, ${fmtH(entry.h)}`}
                >
                  <span className="cal-block-title">{entry.desc || entry.proj}</span>
                  <span className="cal-block-meta">
                    <span>{entry.proj}</span>
                    <span className="tabular">{fmtH(entry.h)}</span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="card empty-state">
            <span className="empty-icon"><IconCalendarEvent size={26} stroke={1.75} /></span>
            Sem entradas neste dia
          </div>
        )}

        <button type="button" className="btn-secondary cal-add" onClick={addOnDay}>
          <IconPlus size={18} stroke={2} /> Registar neste dia
        </button>
      </section>

      {editEntry && <EntryEditModal entry={editEntry} onClose={() => setEditEntry(null)} />}
    </div>
  );
}
