import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clapperboard, ImageIcon, Music2 } from 'lucide-react';

import { filmScenes, type FilmScene } from '../data/films';
import { songs } from '../data/songs';
import { episodeWithSlot } from '../data/taxonomy';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';
import { useUrlParam } from '../hooks/useUrlState';
import { useVideoItems } from '../hooks/useVideoItems';
import { pluralize } from '../lib/plural';
import { FINALIZED_STATUSES, isFinalized, productionStatusMeta } from '../lib/status';
import { finalizedVideoItems } from '../lib/videos';
import { crewPath } from '../routes/paths';

import FilterChip from './FilterChip';
import { allValue } from './FilterSelect';
import Lightbox from './Lightbox';
import SongAudioPlayer from './SongAudioPlayer';
import StatusBadge from './StatusBadge';
import VideoCard from './VideoCard';

type FinalizedType = 'song' | 'image' | 'video';

const finalizedSongs = songs.filter((song) => isFinalized(song.status));
const finalizedImages = filmScenes.filter(
  (scene) => scene.mediaType === 'image' && isFinalized(scene.status),
);
export default function Finalized() {
  const [type, setType] = useUrlParam<typeof allValue | FinalizedType>('type', allValue, [
    allValue,
    'song',
    'image',
    'video',
  ]);
  const [lightboxScene, setLightboxScene] = useState<FilmScene | null>(null);
  const { copiedKey, copy } = useCopyToClipboard();
  const allVideos = useVideoItems();
  // The same list as the Video view, narrowed to Approved and Final.
  const videos = useMemo(() => finalizedVideoItems(allVideos), [allVideos]);

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
          <FilterChip active={type === allValue} onClick={() => setType(allValue)}>
            All ({total})
          </FilterChip>
          <FilterChip active={type === 'song'} onClick={() => setType('song')}>
            Songs ({counts.song})
          </FilterChip>
          <FilterChip active={type === 'image'} onClick={() => setType('image')}>
            Images ({counts.image})
          </FilterChip>
          <FilterChip active={type === 'video'} onClick={() => setType('video')}>
            Video ({counts.video})
          </FilterChip>
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
          empty="No video is marked Approved or Final yet. Scene videos, Timeline clips, cutaways and archive clips land here when they are."
        >
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {videos.map((video) => (
              <li key={video.key} className="flex">
                <VideoCard item={video} />
              </li>
            ))}
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
