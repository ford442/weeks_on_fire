import { ChevronLeft, ChevronRight, Loader2, Pause, Play } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { songs } from '../data/songs';
import { useCoordinatedAudio } from '../hooks/useCoordinatedAudio';
import { loadSongAudioUrl } from '../lib/songAudio';

import { artistFor, publicTracks } from './catalog';

import type { Song } from '../data/types';

export default function Listen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { playable, upcoming } = useMemo(() => publicTracks(), []);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ time: 0, duration: 0 });

  const selected = songs.find((song) => song.id === id) ?? playable[0];
  const index = selected ? playable.findIndex((song) => song.id === selected.id) : -1;
  const canPlay = Boolean(selected?.audioFile);

  useCoordinatedAudio(
    selected?.id ?? 'public-player',
    audioRef,
    selected?.title ?? '',
    selected ? artistFor(selected) : undefined,
  );

  const playSong = useCallback(async (song: Song) => {
    const audio = audioRef.current;
    if (!audio || !song.audioFile) return;
    setLoading(true);
    try {
      const url = await loadSongAudioUrl(song.audioFile);
      if (!url) return;
      if (audio.src !== new URL(url, window.location.href).href) audio.src = url;
      await audio.play();
    } catch {
      setIsPlaying(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const go = useCallback(
    (offset: number, autoplay: boolean) => {
      if (playable.length === 0) return;
      const next = playable[(Math.max(index, 0) + offset + playable.length) % playable.length];
      if (!next) return;
      void navigate(`/listen/${next.id}`);
      if (autoplay) void playSong(next);
    },
    [index, navigate, playSong, playable],
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTime = () => setProgress({ time: audio.currentTime, duration: audio.duration || 0 });
    const onEnded = () => go(1, true);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onTime);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onTime);
      audio.removeEventListener('ended', onEnded);
    };
  }, [go]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio || !selected) return;
    if (audio.paused || !audio.src) void playSong(selected);
    else audio.pause();
  };

  const seek = (value: number) => {
    const audio = audioRef.current;
    if (audio && Number.isFinite(value)) audio.currentTime = value;
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <audio ref={audioRef} preload="none" className="hidden" />

      {selected && (
        <section
          aria-label="Now playing"
          className="mb-8 rounded-2xl border border-fuchsia-900/50 bg-gradient-to-br from-fuchsia-950/40 via-zinc-950 to-orange-950/30 p-5 sm:p-7"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-fuchsia-300">
            {artistFor(selected)}
          </p>
          <h1 className="mt-1 text-3xl font-black text-white sm:text-4xl">{selected.title}</h1>
          <p className="mt-1 text-sm text-zinc-400">{selected.subgenre ?? selected.genre}</p>
          <p className="mt-3 max-w-2xl text-zinc-300">{selected.description}</p>

          {canPlay ? (
            <div className="mt-5 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => go(-1, isPlaying)}
                  aria-label="Previous track"
                  className="rounded-full p-2 text-zinc-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-300"
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  type="button"
                  onClick={toggle}
                  aria-label={isPlaying ? `Pause ${selected.title}` : `Play ${selected.title}`}
                  className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-fuchsia-500 text-white shadow-lg shadow-fuchsia-900/50 transition hover:bg-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-200"
                >
                  {loading ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : isPlaying ? (
                    <Pause size={24} />
                  ) : (
                    <Play size={24} className="ml-1" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => go(1, isPlaying)}
                  aria-label="Next track"
                  className="rounded-full p-2 text-zinc-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-300"
                >
                  <ChevronRight size={22} />
                </button>
              </div>
              <label className="flex items-center gap-3 text-xs tabular-nums text-zinc-400">
                <span>{formatTime(progress.time)}</span>
                <input
                  type="range"
                  min={0}
                  max={progress.duration || 0}
                  step={0.1}
                  value={progress.time}
                  onChange={(event) => seek(Number(event.target.value))}
                  aria-label="Seek"
                  className="flex-1 accent-fuchsia-400"
                />
                <span>{formatTime(progress.duration)}</span>
              </label>
            </div>
          ) : (
            <p className="mt-5 inline-block rounded-full border border-zinc-700 px-3 py-1 text-sm text-zinc-400">
              Audio coming soon
            </p>
          )}

          {!selected.instrumental && selected.lyrics?.trim() && (
            <details className="mt-6">
              <summary className="cursor-pointer text-sm font-semibold text-fuchsia-200">
                Lyrics
              </summary>
              <pre className="mt-3 max-h-96 overflow-y-auto whitespace-pre-wrap font-sans text-sm leading-6 text-zinc-300">
                {selected.lyrics}
              </pre>
            </details>
          )}
        </section>
      )}

      <TrackList title="Tracks" songs={playable} selectedId={selected?.id} isPlaying={isPlaying} />
      {upcoming.length > 0 && (
        <TrackList title="Coming soon" songs={upcoming} selectedId={selected?.id} muted />
      )}
    </div>
  );
}

function TrackList({
  title,
  songs: list,
  selectedId,
  isPlaying = false,
  muted = false,
}: {
  title: string;
  songs: Song[];
  selectedId?: string;
  isPlaying?: boolean;
  muted?: boolean;
}) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
        {title}
      </h2>
      <ol className="divide-y divide-zinc-900 overflow-hidden rounded-xl border border-zinc-900">
        {list.map((song, i) => {
          const active = song.id === selectedId;
          return (
            <li key={song.id}>
              <Link
                to={`/listen/${song.id}`}
                aria-current={active ? 'true' : undefined}
                className={`flex items-center gap-4 px-4 py-3 transition hover:bg-zinc-900/70 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-fuchsia-300 ${
                  active ? 'bg-fuchsia-950/30' : ''
                }`}
              >
                <span className="w-6 text-right text-sm tabular-nums text-zinc-500">
                  {active && isPlaying ? '♪' : i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={`block truncate font-semibold ${muted ? 'text-zinc-400' : 'text-zinc-100'}`}
                  >
                    {song.title}
                  </span>
                  <span className="block truncate text-xs text-zinc-500">
                    {artistFor(song)} · {song.subgenre ?? song.genre}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
