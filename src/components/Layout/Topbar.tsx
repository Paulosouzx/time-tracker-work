import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../supabase/supabaseClient';
import { useApp, BASE_THEMES } from '../../context/AppContext';
import { getGreeting } from '../../utils';
import Settings from '../Settings/Settings';
import './Topbar.css';

function useClickOutside(ref: React.RefObject<HTMLElement>, onClose: () => void) {
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [ref, onClose]);
}

function UserAvatar() {
  const { currentUser } = useApp();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useClickOutside(menuRef, () => setOpen(false));

  if (!currentUser) return null;

  const metadata = currentUser.user_metadata;
  const name = metadata?.full_name || metadata?.name || currentUser.email || 'Utilizador';
  const initials = name.split(' ').map((part: string) => part[0]).slice(0, 2).join('').toUpperCase() || '?';
  const avatarUrl = metadata?.avatar_url || metadata?.picture || '';

  return (
    <div className="user-avatar-wrap" ref={menuRef}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          className="user-avatar"
          alt={name}
          title={name}
          onClick={() => setOpen(prev => !prev)}
        />
      ) : (
        <button type="button" className="user-avatar-placeholder" title={name} onClick={() => setOpen(prev => !prev)}>
          {initials}
        </button>
      )}

      <div className={`user-menu ${open ? 'open' : ''}`}>
        <div className="user-menu-header">
          <div className="user-menu-name">{name}</div>
          <div className="user-menu-email">{currentUser.email || ''}</div>
        </div>
        <button
          type="button"
          className="user-menu-item danger"
          onClick={async () => { setOpen(false); await supabase.auth.signOut(); }}
        >
          <i className="ti ti-logout" /> Terminar sessão
        </button>
      </div>
    </div>
  );
}

function ThemePicker() {
  const { currentTheme, customThemes, applyTheme, deleteCustomTheme } = useApp();
  const [open, setOpen] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  useClickOutside(pickerRef, () => setOpen(false));

  const activeThemeIcon = useMemo(() => {
    return customThemes.some(theme => theme.id === currentTheme)
      ? 'ti-palette'
      : BASE_THEMES.find(theme => theme.id === currentTheme)?.icon || 'ti-sun';
  }, [currentTheme, customThemes]);

  return (
    <>
      <div className="theme-picker-wrap" ref={pickerRef}>
        <button className="btn-control" type="button" onClick={() => setOpen(prev => !prev)} title="Escolher tema">
          <span className="theme-icon active">
            <i className={`ti ${activeThemeIcon}`} />
          </span>
        </button>

        <div className={`theme-picker-dropdown ${open ? 'open' : ''}`}>
          {BASE_THEMES.map(theme => (
            <button
              key={theme.id}
              type="button"
              className={`theme-picker-item ${currentTheme === theme.id ? 'active' : ''}`}
              onClick={() => { applyTheme(theme.id); setOpen(false); }}
            >
              <span className="theme-swatch" style={{ background: theme.color }} />
              <i className={`ti ${theme.icon}`} />
              <span>{theme.name}</span>
            </button>
          ))}

          {customThemes.length > 0 && (
            <>
              <div className="theme-picker-divider" />
              {customThemes.map(theme => (
                <button
                  key={theme.id}
                  type="button"
                  className={`theme-picker-item ${currentTheme === theme.id ? 'active' : ''}`}
                  onClick={() => { applyTheme(theme.id); setOpen(false); }}
                >
                  <span className="theme-swatch" style={{ background: theme.colors.accent }} />
                  <i className="ti ti-palette" />
                  <span className="theme-picker-name">{theme.name}</span>
                  <i
                    className="ti ti-trash delete-theme-btn"
                    title="Remover Tema"
                    onClick={event => {
                      event.stopPropagation();
                      if (confirm('Apagar este tema?')) deleteCustomTheme(theme.id);
                    }}
                  />
                </button>
              ))}
            </>
          )}

          <div className="theme-picker-divider" />
          <button type="button" className="theme-picker-item custom-plus" onClick={() => { setOpen(false); setShowCustomModal(true); }}>
            <i className="ti ti-plus" /> Criar Novo Tema
          </button>
        </div>
      </div>

      {showCustomModal && <CustomThemeModal onClose={() => setShowCustomModal(false)} />}
    </>
  );
}

