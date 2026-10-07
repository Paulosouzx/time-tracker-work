import { useEffect } from 'react';
import { IconArrowLeft } from '@tabler/icons-react';
import { applyTheme, getSavedTheme } from '../services/themeService';
import { LangProvider, useLang } from './i18n';
import { Logo } from './Mockups';
import './Landing.css';

function NotFoundPage() {
  const { t } = useLang();

  useEffect(() => {
    applyTheme(getSavedTheme());
    const previous = document.title;
    document.title = `404 · ${t.notFound.title} · Time Tracker`;
    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement('meta');
      robots.name = 'robots';
      document.head.appendChild(robots);
    }
    robots.content = 'noindex';
    return () => { document.title = previous; };
  }, [t]);

  return (
    <div className="landing lp-404">
      <header className="lp-nav">
        <div className="lp-nav-inner">
          <a href="/" className="lp-brand"><Logo size={28} /><span>Time Tracker</span></a>
        </div>
      </header>
      <main className="lp-hero">
        <div className="lp-hero-box lp-404-box">
          <div className="lp-hero-content">
            <div className="lp-404-code" aria-hidden="true">
              <span>4</span>
              <span className="lp-404-zero"><Logo size={88} /></span>
              <span>4</span>
            </div>
            <h1 className="lp-404-title">{t.notFound.title}</h1>
            <p className="lp-hero-sub">{t.notFound.text}</p>
            <a href="/" className="lp-btn-primary lp-404-home"><IconArrowLeft size={18} stroke={2} /> {t.notFound.home}</a>
            <p className="lp-404-note" aria-hidden="true">{t.notFound.note}</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function NotFound() {
  return (
    <LangProvider>
      <NotFoundPage />
    </LangProvider>
  );
}
