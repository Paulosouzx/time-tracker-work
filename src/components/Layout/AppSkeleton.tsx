import './AppShell.css';

export default function AppSkeleton() {
  return (
    <div className="app-skeleton" aria-busy="true" aria-label="A carregar">
      <div className="skeleton-header">
        <div>
          <div className="skeleton" style={{ width: 140, height: 12, marginBottom: 10 }} />
          <div className="skeleton" style={{ width: 220, height: 26 }} />
        </div>
        <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }} />
      </div>
      <div className="card skeleton-card">
        <div className="skeleton" style={{ width: '40%', height: 16 }} />
        <div className="skeleton" style={{ width: '100%', height: 8 }} />
        <div className="skeleton-row">
          {Array.from({ length: 7 }, (_, i) => <div key={i} className="skeleton" style={{ flex: 1, height: 48 }} />)}
        </div>
      </div>
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="card skeleton-entry">
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ width: '60%', height: 14, marginBottom: 10 }} />
            <div className="skeleton" style={{ width: 80, height: 18, borderRadius: 999 }} />
          </div>
          <div className="skeleton" style={{ width: 44, height: 44, borderRadius: '50%' }} />
        </div>
      ))}
    </div>
  );
}
