import { useMemo, useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  Film,
  Flower2,
  ImageIcon,
  Maximize2,
  Play,
  Sparkles,
  X,
} from 'lucide-react';
import {
  daisyBellAudioFile,
  daisyBellFrames,
  daisyBellMeta,
  daisyBellSequence,
  daisyBellSights,
  daisyBellStylish1890s,
  daisyBellSubjectLock,
  daisyBellWorking1890s,
  daisyFramesByTreatment,
  daisyTreatmentMeta,
  type DaisyBellFrame,
  type DaisyFrameTreatment,
} from '../data/daisyBell';
import { firstCatalogItem } from '../lib/catalog';
import SongAudioPlayer from './SongAudioPlayer';

const allValue = 'all' as const;
type TreatmentFilter = typeof allValue | DaisyFrameTreatment;

export default function DaisyBell() {
  const [treatment, setTreatment] = useState<TreatmentFilter>(allValue);
  const [selected, setSelected] = useState<DaisyBellFrame>(
    firstCatalogItem(daisyBellFrames, 'daisy-bell'),
  );
  const [lightbox, setLightbox] = useState<DaisyBellFrame | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const frames = useMemo(() => daisyFramesByTreatment(treatment), [treatment]);

  const counts = useMemo(() => {
    let color = 0;
    let period = 0;
    let withImage = 0;
    for (const frame of daisyBellFrames) {
      if (frame.treatment === 'color') color += 1;
      else period += 1;
      if (frame.imageUrl) withImage += 1;
    }
    return { color, period, withImage, total: daisyBellFrames.length };
  }, []);

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
    <section className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      {/* Hero */}
      <header className="overflow-hidden rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-950 via-black to-emerald-950/30">
        <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)] lg:p-8">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300/90">
              <Flower2 size={14} />
              Musical cutaway · {daisyBellMeta.duo}
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {daisyBellMeta.title}
            </h2>
            <p className="mt-1 text-lg text-zinc-400">{daisyBellMeta.subtitle}</p>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300">{daisyBellMeta.pitch}</p>
            <p className="mt-3 max-w-2xl border-l-2 border-emerald-500/40 pl-3 text-sm leading-6 text-zinc-400">
              {daisyBellMeta.constant}
            </p>
            <details className="mt-4 max-w-2xl rounded-md border border-zinc-800 bg-black/40 p-3 text-xs text-zinc-500">
              <summary className="cursor-pointer font-semibold text-zinc-300">
                Prompt lock blocks (copy for re-rolls)
              </summary>
              <div className="mt-3 space-y-3">
                <div>
                  <p className="mb-1 font-semibold uppercase tracking-wider text-zinc-600">
                    Subject
                  </p>
                  <p className="leading-5 text-zinc-400">{daisyBellSubjectLock}</p>
                </div>
                <div>
                  <p className="mb-1 font-semibold uppercase tracking-wider text-zinc-600">
                    Stylish 1890–96
                  </p>
                  <p className="leading-5 text-zinc-400">{daisyBellStylish1890s}</p>
                </div>
                <div>
                  <p className="mb-1 font-semibold uppercase tracking-wider text-zinc-600">
                    Working class
                  </p>
                  <p className="leading-5 text-zinc-400">{daisyBellWorking1890s}</p>
                </div>
              </div>
            </details>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-md border border-zinc-700 bg-zinc-900/80 px-2.5 py-1 text-zinc-300">
                {counts.total} keyframes
              </span>
              <span className={`rounded-md border px-2.5 py-1 ${daisyTreatmentMeta.color.accent}`}>
                {counts.color} color HD
              </span>
              <span className={`rounded-md border px-2.5 py-1 ${daisyTreatmentMeta.period.accent}`}>
                {counts.period} period film
              </span>
              <span className="rounded-md border border-zinc-700 bg-zinc-900/80 px-2.5 py-1 text-zinc-400">
                {counts.withImage} stills linked · drop more in{' '}
                <code className="text-zinc-300">images/daisy-bell/</code>
              </span>
            </div>
          </div>

          <div className="flex flex-col justify-center gap-3 rounded-lg border border-zinc-800 bg-black/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Track</p>
            {daisyBellAudioFile ? (
              <SongAudioPlayer audioFile={daisyBellAudioFile} title={daisyBellMeta.title} />
            ) : (
              <p className="text-sm text-zinc-500">
                Audio file not found (expected Daisy+Bell.mp3).
              </p>
            )}

            <div className="rounded-md border border-emerald-500/25 bg-emerald-500/5 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/90">
                Timed slideshow
              </p>
              <p className="mt-1.5 text-xs leading-5 text-zinc-400">
                Stills cut to the full song (~4:20) from the energy cue map. Hosted on test.1ink.us
                — not in the git repo.
              </p>
              <a
                href={daisyBellMeta.slideshowUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-emerald-500/40 bg-emerald-600/90 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              >
                <Play size={16} />
                Watch slideshow
                <ExternalLink size={14} className="opacity-80" />
              </a>
              <a
                href={daisyBellMeta.slideshowUrl}
                className="mt-2 block truncate text-center text-[11px] text-zinc-500 underline-offset-2 hover:text-zinc-300 hover:underline"
              >
                {daisyBellMeta.slideshowUrl}
              </a>
            </div>

            <p className="text-xs leading-5 text-zinc-500">
              Concept notes: <code className="text-zinc-400">{daisyBellMeta.conceptFile}</code>
            </p>
          </div>
        </div>
      </header>

      {/* Sequence */}
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
          <Film size={14} />
          Core sequence
        </h3>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {daisyBellSequence.map((beat) => {
            const accent =
              beat.treatment === 'flip'
                ? 'border-orange-500/30 bg-orange-500/5 text-orange-200'
                : beat.treatment === 'color'
                  ? daisyTreatmentMeta.color.accent
                  : daisyTreatmentMeta.period.accent;
            const label =
              beat.treatment === 'flip'
                ? 'B&W ↔ HD flip'
                : beat.treatment === 'color'
                  ? daisyTreatmentMeta.color.short
                  : daisyTreatmentMeta.period.short;
            return (
              <li key={beat.id} className="rounded-lg border border-zinc-800 bg-zinc-950/90 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-zinc-500">Step {beat.step}</span>
                  <span
                    className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${accent}`}
                  >
                    {label}
                  </span>
                </div>
                <p className="mt-2 font-medium text-zinc-100">{beat.title}</p>
                <p className="mt-1.5 text-sm leading-6 text-zinc-500">{beat.summary}</p>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Keyframe gallery */}
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
              <ImageIcon size={14} />
              Keyframe board
            </h3>
            <div
              className="inline-flex rounded-lg border border-zinc-800 bg-black/40 p-1"
              role="group"
              aria-label="Filter by treatment"
            >
              {(
                [
                  [allValue, 'All'],
                  ['color', daisyTreatmentMeta.color.short],
                  ['period', daisyTreatmentMeta.period.short],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTreatment(value)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                    treatment === value
                      ? 'bg-orange-600 text-white'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {frames.map((frame) => {
              const meta = daisyTreatmentMeta[frame.treatment];
              const active = selected.id === frame.id;
              return (
                <article
                  key={frame.id}
                  className={`overflow-hidden rounded-lg border bg-zinc-950 transition ${
                    active
                      ? 'border-orange-500/70 ring-1 ring-orange-500/30'
                      : 'border-zinc-800 hover:border-zinc-600'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelected(frame)}
                    onDoubleClick={() => setLightbox(frame)}
                    className="block w-full text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-300"
                  >
                    <div
                      className={`relative aspect-video ${
                        frame.treatment === 'period'
                          ? 'bg-gradient-to-br from-stone-900 via-zinc-950 to-black'
                          : 'bg-gradient-to-br from-emerald-950/40 via-zinc-950 to-black'
                      }`}
                    >
                      {frame.imageUrl ? (
                        <img
                          src={frame.imageUrl}
                          alt={frame.title}
                          loading="lazy"
                          className={`h-full w-full object-cover ${
                            frame.treatment === 'period' ? 'grayscale contrast-125' : ''
                          }`}
                        />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
                          <Sparkles
                            size={22}
                            className={
                              frame.treatment === 'period'
                                ? 'text-stone-500'
                                : 'text-emerald-700/80'
                            }
                          />
                          <p className="text-xs text-zinc-500">Prompt ready · still not linked</p>
                        </div>
                      )}
                      <span
                        className={`absolute left-2 top-2 rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${meta.accent}`}
                      >
                        {meta.short}
                      </span>
                      <span className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-0.5 text-[10px] font-medium text-zinc-300">
                        #{frame.order}
                      </span>
                    </div>
                    <div className="p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        {frame.beat}
                      </p>
                      <h4 className="mt-1 text-sm font-semibold text-white">{frame.title}</h4>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">
                        {frame.description}
                      </p>
                    </div>
                  </button>
                </article>
              );
            })}
          </div>

          {frames.length === 0 && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-8 text-center text-zinc-500">
              No keyframes for this filter.
            </div>
          )}
        </div>

        {/* Workspace */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/95 p-5 shadow-2xl shadow-black/30">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-300">
              {selected.beat}
            </p>
            <h3 className="mt-2 text-xl font-semibold text-white">{selected.title}</h3>
            <span
              className={`mt-3 inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold ${
                daisyTreatmentMeta[selected.treatment].accent
              }`}
            >
              {daisyTreatmentMeta[selected.treatment].label}
            </span>
            <p className="mt-3 text-sm leading-6 text-zinc-400">{selected.description}</p>
            <p className="mt-2 text-xs leading-5 text-zinc-600">
              {daisyTreatmentMeta[selected.treatment].description}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {selected.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-400"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Generate prompt
                </h4>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(selected.prompt, 'Prompt', `${selected.id}:prompt`)
                  }
                  className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 px-2.5 py-1.5 text-xs font-semibold text-zinc-200 transition hover:border-orange-400 hover:text-orange-200"
                >
                  {copiedKey === `${selected.id}:prompt` ? <Check size={14} /> : <Copy size={14} />}
                  {copiedKey === `${selected.id}:prompt` ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="max-h-56 overflow-auto rounded-md border border-zinc-800 bg-black/80 p-3 text-xs leading-5 text-zinc-300 whitespace-pre-wrap">
                {selected.prompt}
              </pre>
            </div>

            {selected.imageUrl ? (
              <button
                type="button"
                onClick={() => setLightbox(selected)}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md border border-zinc-700 py-2 text-sm font-semibold text-zinc-200 transition hover:border-orange-400 hover:text-orange-200"
              >
                <Maximize2 size={16} />
                Open still
              </button>
            ) : (
              <p className="mt-4 rounded-md border border-dashed border-zinc-800 bg-black/40 p-3 text-xs leading-5 text-zinc-500">
                After generating, save under{' '}
                <code className="text-zinc-400">images/daisy-bell/</code> and set{' '}
                <code className="text-zinc-400">imageUrl</code> on this frame in{' '}
                <code className="text-zinc-400">src/data/daisyBell.ts</code>.
              </p>
            )}
          </div>
        </aside>
      </section>

      {/* Street sights */}
      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
          Strange sights on the ride
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {daisyBellSights.map((sight) => (
            <article
              key={sight.id}
              className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-4"
            >
              {sight.lyricCue && (
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-400/80">
                  “{sight.lyricCue}”
                </p>
              )}
              <h4 className="mt-1.5 text-sm font-semibold text-zinc-100">{sight.title}</h4>
              <p className="mt-1.5 text-sm leading-6 text-zinc-500">{sight.description}</p>
            </article>
          ))}
        </div>
      </section>

      {lightbox && (
        <DaisyLightbox
          frame={lightbox}
          onClose={() => setLightbox(null)}
          copiedKey={copiedKey}
          onCopy={copyToClipboard}
        />
      )}
    </section>
  );
}

