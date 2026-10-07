import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
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
        {description && <div className="setting-row-desc">{description}</div>}
      </label>
      <label className="toggle-switch">
        <input id={id} type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
        <span className="toggle-slider" />
      </label>
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
        if (response.ok) {
          setCountries(await response.json());
        }
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

  async function fetchHolidays() {
    if (!selectedHolidayCountry) {
      alert('Escolhe um país primeiro.');
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
          )
        );
      }

      const nextHolidays = [...holidays];
      let added = 0;
      let skipped = 0;

      data.forEach((holiday: any) => {
        const [yearPart, monthPart, dayPart] = holiday.date.split('-');
        const dateString = `${dayPart}/${monthPart}/${yearPart}`;
        if (!nextHolidays.some(item => item.date === dateString)) {
          nextHolidays.push({ date: dateString, name: holiday.localName || holiday.name });
          added += 1;
        } else {
          skipped += 1;
        }
      });

      updateHolidayList(nextHolidays);
      setStatusOk(true);
      setStatus(`✓ ${added} feriados adicionados${skipped ? `, ${skipped} já existiam` : ''} (${year})`);
    } catch {
      setStatusOk(false);
      setStatus('Erro ao carregar feriados. Verifica a ligação.');
    } finally {
      setLoading(false);
    }
  }

  function addManualHoliday() {
    if (!manualDate.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      alert('Data inválida. Use o formato dd/mm/aaaa.');
      return;
    }

    if (!holidays.some(item => item.date === manualDate)) {
      updateHolidayList([...holidays, { date: manualDate, name: manualName.trim() || 'Feriado' }]);
    }

    setManualDate('');
    setManualName('');
  }

  function removeHoliday(index: number) {
    const updated = [...holidays];
    updated.splice(index, 1);
    updateHolidayList(updated);
  }

  const sortedHolidays = useMemo(
    () => [...holidays].sort((a, b) =>
      a.date.split('/').reverse().join('').localeCompare(b.date.split('/').reverse().join(''))
    ),
    [holidays],
  );

  return (
    <div className="holiday-settings">
      <div className="settings-row-wrap" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <select
          className="week-select"
          value={selectedHolidayCountry}
          onChange={event => {
            const country = event.target.value;
            setSelectedHolidayCountry(country);
            localStorage.setItem('tt_holiday_country', country);
            setSelectedHolidaySubdivision('');
          }}
          style={{ flex: '1 1 180px', minWidth: 140, height: 36 }}
        >
          <option value="">— País —</option>
          {countries.map(country => (
            <option key={country.countryCode} value={country.countryCode}>
              {country.name}
            </option>
          ))}
        </select>

        {subdivisions.length > 0 && (
          <select
            className="week-select"
            value={selectedHolidaySubdivision}
            onChange={event => {
              setSelectedHolidaySubdivision(event.target.value);
              localStorage.setItem('tt_holiday_subdivision', event.target.value);
            }}
            style={{ flex: '1 1 180px', minWidth: 140, height: 36 }}
          >
            <option value="">— Feriados nacionais (todos) —</option>
            {subdivisions.map(subdivision => (
              <option key={subdivision.code} value={subdivision.code}>
                {subdivision.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedHolidayCountry && (
        <div className="settings-row-wrap" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <select
            className="week-select"
            value={year}
            onChange={event => setYear(Number(event.target.value))}
            style={{ width: 110, height: 36 }}
          >
            {[currentYear - 1, currentYear, currentYear + 1].map(y => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn-save"
            onClick={fetchHolidays}
            disabled={loading}
            style={{ minWidth: 164, height: 36 }}
          >
            {loading ? 'A carregar...' : 'Carregar feriados'}
          </button>
        </div>
      )}

      {status && (
        <div
          style={{
            fontSize: 12,
            color: statusOk ? 'var(--ok)' : 'var(--danger)',
            marginBottom: 10,
          }}
        >
          {status}
        </div>
      )}

      <div className="settings-row-wrap" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          className="fi"
          placeholder="dd/mm/aaaa"
          value={manualDate}
          onChange={event => setManualDate(event.target.value)}
          style={{ flex: '1 1 120px', minWidth: 100, height: 36 }}
        />
        <input
          className="fi"
          placeholder="Nome do feriado..."
          value={manualName}
          onChange={event => setManualName(event.target.value)}
          style={{ flex: '2 1 180px', minWidth: 120, height: 36 }}
        />
        <button
          className="btn-save"
          type="button"
          onClick={addManualHoliday}
          style={{ minWidth: 120, height: 36 }}
        >
          + Manual
        </button>
      </div>

      <div className="holidays-list">
        {sortedHolidays.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', padding: '10px 0' }}>
            Sem feriados definidos.
          </div>
        ) : (
          sortedHolidays.map((holiday, index) => (
            <div key={`${holiday.date}-${index}`} className="holiday-item">
              <span>
                <strong>{holiday.date}</strong> — {holiday.name}
              </span>
              <button
                className="btn-holiday-del"
                type="button"
                onClick={() => removeHoliday(index)}
                title="Remover"
              >
                <i className="ti ti-x" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function Settings({ onClose }: { onClose: () => void }) {
  const {
    showSync,
    setShowSync,
    showNotesDone,
    setShowNotesDone,
    notesCollapsed,
    setNotesCollapsed,
    showHolidays,
    setShowHolidays,
    userName,
    setUserName,
    savePrefs,
  } = useApp();

  const [localName, setLocalName] = useState(userName);
  const [localSync, setLocalSync] = useState(showSync);
  const [localNotesDone, setLocalNotesDone] = useState(showNotesDone);
  const [localCollapsed, setLocalCollapsed] = useState(notesCollapsed);
  const [localHolidays, setLocalHolidays] = useState(showHolidays);

  function save() {
    setShowSync(localSync);
    localStorage.setItem('tt_show_sync', String(localSync));

    setShowNotesDone(localNotesDone);
    localStorage.setItem('tt_notes_done', String(localNotesDone));

    setNotesCollapsed(localCollapsed);
    localStorage.setItem('tt_notes_collapsed', String(localCollapsed));

    setShowHolidays(localHolidays);
    localStorage.setItem('tt_show_holidays', String(localHolidays));

    setUserName(localName.trim());
    localStorage.setItem('tt_user_name', localName.trim());

    savePrefs();
    onClose();
  }

  return (
    <div className="modal-bg open" onClick={event => event.target === event.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 520 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h2 style={{ margin: 0 }}>Configurações</h2>
          <button className="btn-icon" type="button" onClick={onClose}>
            <i className="ti ti-x" />
          </button>
        </div>

        <div className="fi-wrapper" style={{ marginBottom: 16 }}>
          <span className="fl-inner">Seu Nome</span>
          <input
            className="fi"
            type="text"
            placeholder="Como quer ser chamado?"
            value={localName}
            onChange={event => setLocalName(event.target.value)}
          />
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 7, display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="ti ti-info-circle" style={{ fontSize: 12 }} />
            Se deixar em branco, o nome é obtido automaticamente.
          </div>
        </div>

        <div className="setting-section-title">Geral</div>
        <div className="setting-group">
          <ToggleRow
            id="chkShowSync"
            label="Mostrar coluna 'Registado no Sistema'"
            checked={localSync}
            onChange={setLocalSync}
          />
        </div>

        <div className="setting-section-title">Notas</div>
        <div className="setting-group">
          <ToggleRow
            id="chkNotesDone"
            label="Permitir marcar notas como feitas"
            checked={localNotesDone}
            onChange={setLocalNotesDone}
          />
          <ToggleRow
            id="chkNotesCollapsed"
            label="Notas colapsadas por padrão"
            checked={localCollapsed}
            onChange={setLocalCollapsed}
          />
        </div>

        <div className="setting-section-title">Calendário</div>
        <div className="setting-group">
          <div className="setting-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 12 }}>
              <label htmlFor="chkHolidays" style={{ flex: 1, cursor: 'pointer' }}>
                Mostrar feriados nos chips da semana
              </label>
              <label className="toggle-switch">
                <input
                  id="chkHolidays"
                  type="checkbox"
                  checked={localHolidays}
                  onChange={event => setLocalHolidays(event.target.checked)}
                />
                <span className="toggle-slider" />
              </label>
            </div>
            {localHolidays && <HolidaySettings />}
          </div>
        </div>

        <div className="modal-actions" style={{ marginTop: 20 }}>
          <button className="btn-save" type="button" onClick={save} style={{ width: '100%' }}>
            Guardar e Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
