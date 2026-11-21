import { ArrowLeft, Check, Copy, Download, GitFork, RotateCcw } from 'lucide-react';
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { sequences, type SequenceRecord } from '../../data/sequences';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { clearDraft, listDrafts, loadDraft, saveDraft } from '../../lib/sequenceDraftStorage';
import { crewPath } from '../../routes/paths';
import { diagnoseGraphText } from '../../sequences/graph/diagnose';
import { formatGraphJson } from '../../sequences/graph/format';
import { newSequenceIdProblem } from '../../sequences/graph/ids';
import { retimeKey, timelineRows, type TimelineRow } from '../../sequences/graph/timeline';
import { customRendererIds } from '../../sequences/registry';
import SequencePlayer from '../SequencePlayer';

import KeyframeStrip from './KeyframeStrip';
import { editorPath } from './paths';

import type { SequenceGraph } from '../../sequences/graph/types';

// CodeMirror is the heaviest part of the editor: its own chunk, after the player is up.
const GraphCodeEditor = lazy(() => import('./GraphCodeEditor'));

/** Wait this long after the last keystroke before the player rebuilds the film. */
const PREVIEW_DELAY_MS = 400;

/**
 * `/sequences/:id/edit`: the in-hub graph editor. `:id` is the catalog sequence the graph starts
 * from; `?as=<new-id>` edits a fork under a new id. Drafts live in this browser's localStorage;
 * Copy and Download are how a draft reaches the repo (`content/sequences/<id>.graph.json`, then
 * `npm run codegen`). Desktop chrome: phones get a pointer back to the player.
 */
export default function SequenceEditor() {
  const { id = '' } = useParams();
  const [searchParams] = useSearchParams();
  const source = sequences.find((sequence) => sequence.id === id);
  if (!source) return <Navigate to={crewPath('/sequences')} replace />;
  const draftId = searchParams.get('as') ?? source.id;
  // A new id or source is a new editor: state does not leak between drafts.
  return <Editor key={`${source.id}|${draftId}`} source={source} draftId={draftId} />;
}

