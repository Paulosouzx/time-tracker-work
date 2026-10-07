import './App.css';
import { useApp } from './context/AppContext';
import AppShell from './components/Layout/AppShell';
import WeekSummary from './components/Layout/WeekSummary';
import RegisterPanel from './components/RegisterPanel/RegisterPanel';
import Dashboard from './components/Dashboard/Dashboard';
import HistoryPanel from './components/HistoryPanel/HistoryPanel';
import NotesPanel from './components/NotesPanel/NotesPanel';
import Settings from './components/Settings/Settings';
import Auth from './components/Auth/Auth';

export default function App() {
  const { activeTab, currentUser, authReady } = useApp();

  if (!authReady) {
    return null;
  }

  if (!currentUser) {
    return <Auth />;
  }

  return (
    <AppShell>
      {activeTab === 'reg' && (
        <>
          <WeekSummary />
          <RegisterPanel />
        </>
      )}
      {activeTab === 'cal' && <WeekSummary />}
      {activeTab === 'dash' && <Dashboard />}
      {activeTab === 'hist' && <HistoryPanel />}
      {activeTab === 'notes' && <NotesPanel />}
      {activeTab === 'profile' && <Settings />}
    </AppShell>
  );
}
