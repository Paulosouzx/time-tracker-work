import { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { todayStr, toDStr, getWeekKey, parseDStr, fmtH } from '../../utils';
import { setPendingRegisterDate } from '../../router';
import './WeekSummary.css';

const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export default function WeekSummary() {
  const { entries, holidays, showHolidays, setActiveTab, activeTab } = useApp();
  const today = todayStr();
  const weekKey = getWeekKey(today);
  const weekStart = useMemo(() => parseDStr(weekKey), [weekKey]);

  const totalWeek = useMemo(
    () => entries.filter((entry) => getWeekKey(entry.date) === weekKey).reduce((sum, entry) => sum + entry.h, 0),
    [entries, weekKey],
  );

  const dayChips = useMemo(
    () => DAYS.map((label, index) => {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + index);
      const dateKey = toDStr(dayDate);
      const hours = entries.filter((entry) => entry.date === dateKey).reduce((sum, entry) => sum + entry.h, 0);
      const holiday = showHolidays ? holidays.find((item) => item.date === dateKey) : undefined;
      return { label, dateKey, hours, holiday, date: dayDate };
    }),
    [entries, holidays, showHolidays, weekStart],
  );

  const progress = Math.min(100, Math.round((totalWeek / 40) * 100));

  function selectDay(date: Date) {
    setPendingRegisterDate(date);
    if (activeTab !== 'reg') setActiveTab('reg');
  }

  return (
    <section className="card week-card" aria-labelledby="weekTitle">
      <div className="week-row">
        <div>
          <h2 className="week-label" id="weekTitle">Esta semana</h2>
          <p className="week-sub">{fmtH(totalWeek)} de 40h registadas</p>
        </div>
        <div className="week-hours tabular">{fmtH(totalWeek)}</div>
      </div>
      <div className="week-bar" role="progressbar" aria-valuemin={0} aria-valuemax={40} aria-valuenow={totalWeek} aria-label="Progresso semanal">
        <div className="week-bar-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="week-days">
        {dayChips.map(({ label, dateKey, hours, holiday, date }) => (
          <button
            key={dateKey}
            type="button"
            className={`week-day ${dateKey === today ? 'today' : ''} ${holiday ? 'holiday' : ''}`}
            title={holiday?.name}
            disabled={!!holiday}
            aria-label={`${label}, ${fmtH(hours)}${holiday ? `, feriado: ${holiday.name}` : ''}`}
            onClick={() => selectDay(date)}
          >
            <span className="week-day-name">{label}</span>
            <span className="week-day-hours tabular">{holiday ? 'Feriado' : fmtH(hours)}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
