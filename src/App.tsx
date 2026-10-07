import './App.css';
import { useApp } from './context/AppContext';
import Topbar from './components/Layout/Topbar';
import Tabs, { WeekSummary } from './components/Layout/Tabs';
import RegisterPanel from './components/RegisterPanel/RegisterPanel';
import Dashboard from './components/Dashboard/Dashboard';
import HistoryPanel from './components/HistoryPanel/HistoryPanel';
import NotesPanel from './components/NotesPanel/NotesPanel';
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
    <div className="layout">
      <Topbar />
      <WeekSummary />
      <Tabs />
      <div className="content">
        {activeTab === 'reg' && <RegisterPanel />}
        {activeTab === 'dash' && <Dashboard />}
        {activeTab === 'hist' && <HistoryPanel />}
        {activeTab === 'notes' && <NotesPanel />}
      </div>
    </div>
  );
}