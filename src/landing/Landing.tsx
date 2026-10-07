import { useCallback, useEffect, useRef, useState } from 'react';
import {
  IconMenu2,
  IconX,
  IconArrowDown,
  IconBrandGithub,
  IconDownload,
  IconShare2,
  IconSun,
  IconMoon,
  IconDeviceDesktop,
  IconChevronDown,
  IconCheck,
} from '@tabler/icons-react';
import { ThemeMode } from '../types';
import { applyTheme, getSavedTheme, onSystemThemeChange } from '../services/themeService';
import { canInstall, isStandalone, onInstallAvailabilityChange, promptInstall } from '../pwaInstall';
import { signInWithGoogle } from './entry';
import { LangProvider, useLang, LANGS, DICTS, Flag, Lang } from './i18n';
import {
  Logo,
  PostIt,
  TodayFloat,
  WeekFloat,
  CalendarFloat,
  RegisterVisual,
  HolidayVisual,
  DashboardVisual,
  EditorVisual,
  SyncVisual,
  PhoneVisual,
  NotesPanelMock,
  ThemeMock,
} from './Mockups';
import '../components/Entries/Entries.css';
import './Landing.css';

function useNavLinks() {
  const { t } = useLang();
  return [
    { href: '#funcionalidades', label: t.nav.features },
    { href: '#como-funciona', label: t.nav.how },
    { href: '#notas', label: t.nav.notes },
    { href: '#faq', label: t.nav.faq },
  ];
}

const GITHUB_URL = 'https://github.com/Paulosouzx';

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-3.59-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

function useGoogleLogin() {
  const { t } = useLang();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const start = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch {
      setError(t.hero.error);
      setLoading(false);
    }
  }, [t]);
  return { start, loading, error };
}

