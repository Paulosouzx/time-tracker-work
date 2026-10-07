import { IconExternalLink } from '@tabler/icons-react';
import { Entry } from '../../types';
import { fmtH } from '../../utils';
import './Entries.css';

interface EntryCardProps {
  entry: Entry;
  showSync: boolean;
  showDate?: boolean;
  onEdit: (entry: Entry) => void;
  onToggleSync: (entry: Entry, checked: boolean) => void;
}

export default function EntryCard({ entry, showSync, showDate, onEdit, onToggleSync }: EntryCardProps) {
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

      <span className="entry-duration tabular">{fmtH(entry.h)}</span>

      {entry.link && (
        <a className="btn-play" href={entry.link} target="_blank" rel="noopener noreferrer" aria-label={`Abrir link da case: ${title}`} title={entry.link}>
          <IconExternalLink size={20} stroke={2} />
        </a>
      )}
    </article>
  );
}
