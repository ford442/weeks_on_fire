import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Check, Copy, PenLine, Search, Sparkles } from 'lucide-react';

import {
  cartoons,
  cartoonStatusMeta,
  type CartoonRecord,
  type CartoonStatus,
} from '../data/cartoons';

const allValue = 'All';

const statusOrder: CartoonStatus[] = ['seed', 'sketched', 'ready-to-generate', 'promoted'];

export default function Cartoons() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<typeof allValue | CartoonStatus>(allValue);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState(
    id && cartoons.some((cartoon) => cartoon.id === id) ? id : (cartoons[0]?.id ?? ''),
  );

  useEffect(() => {
    if (!id) return;
    const match = cartoons.find((cartoon) => cartoon.id === id);
    if (match) {
      setSelectedId(match.id);
      return;
    }
    navigate('/cartoons', { replace: true });
  }, [id, navigate]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return cartoons.filter((cartoon) => {
      const matchesSearch =
        normalizedQuery.length === 0 ||
        [
          cartoon.title,
          cartoon.premise,
          cartoon.visual,
          cartoon.register ?? '',
          cartoon.characterLean ?? '',
          cartoon.notes ?? '',
          cartoon.agent ?? '',
          cartoon.tags.join(' '),
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesSearch && (status === allValue || cartoon.status === status);
    });
  }, [query, status]);

  const selected = cartoons.find((cartoon) => cartoon.id === selectedId) ?? filtered[0];

  const selectCartoon = (cartoon: CartoonRecord) => {
    setSelectedId(cartoon.id);
    navigate(`/cartoons/${cartoon.id}`);
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
    <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_390px] lg:px-8">
      <div className="space-y-5">
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-4">
          <div className="flex items-start gap-3">
            <PenLine className="mt-0.5 shrink-0 text-orange-300" size={18} aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-zinc-200">
                Agent parking lot for short cartoons
              </p>
              <p className="mt-1 text-sm leading-6 text-zinc-400">
                Drop a seed in{' '}
                <code className="whitespace-nowrap text-zinc-300">
                  content/cartoons/your-idea.json
                </code>{' '}
                and run <code className="whitespace-nowrap text-zinc-300">npm run codegen</code>.
                Keep it short: premise, still, optional Grok prompt. No song id, no timed segments.
                Promote winners to{' '}
                <Link to="/suggestions" className="text-orange-300 underline underline-offset-2">
                  Suggestions
                </Link>
                . Tone lock: dry, elegant, slightly menacing — not slapstick.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-4">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_200px]">
            <label className="relative block">
              <span className="sr-only">Search cartoon ideas</span>
              <Search
                aria-hidden="true"
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search premise, tags, agent…"
                className="h-11 w-full rounded-md border border-zinc-800 bg-black/70 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/30"
              />
            </label>
            <label className="block">
              <span className="sr-only">Filter by status</span>
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as typeof allValue | CartoonStatus)
                }
                className="h-11 w-full rounded-md border border-zinc-800 bg-black/70 px-3 text-sm text-white outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/30"
              >
                <option value={allValue}>Status: All</option>
                {statusOrder.map((value) => (
                  <option key={value} value={value}>
                    {cartoonStatusMeta[value].label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {cartoons.length === 0 ? (
          <EmptyCatalog />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((cartoon) => {
              const meta = cartoonStatusMeta[cartoon.status];
              const isActive = selected?.id === cartoon.id;

              return (
                <article
                  key={cartoon.id}
                  className={`overflow-hidden rounded-lg border bg-zinc-950 transition hover:-translate-y-0.5 ${
                    isActive
                      ? 'border-orange-500/70 ring-1 ring-orange-500/30'
                      : 'border-zinc-800 hover:border-orange-500/50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => selectCartoon(cartoon)}
                    className="block w-full p-5 text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-300"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-300">
                        {cartoon.register ?? 'Short cartoon'}
                      </p>
                      <span
                        className={`rounded-md border px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${meta.accent}`}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <h2 className="mt-2 text-xl font-semibold leading-tight text-white">
                      {cartoon.title}
                    </h2>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-300">
                      {cartoon.premise}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {cartoon.tags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-300"
                        >
                          {tag}
                        </span>
                      ))}
                      {cartoon.agent ? (
                        <span className="rounded-md border border-violet-500/30 bg-violet-500/10 px-2 py-1 text-xs text-violet-200">
                          {cartoon.agent}
                        </span>
                      ) : null}
                    </div>
                  </button>
                  {cartoon.grokImaginePrompt ? (
                    <div className="grid border-t border-zinc-800">
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            cartoon.grokImaginePrompt ?? '',
                            'Grok prompt',
                            `${cartoon.id}:card-prompt`,
                          )
                        }
                        className="flex items-center justify-center gap-2 px-3 py-3 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-900 hover:text-orange-200"
                      >
                        <Copy size={16} />
                        {copiedKey === `${cartoon.id}:card-prompt` ? 'Copied' : 'Prompt'}
                      </button>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}

        {cartoons.length > 0 && filtered.length === 0 ? (
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-10 text-center text-zinc-400">
            No cartoon ideas match the current filters.
          </div>
        ) : null}
      </div>

      <div className="lg:sticky lg:top-20 lg:self-start">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-400">
          <Sparkles size={17} aria-hidden="true" />
          Cartoon workspace
        </div>
        {selected ? (
          <CartoonDetail cartoon={selected} copiedKey={copiedKey} onCopy={copyToClipboard} />
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
      <p className="text-sm font-semibold text-zinc-200">No cartoon ideas yet</p>
      <p className="mt-2 text-sm leading-6 text-zinc-400">
        Add <code className="whitespace-nowrap text-zinc-300">content/cartoons/your-idea.json</code>{' '}
        with <code className="text-zinc-300">id</code>, <code className="text-zinc-300">title</code>
        , <code className="text-zinc-300">premise</code>,{' '}
        <code className="text-zinc-300">visual</code>, <code className="text-zinc-300">status</code>
        , and <code className="text-zinc-300">tags</code>, then run codegen.
      </p>
    </div>
  );
}

function EmptyWorkspace() {
  return (
    <aside className="rounded-lg border border-zinc-800 bg-zinc-950/95 p-5 text-sm leading-6 text-zinc-400">
      Select a cartoon idea, or add one under{' '}
      <code className="text-zinc-300">content/cartoons/</code>.
    </aside>
  );
}

interface CartoonDetailProps {
  cartoon: CartoonRecord;
  copiedKey: string | null;
  onCopy: (text: string, label: string, key: string) => void;
}

function CartoonDetail({ cartoon, copiedKey, onCopy }: CartoonDetailProps) {
  const meta = cartoonStatusMeta[cartoon.status];

  return (
    <aside className="flex min-h-0 flex-col gap-5 rounded-lg border border-zinc-800 bg-zinc-950/95 p-5 shadow-2xl shadow-black/30">
      <div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-300">
            {cartoon.register ?? 'Short cartoon'}
          </p>
          <span
            className={`rounded-md border px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${meta.accent}`}
          >
            {meta.label}
          </span>
        </div>
        <h2 className="mt-2 text-2xl font-semibold leading-tight text-white">{cartoon.title}</h2>
        {cartoon.characterLean ? (
          <p className="mt-2 text-sm text-zinc-400">{cartoon.characterLean}</p>
        ) : null}
        {cartoon.runtime || cartoon.agent ? (
          <p className="mt-2 text-xs text-zinc-500">
            {[cartoon.runtime, cartoon.agent ? `via ${cartoon.agent}` : null]
              .filter(Boolean)
              .join(' · ')}
          </p>
        ) : null}
      </div>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">Premise</h3>
        <p className="mt-2 text-sm leading-6 text-zinc-300">{cartoon.premise}</p>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">Visual</h3>
        <p className="mt-2 text-sm leading-6 text-zinc-300">{cartoon.visual}</p>
      </section>

      {cartoon.grokImaginePrompt ? (
        <section className="min-h-0">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
              Grok Imagine prompt
            </h3>
            <CopyButton
              copied={copiedKey === `${cartoon.id}:prompt`}
              label="Copy"
              onClick={() =>
                onCopy(cartoon.grokImaginePrompt ?? '', 'Grok prompt', `${cartoon.id}:prompt`)
              }
            />
          </div>
          <pre className="max-h-52 overflow-auto rounded-md border border-zinc-800 bg-black/80 p-4 text-sm leading-6 text-zinc-200 whitespace-pre-wrap">
            {cartoon.grokImaginePrompt}
          </pre>
        </section>
      ) : (
        <p className="rounded-md border border-dashed border-zinc-800 bg-black/40 p-3 text-sm leading-6 text-zinc-500">
          No still prompt yet. Add <code className="text-zinc-400">grokImaginePrompt</code> when the
          newspaper-comic test passes.
        </p>
      )}

      {cartoon.motion ? (
        <section className="min-h-0">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
              Motion
            </h3>
            <CopyButton
              copied={copiedKey === `${cartoon.id}:motion`}
              label="Copy"
              onClick={() => onCopy(cartoon.motion ?? '', 'Motion', `${cartoon.id}:motion`)}
            />
          </div>
          <pre className="max-h-40 overflow-auto rounded-md border border-zinc-800 bg-black/80 p-4 text-sm leading-6 text-zinc-200 whitespace-pre-wrap">
            {cartoon.motion}
          </pre>
        </section>
      ) : null}

      {cartoon.notes ? (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">Notes</h3>
          <p className="mt-2 rounded-md border border-zinc-800 bg-zinc-900/70 p-3 text-sm leading-6 text-zinc-400">
            {cartoon.notes}
          </p>
        </section>
      ) : null}

      {cartoon.tags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {cartoon.tags.map((tag) => (
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

interface CopyButtonProps {
  copied: boolean;
  label: string;
  onClick: () => void;
}

function CopyButton({ copied, label, onClick }: CopyButtonProps) {
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
