import {
  IconAlarm,
  IconSquareCheckFilled,
  IconConfetti,
  IconCircle,
  IconCircleCheckFilled,
  IconPlus,
  IconCloudCheck,
  IconDeviceLaptop,
  IconDeviceMobile,
  IconRefresh,
  IconBold,
  IconItalic,
  IconList,
  IconQuote,
  IconHome,
  IconCalendar,
  IconChartBar,
  IconHistory,
  IconNotes,
  IconMinus,
  IconX,
} from '@tabler/icons-react';
import EntryCard from '../components/Entries/EntryCard';
import { Entry } from '../types';
import { useLang } from './i18n';

const noop = () => {};
const inert = { inert: '' } as Record<string, string>;

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false" className="lp-logo-mark">
      <circle cx="7" cy="7" r="4.4" fill="var(--accent)" stroke="var(--primary)" strokeWidth="1.2" />
      <circle cx="17" cy="7" r="5" fill="var(--primary)" />
      <circle cx="7" cy="17" r="5" fill="var(--primary)" />
      <circle cx="17" cy="17" r="5" fill="var(--primary)" />
    </svg>
  );
}

function useSample(): Entry[] {
  const { t } = useLang();
  const [a, b, c] = t.mock.entries;
  return [
    { id: 'm1', h: 2.5, proj: a[1], date: '', desc: a[0], link: 'https://example.com' },
    { id: 'm2', h: 1.5, proj: b[1], date: '', desc: b[0], sync: true },
    { id: 'm3', h: 3, proj: c[1], date: '', desc: c[0] },
  ];
}

export function MockEntry({ entry, showSync = false }: { entry?: Entry; showSync?: boolean }) {
  const sample = useSample();
  return <EntryCard entry={entry ?? sample[0]} showSync={showSync} onEdit={noop} onToggleSync={noop} />;
}

export function PostIt() {
  const { t } = useLang();
  return (
    <div className="mk-postit">
      <span className="mk-pin" />
      <span className="mk-postit-check"><IconSquareCheckFilled size={34} /></span>
      <p>{t.mock.postit}</p>
    </div>
  );
}

export function TodayFloat() {
  const { t } = useLang();
  return (
    <div className="mk-stack">
      <div className="card mk-icon-card"><IconAlarm size={30} stroke={1.6} /></div>
      <div className="card mk-today">
        <div className="mk-row-between">
          <span className="mk-card-title">{t.mock.today}</span>
          <span className="mk-total tabular">4h30m</span>
        </div>
        <MockEntry />
      </div>
    </div>
  );
}

export function MiniBars({ values = [6, 8, 7.5, 8.5, 5, 0, 0], highlight = 3 }: { values?: number[]; highlight?: number }) {
  const { t } = useLang();
  const max = Math.max(...values, 1);
  const days = t.mock.dayInitials;
  return (
    <div className="mk-bars">
      {values.map((value, index) => (
        <div key={index} className="mk-bar-col">
          <span
            className={`mk-bar ${index === highlight ? 'accent' : ''}`}
            style={{ height: `${Math.max(6, (value / max) * 100)}%` }}
          />
          <span className="mk-bar-label">{days[index % days.length]}</span>
        </div>
      ))}
    </div>
  );
}

export function WeekFloat() {
  const { t } = useLang();
  return (
    <div className="card mk-week">
      <span className="mk-card-label">{t.mock.thisWeek}</span>
      <span className="mk-big tabular">35h</span>
      <MiniBars />
    </div>
  );
}

export function WeekStrip({ holiday = false }: { holiday?: boolean }) {
  const { t } = useLang();
  return (
    <div className="mk-strip">
      {t.mock.weekdays.map((label, index) => [label, 5 + index] as const).map(([label, num], index) => (
        <div key={label} className="mk-strip-day">
          <span className="mk-strip-wday">{label}</span>
          <span className={`mk-strip-num ${index === 2 ? 'today' : ''}`}>{num}</span>
          <span className={`mk-dot ${holiday && index === 4 ? 'holiday' : index < 3 ? 'on' : ''}`} />
        </div>
      ))}
    </div>
  );
}

export function CalendarFloat() {
  const { t } = useLang();
  return (
    <div className="card mk-cal">
      <span className="mk-card-title">{t.mock.month}</span>
      <WeekStrip />
      <div className="mk-event tone-peach"><strong>{t.mock.events[0]}</strong><span>1h30m</span></div>
      <div className="mk-event tone-rose"><strong>{t.mock.events[1]}</strong><span>2h</span></div>
    </div>
  );
}

export function RegisterVisual() {
  const { t } = useLang();
  const sample = useSample();
  return (
    <div className="mk-register" {...inert} aria-hidden="true">
      <div className="card mk-progress">
        <div className="mk-row-between"><span className="mk-card-title">{t.mock.today}</span><span className="mk-total tabular">7h</span></div>
        <div className="mk-progress-bar"><span style={{ width: '87%' }} /></div>
      </div>
      {sample.map((entry) => <MockEntry key={entry.id} entry={entry} showSync />)}
    </div>
  );
}

