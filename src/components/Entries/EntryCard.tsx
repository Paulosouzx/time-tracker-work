import { IconExternalLink, IconPlayerPlay } from '@tabler/icons-react';
import { Entry } from '../../types';
import { fmtH } from '../../utils';
import './Entries.css';

interface EntryCardProps {
  entry: Entry;
  showSync: boolean;
  showDate?: boolean;
  onEdit: (entry: Entry) => void;
  onToggleSync: (entry: Entry, checked: boolean) => void;
  onRepeat?: (entry: Entry) => void;
}

export default function EntryCard({ entry, showSync, showDate, onEdit, onToggleSync, onRepeat }: EntryCardProps) {
  const title = entry.desc || entry.proj;

  return (
    <article className="entry-card">
      {showSync && (
        <label className="entry-sync" title="Registado no sistema">
          <input
            type="checkbox"
            checked={!!entry.sync}
            onChange={(event) => onToggleSync(entry, event.target.checked)}
            aria-label={`Registado no sistema: ${title}`}
          />
        </label>
      )}

      <button type="button" className="entry-main" onClick={() => onEdit(entry)} aria-label={`Editar ${title}, ${fmtH(entry.h)}`}>
        <span className="entry-title">{title}</span>
        <span className="entry-meta">
          <span className="tag">{entry.proj}</span>
          {showDate && <span className="entry-date tabular">{entry.date}</span>}
        </span>
      </button>

      {entry.link && (
        <a className="btn-icon entry-link" href={entry.link} target="_blank" rel="noopener noreferrer" aria-label={`Abrir link de ${title}`} title={entry.link}>
          <IconExternalLink size={18} stroke={1.75} />
        </a>
      )}

      <span className="entry-duration tabular">{fmtH(entry.h)}</span>

      {onRepeat && (
        <button type="button" className="btn-play" onClick={() => onRepeat(entry)} aria-label={`Registar novamente: ${title}`} title="Registar novamente">
          <IconPlayerPlay size={18} stroke={2} fill="currentColor" />
        </button>
      )}
    </article>
  );
}