function CustomThemeModal({ onClose }: { onClose: () => void }) {
  const { addCustomTheme, savePrefs } = useApp();
  const [name, setName] = useState('');
  const [colors, setColors] = useState({
    bg: '#F8F7FF',
    surface: '#FFFFFF',
    accent: '#534AB7',
    text: '#1a1a2e',
    text2: '#5f5c7a',
    border: '#E2E0F0',
  });

  function updateColor(key: keyof typeof colors, value: string) {
    setColors(prev => ({ ...prev, [key]: value }));
  }

  function saveTheme() {
    if (!name.trim()) {
      alert('Por favor, dá um nome ao teu tema.');
      return;
    }

    addCustomTheme({ id: `custom_${Date.now()}`, name: name.trim(), colors });
    savePrefs();
    onClose();
  }

  const fields = [
    { key: 'bg', label: 'Fundo' },
    { key: 'surface', label: 'Surface' },
    { key: 'accent', label: 'Accent' },
    { key: 'text', label: 'Texto Principal' },
    { key: 'text2', label: 'Texto Secundário' },
    { key: 'border', label: 'Borda' },
  ] as const;

  return (
    <div className="modal-bg open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-large">
        <div className="modal-header">
          <h2>Criar Tema Personalizado</h2>
          <button className="btn-icon" type="button" onClick={onClose}><i className="ti ti-x" /></button>
        </div>

        <div className="fi-wrapper">
          <span className="fl-inner">Nome do Tema</span>
          <input
            className="fi"
            type="text"
            placeholder="Ex: O Meu Tema Escuro"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        <div className="theme-preview-strip" style={{ borderColor: colors.border }}>
          <div className="theme-preview-seg" style={{ background: colors.bg, color: colors.text2 }}>BG</div>
          <div className="theme-preview-seg" style={{ background: colors.surface, color: colors.text }}>SFC</div>
          <div className="theme-preview-seg" style={{ background: colors.accent, color: '#fff' }}>ACC</div>
          <div className="theme-preview-seg" style={{ background: colors.surface, color: colors.text }}>TXT</div>
        </div>

        <div className="custom-theme-grid">
          {fields.map(field => (
            <div className="color-field" key={field.key}>
              <div className="color-field-lbl">{field.label}</div>
              <div className="color-field-row">
                <input type="color" value={colors[field.key]} onChange={e => updateColor(field.key, e.target.value)} />
                <span className="color-hex-label">{colors[field.key].toUpperCase()}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="modal-actions modal-actions-full">
          <button className="btn-cancel" type="button" onClick={onClose}>Cancelar</button>
          <button className="btn-save" type="button" onClick={saveTheme}>Guardar Tema</button>
        </div>
      </div>
    </div>
  );
}

export default function Topbar() {
  const { userName, currentUser } = useApp();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [timeText, setTimeText] = useState('');
  const [dateText, setDateText] = useState('');
  const [greeting, setGreeting] = useState(getGreeting());

  useEffect(() => {
    function updateClock() {
      const now = new Date();
      setTimeText(`· ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`);
      setDateText(now.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' }));
      setGreeting(getGreeting());
    }

    updateClock();
    const intervalId = setInterval(updateClock, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const displayName = useMemo(() => {
    if (userName) return userName;
    if (!currentUser) return '';
    const metadata = currentUser.user_metadata;
    return metadata?.full_name?.split(' ')[0] || metadata?.name?.split(' ')[0] || '';
  }, [currentUser, userName]);

  return (
    <>
      <div className="topbar">
        <UserAvatar />

        <span className="app-name">{greeting}{displayName ? `, ${displayName}` : ''}</span>

        <div className="topbar-time">
          <span className="app-date">{dateText}</span>
          <span className="app-date app-time">{timeText}</span>
        </div>

        <ThemePicker />

        <button className="btn-control" type="button" onClick={() => setSettingsOpen(true)} title="Configurações">
          <span className="settings-icon"><i className="ti ti-settings" /></span>
        </button>
      </div>

      {settingsOpen && <Settings onClose={() => setSettingsOpen(false)} />}
    </>
  );
}
