import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Clapperboard, ExternalLink } from 'lucide-react';

import { useCoordinatedAudio } from '../hooks/useCoordinatedAudio';
import { isDirectVideoUrl, type VideoItem } from '../lib/videos';

import StatusBadge from './StatusBadge';

/**
 * One video record: a player when the file is a direct mp4/webm, otherwise a link out, with its
 * production status and the page that owns it. Shared by the Video, Finalized and Scene views.
 */
export default function VideoCard({ item }: { item: VideoItem }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playable = item.url !== undefined && isDirectVideoUrl(item.url);

  // Starting this video pauses whatever else is playing, e.g. the scene's song.
  useCoordinatedAudio(`video:${item.key}`, videoRef, item.title);

  return (
    <article className="flex w-full flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
      <div className="aspect-video bg-black">
        {playable ? (
          <video
            ref={videoRef}
            src={item.url}
            controls
            preload="none"
            playsInline
            aria-label={item.title}
            className="h-full w-full"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center text-sm text-zinc-400">
            <Clapperboard size={22} aria-hidden="true" className="text-zinc-600" />
            {item.url ? 'Hosted elsewhere — open the link.' : 'No file is linked to this clip yet.'}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <StatusBadge status={item.status} size="xs" />
        <h3 className="text-sm font-semibold leading-snug text-white">
          <Link
            to={item.to}
            className="hover:text-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-300"
          >
            {item.title}
          </Link>
        </h3>
        <p className="text-xs text-zinc-400">{item.context}</p>
        {item.note && <p className="text-sm leading-6 text-zinc-400">{item.note}</p>}
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="mt-auto inline-flex items-center gap-1.5 self-start pt-1 text-xs font-semibold text-orange-300 underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-orange-300"
          >
            Open file
            <ExternalLink size={13} aria-hidden="true" />
          </a>
        )}
      </div>
    </article>
  );
}
