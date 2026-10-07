import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import './Dashboard.css';
import { todayStr, getWeekKey, getWeekNumber, fmtH, DASH_PALETTE, toDStr } from '../../utils';

function getRecentWeekKeys(count: number) {
  const today = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - index * 7);
    return getWeekKey(toDStr(date));
  }).reverse();
}

function KPIs() {
  const { entries, notes } = useApp();
  const today = todayStr();
  const weekKey = getWeekKey(today);

  const todayEntries = useMemo(() => entries.filter(entry => entry.date === today), [entries, today]);
  const weekEntries = useMemo(() => entries.filter(entry => getWeekKey(entry.date) === weekKey), [entries, weekKey]);

  const totalToday = useMemo(() => todayEntries.reduce((sum, entry) => sum + entry.h, 0), [todayEntries]);
  const totalWeek = useMemo(() => weekEntries.reduce((sum, entry) => sum + entry.h, 0), [weekEntries]);
  const totalAll = useMemo(() => entries.reduce((sum, entry) => sum + entry.h, 0), [entries]);
  const projectCount = useMemo(() => new Set(entries.map(entry => entry.proj)).size, [entries]);

  const weeklyAverage = useMemo(() => {
    const weekKeys = getRecentWeekKeys(8);
    const totals = weekKeys.map(key => entries.filter(entry => getWeekKey(entry.date) === key).reduce((sum, entry) => sum + entry.h, 0));
    const activeWeeks = totals.filter(value => value > 0);
    return activeWeeks.length ? activeWeeks.reduce((sum, value) => sum + value, 0) / activeWeeks.length : 0;
  }, [entries]);

  const metrics = [
    { icon: 'ti-sun', label: 'Hoje', value: fmtH(totalToday), sub: `${todayEntries.length} entr.` },
    { icon: 'ti-calendar-week', label: 'Esta Semana', value: fmtH(totalWeek), sub: 'de 40h' },
    { icon: 'ti-trending-up', label: 'Média Semanal', value: fmtH(Math.round(weeklyAverage * 4) / 4), sub: 'últ. semanas activas' },
    { icon: 'ti-database', label: 'Total', value: fmtH(totalAll), sub: 'histórico' },
    { icon: 'ti-briefcase', label: 'Projetos', value: String(projectCount), sub: 'distintos' },
    { icon: 'ti-notes', label: 'Notas', value: String(notes.filter(note => !note.done).length), sub: 'activas' },
  ];

  return (
    <div className="dash-kpis">
      {metrics.map(metric => (
        <div className="dash-kpi" key={metric.label}>
          <div className="dash-kpi-icon"><i className={`ti ${metric.icon}`} /></div>
          <div className="dash-kpi-label">{metric.label}</div>
          <div className="dash-kpi-value">{metric.value}</div>
          <div className="dash-kpi-sub">{metric.sub}</div>
        </div>
      ))}
    </div>
  );
}

