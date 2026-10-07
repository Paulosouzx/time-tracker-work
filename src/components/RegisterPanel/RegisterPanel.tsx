import { useEffect, useMemo, useRef, useState } from 'react';
import { IconPlus, IconClockPause } from '@tabler/icons-react';
import { useApp } from '../../context/AppContext';
import { TimePicker, CalendarPicker, FloatInput } from '../Layout/Pickers';
import WeekSummary from '../Layout/WeekSummary';
import EntryCard from '../Entries/EntryCard';
import EntryEditModal from '../Entries/EntryEditModal';
import { todayStr, toDStr, fmtH, sortEntriesDesc } from '../../utils';
import { consumePendingRegisterDate } from '../../router';
import { Entry } from '../../types';
import './RegisterPanel.css';

type DayView = 'today' | 'previous';

function previousDayStr() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return toDStr(date);
}

export default function RegisterPanel() {
  const { entries, saveEntries, showSync } = useApp();
  const [hours, setHours] = useState(1.0);
  const [project, setProject] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [date, setDate] = useState(() => consumePendingRegisterDate() ?? new Date());
  const [error, setError] = useState('');
  const [editEntry, setEditEntry] = useState<Entry | null>(null);
  const [dayView, setDayView] = useState<DayView>('today');
  const formRef = useRef<HTMLFormElement>(null);
  const projectRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleDateSelect(event: Event) {
      const customEvent = event as CustomEvent<{ date: string | Date }>;
      consumePendingRegisterDate();
      setDate(new Date(customEvent.detail.date));
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    window.addEventListener('tt:selectDate', handleDateSelect);
    return () => window.removeEventListener('tt:selectDate', handleDateSelect);
  }, []);

  const today = todayStr();
  const dayKey = dayView === 'today' ? today : previousDayStr();
  const dayEntries = useMemo(() => entries.filter((entry) => entry.date === dayKey), [entries, dayKey]);
  const dayTotal = useMemo(() => dayEntries.reduce((sum, entry) => sum + entry.h, 0), [dayEntries]);
  const totalToday = useMemo(() => entries.filter((entry) => entry.date === today).reduce((sum, entry) => sum + entry.h, 0), [entries, today]);
  const progress = Math.min(100, Math.round((totalToday / 8) * 100));
  const knownProjects = useMemo(() => {
    const seen = new Set<string>();
    sortEntriesDesc(entries).forEach((entry) => entry.proj && seen.add(entry.proj));
    return [...seen];
  }, [entries]);
  const projectPlaceholder = knownProjects[0] ? `ex: ${knownProjects[0]}` : 'Nome do projeto';

  function addEntry(event: React.FormEvent) {
    event.preventDefault();
    if (!project.trim()) {
      setError('Por favor, preencha o nome do projeto.');
      projectRef.current?.focus();
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

    setError('');
    setProject('');
    setDescription('');
    setLink('');
    setHours(1.0);
    setDate(new Date());
  }

  function updateSync(entry: Entry, checked: boolean) {
    saveEntries(entries.map((item) => (item.id === entry.id ? { ...item, sync: checked } : item)));
  }

  return (
    <div className="home">
      <div className="home-grid">
        <div className="home-col">
          <WeekSummary />

          <form className="card register-card" ref={formRef} onSubmit={addEntry} aria-labelledby="registerTitle" noValidate>
            <h2 className="card-title" id="registerTitle">Nova entrada</h2>
            <div className="register-grid">
              <TimePicker value={hours} onChange={setHours} />
              <CalendarPicker value={date} onChange={setDate} alignRight />
            </div>
            <div className="entry-form-stack">
              <FloatInput
                label="Projeto"
                id="eProj"
                placeholder={projectPlaceholder}
                list="knownProjects"
                value={project}
                onChange={(value) => { setProject(value); if (error) setError(''); }}
                inputRef={projectRef}
                invalid={!!error}
              />
              <datalist id="knownProjects">
                {knownProjects.map((name) => <option key={name} value={name} />)}
              </datalist>
              {error && <p className="form-error" role="alert">{error}</p>}
              <FloatInput label="Descrição" id="eDesc" placeholder="O que foi feito…" value={description} onChange={setDescription} />
              <FloatInput label="Link da case (opcional)" id="eLink" type="url" placeholder="https://…" value={link} onChange={setLink} />
            </div>
            <button type="submit" className="btn-primary register-submit">
              <IconPlus size={18} stroke={2} /> Registar entrada
            </button>
          </form>
        </div>

        <div className="home-col">
          <section className="card today-card" aria-label="Progresso de hoje">
            <div className="today-row">
              <span className="today-label">Hoje</span>
              <span className="today-remaining">
                {8 - totalToday > 0 ? `${fmtH(8 - totalToday)} restantes` : 'Completo!'}
              </span>
              <span className="today-h tabular">{fmtH(totalToday)}</span>
            </div>
            <div className="week-bar" role="progressbar" aria-valuemin={0} aria-valuemax={8} aria-valuenow={totalToday} aria-label="Progresso diário">
              <div className="week-bar-fill" style={{ width: `${progress}%` }} />
            </div>
          </section>

          <div className="segmented home-segmented" role="group" aria-label="Dia a mostrar">
            <button type="button" aria-pressed={dayView === 'today'} onClick={() => setDayView('today')}>Hoje</button>
            <button type="button" aria-pressed={dayView === 'previous'} onClick={() => setDayView('previous')}>Dia anterior</button>
          </div>

          <section className="day-group" aria-labelledby="dayGroupTitle">
            <div className="day-group-head">
              <h2 className="day-group-title" id="dayGroupTitle">{dayView === 'today' ? 'Hoje' : 'Ontem'} · <span className="tabular">{dayKey}</span></h2>
              <span className="day-group-total tabular">{fmtH(dayTotal)}</span>
            </div>
            {dayEntries.length > 0 ? (
              <div className="entry-list">
                {dayEntries.map((entry) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    showSync={showSync}
                    onEdit={setEditEntry}
                    onToggleSync={updateSync}
                  />
                ))}
              </div>
            ) : (
              <div className="card empty-state">
                <span className="empty-icon"><IconClockPause size={26} stroke={1.75} /></span>
                {dayView === 'today' ? 'Nenhuma entrada hoje ainda' : 'Sem entradas no dia anterior'}
              </div>
            )}
          </section>
        </div>
      </div>

      {editEntry && <EntryEditModal entry={editEntry} onClose={() => setEditEntry(null)} />}
    </div>
  );
}
