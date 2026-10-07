import { createPortal } from 'react-dom';
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { IconSettings, IconLogout, IconSun, IconMoon, IconDeviceDesktop } from '@tabler/icons-react';
import { supabase } from '../../supabase/supabaseClient';
import { useApp } from '../../context/AppContext';
import { ThemeMode } from '../../types';
import { getGreeting } from '../../utils';
import Settings from '../Settings/Settings';
import './Topbar.css';

function useClickOutside(ref: RefObject<HTMLElement>, onClose: () => void) {
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
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const wrapRef = useRef<HTMLDivElement>(null);
  useClickOutside(wrapRef as RefObject<HTMLElement>, () => setOpen(false));

  if (!currentUser) return null;

  const metadata = currentUser.user_metadata;
  const name = metadata?.full_name || metadata?.name || currentUser.email || 'Utilizador';
  const initials = name.split(' ').map((part: string) => part[0]).slice(0, 2).join('').toUpperCase() || '?';
  const avatarUrl = metadata?.avatar_url || metadata?.picture || '';

  function handleToggle() {
    if (!open && wrapRef.current) {
      const rect = wrapRef.current.getBoundingClientRect();
      const menuWidth = 220; // approximate menu width
      const viewportWidth = window.innerWidth;
      let right = viewportWidth - rect.right;
      
      // Ensure menu doesn't go off-screen on mobile
      if (right + menuWidth > viewportWidth - 16) {
        right = Math.max(16, viewportWidth - menuWidth - 16);
      }
      
      setMenuPos({ top: rect.bottom + 8, right });
    }
    setOpen(prev => !prev);
  }

  return (
    <div className="user-avatar-wrap" ref={wrapRef}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          className="user-avatar"
          alt={name}
          title={name}
          onClick={handleToggle}
          referrerPolicy="no-referrer"
        />
      ) : (
        <button type="button" className="user-avatar-placeholder" title={name} onClick={handleToggle}>
          {initials}
        </button>
      )}

      {open && createPortal(
        <div className="user-menu open" style={{ position: 'fixed', top: menuPos.top, right: menuPos.right, zIndex: 9999 }}>
          <div className="user-menu-header">
            <div className="user-menu-name">{name}</div>
            <div className="user-menu-email">{currentUser.email || ''}</div>
          </div>
          <button
            type="button"
            className="user-menu-item danger"
            onClick={async () => { setOpen(false); await supabase.auth.signOut(); }}
          >
            <IconLogout size={14} stroke={2} /> Terminar sessão
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}

const THEME_CYCLE: ThemeMode[] = ['light', 'dark', 'system'];
const THEME_META = {
  light: { icon: IconSun, label: 'Tema claro' },
  dark: { icon: IconMoon, label: 'Tema escuro' },
  system: { icon: IconDeviceDesktop, label: 'Seguir o sistema' },
};

function ThemeToggle() {
  const { themeMode, setThemeMode } = useApp();
  const { icon: Icon, label } = THEME_META[themeMode];
  const next = THEME_CYCLE[(THEME_CYCLE.indexOf(themeMode) + 1) % THEME_CYCLE.length];
  return (
    <button className="btn-control" type="button" onClick={() => setThemeMode(next)} title={label} aria-label={`${label}. Mudar para ${THEME_META[next].label.toLowerCase()}`}>
      <Icon size={18} stroke={2} />
    </button>
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
      setTimeText(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`);
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
          <span className="topbar-separator" aria-hidden="true">•</span>
          <span className="app-time">{timeText}</span>
        </div>

        <ThemeToggle />

        <button className="btn-control" type="button" onClick={() => setSettingsOpen(true)} title="Configurações">
          <span className="settings-icon"><IconSettings size={18} stroke={2} /></span>
        </button>
      </div>

      {settingsOpen && <Settings onClose={() => setSettingsOpen(false)} />}
    </>
  );
}