function useReveal(lang: string) {
  useEffect(() => {
    const root = document.querySelector('.landing');
    if (!root || prefersReducedMotion() || !('IntersectionObserver' in window)) return;
    root.classList.add('reveal-on');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
    root.querySelectorAll('.reveal:not(.is-visible)').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [lang]);
}

function useThemeMode() {
  const [mode, setMode] = useState<ThemeMode>(() => getSavedTheme());
  useEffect(() => {
    applyTheme(mode);
    if (mode !== 'system') return;
    return onSystemThemeChange(() => applyTheme('system'));
  }, [mode]);
  return [mode, setMode] as const;
}

function LanguageSwitcher() {
  const { lang, t, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function choose(next: Lang) {
    setLang(next);
    setOpen(false);
  }

  return (
    <div className="lp-lang" ref={ref}>
      <button
        type="button"
        className="lp-lang-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Flag lang={lang} />
        <span className="lp-lang-code">{lang.toUpperCase()}</span>
        <span className="sr-only">, {t.language}: {t.langName}</span>
        <IconChevronDown size={14} stroke={2} aria-hidden="true" />
      </button>
      {open && (
        <ul className="lp-lang-menu" role="menu" aria-label={t.language}>
          {LANGS.map((code) => (
            <li key={code} role="none">
              <button
                type="button"
                role="menuitemradio"
                aria-checked={code === lang}
                lang={DICTS[code].htmlLang}
                className="lp-lang-item"
                onClick={() => choose(code)}
              >
                <Flag lang={code} />
                <span>{DICTS[code].langName}</span>
                {code === lang && <IconCheck size={16} stroke={2} aria-hidden="true" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Navbar({ onStart, loading }: { onStart: () => void; loading: boolean }) {
  const { t } = useLang();
  const links = useNavLinks();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className={`lp-nav ${scrolled || open ? 'scrolled' : ''}`}>
      <div className="lp-nav-inner">
        <a href="#topo" className="lp-brand" aria-label={t.brandHome}>
          <Logo size={28} />
          <span>Time Tracker</span>
        </a>
        <nav className="lp-nav-links" aria-label={t.nav.sections}>
          {links.map((link) => <a key={link.href} href={link.href}>{link.label}</a>)}
        </nav>
        <div className="lp-nav-actions">
          <LanguageSwitcher />
          <a href="/login" className="lp-link">{t.login}</a>
          <button type="button" className="lp-btn-outline" onClick={onStart} disabled={loading}>{t.start}</button>
        </div>
        <div className="lp-nav-mobile-lang"><LanguageSwitcher /></div>
        <button
          type="button"
          className="lp-burger"
          aria-expanded={open}
          aria-controls="lp-mobile-menu"
          aria-label={open ? t.closeMenu : t.openMenu}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <IconX size={22} stroke={1.75} /> : <IconMenu2 size={22} stroke={1.75} />}
        </button>
      </div>
      {open && (
        <div className="lp-mobile-menu" id="lp-mobile-menu">
          <nav aria-label={t.nav.sections}>
            {links.map((link) => <a key={link.href} href={link.href} onClick={() => setOpen(false)}>{link.label}</a>)}
          </nav>
          <div className="lp-mobile-actions">
            <a href="/login" className="btn-secondary">{t.login}</a>
            <button type="button" className="btn-primary" onClick={onStart} disabled={loading}>{t.start}</button>
          </div>
        </div>
      )}
    </header>
  );
}

function Hero({ onStart, loading, error }: { onStart: () => void; loading: boolean; error: string }) {
  const { t } = useLang();
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const box = boxRef.current;
    if (!box || prefersReducedMotion() || !window.matchMedia('(pointer: fine)').matches) return;
    let frame = 0;
    function onMove(event: MouseEvent) {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = box!.getBoundingClientRect();
        box!.style.setProperty('--mx', (((event.clientX - rect.left) / rect.width) * 2 - 1).toFixed(3));
        box!.style.setProperty('--my', (((event.clientY - rect.top) / rect.height) * 2 - 1).toFixed(3));
      });
    }
    function onLeave() {
      box!.style.setProperty('--mx', '0');
      box!.style.setProperty('--my', '0');
    }
    box.addEventListener('mousemove', onMove);
    box.addEventListener('mouseleave', onLeave);
    return () => {
      cancelAnimationFrame(frame);
      box.removeEventListener('mousemove', onMove);
      box.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <section className="lp-hero" id="topo" aria-labelledby="heroTitle">
      <div className="lp-hero-box" ref={boxRef}>
        <div className="lp-floats" aria-hidden="true" {...{ inert: '' }}>
          <div className="lp-float f1"><div className="lp-float-inner"><PostIt /></div></div>
          <div className="lp-float f2"><div className="lp-float-inner"><TodayFloat /></div></div>
          <div className="lp-float f3"><div className="lp-float-inner"><WeekFloat /></div></div>
          <div className="lp-float f4"><div className="lp-float-inner"><CalendarFloat /></div></div>
        </div>

        <div className="lp-hero-content">
          <span className="lp-app-icon" aria-hidden="true"><Logo size={44} /></span>
          <h1 id="heroTitle" className="lp-hero-title">
            <span>{t.hero.line1}</span>
            <span className="muted">{t.hero.line2}</span>
          </h1>
          <p className="lp-hero-sub">{t.hero.sub}</p>
          <div className="lp-hero-ctas">
            <button type="button" className="lp-btn-primary" onClick={onStart} disabled={loading}>
              <GoogleMark /> {loading ? t.hero.googleLoading : t.hero.google}
            </button>
            <a href="#como-funciona" className="lp-link lp-link-arrow">{t.hero.how} <IconArrowDown size={16} stroke={2} /></a>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
        </div>
      </div>
    </section>
  );
}

function SectionHead({ id, eyebrow, title, text }: { id: string; eyebrow: string; title: string; text?: string }) {
  return (
    <div className="lp-section-head reveal">
      <span className="lp-eyebrow">{eyebrow}</span>
      <h2 id={id}>{title}</h2>
      {text && <p>{text}</p>}
    </div>
  );
}

function Features() {
  const { t } = useLang();
  const f = t.features;
  const cards = [
    { id: 'register', cls: 'span-a', copy: f.register, visual: <RegisterVisual /> },
    { id: 'holidays', cls: 'span-b', copy: f.holidays, visual: <HolidayVisual /> },
    { id: 'dashboard', cls: 'span-b', copy: f.dashboard, visual: <DashboardVisual /> },
    { id: 'editor', cls: 'span-c', copy: f.editor, visual: <EditorVisual /> },
    { id: 'sync', cls: 'span-c', copy: f.sync, visual: <SyncVisual /> },
    { id: 'pwa', cls: 'span-c', copy: f.pwa, visual: <PhoneVisual /> },
  ];

  return (
    <section className="lp-section" id="funcionalidades" aria-labelledby="featTitle">
      <SectionHead id="featTitle" eyebrow={f.eyebrow} title={f.title} />
      <div className="lp-bento">
        {cards.map((card) => (
          <article key={card.id} className={`card lp-bento-card reveal ${card.cls}`}>
            <div className="lp-bento-visual">{card.visual}</div>
            <h3>{card.copy[0]}</h3>
            <p>{card.copy[1]}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function NotesSpotlight() {
  const { t } = useLang();
  const points = t.notes.points;
  return (
    <section className="lp-section lp-notes" id="notas" aria-labelledby="notesTitle">
      <div className="lp-notes-text reveal">
        <span className="lp-eyebrow">{t.notes.eyebrow}</span>
        <h2 id="notesTitle">{t.notes.title}</h2>
        <p>{t.notes.text}</p>
        <ul className="lp-checks">
          {points.map((point) => (
            <li key={points.indexOf(point)}><span className="lp-check"><IconCheck size={14} stroke={2.5} /></span>{point}</li>
          ))}
        </ul>
      </div>
      <div className="lp-notes-visual reveal">
        <NotesPanelMock />
      </div>
    </section>
  );
}

function HowItWorks() {
  const { t } = useLang();
  const steps = t.how.steps.map(([title, text]) => ({ title, text }));
  return (
    <section className="lp-section" id="como-funciona" aria-labelledby="howTitle">
      <SectionHead id="howTitle" eyebrow={t.how.eyebrow} title={t.how.title} />
      <ol className="lp-steps">
        {steps.map((step, index) => (
          <li key={index} className="card lp-step reveal">
            <span className="lp-step-num" aria-hidden="true">{index + 1}</span>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

const THEME_OPTIONS: { value: ThemeMode; key: 'light' | 'dark' | 'system'; icon: typeof IconSun }[] = [
  { value: 'light', key: 'light', icon: IconSun },
  { value: 'dark', key: 'dark', icon: IconMoon },
  { value: 'system', key: 'system', icon: IconDeviceDesktop },
];

function ThemeSection({ mode, setMode }: { mode: ThemeMode; setMode: (mode: ThemeMode) => void }) {
  const { t } = useLang();
  return (
    <section className="lp-section" id="tema" aria-labelledby="themeTitle">
      <SectionHead id="themeTitle" eyebrow={t.theme.eyebrow} title={t.theme.title} text={t.theme.text} />
      <div className="lp-theme-toggle reveal">
        <div className="segmented" role="radiogroup" aria-label={t.theme.group}>
          {THEME_OPTIONS.map(({ value, key, icon: IconCmp }) => (
            <button key={value} type="button" role="radio" aria-checked={mode === value} onClick={() => setMode(value)}>
              <IconCmp size={16} stroke={1.75} /> {t.theme[key]}
            </button>
          ))}
        </div>
      </div>
      <div className="lp-split reveal" aria-hidden="true">
        <div className="lp-split-half theme-scope" data-theme="light"><ThemeMock /></div>
        <div className="lp-split-half theme-scope dark" data-theme="dark"><ThemeMock /></div>
      </div>
    </section>
  );
}

function InstallSection() {
  const { t } = useLang();
  const [available, setAvailable] = useState(canInstall);
  const [installed, setInstalled] = useState(isStandalone);

  useEffect(() => onInstallAvailabilityChange(() => {
    setAvailable(canInstall());
    setInstalled(isStandalone());
  }), []);

  return (
    <section className="lp-section lp-install" id="instalar" aria-labelledby="installTitle">
      <div className="lp-install-visual reveal"><PhoneVisual large /></div>
      <div className="lp-install-text reveal">
        <span className="lp-eyebrow">{t.install.eyebrow}</span>
        <h2 id="installTitle">{t.install.title}</h2>
        <p>{t.install.text}</p>
        {installed ? (
          <p className="lp-install-note"><IconCheck size={18} stroke={2} /> {t.install.installed}</p>
        ) : available ? (
          <button type="button" className="lp-btn-primary" onClick={() => promptInstall()}>
            <IconDownload size={18} stroke={2} /> {t.install.button}
          </button>
        ) : (
          <p className="lp-install-note">
            <IconShare2 size={18} stroke={1.75} /> {t.install.hint}
          </p>
        )}
      </div>
    </section>
  );
}

function Faq() {
  const { t } = useLang();
  const items = t.faq.items.map(([q, a]) => ({ q, a }));
  return (
    <section className="lp-section lp-faq" id="faq" aria-labelledby="faqTitle">
      <SectionHead id="faqTitle" eyebrow={t.faq.eyebrow} title={t.faq.title} />
      <div className="lp-faq-list reveal">
        {items.map((item) => (
          <details key={items.indexOf(item)} className="card lp-faq-item">
            <summary>
              <h3>{item.q}</h3>
              <IconChevronDown size={20} stroke={1.75} aria-hidden="true" />
            </summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function FinalCta({ onStart, loading }: { onStart: () => void; loading: boolean }) {
  const { t } = useLang();
  return (
    <section className="lp-section" aria-labelledby="ctaTitle">
      <div className="lp-cta reveal">
        <h2 id="ctaTitle">{t.cta.title}</h2>
        <p>{t.cta.text}</p>
        <button type="button" className="lp-btn-accent" onClick={onStart} disabled={loading}>{t.cta.button}</button>
      </div>
    </section>
  );
}

function Footer() {
  const { t } = useLang();
  const links = useNavLinks();
  return (
    <footer className="lp-footer">
      <div className="lp-footer-inner">
        <a href="#topo" className="lp-brand"><Logo size={24} /><span>Time Tracker</span></a>
        <nav aria-label={t.nav.footer} className="lp-footer-links">
          {links.map((link) => <a key={link.href} href={link.href}>{link.label}</a>)}
          <a href="/login">{t.login}</a>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="lp-github">
            <IconBrandGithub size={18} stroke={1.75} /> GitHub
          </a>
        </nav>
        <p className="lp-copy">© {new Date().getFullYear()} Time Tracker</p>
      </div>
    </footer>
  );
}

function LandingPage() {
  const { t, lang } = useLang();
  const { start, loading, error } = useGoogleLogin();
  const [mode, setMode] = useThemeMode();
  useReveal(lang);

  return (
    <div className="landing">
      <a href="#conteudo" className="lp-skip">{t.skip}</a>
      <Navbar onStart={start} loading={loading} />
      <main id="conteudo">
        <Hero onStart={start} loading={loading} error={error} />
        <Features />
        <NotesSpotlight />
        <HowItWorks />
        <ThemeSection mode={mode} setMode={setMode} />
        <InstallSection />
        <Faq />
        <FinalCta onStart={start} loading={loading} />
      </main>
      <Footer />
    </div>
  );
}

export default function Landing() {
  return (
    <LangProvider>
      <LandingPage />
    </LangProvider>
  );
}
