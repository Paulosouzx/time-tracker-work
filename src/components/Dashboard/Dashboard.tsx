import { useEffect, useMemo, useRef, useState } from 'react';
import {
  IconSun,
  IconCalendarWeek,
  IconTrendingUp,
  IconDatabase,
  IconBriefcase,
  IconNotes,
  IconChartBar,
  IconChartDonut,
  IconTrophy,
  type Icon,
} from '@tabler/icons-react';
import { useApp } from '../../context/AppContext';
import { Entry } from '../../types';
import { todayStr, getWeekKey, getWeekNumber, fmtH, toDStr, sortEntriesDesc } from '../../utils';
import EntryCard from '../Entries/EntryCard';
import EntryEditModal from '../Entries/EntryEditModal';
import './Dashboard.css';

const RANGES = [8, 12, 24];
const PALETTE_VARS = ['--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5', '--chart-6', '--chart-7'];

function getRecentWeekKeys(count: number) {
  const today = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - index * 7);
    return getWeekKey(toDStr(date));
  }).reverse();
}

function cssVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function usePalette() {
  const theme = useThemeAttr();
  return useMemo(() => PALETTE_VARS.map(cssVar), [theme]);
}

function useThemeAttr() {
  const [theme, setTheme] = useState(() => document.documentElement.getAttribute('data-theme'));
  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(document.documentElement.getAttribute('data-theme')));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);
  return theme;
}

function useWidth(ref: React.RefObject<HTMLElement>) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}

function projectTotals(entries: Entry[]) {
  const totals: Record<string, number> = {};
  entries.forEach((entry) => { totals[entry.proj] = (totals[entry.proj] || 0) + entry.h; });
  return Object.entries(totals).sort((a, b) => b[1] - a[1]);
}

function KPIs() {
  const { entries, notes } = useApp();
  const today = todayStr();
  const weekKey = getWeekKey(today);

  const metrics = useMemo(() => {
    const todayEntries = entries.filter((entry) => entry.date === today);
    const totalToday = todayEntries.reduce((sum, entry) => sum + entry.h, 0);
    const totalWeek = entries.filter((entry) => getWeekKey(entry.date) === weekKey).reduce((sum, entry) => sum + entry.h, 0);
    const totalAll = entries.reduce((sum, entry) => sum + entry.h, 0);
    const projectCount = new Set(entries.map((entry) => entry.proj)).size;
    const totals = getRecentWeekKeys(8).map((key) => entries.filter((entry) => getWeekKey(entry.date) === key).reduce((sum, entry) => sum + entry.h, 0));
    const activeWeeks = totals.filter((value) => value > 0);
    const weeklyAverage = activeWeeks.length ? activeWeeks.reduce((sum, value) => sum + value, 0) / activeWeeks.length : 0;

    const list: { icon: Icon; label: string; value: string; sub: string }[] = [
      { icon: IconSun, label: 'Hoje', value: fmtH(totalToday), sub: `${todayEntries.length} entr.` },
      { icon: IconCalendarWeek, label: 'Esta semana', value: fmtH(totalWeek), sub: 'de 40h' },
      { icon: IconTrendingUp, label: 'Média semanal', value: fmtH(Math.round(weeklyAverage * 4) / 4), sub: 'últ. semanas ativas' },
      { icon: IconDatabase, label: 'Total', value: fmtH(totalAll), sub: 'histórico' },
      { icon: IconBriefcase, label: 'Projetos', value: String(projectCount), sub: 'distintos' },
      { icon: IconNotes, label: 'Notas', value: String(notes.filter((note) => !note.done).length), sub: 'ativas' },
    ];
    return list;
  }, [entries, notes, today, weekKey]);

  return (
    <div className="dash-kpis">
      {metrics.map(({ icon: IconCmp, label, value, sub }) => (
        <div className="card dash-kpi" key={label}>
          <span className="dash-kpi-icon"><IconCmp size={18} stroke={1.75} /></span>
          <span className="dash-kpi-label">{label}</span>
          <span className="dash-kpi-value tabular">{value}</span>
          <span className="dash-kpi-sub">{sub}</span>
        </div>
      ))}
    </div>
  );
}

function roundedTopRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h);
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.lineTo(x + w - radius, y);
  ctx.arcTo(x + w, y, x + w, y + radius, radius);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
}