function Editor({ source, draftId }: { source: SequenceRecord; draftId: string }) {
  const navigate = useNavigate();
  const committedText = useMemo(
    () => (source.graph ? formatGraphJson(source.graph) : ''),
    [source.graph],
  );
  const isFork = draftId !== source.id;
  const [text, setText] = useState(() => loadDraft(draftId)?.text ?? committedText);
  const [saved, setSaved] = useState<'saved' | 'unsaved' | 'blocked' | 'catalog'>(() =>
    loadDraft(draftId) ? 'saved' : 'catalog',
  );
  const [timeSec, setTimeSec] = useState(0);
  const [seekRequest, setSeekRequest] = useState<{ timeSec: number }>();
  const [reveal, setReveal] = useState<{ from: number; to: number }>();
  const { copiedKey, copy } = useCopyToClipboard();
  const durationSec = source.durationSec;

  const diagnosis = useMemo(() => diagnoseGraphText(text, durationSec), [text, durationSec]);
  // The player shows the last graph that passed every check, a beat after typing stops.
  const [previewGraph, setPreviewGraph] = useState<SequenceGraph | undefined>(
    () => diagnosis.graph ?? source.graph,
  );
  useEffect(() => {
    if (!diagnosis.graph) return;
    const graph = diagnosis.graph;
    const timer = window.setTimeout(() => setPreviewGraph(graph), PREVIEW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [diagnosis.graph]);

  // Save the draft a beat after typing stops (or forget it once it matches the catalog again).
  // A save still waiting when the page goes away (reload, close, navigation) is written at once.
  const pendingRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isFork && text === committedText) {
      pendingRef.current = null;
      clearDraft(draftId);
      setSaved('catalog');
      return;
    }
    pendingRef.current = text;
    setSaved('unsaved');
    const timer = window.setTimeout(() => {
      pendingRef.current = null;
      setSaved(saveDraft(draftId, text, source.id) ? 'saved' : 'blocked');
    }, PREVIEW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [committedText, draftId, isFork, source.id, text]);
  useEffect(() => {
    const flush = () => {
      if (pendingRef.current === null) return;
      saveDraft(draftId, pendingRef.current, source.id);
      pendingRef.current = null;
    };
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, [draftId, source.id]);

  const previewRecord = useMemo<SequenceRecord>(
    () => ({ ...source, id: draftId, renderer: 'graph', graph: previewGraph }),
    [draftId, previewGraph, source],
  );
  const rows = useMemo(() => (previewGraph ? timelineRows(previewGraph) : []), [previewGraph]);

  const retime = (row: TimelineRow, index: number, t: number) => {
    const next = retimeKey(text, row.path, index, t, durationSec, {
      before: row.times[index - 1],
      after: row.times[index + 1],
    });
    if (next !== null) setText(next);
  };

  const download = () => {
    const blob = new Blob([text.endsWith('\n') ? text : `${text}\n`], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${draftId}.graph.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const status = {
    catalog: 'Matches the catalog',
    saved: 'Draft saved in this browser',
    unsaved: 'Saving…',
    blocked: 'Could not save (storage blocked or full)',
  }[saved];

  return (
    <section className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            to={crewPath(`/sequences/${source.id}`)}
            className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-orange-200"
          >
            <ArrowLeft size={14} aria-hidden="true" /> {source.title}
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-white">
            Graph editor · <span className="font-mono text-orange-200">{draftId}</span>
          </h1>
          <p className="mt-1 text-xs text-zinc-400">
            {isFork ? `Fork of ${source.id}. ` : ''}
            {status}. Hand it off with Copy or Download as{' '}
            <code className="text-zinc-300">content/sequences/{draftId}.graph.json</code>, then run{' '}
            <code className="text-zinc-300">npm run codegen</code>.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ToolbarButton
            onClick={() => copy(text, 'Graph JSON', 'graph')}
            icon={copiedKey === 'graph' ? Check : Copy}
            label={copiedKey === 'graph' ? 'Copied' : 'Copy graph JSON'}
          />
          <ToolbarButton
            onClick={download}
            icon={Download}
            label={`Download ${draftId}.graph.json`}
          />
          {!isFork && saved !== 'catalog' ? (
            <ToolbarButton
              onClick={() => setText(committedText)}
              icon={RotateCcw}
              label="Revert to catalog"
            />
          ) : null}
        </div>
      </header>

      <p className="rounded-md border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-400 lg:hidden">
        The graph editor needs a wider screen.{' '}
        <Link className="text-orange-200 underline" to={crewPath(`/sequences/${source.id}`)}>
          Watch {source.title}
        </Link>{' '}
        instead.
      </p>

      <div className="hidden gap-5 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <div className="space-y-4">
          <SequencePlayer
            sequence={previewRecord}
            onTimeUpdate={setTimeSec}
            seekRequest={seekRequest}
          />
          <KeyframeStrip
            rows={rows}
            markers={previewGraph?.markers ?? []}
            durationSec={durationSec}
            timeSec={timeSec}
            onSeek={(t) => setSeekRequest({ timeSec: t })}
            onRetime={retime}
          />
          <ForkPanel
            source={source}
            draftId={draftId}
            onFork={(from, newId) => {
              // Forking the film on screen keeps the edits on screen.
              if (from === source.id && !loadDraft(newId)) saveDraft(newId, text, source.id);
              void navigate(editorPath(from, newId));
            }}
          />
        </div>

        <div className="flex min-h-[70vh] flex-col gap-3">
          <div className="min-h-0 flex-1 overflow-hidden rounded-md border border-zinc-800">
            <Suspense
              fallback={
                <div role="status" className="p-4 text-sm text-zinc-500">
                  Loading the editor…
                </div>
              }
            >
              <GraphCodeEditor
                value={text}
                onChange={setText}
                durationSec={durationSec}
                reveal={reveal}
                label={`${draftId}.graph.json`}
              />
            </Suspense>
          </div>
          <ProblemList
            problems={diagnosis.diagnostics}
            onReveal={(from, to) => setReveal({ from, to })}
          />
        </div>
      </div>
    </section>
  );
}

function ProblemList({
  problems,
  onReveal,
}: {
  problems: { from: number; to: number; message: string }[];
  onReveal: (from: number, to: number) => void;
}) {
  if (problems.length === 0) {
    return (
      <p role="status" className="text-xs text-emerald-300">
        Valid graph: codegen would accept it. The player shows this version.
      </p>
    );
  }
  return (
    <div
      role="status"
      className="max-h-40 overflow-y-auto rounded-md border border-red-900/60 bg-red-950/30 p-2"
    >
      <p className="mb-1 text-xs font-semibold text-red-200">
        {problems.length === 1 ? '1 problem' : `${problems.length} problems`} — the player keeps the
        last valid version.
      </p>
      <ul className="space-y-0.5">
        {problems.map((problem, index) => (
          <li key={`${index}-${problem.message}`}>
            <button
              type="button"
              onClick={() => onReveal(problem.from, problem.to)}
              className="text-left font-mono text-[11px] text-red-100 hover:underline"
            >
              {problem.message}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Start a new film from any sequence's graph, under a new id. */
function ForkPanel({
  source,
  draftId,
  onFork,
}: {
  source: SequenceRecord;
  draftId: string;
  onFork: (from: string, newId: string) => void;
}) {
  const [from, setFrom] = useState(source.id);
  const [newId, setNewId] = useState('');
  const drafts = useMemo(() => listDrafts(), []);
  const problem = newId
    ? newSequenceIdProblem(newId, {
        sequenceIds: sequences.map((sequence) => sequence.id),
        customRendererIds,
      })
    : null;

  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-950/80 p-3 text-sm">
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!newId || problem) return;
          onFork(from, newId);
        }}
      >
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Fork from
          <select
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            className="h-9 rounded-md border border-zinc-800 bg-black/70 px-2 text-sm text-white"
          >
            {sequences.map((sequence) => (
              <option key={sequence.id} value={sequence.id}>
                {sequence.title} ({sequence.durationSec}s)
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          New id
          <input
            value={newId}
            onChange={(event) => setNewId(event.target.value.trim())}
            placeholder="my-new-film"
            aria-invalid={problem ? true : undefined}
            aria-describedby="fork-id-problem"
            className="h-9 w-52 rounded-md border border-zinc-800 bg-black/70 px-2 font-mono text-sm text-white"
          />
        </label>
        <button
          type="submit"
          disabled={!newId || Boolean(problem)}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-zinc-700 px-3 text-xs font-semibold text-zinc-200 transition enabled:hover:border-orange-400 enabled:hover:text-orange-200 disabled:opacity-40"
        >
          <GitFork size={14} aria-hidden="true" /> Fork
        </button>
      </form>
      <p id="fork-id-problem" className="mt-1 min-h-4 text-xs text-red-300">
        {problem ?? ''}
      </p>
      {drafts.filter((draft) => draft.id !== draftId).length > 0 ? (
        <p className="mt-1 text-xs text-zinc-400">
          Other drafts here:{' '}
          {drafts
            .filter((draft) => draft.id !== draftId)
            .map((draft, index) => (
              <span key={draft.id}>
                {index > 0 ? ', ' : ''}
                <Link
                  className="font-mono text-orange-200 hover:underline"
                  to={editorPath(
                    sequences.some((sequence) => sequence.id === draft.forkedFrom)
                      ? draft.forkedFrom
                      : source.id,
                    draft.id,
                  )}
                >
                  {draft.id}
                </Link>
              </span>
            ))}
        </p>
      ) : null}
      <p className="mt-2 text-xs text-zinc-500">
        A fork keeps the source&apos;s length ({source.durationSec}s here): set{' '}
        <code className="text-zinc-300">durationSec</code> in the new record when you commit it.
      </p>
    </div>
  );
}

function ToolbarButton({
  onClick,
  icon: Icon,
  label,
}: {
  onClick: () => void;
  icon: typeof Copy;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 px-2.5 py-1.5 text-xs font-semibold text-zinc-200 transition hover:border-orange-400 hover:text-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-300"
    >
      <Icon size={14} aria-hidden="true" />
      {label}
    </button>
  );
}