function LineChart({ weeksRange }: { weeksRange: number }) {
  const { entries } = useApp();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const weekKeys = getRecentWeekKeys(weeksRange);
    const data = weekKeys.map(key => entries.filter(entry => getWeekKey(entry.date) === key).reduce((sum, entry) => sum + entry.h, 0));
    const labels = weekKeys.map((key, index) => index === weekKeys.length - 1 ? 'Esta' : `S${getWeekNumber(key)}`);

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.parentElement?.clientWidth || 600;
    const height = 160;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const style = getComputedStyle(document.documentElement);
    const accent = style.getPropertyValue('--primary').trim() || '#534AB7';
    const text3 = style.getPropertyValue('--text3').trim() || '#9895b0';
    const border = style.getPropertyValue('--border').trim() || '#E2E0F0';
    const surface = style.getPropertyValue('--surface').trim() || '#fff';
    const ok = style.getPropertyValue('--ok').trim() || '#1D9E75';

    const padding = { top: 16, right: 16, bottom: 36, left: 38 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;
    const maxValue = Math.max(...data, 8);

    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = border;
    ctx.lineWidth = 1;

    [0, 0.25, 0.5, 0.75, 1].forEach(fraction => {
      const y = padding.top + plotHeight * (1 - fraction);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + plotWidth, y);
      ctx.stroke();
      ctx.fillStyle = text3;
      ctx.font = '10px system-ui';
      ctx.textAlign = 'right';
      ctx.fillText(fmtH(maxValue * fraction), padding.left - 4, y + 3);
    });

    if (maxValue >= 35) {
      const goalY = padding.top + plotHeight * (1 - 40 / maxValue);
      ctx.save();
      ctx.strokeStyle = ok;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(padding.left, goalY);
      ctx.lineTo(padding.left + plotWidth, goalY);
      ctx.stroke();
      ctx.restore();
    }

    const points = data.map((value, index) => ({
      x: padding.left + (index / (data.length - 1 || 1)) * plotWidth,
      y: padding.top + plotHeight * (1 - value / maxValue),
    }));

    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + plotHeight);
    gradient.addColorStop(0, `${accent}55`);
    gradient.addColorStop(1, `${accent}00`);

    ctx.beginPath();
    points.forEach((point, index) => index === 0 ? ctx.moveTo(point.x, point.y) : ctx.lineTo(point.x, point.y));
    ctx.lineTo(points[points.length - 1].x, padding.top + plotHeight);
    ctx.lineTo(points[0].x, padding.top + plotHeight);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    points.forEach((point, index) => index === 0 ? ctx.moveTo(point.x, point.y) : ctx.lineTo(point.x, point.y));
    ctx.stroke();

    points.forEach((point, index) => {
      ctx.fillStyle = text3;
      ctx.font = '10px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(labels[index], point.x, height - padding.bottom + 14);

      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = surface;
      ctx.fill();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.stroke();

      if (data[index] > 0) {
        ctx.fillStyle = accent;
        ctx.font = 'bold 10px system-ui';
        ctx.fillText(fmtH(data[index]), point.x, point.y - 9);
      }
    });

    const tooltip = tooltipRef.current;
    function handleMove(event: MouseEvent) {
      const rect = canvas?.getBoundingClientRect();
      if (!rect) return;
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const hitIndex = points.findIndex(point => Math.hypot(x - point.x, y - point.y) < 20);

      if (hitIndex >= 0 && tooltip) {
        tooltip.textContent = `${labels[hitIndex]}: ${fmtH(data[hitIndex])}`;
        tooltip.classList.add('visible');
        tooltip.style.left = `${event.clientX + 12}px`;
        tooltip.style.top = `${event.clientY - 28}px`;
      } else {
        tooltip?.classList.remove('visible');
      }
    }

    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mouseleave', () => tooltip?.classList.remove('visible'));
    return () => {
      canvas.removeEventListener('mousemove', handleMove);
      tooltip?.classList.remove('visible');
    };
  }, [entries, weeksRange]);

  return (
    <>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      <div ref={tooltipRef} className="chart-tooltip" />
    </>
  );
}