function WeeklyBarChart({ weekKeys }: { weekKeys: string[] }) {
  const { entries } = useApp();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hover, setHover] = useState<{ index: number; x: number; y: number } | null>(null);
  const width = useWidth(wrapRef);
  const theme = useThemeAttr();

  const data = useMemo(
    () => weekKeys.map((key) => entries.filter((entry) => getWeekKey(entry.date) === key).reduce((sum, entry) => sum + entry.h, 0)),
    [entries, weekKeys],
  );
  const labels = useMemo(() => weekKeys.map((key, index) => (index === weekKeys.length - 1 ? 'Esta' : `S${getWeekNumber(key)}`)), [weekKeys]);
  const height = 200;
  const padding = { top: 22, right: 8, bottom: 28, left: 36 };
  const maxValue = Math.max(...data, 8);
  const plotWidth = Math.max(0, width - padding.left - padding.right);
  const plotHeight = height - padding.top - padding.bottom;
  const slot = plotWidth / (data.length || 1);
  const barWidth = Math.min(28, slot * 0.6);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !width) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const primary = cssVar('--primary');
    const muted = cssVar('--text-muted');
    const border = cssVar('--border');
    const text = cssVar('--text');
    const font = cssVar('--font');

    ctx.strokeStyle = border;
    ctx.lineWidth = 1;
    ctx.font = `12px ${font}`;
    [0, 0.5, 1].forEach((fraction) => {
      const y = Math.round(padding.top + plotHeight * (1 - fraction)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + plotWidth, y);
      ctx.stroke();
      ctx.fillStyle = muted;
      ctx.textAlign = 'right';
      ctx.fillText(fmtH(maxValue * fraction), padding.left - 6, y + 4);
    });

    if (maxValue >= 35) {
      const goalY = padding.top + plotHeight * (1 - 40 / maxValue);
      ctx.save();
      ctx.strokeStyle = muted;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(padding.left, goalY);
      ctx.lineTo(padding.left + plotWidth, goalY);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = muted;
      ctx.textAlign = 'left';
      ctx.fillText('40h', padding.left + 4, goalY - 4);
    }

    data.forEach((value, index) => {
      const cx = padding.left + slot * index + slot / 2;
      const barHeight = (value / maxValue) * plotHeight;
      if (value > 0) {
        ctx.fillStyle = primary;
        roundedTopRect(ctx, cx - barWidth / 2, padding.top + plotHeight - barHeight, barWidth, barHeight, 8);
        ctx.fill();
        if (slot > 30) {
          ctx.fillStyle = text;
          ctx.font = `600 11px ${font}`;
          ctx.textAlign = 'center';
          ctx.fillText(fmtH(value), cx, padding.top + plotHeight - barHeight - 6);
        }
      }
      ctx.fillStyle = muted;
      ctx.font = `${index === data.length - 1 ? '600 ' : ''}11px ${font}`;
      ctx.textAlign = 'center';
      if (slot > 26 || index % 2 === data.length % 2) {
        ctx.fillText(labels[index], cx, height - 8);
      }
    });
  }, [data, labels, width, theme, maxValue, plotHeight, plotWidth, slot, barWidth]);

  function handleMove(event: React.MouseEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left - padding.left;
    const index = Math.floor(x / slot);
    if (index >= 0 && index < data.length) {
      setHover({ index, x: event.clientX - rect.left, y: event.clientY - rect.top });
    } else {
      setHover(null);
    }
  }

  return (
    <div className="dash-chart-area" ref={wrapRef}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`Horas por semana: ${data.map((value, index) => `${labels[index]} ${fmtH(value)}`).join(', ')}`}
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
      />
      {hover && (
        <div className="chart-tooltip" style={{ left: hover.x, top: hover.y }}>
          {labels[hover.index]}: <strong className="tabular">{fmtH(data[hover.index])}</strong>
        </div>
      )}
    </div>
  );
}