export function HolidayVisual() {
  const { t } = useLang();
  return (
    <div className="mk-holiday" aria-hidden="true">
      <WeekStrip holiday />
      <div className="mk-holiday-pill"><IconConfetti size={16} stroke={1.75} /> {t.mock.holiday}</div>
    </div>
  );
}

export function DashboardVisual() {
  const { t } = useLang();
  return (
    <div className="mk-dash" aria-hidden="true">
      <div className="mk-row-between">
        <span className="mk-card-label">{t.mock.week}</span>
        <span className="mk-big sm tabular">38h</span>
      </div>
      <MiniBars values={[30, 36, 32, 40, 38, 34, 38]} highlight={6} />
    </div>
  );
}

export function EditorVisual() {
  const { t } = useLang();
  return (
    <div className="mk-editor" aria-hidden="true">
      <div className="mk-toolbar">
        <IconBold size={16} stroke={1.75} /><IconItalic size={16} stroke={1.75} /><IconList size={16} stroke={1.75} /><IconQuote size={16} stroke={1.75} />
      </div>
      <div className="mk-editor-body">
        <strong>{t.mock.noteTitle}</strong>
        <ul>{t.mock.noteItems.map((item) => <li key={item}>{item}</li>)}</ul>
      </div>
    </div>
  );
}

export function SyncVisual() {
  const { t } = useLang();
  return (
    <div className="mk-sync" aria-hidden="true">
      <span className="mk-device"><IconDeviceLaptop size={34} stroke={1.5} /></span>
      <span className="mk-sync-arrow"><IconRefresh size={20} stroke={1.75} /></span>
      <span className="mk-device"><IconDeviceMobile size={30} stroke={1.5} /></span>
      <span className="mk-sync-badge"><IconCloudCheck size={14} stroke={1.75} /> {t.mock.saved}</span>
    </div>
  );
}

export function PhoneVisual({ large = false }: { large?: boolean }) {
  return (
    <div className={`mk-phone ${large ? 'large' : ''}`} aria-hidden="true">
      <div className="mk-phone-screen">
        <div className="mk-phone-grid">
          <span className="mk-app-icon"><Logo size={large ? 30 : 22} /></span>
          <span className="mk-app-ghost" />
          <span className="mk-app-ghost" />
          <span className="mk-app-ghost" />
        </div>
        {large && <span className="mk-phone-label">Time Tracker</span>}
      </div>
    </div>
  );
}

const NAV = [IconHome, IconCalendar, IconChartBar, IconHistory, IconNotes];

export function NotesPanelMock() {
  const { t } = useLang();
  const items = t.mock.panelItems.map(([title, snippet], index) => ({ title, snippet, done: index === 2 }));
  return (
    <div className="mk-window" aria-hidden="true" {...inert}>
      <div className="mk-window-bar"><span /><span /><span /></div>
      <div className="mk-window-body">
        <div className="mk-side">
          <span className="mk-side-brand"><Logo size={18} /></span>
          {NAV.map((IconCmp, index) => (
            <span key={index} className={`mk-side-item ${index === 2 ? 'active' : ''}`}><IconCmp size={16} stroke={1.75} /></span>
          ))}
        </div>
        <div className="mk-main">
          <span className="mk-main-title">{t.mock.dashboard}</span>
          <div className="card mk-main-card">
            <span className="mk-card-label">{t.mock.totalHours}</span>
            <span className="mk-big tabular">228h</span>
            <MiniBars values={[30, 36, 32, 40, 38, 34, 38, 19]} highlight={7} />
          </div>
          <div className="mk-main-row">
            <div className="card mk-ghost" />
            <div className="card mk-ghost" />
          </div>
        </div>
        <div className="mk-notes-panel">
          <div className="mk-np-head">
            <span className="mk-np-icon"><IconNotes size={14} stroke={1.75} /></span>
            <strong>{t.mock.notes}</strong>
            <span className="mk-np-saved"><IconCloudCheck size={12} stroke={1.75} /> {t.mock.saved}</span>
            <IconMinus size={14} stroke={1.75} />
            <IconX size={14} stroke={1.75} />
          </div>
          <div className="mk-np-add">{t.mock.addNote}<span><IconPlus size={14} stroke={2} /></span></div>
          {items.map((item) => (
            <div key={item.title} className={`mk-np-item ${item.done ? 'done' : ''}`}>
              {item.done ? <IconCircleCheckFilled size={18} /> : <IconCircle size={18} stroke={1.75} />}
              <div>
                <strong>{item.title}</strong>
                <span>{item.snippet}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ThemeMock() {
  const { t } = useLang();
  return (
    <div className="mk-theme-card" {...inert}>
      <div className="mk-row-between">
        <span className="mk-card-title">{t.mock.thisWeek}</span>
        <span className="mk-big sm tabular">35h</span>
      </div>
      <MiniBars />
      <MockEntry />
      <div className="mk-event tone-peach"><strong>{t.mock.events[0]}</strong><span>1h30m</span></div>
    </div>
  );
}
