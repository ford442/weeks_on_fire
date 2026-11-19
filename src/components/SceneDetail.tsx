import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  Clapperboard,
  Copy,
  Film,
  ImageIcon,
  Maximize2,
  Music2,
  Sparkles,
  X,
} from 'lucide-react';

import {
  framedTreatments,
  framesByTreatment,
  sceneToneMeta,
  type SceneBoard,
  type SceneFrame,
  type SceneTreatment,
} from '../data/sceneBoards';
import { songs } from '../data/songs';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';
import { useEditMode, publicText } from '../hooks/useEditMode';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useUrlParam } from '../hooks/useUrlState';
import { firstCatalogItem } from '../lib/catalog';
import { pluralize } from '../lib/plural';
import { buildVideoItems } from '../lib/videos';
import { crewPath } from '../routes/paths';

import { allValue } from './FilterSelect';
import SongAudioPlayer from './SongAudioPlayer';
import StatusBadge from './StatusBadge';
import VideoCard from './VideoCard';
import Still from './Still';

interface SceneDetailProps {
  board: SceneBoard;
}

/** Fallback look for a frame (or beat) whose board declares no treatment for it. */
const NEUTRAL = {
  accent: 'border-zinc-700 bg-zinc-900/80 text-zinc-300',
  text: 'text-orange-300',
  tile: 'bg-gradient-to-br from-zinc-900 via-zinc-950 to-black',
  icon: 'text-zinc-600',
};

/**
 * The one page every scene renders through: pitch and prompt locks, finished video, the sequence,
 * a filterable keyframe board with a prompt workspace, and the board's extras. Everything scene
 * specific — treatment names, tones, lock blocks, the extras heading — comes from the board.
 */
