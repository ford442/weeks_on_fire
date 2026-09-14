import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, Clock, ExternalLink } from 'lucide-react';

import { episodes, episodeStatusMeta } from '../data/episodes';
import type { EpisodeFiles } from '../data/episodes';
import { loadMarkdownFile } from '../lib/episodeMarkdown';
import { AVAILABLE_EPISODES } from '../data/production';

const REPO_BASE = 'https://github.com/ford442/weeks_on_fire';

type MarkdownTabKey = 'synopsis' | 'scenes' | 'screenplay' | 'notes' | 'seasonArc';

const markdownTabMeta: Record<MarkdownTabKey, string> = {
  synopsis: 'Synopsis',
  scenes: 'Scenes',
  screenplay: 'Screenplay',
  notes: 'Notes',
  seasonArc: 'Season Arc',
};

const markdownTabKeys: MarkdownTabKey[] = [
  'synopsis',
  'scenes',
  'screenplay',
  'notes',
  'seasonArc',
];

// Shift heading levels down one so a document's own `# Title` never collides
// with the page's single real <h1> (SiteHeader) or the <h2> episode title above.
const markdownComponents = {
  h1: 'h2',
  h2: 'h3',
  h3: 'h4',
  h4: 'h5',
  h5: 'h6',
  h6: 'h6',
} as const;

const fileLabels: Record<keyof EpisodeFiles, string> = {
  synopsis: 'synopsis.md',
  scenes: 'scenes.md',
  screenplay: 'screenplay.md',
  subtitles: 'subtitles.srt',
  notes: 'notes',
  seasonArc: 'season-arc.md',
};

interface EpisodeDetailProps {
  id: string;
}

export default function EpisodeDetail({ id }: EpisodeDetailProps) {
  const navigate = useNavigate();
  const episode = useMemo(() => episodes.find((entry) => entry.id === id), [id]);

  const availableTabs = useMemo(
    () => (episode ? markdownTabKeys.filter((key) => Boolean(episode.files[key])) : []),
    [episode],
  );

  const [activeTab, setActiveTab] = useState<MarkdownTabKey | null>(availableTabs[0] ?? null);
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setActiveTab(availableTabs[0] ?? null);
  }, [availableTabs]);

  useEffect(() => {
    if (!episode || !activeTab) {
      setMarkdown(null);
      return;
    }

    const path = episode.files[activeTab];
    if (!path) {
      setMarkdown(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    loadMarkdownFile(path).then((content) => {
      if (cancelled) return;
      setMarkdown(content);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [episode, activeTab]);

  useEffect(() => {
    if (episode === undefined) {
      navigate('/episodes', { replace: true });
    }
  }, [episode, navigate]);

  if (!episode) return null;

  const status = episodeStatusMeta[episode.status];
  const hasTimelineData = (AVAILABLE_EPISODES as readonly string[]).includes(episode.id);
  const fileEntries = Object.entries(episode.files) as Array<[keyof EpisodeFiles, string]>;

  return (
    <section className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <Link
        to="/episodes"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-400 transition hover:text-orange-300"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        All episodes
      </Link>

      <header className="rounded-lg border border-zinc-800 bg-zinc-950 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-300">
            {episode.isCandidate ? 'Episode 5 candidate' : `Episode ${episode.number}`}
          </p>
          <span
            className={`rounded-md border px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${status.accent}`}
          >
            {status.label}
          </span>
        </div>

        <h2 className="mt-2 text-3xl font-semibold leading-tight text-white">{episode.title}</h2>
        {episode.register ? <p className="mt-1 text-sm text-zinc-400">{episode.register}</p> : null}

        <p className="mt-4 text-base leading-7 text-zinc-300">{episode.logline}</p>

        {episode.runtime ? (
          <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-zinc-500">
            <Clock size={13} aria-hidden="true" />
            {episode.runtime}
          </p>
        ) : null}

        {episode.isCandidate ? (
          <p className="mt-4 rounded-md border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-sm leading-6 text-violet-200">
            Episode 4 is HOA / Morning After. This is a parked Episode 5 candidate — draft only, not
            a replacement for Episode 4.
          </p>
        ) : null}

        {hasTimelineData ? (
          <p className="mt-4 text-sm text-zinc-400">
            Scene-by-scene production tracking lives in{' '}
            <Link to="/timeline" className="text-orange-300 underline underline-offset-2">
              Timeline
            </Link>{' '}
            — select this episode there to edit it.
          </p>
        ) : null}
      </header>

      {availableTabs.length > 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950">
          <div
            role="tablist"
            aria-label="Episode documents"
            className="flex flex-wrap gap-1 border-b border-zinc-800 p-2"
          >
            {availableTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-md px-3 py-1.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-orange-300 ${
                  activeTab === tab
                    ? 'bg-orange-600 text-white'
                    : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                }`}
              >
                {markdownTabMeta[tab]}
              </button>
            ))}
          </div>

          <div className="markdown-body p-6">
            {isLoading ? (
              <p className="text-sm text-zinc-500">Loading…</p>
            ) : markdown ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {markdown}
              </ReactMarkdown>
            ) : (
              <p className="text-sm text-zinc-500">This document could not be loaded.</p>
            )}
          </div>
        </div>
      ) : null}

      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
          Source files
        </p>
        <ul className="mt-3 space-y-2">
          {fileEntries.map(([key, path]) => (
            <li key={key}>
              <a
                href={`${REPO_BASE}/blob/main/${path}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-zinc-300 transition hover:text-orange-300"
              >
                <ExternalLink size={13} aria-hidden="true" />
                {fileLabels[key]} — <span className="text-zinc-500">{path}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