function DonutChart({ entries }: { entries: Entry[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const palette = usePalette();
  const [hover, setHover] = useState<{ index: number; x: number; y: number } | null>(null);
  const size = 168;
  const outerRadius = 76;
  const innerRadius = 50;

  const slices = useMemo(() => {
    const sorted = projectTotals(entries);
    const top = sorted.slice(0, 6);
    const otherTotal = sorted.slice(6).reduce((sum, [, value]) => sum + value, 0);
    if (otherTotal > 0) top.push(['Outros', otherTotal]);
    return top;
  }, [entries]);
  const total = slices.reduce((sum, [, value]) => sum + value, 0);

  const angles = useMemo(() => {
    let start = -Math.PI / 2;
    return slices.map(([, value]) => {
      const angle = (value / (total || 1)) * Math.PI * 2;
      const range = { start, end: start + angle };
      start += angle;
      return range;
    });
  }, [slices, total]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    const center = size / 2;

    if (!slices.length) {
      ctx.beginPath();
      ctx.arc(center, center, outerRadius, 0, Math.PI * 2);
      ctx.arc(center, center, innerRadius, 0, Math.PI * 2, true);
      ctx.fillStyle = cssVar('--surface-muted');
      ctx.fill();
      return;
    }

    const gap = slices.length > 1 ? 0.02 : 0;
    angles.forEach(({ start, end }, index) => {
      ctx.beginPath();
      ctx.arc(center, center, outerRadius, start + gap, end - gap);
      ctx.arc(center, center, innerRadius, end - gap, start + gap, true);
      ctx.closePath();
      ctx.fillStyle = palette[index % palette.length];
      ctx.fill();
    });
  }, [slices, angles, palette]);

  function handleMove(event: React.MouseEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    const distance = Math.hypot(x, y);
    if (distance < innerRadius || distance > outerRadius) return setHover(null);
    let angle = Math.atan2(y, x);
    if (angle < -Math.PI / 2) angle += Math.PI * 2;
    const index = angles.findIndex(({ start, end }) => angle >= start && angle < end);
    setHover(index >= 0 ? { index, x: event.clientX - rect.left, y: event.clientY - rect.top } : null);
  }

  return (
    <div className="dash-donut-wrap">
      <div className="dash-donut">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`Horas por projeto: ${slices.map(([name, value]) => `${name} ${fmtH(value)}`).join(', ') || 'sem dados'}`}
          onMouseMove={handleMove}
          onMouseLeave={() => setHover(null)}
        />
        <span className="dash-donut-total tabular" aria-hidden="true">{fmtH(total)}</span>
        {hover && (
          <div className="chart-tooltip" style={{ left: hover.x, top: hover.y }}>
            {slices[hover.index][0]}: <strong className="tabular">{fmtH(slices[hover.index][1])}</strong> ({Math.round((slices[hover.index][1] / (total || 1)) * 100)}%)
          </div>
        )}
      </div>
      <ul className="dash-legend">
        {slices.map(([name, value], index) => (
          <li key={name} className="dash-legend-item">
            <span className="dash-legend-dot" style={{ background: palette[index % palette.length] }} />
            <span className="dash-legend-name">{name}</span>
            <span className="dash-legend-value tabular">{fmtH(value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TopProjects({ entries }: { entries: Entry[] }) {
  const palette = usePalette();
  const projects = useMemo(() => projectTotals(entries).slice(0, 6), [entries]);
  const maxHours = projects[0]?.[1] || 1;

  if (!projects.length) {
    return <div className="empty-state">Sem dados ainda</div>;
  }

  return (
    <ul className="dash-top-projects">
      {projects.map(([name, hours], index) => (
        <li key={name} className="dash-proj-row">
          <span className="dash-proj-name" title={name}>{name}</span>
          <span className="dash-proj-bar-bg">
            <span className="dash-proj-bar-fill" style={{ width: `${(hours / maxHours) * 100}%`, background: palette[index % palette.length] }} />
          </span>
          <span className="dash-proj-h tabular">{fmtH(hours)}</span>
        </li>
      ))}
    </ul>
  );
}

export default function Dashboard() {
  const { entries, saveEntries, showSync } = useApp();
  const [weeksRange, setWeeksRange] = useState(8);
  const [editEntry, setEditEntry] = useState<Entry | null>(null);

  const weekKeys = useMemo(() => getRecentWeekKeys(weeksRange), [weeksRange]);
  const rangeEntries = useMemo(() => {
    const keys = new Set(weekKeys);
    return entries.filter((entry) => keys.has(getWeekKey(entry.date)));
  }, [entries, weekKeys]);
  const rangeTotal = rangeEntries.reduce((sum, entry) => sum + entry.h, 0);
  const recent = useMemo(() => sortEntriesDesc(entries).slice(0, 5), [entries]);

  return (
    <div className="dash">
      <div className="chips" role="group" aria-label="Período">
        {RANGES.map((range) => (
          <button key={range} type="button" className="chip-filter" aria-pressed={weeksRange === range} onClick={() => setWeeksRange(range)}>
            {range} semanas
          </button>
        ))}
      </div>

      <section className="card dash-hero" aria-labelledby="dashTotal">
        <div className="dash-hero-head">
          <div>
            <h2 className="dash-hero-label" id="dashTotal">Total de horas</h2>
            <p className="dash-hero-value tabular">{fmtH(rangeTotal)}</p>
            <p className="dash-hero-sub">nas últimas {weeksRange} semanas · {rangeEntries.length} entradas</p>
          </div>
          <span className="dash-card-title-icon" aria-hidden="true"><IconChartBar size={20} stroke={1.75} /></span>
        </div>
        <WeeklyBarChart weekKeys={weekKeys} />
      </section>

      <KPIs />

      <div className="dash-two-col">
        <section className="card dash-card" aria-labelledby="dashDonut">
          <h2 className="dash-card-title" id="dashDonut"><IconChartDonut size={18} stroke={1.75} /> Por projeto</h2>
          <DonutChart entries={entries} />
        </section>
        <section className="card dash-card" aria-labelledby="dashTop">
          <h2 className="dash-card-title" id="dashTop"><IconTrophy size={18} stroke={1.75} /> Top projetos</h2>
          <TopProjects entries={entries} />
        </section>
      </div>

      <section aria-labelledby="dashRecent">
        <h2 className="section-title" id="dashRecent">Atividade recente</h2>
        {recent.length ? (
          <div className="entry-list">
            {recent.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                showSync={showSync}
                showDate
                onEdit={setEditEntry}
                onToggleSync={(item, checked) => saveEntries(entries.map((e) => (e.id === item.id ? { ...e, sync: checked } : e)))}
              />
            ))}
          </div>
        ) : (
          <div className="card empty-state">Sem atividade ainda</div>
        )}
      </section>

      {editEntry && <EntryEditModal entry={editEntry} onClose={() => setEditEntry(null)} />}
    </div>
  );
}
