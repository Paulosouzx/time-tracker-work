import './App.css';
import { useApp } from './context/AppContext';
import AnimatedBackground from './components/Layout/AnimatedBackground';
import Topbar from './components/Layout/Topbar';
import Tabs, { WeekSummary } from './components/Layout/Tabs';
import RegisterPanel from './components/RegisterPanel/RegisterPanel';
import Dashboard from './components/Dashboard/Dashboard';
import HistoryPanel from './components/HistoryPanel/HistoryPanel';
import NotesPanel from './components/NotesPanel/NotesPanel';

export default function App() {
  const { activeTab } = useApp();

 

  return (
    <div className="layout">
      <AnimatedBackground />
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