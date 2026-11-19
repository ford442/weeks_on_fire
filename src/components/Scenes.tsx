import { Link, Navigate, useParams } from 'react-router-dom';
import { Clapperboard } from 'lucide-react';

import { sceneBoardById, sceneBoardCover, sceneBoards, sceneToneMeta } from '../data/sceneBoards';
import { pluralize } from '../lib/plural';
import { crewPath } from '../routes/paths';

import SceneDetail from './SceneDetail';
import StatusBadge from './StatusBadge';
import Still from './Still';

/** `/scenes` lists every scene board; `/scenes/:id` renders one through the shared template. */
export default function Scenes() {
  const { id } = useParams();

  if (id) {
    const board = sceneBoardById(id);
    if (!board) return <Navigate to={crewPath('/scenes')} replace />;
    // Keyed so moving between scenes resets the selected keyframe and filters.
    return <SceneDetail key={board.id} board={board} />;
  }

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-4">
        <div className="flex items-start gap-3">
          <Clapperboard className="mt-0.5 shrink-0 text-orange-300" size={18} aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-zinc-200">Scenes with a page of their own</p>
            <p className="mt-1 text-sm leading-6 text-zinc-400">
              A scene gets a board once it has a pitch, prompt locks and keyframes. Every scene uses
              the same page. Raw ideas stay in{' '}
              <Link
                to={crewPath('/suggestions')}
                className="text-orange-300 underline underline-offset-2"
              >
                Suggestions
              </Link>
              ; finished cuts are collected under{' '}
              <Link
                to={crewPath('/video')}
                className="text-orange-300 underline underline-offset-2"
              >
                Video
              </Link>
              .
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {sceneBoards.map((board) => {
          const cover = sceneBoardCover(board);
          const tone = sceneToneMeta[board.tone ?? 'orange'];
          return (
            <Link
              key={board.id}
              to={crewPath(`/scenes/${board.id}`)}
              className="group block overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 transition hover:-translate-y-0.5 hover:border-orange-500/70 focus:outline-none focus:ring-2 focus:ring-orange-300"
            >
              <div className={`aspect-video overflow-hidden ${tone.tile}`}>
                {cover?.imageUrl && (
                  <Still
                    src={cover.imageUrl}
                    picture={cover.imagePicture}
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  />
                )}
              </div>
              <div className="space-y-2 p-5">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm font-semibold ${tone.text}`}>
                    {[board.format ?? 'Scene', board.cast].filter(Boolean).join(' · ')}
                  </p>
                  <StatusBadge status={board.status} size="xs" />
                </div>
                <h2 className="text-xl font-semibold leading-tight text-white">{board.title}</h2>
                {board.subtitle && <p className="text-sm text-zinc-400">{board.subtitle}</p>}
                <p className="line-clamp-3 text-sm leading-6 text-zinc-300">{board.pitch}</p>
                <p className="pt-1 text-xs text-zinc-400">
                  {pluralize(board.frames.length, 'keyframe')} ·{' '}
                  {pluralize(board.videos.length, 'video')}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
