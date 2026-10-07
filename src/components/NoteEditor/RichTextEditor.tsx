import {
  IconBold,
  IconItalic,
  IconUnderline,
  IconStrikethrough,
  IconList,
  IconQuote,
  IconAlignLeft,
  IconAlignCenter,
  IconAlignRight,
  type Icon,
} from '@tabler/icons-react';
import './RichTextEditor.css';

function execCommand(editorRef: React.RefObject<HTMLDivElement>, command: string, value?: string) {
  editorRef.current?.focus();
  document.execCommand(command, false, value);
  editorRef.current?.dispatchEvent(new Event('input', { bubbles: true }));
}

function handleListTab(event: React.KeyboardEvent<HTMLDivElement>) {
  if (event.key !== 'Tab') return;
  event.preventDefault();
  const selection = window.getSelection();
  if (!selection?.rangeCount) return;

  const range = selection.getRangeAt(0);
  const container = range.startContainer;
  const listItem = (container.nodeType === Node.TEXT_NODE ? container.parentElement : container as Element)?.closest('li');

  if (listItem) {
    if (!event.shiftKey) {
      const previous = listItem.previousElementSibling as HTMLElement | null;
      if (previous) {
        let nested = previous.querySelector(':scope > ul, :scope > ol') as HTMLElement | null;
        if (!nested) {
          nested = document.createElement('ul');
          previous.appendChild(nested);
        }
        nested.appendChild(listItem);
      }
    } else {
      const parent = listItem.parentElement as HTMLElement;
      const parentItem = parent.parentElement?.closest('li');
      if (parentItem) {
        parentItem.parentElement!.insertBefore(listItem, parentItem.nextSibling);
        if (!parent.children.length) parent.remove();
      }
    }
    event.currentTarget.dispatchEvent(new Event('input', { bubbles: true }));
    return;
  }

  if (container.nodeType === Node.TEXT_NODE) {
    const text = container.textContent || '';
    const offset = range.startOffset;
    if (text.substring(0, offset).trim() === '-') {
      range.setStart(container, text.lastIndexOf('-', offset - 1));
      range.setEnd(container, offset);
      range.deleteContents();
      document.execCommand('insertUnorderedList', false);
      return;
    }
  }

  document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
}

const FORMAT_BUTTONS: { command: string; value?: string; label: string; icon: Icon; group: number }[] = [
  { command: 'bold', label: 'Negrito', icon: IconBold, group: 1 },
  { command: 'italic', label: 'Itálico', icon: IconItalic, group: 1 },
  { command: 'underline', label: 'Sublinhado', icon: IconUnderline, group: 1 },
  { command: 'strikeThrough', label: 'Rasurado', icon: IconStrikethrough, group: 1 },
  { command: 'insertUnorderedList', label: 'Lista', icon: IconList, group: 2 },
  { command: 'formatBlock', value: '<blockquote>', label: 'Citação', icon: IconQuote, group: 2 },
  { command: 'justifyLeft', label: 'Alinhar à esquerda', icon: IconAlignLeft, group: 3 },
  { command: 'justifyCenter', label: 'Centrar', icon: IconAlignCenter, group: 3 },
  { command: 'justifyRight', label: 'Alinhar à direita', icon: IconAlignRight, group: 3 },
];

interface RichTextEditorProps {
  editorRef: React.RefObject<HTMLDivElement>;
  onInput?: () => void;
  compact?: boolean;
  label?: string;
}

export default function RichTextEditor({ editorRef, onInput, compact = false, label = 'Conteúdo da nota' }: RichTextEditorProps) {
  const buttons = compact ? FORMAT_BUTTONS.filter((button) => button.group < 3) : FORMAT_BUTTONS;

  return (
    <div className={`rte ${compact ? 'rte-compact' : ''}`}>
      <div className="rte-toolbar" role="toolbar" aria-label="Formatação">
        <select
          className="rte-select"
          aria-label="Estilo do bloco"
          defaultValue=""
          onChange={(e) => {
            const value = e.target.value;
            if (value) execCommand(editorRef, 'formatBlock', `<${value}>`);
            e.target.value = '';
          }}
        >
          <option value="">Parágrafo</option>
          <option value="h1">Título 1</option>
          <option value="h2">Título 2</option>
        </select>
        {buttons.map((button, index) => {
          const IconCmp = button.icon;
          const separator = index > 0 && buttons[index - 1].group !== button.group;
          return (
            <span key={button.label} className="rte-btn-wrap">
              {separator && <span className="rte-sep" aria-hidden="true" />}
              <button
                type="button"
                className="rte-btn"
                title={button.label}
                aria-label={button.label}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => execCommand(editorRef, button.command, button.value)}
              >
                <IconCmp size={17} stroke={1.75} />
              </button>
            </span>
          );
        })}
      </div>

      <div
        ref={editorRef}
        className="rte-editor rich-content"
        contentEditable
        role="textbox"
        aria-multiline="true"
        aria-label={label}
        data-placeholder="Escreve a tua anotação (podes usar '-' e Tab para listas)…"
        onKeyDown={handleListTab}
        onInput={onInput}
        suppressContentEditableWarning
      />
    </div>
  );
}
