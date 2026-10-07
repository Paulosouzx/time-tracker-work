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

export type EventTone = 'lime' | 'peach' | 'rose';
const TONES: EventTone[] = ['lime', 'peach', 'rose'];

export function projectTone(project: string): EventTone {
  let hash = 0;
  for (let i = 0; i < project.length; i++) hash = (hash * 31 + project.charCodeAt(i)) | 0;
  return TONES[Math.abs(hash) % TONES.length];
}

export function dateSortKey(dateStr: string): string {
  return dateStr.split('/').reverse().join('');
}

export function sortEntriesDesc<T extends { date: string; id: string }>(list: T[]): T[] {
  return [...list].sort((a, b) => dateSortKey(b.date).localeCompare(dateSortKey(a.date)) || b.id.localeCompare(a.id));
}

export function longDayLabel(date: Date): string {
  return date.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });
}
