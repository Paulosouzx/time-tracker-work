import { ReactNode, useEffect, useMemo, useState } from 'react';
import {
  IconAlertCircle,
  IconHome,
  IconCalendar,
  IconChartBar,
  IconHistory,
  IconNotes,
  IconUserCircle,
  type Icon,
} from '@tabler/icons-react';
import { useApp } from '../../context/AppContext';
import { ROUTES } from '../../router';
import { TabId } from '../../types';
import { getGreeting } from '../../utils';
import UserAvatar, { getUserDisplay } from './UserAvatar';
import './AppShell.css';

interface NavItem {
  id: TabId;
  label: string;
  icon: Icon;
  mobile: boolean;
}

const NAV: NavItem[] = [
  { id: 'reg', label: 'Início', icon: IconHome, mobile: true },
  { id: 'cal', label: 'Calendário', icon: IconCalendar, mobile: true },
  { id: 'dash', label: 'Dashboard', icon: IconChartBar, mobile: true },
  { id: 'hist', label: 'Histórico', icon: IconHistory, mobile: true },
  { id: 'notes', label: 'Notas', icon: IconNotes, mobile: true },
  { id: 'profile', label: 'Perfil', icon: IconUserCircle, mobile: false },
];

const TITLES: Record<TabId, string> = {
  reg: '',
  cal: 'Calendário',
  dash: 'Dashboard',
  hist: 'Histórico',
  notes: 'Notas',
  profile: 'Perfil',
};

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function HeaderTitle() {
  const { activeTab, userName, currentUser } = useApp();
  const now = useClock();

  const firstName = useMemo(() => {
    if (userName) return userName;
    const metadata = currentUser?.user_metadata;
    return metadata?.full_name?.split(' ')[0] || metadata?.name?.split(' ')[0] || '';
  }, [currentUser, userName]);

  const dateText = now.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });
  const timeText = now.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  if (activeTab === 'reg') {
    return (
      <div className="header-title">
        <p className="header-sub">
          <span className="header-date">{dateText}</span>
          <span aria-hidden="true"> · </span>
          <time className="tabular">{timeText}</time>
        </p>
        <h1>{getGreeting()}{firstName ? `, ${firstName}` : ''}</h1>
      </div>
    );
  }

  return (
    <div className="header-title">
      <p className="header-sub header-date">{dateText}</p>
      <h1>{TITLES[activeTab]}</h1>
    </div>
  );
}

function NavLink({ item, compact }: { item: NavItem; compact?: boolean }) {
  const { activeTab, setActiveTab, notes } = useApp();
  const active = activeTab === item.id;
  const activeNotes = item.id === 'notes' ? notes.filter((note) => !note.done).length : 0;
  const IconCmp = item.icon;

  return (
    <a
      href={ROUTES[item.id]}
      className={`${compact ? 'bottom-nav-item' : 'side-nav-item'} ${active ? 'active' : ''}`}
      aria-current={active ? 'page' : undefined}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey) return;
        event.preventDefault();
        setActiveTab(item.id);
      }}
    >
      <span className="nav-icon">
        <IconCmp size={22} stroke={1.75} />
        {activeNotes > 0 && <span className="nav-badge" aria-label={`${activeNotes} notas ativas`}>{activeNotes}</span>}
      </span>
      <span className="nav-label">{item.label}</span>
    </a>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const { currentUser, activeTab, setActiveTab, loadError, retryLoad } = useApp();
  const { name } = getUserDisplay(currentUser);

  return (
    <div className="shell">
      <aside className="side-nav" aria-label="Navegação principal">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 20 20" fill="none" width="20" height="20">
              <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.8" />
              <path d="M10 10V5.5M10 10l3.5 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          <span className="brand-name">Time Tracker</span>
        </div>
        <nav className="side-nav-list">
          {NAV.map((item) => <NavLink key={item.id} item={item} />)}
        </nav>
      </aside>

      <div className="shell-main">
        <header className="app-header">
          <HeaderTitle />
          <button
            type="button"
            className={`header-avatar ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
            aria-label={`Perfil de ${name}`}
          >
            <UserAvatar user={currentUser} size={40} />
          </button>
        </header>

        <main className="content" id="main">
          {loadError && (
            <div className="error-state load-error" role="alert">
              <IconAlertCircle size={20} stroke={1.75} />
              <span>{loadError}</span>
              <button type="button" className="btn-secondary" onClick={retryLoad}>Tentar novamente</button>
            </div>
          )}
          {children}
        </main>
      </div>

      <nav className="bottom-nav" aria-label="Navegação principal">
        {NAV.filter((item) => item.mobile).map((item) => <NavLink key={item.id} item={item} compact />)}
      </nav>
    </div>
  );
}
