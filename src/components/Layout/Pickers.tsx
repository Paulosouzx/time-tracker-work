import { useState, useEffect, useRef, useId } from 'react';
import { IconClock, IconCalendarEvent, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { toDStr, todayStr, fmtH, MONTH_NAMES } from '../../utils';

import './Pickers.css';

function useDismiss(ref: React.RefObject<HTMLElement>, open: boolean, close: () => void) {
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close();
      }
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [ref, open, close]);
}

interface TimePickerProps {
  value: number;
  onChange: (h: number) => void;
}

export function TimePicker({ value, onChange }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listId = useId();
  useDismiss(ref, open, () => setOpen(false));

  const options: number[] = [];
  for (let i = 0.25; i <= 12; i += 0.25) options.push(i);

  useEffect(() => {
    if (open && ref.current) {
      const active = ref.current.querySelector('[aria-selected="true"]') as HTMLElement | null;
      active?.scrollIntoView({ block: 'nearest' });
      active?.focus();
    }
  }, [open]);

  return (
    <div className="picker" ref={ref}>
      <span className="field-label" id={`${listId}-lbl`}>Tempo</span>
      <button
        type="button"
        className={`picker-trigger ${open ? 'open' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${listId}-lbl`}
        onClick={() => setOpen((v) => !v)}
      >
        <IconClock size={18} stroke={1.75} />
        <span className="tabular">{fmtH(value)}</span>
      </button>
      {open && (
        <div className="picker-dropdown" role="listbox" aria-labelledby={`${listId}-lbl`}>
          {options.map((v) => (
            <button
              type="button"
              key={v}
              role="option"
              aria-selected={v === value}
              className="picker-item tabular"
              onClick={() => { onChange(v); setOpen(false); }}
            >
              {fmtH(v)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface CalendarPickerProps {
  value: Date;
  onChange: (d: Date) => void;
  alignRight?: boolean;
  showTodayBtn?: boolean;
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function CalendarPicker({ value, onChange, alignRight = false, showTodayBtn = true }: CalendarPickerProps) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date(value));
  const ref = useRef<HTMLDivElement>(null);
  const labelId = useId();
  useDismiss(ref, open, () => setOpen(false));

  function handleOpen() {
    setViewDate(new Date(value));
    setOpen((v) => !v);
  }

  function shiftMonth(delta: number) {
    setViewDate((d) => {
      const n = new Date(d);
      n.setDate(1);
      n.setMonth(n.getMonth() + delta);
      return n;
    });
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
    <div className="picker" ref={ref}>
      <span className="field-label" id={labelId}>Data</span>
      <button
        type="button"
        className={`picker-trigger ${open ? 'open' : ''}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-labelledby={labelId}
        onClick={handleOpen}
      >
        <IconCalendarEvent size={18} stroke={1.75} />
        <span className="tabular">{label}</span>
      </button>

      {open && (
        <div className={`cal-dropdown ${alignRight ? 'align-right' : ''}`} role="dialog" aria-label="Escolher data">
          <div className="cal-header">
            <span className="cal-month-title">{MONTH_NAMES[month]} {year}</span>
            <div className="cal-arrows">
              <button type="button" className="btn-icon" onClick={() => shiftMonth(-1)} aria-label="Mês anterior">
                <IconChevronLeft size={18} stroke={1.75} />
              </button>
              <button type="button" className="btn-icon" onClick={() => shiftMonth(1)} aria-label="Mês seguinte">
                <IconChevronRight size={18} stroke={1.75} />
              </button>
            </div>
          </div>

          <div className="cal-weekdays" aria-hidden="true">
            {WEEKDAYS.map((w) => <div key={w} className="cal-wday">{w}</div>)}
          </div>

          <div className="cal-days-grid">
            {days.map((day, i) => {
              if (!day) return <div key={`e-${i}`} className="cal-day empty" />;
              const isSelected = day === value.getDate() && month === value.getMonth() && year === value.getFullYear();
              const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              return (
                <button
                  type="button"
                  key={day}
                  className={`cal-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                  aria-pressed={isSelected}
                  aria-label={new Date(year, month, day).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}
                  onClick={() => { onChange(new Date(year, month, day)); setOpen(false); }}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {showTodayBtn && (
            <div className="cal-footer">
              <button type="button" className="btn-secondary" onClick={() => { onChange(new Date()); setOpen(false); }}>
                Hoje
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface FloatInputProps {
  label: string;
  id: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  style?: React.CSSProperties;
  inputRef?: React.Ref<HTMLInputElement>;
  invalid?: boolean;
  list?: string;
}

export function FloatInput({ label, id, type = 'text', placeholder, value, onChange, style, inputRef, invalid, list }: FloatInputProps) {
  return (
    <div className="field" style={style}>
      <label className="field-label" htmlFor={id}>{label}</label>
      <input
        id={id}
        ref={inputRef}
        className="input"
        type={type}
        placeholder={placeholder}
        value={value}
        aria-invalid={invalid || undefined}
        list={list}
        autoComplete={list ? 'off' : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
