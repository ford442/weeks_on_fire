import { Link, useParams } from 'react-router-dom';
import { BookOpen, Clock } from 'lucide-react';

import { episodes, episodeStatusMeta } from '../data/episodes';
import EpisodeDetail from './EpisodeDetail';

export default function Episodes() {
  const { id } = useParams();

  if (id) {
    return <EpisodeDetail id={id} />;
  }

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-4">
        <div className="flex items-start gap-3">
          <BookOpen className="mt-0.5 shrink-0 text-orange-300" size={18} aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-zinc-200">Read-only episode bible</p>
            <p className="mt-1 text-sm leading-6 text-zinc-400">
              Loglines, status, and in-app synopses for every episode. To edit a scene timeline or
              its production history, use the{' '}
              <Link to="/timeline" className="text-orange-300 underline underline-offset-2">
                Timeline
              </Link>{' '}
              view instead.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {episodes.map((episode) => {
          const status = episodeStatusMeta[episode.status];

          return (
            <Link
              key={episode.id}
              to={`/episodes/${episode.id}`}
              className={`block rounded-lg border bg-zinc-950 p-5 transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-orange-300 ${
                episode.isCandidate
                  ? 'border-violet-500/40 hover:border-violet-500/70'
                  : 'border-zinc-800 hover:border-orange-500/70'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-300">
                  {episode.isCandidate ? 'Episode 5 candidate' : `Episode ${episode.number}`}
                </p>
                <span
                  className={`rounded-md border px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${status.accent}`}
                >
                  {status.label}
                </span>
              </div>

              <h2 className="mt-2 text-xl font-semibold leading-tight text-white">
                {episode.title}
              </h2>
              {episode.register ? (
                <p className="mt-1 text-sm text-zinc-400">{episode.register}</p>
              ) : null}

              <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-300">{episode.logline}</p>

              {episode.runtime ? (
                <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-zinc-500">
                  <Clock size={13} aria-hidden="true" />
                  {episode.runtime}
                </p>
              ) : null}

              {episode.isCandidate ? (
                <p className="mt-3 border-t border-zinc-800 pt-3 text-xs leading-5 text-violet-300">
                  Episode 4 is HOA / Morning After. This is a parked Episode 5 candidate — not a
                  replacement for it.
                </p>
              ) : null}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
