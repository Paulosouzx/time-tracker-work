import { useState, useEffect, useRef } from 'react';
import { toDStr, todayStr, fmtH, MONTH_NAMES } from '../../utils';
import './Pickers.css';

interface TimePickerProps {
  value: number;
  onChange: (h: number) => void;
  triggerId?: string;
}

export function TimePicker({ value, onChange }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const options: number[] = [];
  for (let i = 0.25; i <= 12; i += 0.25) options.push(i);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  useEffect(() => {
    if (open && ref.current) {
      const active = ref.current.querySelector('.selected') as HTMLElement | null;
      if (active) active.scrollIntoView({ block: 'nearest' });
    }
  }, [open]);

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <div
        className={`custom-field ${open ? 'active-focus' : ''}`}
        onClick={() => setOpen(v => !v)}
      >
        <span className="field-label">Tempo</span>
        <span className="field-value">
          <i className="ti ti-clock"/>
          <span>{fmtH(value)}</span>
        </span>
      </div>
      <div className={`picker-dropdown ${open ? 'open' : ''}`}>
        {options.map(v => (
          <div
            key={v}
            className={`picker-item ${v === value ? 'selected' : ''}`}
            onClick={e => { e.stopPropagation(); onChange(v); setOpen(false); }}
          >
            {fmtH(v)}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Calendar Picker ───────────────────────────────────
interface CalendarPickerProps {
  value: Date;
  onChange: (d: Date) => void;
  alignRight?: boolean;
  showTodayBtn?: boolean;
}

export function CalendarPicker({ value, onChange, alignRight = false, showTodayBtn = true }: CalendarPickerProps) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date(value));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  function handleOpen() {
    setViewDate(new Date(value));
    setOpen(v => !v);
  }

  const ds = toDStr(value);
  const label = ds === todayStr() ? 'Hoje' : ds;

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const days: (number | null)[] = [...Array(firstDayIndex).fill(null)];
  for (let d = 1; d <= lastDay; d++) days.push(d);

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <div className={`custom-field ${open ? 'active-focus' : ''}`} onClick={handleOpen}>
        <span className="field-label">Data</span>
        <span className="field-value">
          <i className="ti ti-calendar"/>
          <span>{label}</span>
        </span>
      </div>

      <div className={`cal-dropdown ${open ? 'open' : ''}`} style={alignRight ? { right: 0, left: 'auto' } : {}}>
        <div className="cal-header">
          <span className="cal-month-title">{MONTH_NAMES[month]} {year}</span>
          <div className="cal-arrows">
            <button className="cal-btn" onClick={e => { e.stopPropagation(); setViewDate(d => { const n = new Date(d); n.setMonth(n.getMonth()-1); return n; }); }}>
              <i className="ti ti-chevron-left"/>
            </button>
            <button className="cal-btn" onClick={e => { e.stopPropagation(); setViewDate(d => { const n = new Date(d); n.setMonth(n.getMonth()+1); return n; }); }}>
              <i className="ti ti-chevron-right"/>
            </button>
          </div>
        </div>

        <div className="cal-weekdays">
          {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(w => (
            <div key={w} className="cal-wday">{w}</div>
          ))}
        </div>

        <div className="cal-days-grid">
          {days.map((day, i) => {
            if (!day) return <div key={`e-${i}`} className="cal-day empty"/>;
            const isSelected = day === value.getDate() && month === value.getMonth() && year === value.getFullYear();
            const isToday    = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            return (
              <div
                key={day}
                className={`cal-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                onClick={e => { e.stopPropagation(); onChange(new Date(year, month, day)); setOpen(false); }}
              >
                {day}
              </div>
            );
          })}
        </div>

        {showTodayBtn && (
          <div className="cal-footer">
            <button className="btn-cal-clear" onClick={e => { e.stopPropagation(); onChange(new Date()); setOpen(false); }}>
              Hoje
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Floating Input Field ──────────────────────────────
interface FloatInputProps {
  label: string;
  id: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  style?: React.CSSProperties;
}

export function FloatInput({ label, id, type = 'text', placeholder, value, onChange, style }: FloatInputProps) {
  return (
    <div className="fi-wrapper" style={style}>
      <span className="fl-inner">{label}</span>
      <input
        id={id}
        className="fi"
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}