function DonutChart() {
  const { entries } = useApp();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const legendRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const totals = entries.reduce<Record<string, number>>((acc, entry) => {
      acc[entry.proj] = (acc[entry.proj] || 0) + entry.h;
      return acc;
    }, {});

    const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    const slices = sorted.slice(0, 6);
    const otherTotal = sorted.slice(6).reduce((sum, [, value]) => sum + value, 0);
    if (otherTotal > 0) slices.push(['Outros', otherTotal]);

    const total = slices.reduce((sum, [, value]) => sum + value, 0) || 1;
    const size = 160;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = size * devicePixelRatio;
    canvas.height = size * devicePixelRatio;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

    const style = getComputedStyle(document.documentElement);
    const surface2 = style.getPropertyValue('--surface2').trim() || '#F1EFF9';
    const surface = style.getPropertyValue('--surface').trim() || '#fff';
    const center = size / 2;
    const outerRadius = 62;
    const innerRadius = 38;

    if (slices.length === 0) {
      ctx.beginPath();
      ctx.arc(center, center, outerRadius, 0, Math.PI * 2);
      ctx.fillStyle = surface2;
      ctx.fill();
      if (legendRef.current) legendRef.current.innerHTML = '';
      return;
    }

    let startAngle = -Math.PI / 2;
    const sliceAngles: Array<{ name: string; value: number; start: number; end: number }> = [];

    slices.forEach(([name, value], index) => {
      const angle = (value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, outerRadius, startAngle, startAngle + angle);
      ctx.closePath();
      ctx.fillStyle = DASH_PALETTE[index % DASH_PALETTE.length];
      ctx.fill();
      sliceAngles.push({ name, value, start: startAngle, end: startAngle + angle });
      startAngle += angle;
    });

    ctx.beginPath();
    ctx.arc(center, center, innerRadius, 0, Math.PI * 2);
    ctx.fillStyle = surface;
    ctx.fill();

    ctx.fillStyle = style.getPropertyValue('--text1').trim() || '#1a1a2e';
    ctx.font = 'bold 14px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(fmtH(total), center, center);

    if (legendRef.current) {
      legendRef.current.innerHTML = slices.map(([name, value], index) =>
        `<div class="dash-legend-item">
          <span class="dash-legend-dot" style="background:${DASH_PALETTE[index % DASH_PALETTE.length]};"></span>
          <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${name}</span>
          <span style="font-weight:600;color:var(--primary);font-size:11px;">${fmtH(value)}</span>
        </div>`
      ).join('');
    }

    const tooltip = tooltipRef.current;
    function handleMove(event: MouseEvent) {
      const rect = canvas?.getBoundingClientRect();
      if (!rect) return;
      const scale = size / rect.width;
      const x = (event.clientX - rect.left) * scale - center;
      const y = (event.clientY - rect.top) * scale - center;
      const distance = Math.hypot(x, y);
      if (distance < innerRadius || distance > outerRadius) {
        tooltip?.classList.remove('visible');
        return;
      }

      let angle = Math.atan2(y, x);
      if (angle < -Math.PI / 2) angle += Math.PI * 2;
      const slice = sliceAngles.find(sliceData => angle >= sliceData.start && angle < sliceData.end);
      if (!slice) {
        tooltip?.classList.remove('visible');
        return;
      }

      if (tooltip) {
        tooltip.textContent = `${slice.name}: ${fmtH(slice.value)} (${Math.round((slice.value / total) * 100)}%)`;
        tooltip.classList.add('visible');
        tooltip.style.left = `${event.clientX + 12}px`;
        tooltip.style.top = `${event.clientY - 28}px`;
      }
    }

    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mouseleave', () => tooltip?.classList.remove('visible'));
    return () => {
      canvas.removeEventListener('mousemove', handleMove);
      tooltip?.classList.remove('visible');
    };
  }, [entries]);

  return (
    <>
      <canvas ref={canvasRef} width={160} height={160} />
      <div ref={tooltipRef} className="chart-tooltip" />
      <div ref={legendRef} style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: '0 4px 4px' }} />
    </>
  );
}

function TopProjects() {
  const { entries } = useApp();

  const projects = useMemo(() => {
    const totals: Record<string, number> = {};
    entries.forEach(entry => { totals[entry.proj] = (totals[entry.proj] || 0) + entry.h; });
    return Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [entries]);

  const maxHours = projects[0]?.[1] || 1;

  if (!projects.length) {
    return <div className="dash-empty">Sem dados ainda</div>;
  }

  return (
    <>
      {projects.map(([name, hours], index) => (
        <div key={name} className="dash-proj-row">
          <div className="dash-proj-name" title={name}>{name}</div>
          <div className="dash-proj-bar-bg">
            <div
              className="dash-proj-bar-fill"
              style={{ width: `${(hours / maxHours) * 100}%`, background: DASH_PALETTE[index % DASH_PALETTE.length] }}
            />
          </div>
          <div className="dash-proj-h">{fmtH(hours)}</div>
        </div>
      ))}
    </>
  );
}

export default function Dashboard() {
  const [weeksRange, setWeeksRange] = useState(8);

  return (
    <div id="panelDash" className="panel active">
      <KPIs />

      <div className="dash-card dash-card-chart">
        <div className="dash-card-header">
          <span className="dash-card-title"><i className="ti ti-chart-line" /> Horas por Semana</span>
          <select
            className="week-select"
            value={weeksRange}
            onChange={e => setWeeksRange(Number(e.target.value))}
          >
            <option value={8}>Últimas 8 semanas</option>
            <option value={12}>Últimas 12 semanas</option>
            <option value={24}>Últimas 24 semanas</option>
          </select>
        </div>
        <div className="dash-chart-area">
          <LineChart weeksRange={weeksRange} />
        </div>
      </div>

      <div className="dash-two-col">
        <div className="dash-card">
          <div className="dash-card-header">
            <span className="dash-card-title"><i className="ti ti-chart-donut" /> Por Projeto</span>
          </div>
          <div className="dash-donut-wrap">
            <DonutChart />
          </div>
        </div>
        <div className="dash-card">
          <div className="dash-card-header">
            <span className="dash-card-title"><i className="ti ti-trophy" /> Top Projetos</span>
          </div>
          <div className="dash-top-projects">
            <TopProjects />
          </div>
        </div>
      </div>
    </div>
  );
}
