import {
  formatExchangeAsScreenplay,
  type DialogExchange,
  type getDialogVersionsForScene,
} from '../../data/sceneDialogVersions';
import CopyButton from './CopyButton';

interface DialogAuditionProps {
  dialogSet: NonNullable<ReturnType<typeof getDialogVersionsForScene>>;
  expandedExchangeId: string | null;
  copiedKey: string | null;
  onToggleExchange: (id: string) => void;
  onCopy: (text: string, label: string, key: string) => void;
}

export default function DialogAudition({
  dialogSet,
  expandedExchangeId,
  copiedKey,
  onToggleExchange,
  onCopy,
}: DialogAuditionProps) {
  return (
    <aside className="flex max-h-[calc(100vh-10rem)] min-h-0 flex-col gap-4 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950/95 p-5 shadow-2xl shadow-black/30">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-300">
          Rosencrantz register
        </p>
        <p className="mt-2 text-sm leading-6 text-zinc-300">{dialogSet.description}</p>
        <p className="mt-2 font-mono text-[11px] text-zinc-500">{dialogSet.sourceFile}</p>
      </div>

      <div className="-mx-1 flex-1 space-y-2 overflow-y-auto px-1">
        {dialogSet.exchanges.map((exchange) => (
          <DialogExchangeCard
            key={exchange.id}
            exchange={exchange}
            expanded={expandedExchangeId === exchange.id}
            copiedKey={copiedKey}
            onToggle={() => onToggleExchange(exchange.id)}
            onCopy={onCopy}
          />
        ))}
      </div>
    </aside>
  );
}

interface DialogExchangeCardProps {
  exchange: DialogExchange;
  expanded: boolean;
  copiedKey: string | null;
  onToggle: () => void;
  onCopy: (text: string, label: string, key: string) => void;
}

function DialogExchangeCard({
  exchange,
  expanded,
  copiedKey,
  onToggle,
  onCopy,
}: DialogExchangeCardProps) {
  const screenplay = formatExchangeAsScreenplay(exchange);
  const copyKey = `dialog:${exchange.id}`;

  return (
    <div className="rounded-md border border-zinc-800 bg-black/40">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-3 px-3 py-3 text-left transition hover:bg-zinc-900/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-300"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-orange-300">
              {exchange.id}
            </span>
            <DialogStatusBadge status={exchange.status} />
          </div>
          <p className="mt-1 text-sm font-semibold text-white">{exchange.title}</p>
          <p className="mt-1 text-xs text-zinc-500">{exchange.beat}</p>
          <p className="mt-1 text-xs text-zinc-400">{exchange.register}</p>
          <p className="mt-2 text-[11px] text-zinc-500">
            {exchange.characters.join(' · ')} · {exchange.lines.length} lines
          </p>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-zinc-800 px-3 py-3">
          <div className="mb-2 flex justify-end">
            <CopyButton
              copied={copiedKey === copyKey}
              label="Copy scene"
              onClick={() => onCopy(screenplay, exchange.title, copyKey)}
            />
          </div>
          <pre className="max-h-80 overflow-auto rounded-md border border-zinc-800 bg-zinc-950 p-3 text-sm leading-6 text-zinc-200 whitespace-pre-wrap">
            {exchange.lines.map((line) => (
              <span
                key={`${line.speaker}:${line.text.slice(0, 24)}`}
                className="block mb-3 last:mb-0"
              >
                <span className="font-semibold text-orange-200">{line.speaker}</span>
                {'\n'}
                {line.text}
              </span>
            ))}
          </pre>
        </div>
      )}
    </div>
  );
}

function DialogStatusBadge({ status }: { status: DialogExchange['status'] }) {
  const styles: Record<DialogExchange['status'], string> = {
    draft: 'border-zinc-700 bg-zinc-900 text-zinc-400',
    alt: 'border-blue-500/30 bg-blue-500/10 text-blue-200',
    active: 'border-green-500/30 bg-green-500/10 text-green-200',
    fragment: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
  };

  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${styles[status]}`}
    >
      {status}
    </span>
  );
}
