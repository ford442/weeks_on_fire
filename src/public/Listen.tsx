import { useMemo } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';

import { albums, belongsToAlbum, publicTracks } from './catalog';
import TrackPlayer from './TrackPlayer';

const listenPath = (id: string) => `/listen/${id}`;

export default function Listen() {
  const { id } = useParams();
  const tracks = useMemo(() => publicTracks(), []);
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <TrackPlayer {...tracks} trackId={id} trackPath={listenPath} />
    </div>
  );
}

export function Album() {
  const { id } = useParams();
  const [search] = useSearchParams();
  const album = albums.find((item) => item.id === id);
  const tracks = useMemo(() => publicTracks((song) => belongsToAlbum(song, id ?? '')), [id]);

  if (!album) return <Navigate to="/albums" replace />;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-8">
        <Link to="/albums" className="text-sm font-semibold text-orange-300 hover:underline">
          ← All music projects
        </Link>
        <h1 className="mt-3 text-4xl font-black text-white">{album.title}</h1>
        <p className="mt-2 text-lg text-zinc-300">{album.description}</p>
      </header>
      <TrackPlayer
        key={album.id}
        {...tracks}
        trackId={search.get('track') ?? undefined}
        trackPath={(songId) => `/albums/${album.id}?track=${encodeURIComponent(songId)}`}
        trackHeading="h2"
      />
    </div>
  );
}
