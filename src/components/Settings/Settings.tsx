import { useEffect, useMemo, useState } from 'react';
import { IconLogout, IconInfoCircle, IconX, IconSun, IconMoon, IconDeviceDesktop } from '@tabler/icons-react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../supabase/supabaseClient';
import UserAvatar, { getUserDisplay } from '../Layout/UserAvatar';
import { ThemeMode } from '../../types';
import './Settings.css';

const NAGER_BASE = 'https://date.nager.at/api/v3';

function ToggleRow({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="setting-row">
      <label htmlFor={id} className="setting-label">
        {label}
        {description && <span className="setting-desc">{description}</span>}
      </label>
      <span className="toggle-switch">
        <input id={id} type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="toggle-slider" />
      </span>
    </div>
  );
}

function HolidaySettings() {
  const {
    holidays,
    saveHolidays,
    savePrefs,
    selectedHolidayCountry,
    setSelectedHolidayCountry,
    selectedHolidaySubdivision,
    setSelectedHolidaySubdivision,
  } = useApp();

  const [countries, setCountries] = useState<{ countryCode: string; name: string }[]>([]);
  const [subdivisions, setSubdivisions] = useState<{ code: string; name: string }[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [statusOk, setStatusOk] = useState(true);
  const [manualDate, setManualDate] = useState('');
  const [manualName, setManualName] = useState('');

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    async function loadCountries() {
      try {
        const response = await fetch(`${NAGER_BASE}/AvailableCountries`);
        if (response.ok) setCountries(await response.json());
      } catch {
        setCountries([]);
      }
    }
    loadCountries();
  }, []);

  useEffect(() => {
    if (!selectedHolidayCountry) {
      setSubdivisions([]);
      return;
    }
    async function loadSubdivisions() {
      try {
        const response = await fetch(`${NAGER_BASE}/CountryInfo/${selectedHolidayCountry}`);
        if (!response.ok) throw new Error('Failed to load subdivisions');
        const data = await response.json();
        setSubdivisions(data.divisions || []);
      } catch {
        setSubdivisions([]);
      }
    }
    loadSubdivisions();
  }, [selectedHolidayCountry]);

  function updateHolidayList(list: typeof holidays) {
    saveHolidays(list);
    savePrefs();
  }

  function showStatus(message: string, ok: boolean) {
    setStatus(message);
    setStatusOk(ok);
  }

  async function fetchHolidays() {
    if (!selectedHolidayCountry) {
      showStatus('Escolhe um país primeiro.', false);
      return;
    }

    setLoading(true);
    setStatus('');

    try {
      const response = await fetch(`${NAGER_BASE}/PublicHolidays/${year}/${selectedHolidayCountry}`);
      if (!response.ok) throw new Error('Fetch failed');
      let data = await response.json();

      if (selectedHolidaySubdivision) {
        data = data.filter((holiday: any) =>
          !holiday.counties || holiday.counties.some((county: string) =>
            county === selectedHolidaySubdivision || county.startsWith(`${selectedHolidaySubdivision}-`),
          ),
        );
      }

      const nextHolidays = [...holidays];
      let added = 0;
      let skipped = 0;

      data.forEach((holiday: any) => {
        const [yearPart, monthPart, dayPart] = holiday.date.split('-');
        const dateString = `${dayPart}/${monthPart}/${yearPart}`;
        if (!nextHolidays.some((item) => item.date === dateString)) {
          nextHolidays.push({ date: dateString, name: holiday.localName || holiday.name });
          added += 1;
        } else {
          skipped += 1;
        }
      });

      updateHolidayList(nextHolidays);
      showStatus(`✓ ${added} feriados adicionados${skipped ? `, ${skipped} já existiam` : ''} (${year})`, true);
    } catch {
      showStatus('Erro ao carregar feriados. Verifica a ligação.', false);
    } finally {
      setLoading(false);
    }
  }

  function addManualHoliday(event: React.FormEvent) {
    event.preventDefault();
    if (!manualDate.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      showStatus('Data inválida. Use o formato dd/mm/aaaa.', false);
      return;
    }
    if (!holidays.some((item) => item.date === manualDate)) {
      updateHolidayList([...holidays, { date: manualDate, name: manualName.trim() || 'Feriado' }]);
    }
    setManualDate('');
    setManualName('');
    setStatus('');
  }

  function removeHoliday(holiday: (typeof holidays)[number]) {
    updateHolidayList(holidays.filter((item) => item !== holiday));
  }

  const sortedHolidays = useMemo(
    () => [...holidays].sort((a, b) => a.date.split('/').reverse().join('').localeCompare(b.date.split('/').reverse().join(''))),
    [holidays],
  );

  return (
    <div className="holiday-settings">
      <div className="holiday-row">
        <div className="field">
          <label className="field-label" htmlFor="holCountry">País</label>
          <select
            id="holCountry"
            className="week-select"
            value={selectedHolidayCountry}
            onChange={(event) => {
              const country = event.target.value;
              setSelectedHolidayCountry(country);
              localStorage.setItem('tt_holiday_country', country);
              setSelectedHolidaySubdivision('');
              localStorage.setItem('tt_holiday_subdivision', '');
              savePrefs();
            }}
          >
            <option value="">— País —</option>
            {countries.map((country) => (
              <option key={country.countryCode} value={country.countryCode}>{country.name}</option>
            ))}
          </select>
        </div>

        {subdivisions.length > 0 && (
          <div className="field">
            <label className="field-label" htmlFor="holSub">Região</label>
            <select
              id="holSub"
              className="week-select"
              value={selectedHolidaySubdivision}
              onChange={(event) => {
                setSelectedHolidaySubdivision(event.target.value);
                localStorage.setItem('tt_holiday_subdivision', event.target.value);
                savePrefs();
              }}
            >
              <option value="">— Feriados nacionais (todos) —</option>
              {subdivisions.map((subdivision) => (
                <option key={subdivision.code} value={subdivision.code}>{subdivision.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {selectedHolidayCountry && (
        <div className="holiday-row holiday-row-inline">
          <div className="field holiday-year">
            <label className="field-label" htmlFor="holYear">Ano</label>
            <select id="holYear" className="week-select" value={year} onChange={(event) => setYear(Number(event.target.value))}>
              {[currentYear - 1, currentYear, currentYear + 1].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button type="button" className="btn-primary" onClick={fetchHolidays} disabled={loading}>
            {loading ? 'A carregar…' : 'Carregar feriados'}
          </button>
        </div>
      )}

      <form className="holiday-row holiday-row-inline" onSubmit={addManualHoliday}>
        <div className="field">
          <label className="field-label" htmlFor="holDate">Data</label>
          <input id="holDate" className="input" placeholder="dd/mm/aaaa" inputMode="numeric" value={manualDate} onChange={(event) => setManualDate(event.target.value)} />
        </div>
        <div className="field holiday-name">
          <label className="field-label" htmlFor="holName">Nome</label>
          <input id="holName" className="input" placeholder="Nome do feriado…" value={manualName} onChange={(event) => setManualName(event.target.value)} />
        </div>
        <button className="btn-secondary" type="submit">+ Manual</button>
      </form>

      {status && (
        <p className={`holiday-status ${statusOk ? 'ok' : 'error'}`} role="status">{status}</p>
      )}

      <ul className="holidays-list">
        {sortedHolidays.length === 0 ? (
          <li className="holidays-empty">Sem feriados definidos.</li>
        ) : (
          sortedHolidays.map((holiday, index) => (
            <li key={`${holiday.date}-${index}`} className="holiday-item">
              <span className="tabular holiday-date">{holiday.date}</span>
              <span className="holiday-item-name">{holiday.name}</span>
              <button className="btn-icon del" type="button" onClick={() => removeHoliday(holiday)} aria-label={`Remover ${holiday.name}`} title="Remover">
                <IconX size={16} stroke={1.75} />
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function AccountCard() {
  const { currentUser } = useApp();
  const { name, email } = getUserDisplay(currentUser);
  return (
    <section className="card account-card" aria-label="Conta">
      <UserAvatar user={currentUser} size={64} />
      <div className="account-info">
        <div className="account-name">{name}</div>
        <div className="account-email">{email}</div>
      </div>
      <button type="button" className="btn-secondary account-logout" onClick={() => supabase.auth.signOut()}>
        <IconLogout size={18} stroke={1.75} /> Terminar sessão
      </button>
    </section>
  );
}

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: typeof IconSun }[] = [
  { value: 'light', label: 'Claro', icon: IconSun },
  { value: 'dark', label: 'Escuro', icon: IconMoon },
  { value: 'system', label: 'Sistema', icon: IconDeviceDesktop },
];

export default function Settings() {
  const {
    showSync, setShowSync,
    showNotesDone, setShowNotesDone,
    notesCollapsed, setNotesCollapsed,
    showHolidays, setShowHolidays,
    userName, setUserName,
    themeMode, setThemeMode,
    savePrefs,
  } = useApp();

  const [localName, setLocalName] = useState(userName);

  useEffect(() => setLocalName(userName), [userName]);

  function persistBool(key: string, setter: (value: boolean) => void) {
    return (value: boolean) => {
      setter(value);
      localStorage.setItem(key, String(value));
      savePrefs();
    };
  }

  function commitName() {
    const trimmed = localName.trim();
    if (trimmed === userName) return;
    setUserName(trimmed);
    localStorage.setItem('tt_user_name', trimmed);
    savePrefs();
  }

  return (
    <div className="settings-page">
      <AccountCard />

      <section className="card settings-section" aria-labelledby="setAppearance">
        <h2 className="settings-title" id="setAppearance">Aparência</h2>
        <div className="segmented theme-segmented" role="radiogroup" aria-label="Tema">
          {THEME_OPTIONS.map(({ value, label, icon: IconCmp }) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={themeMode === value}
              aria-pressed={themeMode === value}
              onClick={() => setThemeMode(value)}
            >
              <IconCmp size={16} stroke={1.75} /> {label}
            </button>
          ))}
        </div>
      </section>

      <section className="card settings-section" aria-labelledby="setProfile">
        <h2 className="settings-title" id="setProfile">Perfil</h2>
        <div className="field">
          <label className="field-label" htmlFor="setName">O teu nome</label>
          <input
            id="setName"
            className="input"
            type="text"
            placeholder="Como queres ser chamado?"
            value={localName}
            onChange={(event) => setLocalName(event.target.value)}
            onBlur={commitName}
            onKeyDown={(event) => event.key === 'Enter' && (event.currentTarget as HTMLInputElement).blur()}
          />
          <p className="setting-hint">
            <IconInfoCircle size={14} stroke={1.75} /> Se deixares em branco, o nome é obtido automaticamente.
          </p>
        </div>
      </section>

      <section className="card settings-section" aria-labelledby="setGeneral">
        <h2 className="settings-title" id="setGeneral">Geral</h2>
        <ToggleRow id="chkShowSync" label="Mostrar coluna 'Registado no Sistema'" checked={showSync} onChange={persistBool('tt_show_sync', setShowSync)} />
      </section>

      <section className="card settings-section" aria-labelledby="setNotes">
        <h2 className="settings-title" id="setNotes">Notas</h2>
        <ToggleRow id="chkNotesDone" label="Permitir marcar notas como feitas" checked={showNotesDone} onChange={persistBool('tt_notes_done', setShowNotesDone)} />
        <ToggleRow id="chkNotesCollapsed" label="Notas colapsadas por padrão" checked={notesCollapsed} onChange={persistBool('tt_notes_collapsed', setNotesCollapsed)} />
      </section>

      <section className="card settings-section settings-calendar" aria-labelledby="setCalendar">
        <h2 className="settings-title" id="setCalendar">Calendário</h2>
        <ToggleRow id="chkHolidays" label="Mostrar feriados" description="Na semana, no calendário e no início" checked={showHolidays} onChange={persistBool('tt_show_holidays', setShowHolidays)} />
        {showHolidays && <HolidaySettings />}
      </section>
    </div>
  );
}
