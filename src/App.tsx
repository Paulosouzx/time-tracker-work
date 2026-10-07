import { useApp } from './context/AppContext';
import AppShell from './components/Layout/AppShell';
import RegisterPanel from './components/RegisterPanel/RegisterPanel';
import CalendarPanel from './components/Calendar/CalendarPanel';
import Dashboard from './components/Dashboard/Dashboard';
import HistoryPanel from './components/HistoryPanel/HistoryPanel';
import NotesPanel from './components/NotesPanel/NotesPanel';
import Settings from './components/Settings/Settings';
import Auth from './components/Auth/Auth';
import AppSkeleton from './components/Layout/AppSkeleton';

export default function App() {
  const { activeTab, currentUser, authReady } = useApp();

  if (!authReady) {
    return <AppSkeleton />;
  }

  if (!currentUser) {
    return <Auth />;
  }

  return (
    <AppShell>
      {activeTab === 'reg' && <RegisterPanel />}
      {activeTab === 'cal' && <CalendarPanel />}
      {activeTab === 'dash' && <Dashboard />}
      {activeTab === 'hist' && <HistoryPanel />}
      {activeTab === 'notes' && <NotesPanel />}
      {activeTab === 'profile' && <Settings />}
    </AppShell>
  );
}