interface DaisyLightboxProps {
  frame: DaisyBellFrame;
  onClose: () => void;
  copiedKey: string | null;
  onCopy: (text: string, label: string, key: string) => void;
}

function DaisyLightbox({ frame, onClose, copiedKey, onCopy }: DaisyLightboxProps) {
  const meta = daisyTreatmentMeta[frame.treatment];
  return (
    <div
      className="fixed inset-0 z-50 flex bg-black/92 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={frame.title}
      onClick={onClose}
    >
      <div
        className="relative m-auto grid max-h-[calc(100vh-1.5rem)] w-full max-w-6xl gap-4 overflow-hidden lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative min-h-[240px] overflow-hidden rounded-lg border border-zinc-800 bg-black">
          {frame.imageUrl ? (
            <img
              src={frame.imageUrl}
              alt={frame.title}
              loading="lazy"
              className={`h-full max-h-[70vh] w-full object-contain lg:max-h-[calc(100vh-3rem)] ${
                frame.treatment === 'period' ? 'grayscale' : ''
              }`}
            />
          ) : (
            <div className="flex min-h-[240px] flex-col justify-center gap-3 p-8">
              <p
                className={`text-xs font-semibold uppercase tracking-[0.2em] ${meta.accent.split(' ').pop() ?? ''}`}
              >
                {meta.label}
              </p>
              <p className="text-sm leading-7 text-zinc-400">{frame.prompt}</p>
            </div>
          )}
        </div>
        <div className="overflow-auto rounded-lg border border-zinc-800 bg-zinc-950 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            {frame.beat}
          </p>
          <h3 className="mt-2 text-xl font-semibold text-white">{frame.title}</h3>
          <p className="mt-3 text-sm leading-6 text-zinc-400">{frame.description}</p>
          <button
            type="button"
            onClick={() => onCopy(frame.prompt, 'Prompt', `${frame.id}:lb`)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-200 hover:border-orange-400"
          >
            {copiedKey === `${frame.id}:lb` ? <Check size={14} /> : <Copy size={14} />}
            {copiedKey === `${frame.id}:lb` ? 'Copied' : 'Copy prompt'}
          </button>
          <pre className="mt-3 max-h-64 overflow-auto rounded-md border border-zinc-800 bg-black/80 p-3 text-xs leading-5 text-zinc-400 whitespace-pre-wrap">
            {frame.prompt}
          </pre>
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-2 top-2 rounded-md bg-black/70 p-2 text-white ring-1 ring-white/10 hover:bg-zinc-900 lg:right-auto lg:left-[calc(100%-2.75rem)]"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
