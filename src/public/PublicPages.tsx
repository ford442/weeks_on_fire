import { Link } from 'react-router-dom';

import { artistFor, publicTracks } from './Listen';

import type { Song } from '../data/types';

function SongCards({ songs }: { songs: Song[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {songs.map((song) => (
        <li key={song.id}>
          <Link
            to={`/show/listen/${song.id}`}
            className="block h-full rounded-xl border border-zinc-900 bg-zinc-950 p-4 transition hover:border-fuchsia-800 focus:outline-none focus:ring-2 focus:ring-fuchsia-300"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-fuchsia-300">{artistFor(song)}</p>
            <p className="mt-1 font-bold text-white">{song.title}</p>
            <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{song.description}</p>
            {!song.audioFile && <p className="mt-2 text-xs text-zinc-500">Audio coming soon</p>}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function PublicHome() {
  const { playable } = publicTracks();
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <section className="mb-12">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-300">
          A comedy series
        </p>
        <h1 className="mt-2 text-4xl font-black leading-tight text-white sm:text-6xl">
          Weeks of Fire
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-zinc-300">
          Ten-second moments, set to music, played completely straight. Starring Lillith and
          Rubella, who are never impressed.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/show/listen"
            className="rounded-full bg-fuchsia-500 px-5 py-2.5 font-semibold text-white hover:bg-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-200"
          >
            Listen to the soundtrack
          </Link>
          <Link
            to="/show/lace-waterfall"
            className="rounded-full border border-zinc-700 px-5 py-2.5 font-semibold text-zinc-200 hover:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-200"
          >
            Meet Lace Waterfall
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
          Latest tracks
        </h2>
        <SongCards songs={playable.slice(0, 6)} />
      </section>
    </div>
  );
}

export function LaceWaterfall() {
  const isBand = (song: Song) => song.episode === 'Lace Waterfall';
  const { playable, upcoming } = publicTracks(isBand);
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-fuchsia-300">The band</p>
      <h1 className="mt-2 text-4xl font-black text-white sm:text-5xl">Lace Waterfall</h1>
      <p className="mt-4 max-w-2xl text-lg text-zinc-300">
        Lillith and Rubella. Two voices, one band, no one else. Lillith starts the chant; Rubella
        answers, drier. They do not explain the name.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <article className="rounded-xl border border-zinc-900 bg-zinc-950 p-5">
          <h2 className="text-xl font-bold text-white">Lillith</h2>
          <p className="mt-1 text-sm text-fuchsia-300">Guitar · lead</p>
          <p className="mt-3 text-sm text-zinc-400">
            The brighter voice. Starts every chant and commits to it.
          </p>
        </article>
        <article className="rounded-xl border border-zinc-900 bg-zinc-950 p-5">
          <h2 className="text-xl font-bold text-white">Rubella</h2>
          <p className="mt-1 text-sm text-fuchsia-300">Vocals</p>
          <p className="mt-3 text-sm text-zinc-400">
            The drier voice. Joins on the second call, every time.
          </p>
        </article>
      </div>

      <section className="mt-12">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
          Discography
        </h2>
        <SongCards songs={[...playable, ...upcoming]} />
      </section>
    </div>
  );
}
