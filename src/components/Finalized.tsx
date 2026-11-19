import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clapperboard, ImageIcon, Music2 } from 'lucide-react';

import { filmScenes, type FilmScene } from '../data/films';
import { AVAILABLE_EPISODES, loadEpisodeProduction } from '../data/production';
import { songs } from '../data/songs';
import { cutawaySuggestions } from '../data/suggestions';
import { episodeWithSlot } from '../data/taxonomy';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';
import { useUrlParam } from '../hooks/useUrlState';
import { pluralize } from '../lib/plural';
import { FINALIZED_STATUSES, isFinalized, productionStatusMeta } from '../lib/status';
import { crewPath, viewPaths } from '../routes/paths';

import { allValue } from './FilterSelect';
import Lightbox from './Lightbox';
import SongAudioPlayer from './SongAudioPlayer';
import StatusBadge from './StatusBadge';

import type { ProductionStatus } from '../lib/status';

type FinalizedType = 'song' | 'image' | 'video';

interface VideoItem {
  key: string;
  title: string;
  status: ProductionStatus;
  context: string;
  to?: string;
  href?: string;
}

const finalizedSongs = songs.filter((song) => isFinalized(song.status));
const finalizedImages = filmScenes.filter(
  (scene) => scene.mediaType === 'image' && isFinalized(scene.status),
);
const catalogVideos: VideoItem[] = [
  ...filmScenes
    .filter((scene) => scene.mediaType === 'video' && isFinalized(scene.status))
    .map((scene) => ({
      key: `gallery:${scene.id}`,
      title: scene.title,
      status: scene.status,
      context: `Visual archive · ${episodeWithSlot(scene.episode, scene.slot)}`,
      to: viewPaths.gallery,
    })),
  ...cutawaySuggestions
    .filter((cutaway) => isFinalized(cutaway.status))
    .map((cutaway) => ({
      key: `cutaway:${cutaway.id}`,
      title: cutaway.title,
      status: cutaway.status,
      context: `Cutaway · ${cutaway.episode} · ${cutaway.runtime}`,
      to: crewPath(`/suggestions/${cutaway.id}`),
    })),
];

