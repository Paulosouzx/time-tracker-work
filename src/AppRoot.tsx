import App from './App';
import { AppProvider } from './context/AppContext';

export default function AppRoot() {
  return (
    <AppProvider>
      <App />
    </AppProvider>
  );
}