export default function SceneDetail({ board }: SceneDetailProps) {
  const editMode = useEditMode();
  const filterTreatments = useMemo(() => framedTreatments(board), [board]);
  const treatmentById = useMemo(
    () => new Map(board.treatments.map((treatment) => [treatment.id, treatment])),
    [board],
  );
  const [treatment, setTreatment] = useUrlParam<string>('treatment', allValue, [
    allValue,
    ...filterTreatments.map((entry) => entry.id),
  ]);
  const [selected, setSelected] = useState<SceneFrame>(() =>
    firstCatalogItem(framesByTreatment(board, null), `scene ${board.id} frames`),
  );
  const [lightbox, setLightbox] = useState<SceneFrame | null>(null);
  const { copiedKey, copy: copyToClipboard } = useCopyToClipboard();

  const frames = useMemo(
    () => framesByTreatment(board, treatment === allValue ? null : treatment),
    [board, treatment],
  );
  const withImage = useMemo(() => board.frames.filter((frame) => frame.imageUrl).length, [board]);
  const framesPerTreatment = useMemo(
    () =>
      filterTreatments.map((entry) => ({
        treatment: entry,
        count: board.frames.filter((frame) => frame.treatment === entry.id).length,
      })),
    [board, filterTreatments],
  );
  const song = board.songId ? songs.find((entry) => entry.id === board.songId) : undefined;
  const videos = useMemo(
    () => buildVideoItems({ scenes: [board], timeline: [], archive: [], cutaways: [] }),
    [board],
  );
  const tone = sceneToneMeta[board.tone ?? 'orange'];

  const look = (frame: { treatment?: string | undefined }) => {
    const entry = frame.treatment ? treatmentById.get(frame.treatment) : undefined;
    return { entry, tone: entry ? sceneToneMeta[entry.tone] : NEUTRAL };
  };
  const selectedLook = look(selected);

  return (
    <section className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      <Link
        to={crewPath('/scenes')}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-400 hover:text-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-300"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        All scenes
      </Link>

      {/* Hero */}
      <header
        className={`overflow-hidden rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-950 via-black ${tone.hero}`}
      >
        <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)] lg:p-8">
          <div>
            <p className={`inline-flex items-center gap-2 text-sm font-semibold ${tone.text}`}>
              <Clapperboard size={14} aria-hidden="true" />
              {[board.format ?? 'Scene', board.cast].filter(Boolean).join(' · ')}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {board.title}
              </h2>
              <StatusBadge status={board.status} />
            </div>
            {board.subtitle && <p className="mt-1 text-lg text-zinc-400">{board.subtitle}</p>}
            <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300">{board.pitch}</p>
            {board.continuity && (
              <p className="mt-3 max-w-2xl border-l-2 border-orange-500/40 pl-3 text-sm leading-6 text-zinc-400">
                {board.continuity}
              </p>
            )}
            {board.locks.length > 0 && (
              <details className="mt-4 max-w-2xl rounded-md border border-zinc-800 bg-black/40 p-3 text-xs text-zinc-400">
                <summary className="cursor-pointer font-semibold text-zinc-300">
                  Prompt lock blocks (copy for re-rolls)
                </summary>
                <div className="mt-3 space-y-3">
                  {board.locks.map((lock) => (
                    <div key={lock.id}>
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <p className="font-semibold text-zinc-400">{lock.label}</p>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(lock.text, lock.label, `lock:${lock.id}`)}
                          className="inline-flex items-center gap-1 rounded border border-zinc-700 px-2 py-0.5 text-[11px] font-semibold text-zinc-300 transition hover:border-orange-400 hover:text-orange-200"
                        >
                          {copiedKey === `lock:${lock.id}` ? (
                            <Check size={12} aria-hidden="true" />
                          ) : (
                            <Copy size={12} aria-hidden="true" />
                          )}
                          {copiedKey === `lock:${lock.id}` ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <p className="leading-5 text-zinc-400">{lock.text}</p>
                    </div>
                  ))}
                </div>
              </details>
            )}
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-md border border-zinc-700 bg-zinc-900/80 px-2.5 py-1 text-zinc-300">
                {pluralize(board.frames.length, 'keyframe')}
              </span>
              {framesPerTreatment.map(({ treatment: entry, count }) => (
                <span
                  key={entry.id}
                  className={`rounded-md border px-2.5 py-1 ${sceneToneMeta[entry.tone].accent}`}
                >
                  {count} {entry.short}
                </span>
              ))}
              <span className="rounded-md border border-zinc-700 bg-zinc-900/80 px-2.5 py-1 text-zinc-400">
                {pluralize(withImage, 'still')} linked
                {editMode && (
                  <>
                    {' '}
                    · set <code className="text-zinc-300">imagePath</code> in{' '}
                    <code className="text-zinc-300">content/scenes/{board.id}.json</code>
                  </>
                )}
              </span>
            </div>
          </div>

          <div className="flex flex-col justify-center gap-3 rounded-lg border border-zinc-800 bg-black/50 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-zinc-400">
              <Music2 size={14} aria-hidden="true" />
              Track
            </p>
            {song?.audioFile ? (
              <SongAudioPlayer audioFile={song.audioFile} title={song.title} />
            ) : (
              <p className="text-sm text-zinc-400">
                {song ? 'This song has no audio file yet.' : 'No song is linked to this scene.'}
              </p>
            )}
            {song && (
              <Link
                to={crewPath(`/songs/${song.id}`)}
                className="text-sm font-semibold text-orange-300 underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-orange-300"
              >
                {song.title} — lyrics and style prompt
              </Link>
            )}
            {editMode && board.conceptFile && (
              <p className="text-sm leading-6 text-zinc-400">
                Concept notes: <code className="text-zinc-400">{board.conceptFile}</code>
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Finished and in-progress cuts */}
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-400">
          <Clapperboard size={14} aria-hidden="true" />
          Video
        </h3>
        {videos.length > 0 ? (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((item) => (
              <li key={item.key} className="flex">
                <VideoCard item={item} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-lg border border-dashed border-zinc-800 p-4 text-sm text-zinc-400">
            No cut of this scene is linked yet. Add one under <code>videos</code> in{' '}
            <code>content/scenes/{board.id}.json</code>.
          </p>
        )}
      </section>

      {/* Sequence */}
      {board.beats.length > 0 && (
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-400">
            <Film size={14} aria-hidden="true" />
            Core sequence
          </h3>
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {board.beats.map((beat) => {
              const entry = beat.treatment ? treatmentById.get(beat.treatment) : undefined;
              return (
                <li key={beat.id} className="rounded-lg border border-zinc-800 bg-zinc-950/90 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-zinc-400">Step {beat.step}</span>
                    {entry && (
                      <span
                        className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${sceneToneMeta[entry.tone].accent}`}
                      >
                        {entry.short}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 font-medium text-zinc-100">{beat.title}</p>
                  <p className="mt-1.5 text-sm leading-6 text-zinc-400">{beat.summary}</p>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {/* Keyframe board */}
      {board.frames.length > 0 && (
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-400">
                <ImageIcon size={14} aria-hidden="true" />
                Keyframe board
              </h3>
              {filterTreatments.length > 1 && (
                <TreatmentFilter
                  treatments={filterTreatments}
                  value={treatment}
                  onChange={setTreatment}
                />
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {frames.map((frame) => {
                const { entry, tone: frameTone } = look(frame);
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
                      aria-pressed={active}
                      onClick={() => setSelected(frame)}
                      onDoubleClick={() => setLightbox(frame)}
                      className="block w-full text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-300"
                    >
                      <div className={`relative aspect-video ${frameTone.tile}`}>
                        {frame.imageUrl ? (
                          <Still
                            src={frame.imageUrl}
                            picture={frame.imagePicture}
                            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                            alt={frame.title}
                            loading="lazy"
                            className={`h-full w-full object-cover ${
                              entry?.grayscale ? 'grayscale contrast-125' : ''
                            }`}
                          />
                        ) : (
                          <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
                            <Sparkles size={22} aria-hidden="true" className={frameTone.icon} />
                            <p className="text-xs text-zinc-400">Prompt ready · still not linked</p>
                          </div>
                        )}
                        {entry && (
                          <span
                            className={`absolute left-2 top-2 rounded border px-2 py-0.5 text-xs font-semibold ${frameTone.accent}`}
                          >
                            {entry.short}
                          </span>
                        )}
                        <span className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-0.5 text-xs font-medium text-zinc-300">
                          #{frame.order}
                        </span>
                      </div>
                      <div className="p-3">
                        <p className="text-xs font-semibold text-zinc-400">
                          {publicText(frame.beat, editMode)}
                        </p>
                        <h4 className="mt-1 text-sm font-semibold text-white">{frame.title}</h4>
                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-zinc-400">
                          {publicText(frame.description, editMode)}
                        </p>
                      </div>
                    </button>
                  </article>
                );
              })}
            </div>

            {frames.length === 0 && (
              <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-8 text-center text-zinc-400">
                No keyframes for this filter.
              </div>
            )}
          </div>

          {/* Workspace */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/95 p-5 shadow-2xl shadow-black/30">
              <p className="text-sm font-semibold text-orange-300">
                {publicText(selected.beat, editMode)}
              </p>
              <h3 className="mt-2 text-xl font-semibold text-white">{selected.title}</h3>
              {selectedLook.entry && (
                <span
                  className={`mt-3 inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold ${selectedLook.tone.accent}`}
                >
                  {selectedLook.entry.label}
                </span>
              )}
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                {publicText(selected.description, editMode)}
              </p>
              {selectedLook.entry && (
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  {selectedLook.entry.description}
                </p>
              )}

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
                  <h4 className="text-sm font-semibold text-zinc-400">Generate prompt</h4>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(selected.prompt, 'Prompt', `${selected.id}:prompt`)
                    }
                    className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 px-2.5 py-1.5 text-xs font-semibold text-zinc-200 transition hover:border-orange-400 hover:text-orange-200"
                  >
                    {copiedKey === `${selected.id}:prompt` ? (
                      <Check size={14} aria-hidden="true" />
                    ) : (
                      <Copy size={14} aria-hidden="true" />
                    )}
                    {copiedKey === `${selected.id}:prompt` ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <pre className="max-h-56 overflow-auto rounded-md border border-zinc-800 bg-black/80 p-3 text-sm leading-6 text-zinc-300 whitespace-pre-wrap">
                  {selected.prompt}
                </pre>
              </div>

              {selected.imageUrl ? (
                <button
                  type="button"
                  onClick={() => setLightbox(selected)}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md border border-zinc-700 py-2 text-sm font-semibold text-zinc-200 transition hover:border-orange-400 hover:text-orange-200"
                >
                  <Maximize2 size={16} aria-hidden="true" />
                  Open still
                </button>
              ) : (
                <p className="mt-4 rounded-md border border-dashed border-zinc-800 bg-black/40 p-3 text-sm leading-6 text-zinc-400">
                  {editMode ? (
                    <>
                      After generating, save the still under <code>images/</code>, set{' '}
                      <code>imagePath</code> on this frame in{' '}
                      <code>content/scenes/{board.id}.json</code>, then run{' '}
                      <code>npm run codegen</code>.
                    </>
                  ) : (
                    'Still coming soon.'
                  )}
                </p>
              )}
            </div>
          </aside>
        </section>
      )}

      {/* Extras */}
      {board.extras && board.extras.items.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold text-zinc-400">{board.extras.heading}</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {board.extras.items.map((extra) => (
              <article
                key={extra.id}
                className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-4"
              >
                {extra.cue && <p className={`text-xs font-semibold ${tone.text}`}>“{extra.cue}”</p>}
                <h4 className="mt-1.5 text-sm font-semibold text-zinc-100">{extra.title}</h4>
                <p className="mt-1.5 text-sm leading-6 text-zinc-400">{extra.description}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {lightbox && (
        <SceneLightbox
          frame={lightbox}
          treatment={lightbox.treatment ? treatmentById.get(lightbox.treatment) : undefined}
          onClose={() => setLightbox(null)}
          copiedKey={copiedKey}
          onCopy={copyToClipboard}
        />
      )}
    </section>
  );
}

function TreatmentFilter({
  treatments,
  value,
  onChange,
}: {
  treatments: readonly SceneTreatment[];
  value: string;
  onChange: (value: string) => void;
}) {
  const options: Array<[string, string]> = [
    [allValue, 'All'],
    ...treatments.map((entry): [string, string] => [entry.id, entry.short]),
  ];
  return (
    <div
      className="inline-flex rounded-lg border border-zinc-800 bg-black/40 p-1"
      role="group"
      aria-label="Filter by treatment"
    >
      {options.map(([id, label]) => (
        <button
          key={id}
          type="button"
          aria-pressed={value === id}
          onClick={() => onChange(id)}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-orange-300 ${
            value === id
              ? 'bg-orange-600 text-white'
              : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

interface SceneLightboxProps {
  frame: SceneFrame;
  treatment: SceneTreatment | undefined;
  onClose: () => void;
  copiedKey: string | null;
  onCopy: (text: string, label: string, key: string) => void;
}

function SceneLightbox({ frame, treatment, onClose, copiedKey, onCopy }: SceneLightboxProps) {
  const editMode = useEditMode();
  const tone = treatment ? sceneToneMeta[treatment.tone] : NEUTRAL;
  useEscapeKey(onClose);
  return (
    <div
      className="fixed inset-0 z-50 flex bg-black/92 p-3 backdrop-blur-sm sm:p-6"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={frame.title}
        className="relative m-auto grid max-h-[calc(100vh-1.5rem)] w-full max-w-6xl gap-4 overflow-hidden lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]"
      >
        <div className="relative min-h-[240px] overflow-hidden rounded-lg border border-zinc-800 bg-black">
          {frame.imageUrl ? (
            <img
              src={frame.imageUrl}
              alt={frame.title}
              loading="lazy"
              className={`h-full max-h-[70vh] w-full object-contain lg:max-h-[calc(100vh-3rem)] ${
                treatment?.grayscale ? 'grayscale' : ''
              }`}
            />
          ) : (
            <div className="flex min-h-[240px] flex-col justify-center gap-3 p-8">
              {treatment && (
                <p className={`text-sm font-semibold ${tone.text}`}>{treatment.label}</p>
              )}
              <p className="text-sm leading-7 text-zinc-400">{frame.prompt}</p>
            </div>
          )}
        </div>
        <div className="overflow-auto rounded-lg border border-zinc-800 bg-zinc-950 p-5">
          <p className="text-sm font-semibold text-zinc-400">{publicText(frame.beat, editMode)}</p>
          <h3 className="mt-2 text-xl font-semibold text-white">{frame.title}</h3>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            {publicText(frame.description, editMode)}
          </p>
          <button
            type="button"
            onClick={() => onCopy(frame.prompt, 'Prompt', `${frame.id}:lb`)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-200 hover:border-orange-400"
          >
            {copiedKey === `${frame.id}:lb` ? (
              <Check size={14} aria-hidden="true" />
            ) : (
              <Copy size={14} aria-hidden="true" />
            )}
            {copiedKey === `${frame.id}:lb` ? 'Copied' : 'Copy prompt'}
          </button>
          <pre className="mt-3 max-h-64 overflow-auto rounded-md border border-zinc-800 bg-black/80 p-3 text-sm leading-6 text-zinc-400 whitespace-pre-wrap">
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
