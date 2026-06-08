export function fmtH(h: number): string {
  if (!h) return '0h';
  const abs = Math.abs(h);
  const hh = Math.floor(abs);
  const mm = Math.round((abs - hh) * 60);
  const sign = h < 0 ? '-' : '';
  if (hh === 0 && mm > 0) return sign + mm + 'm';
  if (hh === 0 && mm === 0) return '0h';
  return sign + hh + 'h' + (mm > 0 ? mm + 'm' : '');
}

export function todayStr(): string {
  return toDStr(new Date());
}

export function toDStr(d: Date): string {
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function parseDStr(s: string): Date {
  const p = s.split('/');
  return new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0]));
}

export function getWeekKey(dateStr: string): string {
  const d = parseDStr(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = d.getDay();
  const diff = d.getDate() - (day === 0 ? 6 : day - 1);
  const mon = new Date(d);
  mon.setDate(diff);
  return toDStr(mon);
}

export function weekRangeLabel(monStr: string): string {
  const mon = parseDStr(monStr);
  const fri = new Date(mon);
  fri.setDate(mon.getDate() + 4);
  return (
    mon.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' }) +
    ' – ' +
    fri.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })
  );
}

export function getWeekNumber(monStr: string): number {
  const mon = parseDStr(monStr);
  const startOfYear = new Date(mon.getFullYear(), 0, 1);
  return Math.ceil(
    (Math.floor((mon.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)) +
      startOfYear.getDay() +
      1) /
      7
  );
}

export function esc(s: string): string {
  return s
    ? s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
    : '';
}

export function darkenHex(hex: string, pct: number): string {
  hex = hex.replace('#', '');
  let r = parseInt(hex.substr(0, 2), 16);
  let g = parseInt(hex.substr(2, 2), 16);
  let b = parseInt(hex.substr(4, 2), 16);
  r = Math.max(0, r - Math.round((r * pct) / 100));
  g = Math.max(0, g - Math.round((g * pct) / 100));
  b = Math.max(0, b - Math.round((b * pct) / 100));
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

export function hexWithAlpha(hex: string, alpha: number): string {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function blendHex(hex1: string, hex2: string, t: number): string {
  const p = (s: string) => {
    s = s.replace('#', '');
    return [parseInt(s.substr(0, 2), 16), parseInt(s.substr(2, 2), 16), parseInt(s.substr(4, 2), 16)];
  };
  const [r1, g1, b1] = p(hex1);
  const [r2, g2, b2] = p(hex2);
  return (
    '#' +
    [Math.round(r1 * (1 - t) + r2 * t), Math.round(g1 * (1 - t) + g2 * t), Math.round(b1 * (1 - t) + b2 * t)]
      .map((x) => x.toString(16).padStart(2, '0'))
      .join('')
  );
}

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Bom dia';
  if (h >= 12 && h < 19) return 'Boa tarde';
  return 'Boa noite';
}

export const MONTH_NAMES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];

export const DASH_PALETTE = [
  '#534AB7','#E8547A','#2E8B57','#E8A020','#0F609B',
  '#CB4127','#7C6FFF','#22C97A','#B08090','#8A6A20',
];