/** Approved and Final timeline scenes from the committed `scenes.json` files (not local edits). */
function useFinalizedTimelineVideos(): VideoItem[] {
  const [items, setItems] = useState<VideoItem[]>([]);
  useEffect(() => {
    let cancelled = false;
    void Promise.all(AVAILABLE_EPISODES.map((episode) => loadEpisodeProduction(episode))).then(
      (productions) => {
        if (cancelled) return;
        setItems(
          productions.flatMap((production) =>
            (production?.scenes ?? [])
              .filter((scene) => isFinalized(scene.status))
              .map((scene) => ({
                key: `timeline:${production?.episode}:${scene.id}`,
                title: scene.title,
                status: scene.status,
                context: `Timeline · Episode ${production?.episode} · ${scene.timestamp}`,
                ...(scene.mediaUrl ? { href: scene.mediaUrl } : { to: viewPaths.timeline }),
              })),
          ),
        );
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);
  return items;
}

export default function Finalized() {
  const [type, setType] = useUrlParam<typeof allValue | FinalizedType>('type', allValue, [
    allValue,
    'song',
    'image',
    'video',
  ]);
  const [lightboxScene, setLightboxScene] = useState<FilmScene | null>(null);
  const { copiedKey, copy } = useCopyToClipboard();
  const timelineVideos = useFinalizedTimelineVideos();
  const videos = useMemo(() => [...catalogVideos, ...timelineVideos], [timelineVideos]);

  const counts: Record<FinalizedType, number> = {
    song: finalizedSongs.length,
    image: finalizedImages.length,
    video: videos.length,
  };
  const total = counts.song + counts.image + counts.video;
  const show = (section: FinalizedType) => type === allValue || type === section;

  return (
    <section className="mx-auto max-w-[1600px] space-y-6 px-4 py-5 sm:px-6 lg:px-8">
      <div className="rounded-xl border border-zinc-800/90 bg-zinc-950/70 p-4">
        <p className="text-sm text-zinc-400">
          {pluralize(total, 'finished piece')} — everything marked{' '}
          {FINALIZED_STATUSES.map((status) => productionStatusMeta[status].label).join(' or ')}{' '}
          across songs, stills and video.
        </p>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filter by type">
          <TypeChip active={type === allValue} onClick={() => setType(allValue)}>
            All ({total})
          </TypeChip>
          <TypeChip active={type === 'song'} onClick={() => setType('song')}>
            Songs ({counts.song})
          </TypeChip>
          <TypeChip active={type === 'image'} onClick={() => setType('image')}>
            Images ({counts.image})
          </TypeChip>
          <TypeChip active={type === 'video'} onClick={() => setType('video')}>
            Video ({counts.video})
          </TypeChip>
        </div>
      </div>

      {show('song') && (
        <FinalizedSection
          icon={<Music2 size={18} aria-hidden="true" />}
          title="Songs"
          count={counts.song}
          empty="No songs are marked Approved or Final yet."
        >
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {finalizedSongs.map((song) => (
              <li
                key={song.id}
                className="flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      to={crewPath(`/songs/${song.id}`)}
                      className="block truncate font-semibold text-white hover:text-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-300"
                    >
                      {song.title}
                    </Link>
                    <p className="truncate text-xs text-zinc-400">
                      {song.subgenre ?? song.genre} · {episodeWithSlot(song.episode, song.slot)}
                    </p>
                  </div>
                  <StatusBadge status={song.status} size="xs" />
                </div>
                {song.audioFile && (
                  <SongAudioPlayer audioFile={song.audioFile} title={song.title} compact />
                )}
              </li>
            ))}
          </ul>
        </FinalizedSection>
      )}

      {show('image') && (
        <FinalizedSection
          icon={<ImageIcon size={18} aria-hidden="true" />}
          title="Images"
          count={counts.image}
          empty="No stills are marked Approved or Final yet."
        >
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
            {finalizedImages.map((scene) => (
              <li key={scene.id}>
                <button
                  type="button"
                  onClick={() => scene.imageUrl && setLightboxScene(scene)}
                  className="group block w-full overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 text-left transition hover:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-300"
                >
                  <div className="aspect-[4/5] overflow-hidden bg-black">
                    {scene.imageUrl ? (
                      <img
                        src={scene.imageUrl}
                        alt={scene.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-zinc-600">
                        <ImageIcon size={24} aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5 p-3">
                    <StatusBadge status={scene.status} size="xs" />
                    <p className="line-clamp-2 text-sm font-semibold leading-snug text-white">
                      {scene.title}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {episodeWithSlot(scene.episode, scene.slot)}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </FinalizedSection>
      )}

      {show('video') && (
        <FinalizedSection
          icon={<Clapperboard size={18} aria-hidden="true" />}
          title="Video"
          count={counts.video}
          empty="No video is marked Approved or Final yet. Timeline scenes, cutaways and archive clips land here when they are."
        >
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {videos.map((video) => {
              const label = (
                <>
                  <span className="block truncate font-semibold text-white">{video.title}</span>
                  <span className="block truncate text-xs text-zinc-400">{video.context}</span>
                </>
              );
              const linkClass =
                'min-w-0 flex-1 hover:text-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-300';
              return (
                <li
                  key={video.key}
                  className="flex items-start justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-4"
                >
                  {video.href ? (
                    <a href={video.href} target="_blank" rel="noreferrer" className={linkClass}>
                      {label}
                    </a>
                  ) : (
                    <Link to={video.to ?? viewPaths.timeline} className={linkClass}>
                      {label}
                    </Link>
                  )}
                  <StatusBadge status={video.status} size="xs" />
                </li>
              );
            })}
          </ul>
        </FinalizedSection>
      )}

      {lightboxScene && (
        <Lightbox
          scene={lightboxScene}
          copiedKey={copiedKey}
          onClose={() => setLightboxScene(null)}
          onCopy={copy}
        />
      )}
    </section>
  );
}

function FinalizedSection({
  icon,
  title,
  count,
  empty,
  children,
}: {
  icon: ReactNode;
  title: string;
  count: number;
  empty: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={`finalized-${title}`} className="space-y-3">
      <h2
        id={`finalized-${title}`}
        className="flex items-center gap-2 text-lg font-semibold text-white"
      >
        <span className="text-orange-300">{icon}</span>
        {title}
        <span className="text-sm font-normal tabular-nums text-zinc-400">{count}</span>
      </h2>
      {count > 0 ? (
        children
      ) : (
        <p className="flex items-center gap-2 rounded-lg border border-dashed border-zinc-800 p-4 text-sm text-zinc-400">
          <CheckCircle2 size={16} aria-hidden="true" />
          {empty}
        </p>
      )}
    </section>
  );
}

function TypeChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-md border px-3 py-1.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-orange-300 ${
        active
          ? 'border-orange-500/60 bg-orange-500/15 text-orange-100'
          : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
      }`}
    >
      {children}
    </button>
  );
}
