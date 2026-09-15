import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Check, Copy, Search, Sparkles } from 'lucide-react';

import SequencePlayer from './SequencePlayer';
import {
  sequences,
  sequenceMediumMeta,
  type SequenceMedium,
  type SequenceRecord,
} from '../data/sequences';
import { formatTimecode } from '../lib/timecode';

const allValue = 'All';

const mediumOrder: SequenceMedium[] = ['unreal', 'photoreal', 'cartoon', 'mixed'];

export default function Sequences() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [medium, setMedium] = useState<typeof allValue | SequenceMedium>(allValue);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState(
    id && sequences.some((sequence) => sequence.id === id) ? id : (sequences[0]?.id ?? ''),
  );

  useEffect(() => {
    if (!id) return;
    const match = sequences.find((sequence) => sequence.id === id);
    if (match) {
      setSelectedId(match.id);
      return;
    }
    navigate('/sequences', { replace: true });
  }, [id, navigate]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return sequences.filter((sequence) => {
      const matchesSearch =
        normalizedQuery.length === 0 ||
        [
          sequence.title,
          sequence.premise,
          sequence.visual,
          sequence.motion,
          sequence.register ?? '',
          sequence.notes ?? '',
          sequence.agent ?? '',
          sequence.tags.join(' '),
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesSearch && (medium === allValue || sequence.medium === medium);
    });
  }, [medium, query]);

  const selected = sequences.find((sequence) => sequence.id === selectedId) ?? filtered[0];

  const selectSequence = (sequence: SequenceRecord) => {
    setSelectedId(sequence.id);
    navigate(`/sequences/${sequence.id}`);
  };

  const copyToClipboard = async (text: string, label: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 1600);
    } catch {
      window.prompt(`Copy ${label}`, text);
    }
  };

  return (
    <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8">
      <div className="space-y-5">
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-4">
          <div className="flex items-start gap-3">
            <Box className="mt-0.5 shrink-0 text-orange-300" size={18} aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-zinc-200">In-hub 3D video sequences</p>
              <p className="mt-1 text-sm leading-6 text-zinc-400">
                Five procedural WebGL sequences, 16 seconds to 1:50. Unreal lattices, a kitchen
                still-life, a cel-shaded errand, chrome ribbon, and a porch that opens onto
                geometry. Author more in{' '}
                <code className="whitespace-nowrap text-zinc-300">content/sequences/</code> and run{' '}
                <code className="whitespace-nowrap text-zinc-300">npm run codegen</code>. Copy the
                Grok / Omni prompts when you want Imagine versions.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-4">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_200px]">
            <label className="relative block">
              <span className="sr-only">Search 3D sequences</span>
              <Search
                aria-hidden="true"
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search premise, tags, medium…"
                className="h-11 w-full rounded-md border border-zinc-800 bg-black/70 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/30"
              />
            </label>
            <label className="block">
              <span className="sr-only">Filter by medium</span>
              <select
                value={medium}
                onChange={(event) =>
                  setMedium(event.target.value as typeof allValue | SequenceMedium)
                }
                className="h-11 w-full rounded-md border border-zinc-800 bg-black/70 px-3 text-sm text-white outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/30"
              >
                <option value={allValue}>All media</option>
                {mediumOrder.map((value) => (
                  <option key={value} value={value}>
                    {sequenceMediumMeta[value].label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {sequences.length === 0 ? (
          <EmptyCatalog />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((sequence) => {
              const meta = sequenceMediumMeta[sequence.medium];
              const active = sequence.id === selected?.id;
              return (
                <article
                  key={sequence.id}
                  className={`overflow-hidden rounded-lg border bg-zinc-950/90 transition ${
                    active ? 'border-orange-500/60' : 'border-zinc-800 hover:border-zinc-600'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => selectSequence(sequence)}
                    className="w-full p-4 text-left"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`rounded-md border px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${meta.accent}`}
                      >
                        {meta.label}
                      </span>
                      <span className="font-mono text-xs text-zinc-500">
                        {formatTimecode(sequence.durationSec)}
                      </span>
                    </div>
                    <h2 className="mt-3 text-lg font-semibold text-white">{sequence.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">{sequence.premise}</p>
                  </button>
                </article>
              );
            })}
          </div>
        )}

        {sequences.length > 0 && filtered.length === 0 ? (
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-10 text-center text-zinc-400">
            No sequences match the current filters.
          </div>
        ) : null}
      </div>

      <div className="lg:sticky lg:top-20 lg:self-start">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-400">
          <Sparkles size={17} aria-hidden="true" />
          Sequence player
        </div>
        {selected ? (
          <SequenceDetail sequence={selected} copiedKey={copiedKey} onCopy={copyToClipboard} />
        ) : (
          <EmptyWorkspace />
        )}
      </div>
    </section>
  );
}

function EmptyCatalog() {
  return (
    <div className="rounded-lg border border-dashed border-zinc-800 bg-zinc-950 p-10 text-center">
      <p className="text-sm font-semibold text-zinc-200">No 3D sequences yet</p>
      <p className="mt-2 text-sm leading-6 text-zinc-400">
        Add <code className="whitespace-nowrap text-zinc-300">content/sequences/your-id.json</code>{' '}
        and a matching renderer in <code className="text-zinc-300">src/sequences/</code>.
      </p>
    </div>
  );
}

function EmptyWorkspace() {
  return (
    <aside className="rounded-lg border border-zinc-800 bg-zinc-950/95 p-5 text-sm leading-6 text-zinc-400">
      Select a sequence, or add one under <code className="text-zinc-300">content/sequences/</code>.
    </aside>
  );
}

interface SequenceDetailProps {
  sequence: SequenceRecord;
  copiedKey: string | null;
  onCopy: (text: string, label: string, key: string) => void;
}

function SequenceDetail({ sequence, copiedKey, onCopy }: SequenceDetailProps) {
  const meta = sequenceMediumMeta[sequence.medium];

  return (
    <aside className="flex min-h-0 flex-col gap-5 rounded-lg border border-zinc-800 bg-zinc-950/95 p-5 shadow-2xl shadow-black/30">
      <div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-300">
            {sequence.register ?? '3D sequence'}
          </p>
          <span
            className={`rounded-md border px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${meta.accent}`}
          >
            {meta.label}
          </span>
        </div>
        <h2 className="mt-2 text-2xl font-semibold leading-tight text-white">{sequence.title}</h2>
        <p className="mt-2 text-xs text-zinc-500">
          {[sequence.runtime, sequence.agent ? `via ${sequence.agent}` : null]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>

      <SequencePlayer sequence={sequence} />

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">Premise</h3>
        <p className="mt-2 text-sm leading-6 text-zinc-300">{sequence.premise}</p>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">Visual</h3>
        <p className="mt-2 text-sm leading-6 text-zinc-300">{sequence.visual}</p>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
            Motion
          </h3>
          <CopyButton
            copied={copiedKey === `${sequence.id}:motion`}
            label="Copy"
            onClick={() => onCopy(sequence.motion, 'Motion', `${sequence.id}:motion`)}
          />
        </div>
        <p className="rounded-md border border-zinc-800 bg-black/80 p-3 text-sm leading-6 text-zinc-300">
          {sequence.motion}
        </p>
      </section>

      {sequence.grokImaginePrompt ? (
        <section>
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
              Grok Imagine prompt
            </h3>
            <CopyButton
              copied={copiedKey === `${sequence.id}:prompt`}
              label="Copy"
              onClick={() =>
                onCopy(sequence.grokImaginePrompt ?? '', 'Grok prompt', `${sequence.id}:prompt`)
              }
            />
          </div>
          <pre className="max-h-40 overflow-auto rounded-md border border-zinc-800 bg-black/80 p-4 text-sm leading-6 text-zinc-200 whitespace-pre-wrap">
            {sequence.grokImaginePrompt}
          </pre>
        </section>
      ) : null}

      {sequence.geminiOmniPrompt ? (
        <section>
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
              Motion prompt
            </h3>
            <CopyButton
              copied={copiedKey === `${sequence.id}:omni`}
              label="Copy"
              onClick={() =>
                onCopy(sequence.geminiOmniPrompt ?? '', 'Omni prompt', `${sequence.id}:omni`)
              }
            />
          </div>
          <pre className="max-h-32 overflow-auto rounded-md border border-zinc-800 bg-black/80 p-4 text-sm leading-6 text-zinc-200 whitespace-pre-wrap">
            {sequence.geminiOmniPrompt}
          </pre>
        </section>
      ) : null}

      {sequence.notes ? (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">Notes</h3>
          <p className="mt-2 rounded-md border border-zinc-800 bg-zinc-900/70 p-3 text-sm leading-6 text-zinc-400">
            {sequence.notes}
          </p>
        </section>
      ) : null}

      {sequence.tags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {sequence.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-300"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </aside>
  );
}

function CopyButton({
  copied,
  label,
  onClick,
}: {
  copied: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-zinc-700 px-2.5 py-1.5 text-xs font-semibold text-zinc-200 transition hover:border-orange-400 hover:text-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-300"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? 'Copied' : label}
    </button>
  );
}
