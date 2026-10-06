import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Headphones, Search, SlidersHorizontal } from 'lucide-react';
import { linkedAudioFilenames, songs, type Song } from '../data/songs';
import { firstCatalogItem } from '../lib/catalog';
import { getUnlistedTracks } from '../lib/songAudio';
import { formatSongDate } from '../lib/songDate';
import SongAudioPlayer from './SongAudioPlayer';
import SongDetail from './SongDetail';

const allValue = 'All';

type SongSort = 'added-desc' | 'added-asc' | 'title';

const hasAddedDates = songs.some((song) => Boolean(song.added));

const sortOptions: Array<{ value: SongSort; label: string; needsDate: boolean }> = [
  { value: 'added-desc', label: 'Date added, newest', needsDate: true },
  { value: 'added-asc', label: 'Date added, oldest', needsDate: true },
  { value: 'title', label: 'Title A–Z', needsDate: false },
];

export default function Songs() {
  const { id } = useParams();
  const navigate = useNavigate();
  const workspaceRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<Song>(firstCatalogItem(songs, 'songs'));
  const [query, setQuery] = useState('');
  const [episode, setEpisode] = useState(allValue);
  const [hasAudio, setHasAudio] = useState(false);
  const [instrumentalOnly, setInstrumentalOnly] = useState(false);
  const [sort, setSort] = useState<SongSort>(hasAddedDates ? 'added-desc' : 'title');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const unlistedTracks = useMemo(() => getUnlistedTracks(linkedAudioFilenames), []);

  useEffect(() => {
    if (id) {
      const song = songs.find((entry) => entry.id === id);
      if (song) {
        setSelected(song);
        return;
      }
      navigate('/songs', { replace: true });
      return;
    }

    if (songs[0]) {
      setSelected(songs[0]);
    }
  }, [id, navigate]);

  const episodes = useMemo(() => uniqueValues(songs.map((song) => song.episode)), []);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const matches = songs.filter((song) => {
      const matchesSearch =
        normalizedQuery.length === 0 ||
        [
          song.title,
          song.genre,
          song.description,
          song.episode,
          song.stylePrompt,
          song.lyrics ?? '',
          song.tags.join(' '),
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);

      return (
        matchesSearch &&
        (episode === allValue || song.episode === episode) &&
        (!hasAudio || Boolean(song.audioFile)) &&
        (!instrumentalOnly || song.instrumental)
      );
    });

    return matches.sort((a, b) => compareSongs(a, b, sort));
  }, [episode, hasAudio, instrumentalOnly, query, sort]);

  const selectSong = (song: Song) => {
    setSelected(song);
    navigate(`/songs/${song.id}`);
    if (!window.matchMedia('(min-width: 1024px)').matches) {
      workspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const copyToClipboard = async (text: string, label: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 1600);
    } catch {
      window.prompt(`Copy ${label}`, text);
    }
  };

  return (
    <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8">
      <div className="min-w-0 space-y-5">
        <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950 lg:max-h-[calc(100vh-7rem)]">
          <div className="sticky top-0 z-10 space-y-3 border-b border-zinc-800 bg-zinc-950 p-4">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
              <label className="relative block">
                <span className="sr-only">Search songs, lyrics, and tags</span>
                <Search
                  aria-hidden="true"
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search songs, lyrics, genres..."
                  className="h-11 w-full rounded-md border border-zinc-800 bg-black/70 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/30"
                />
              </label>
              <label className="block">
                <span className="sr-only">Sort</span>
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as SongSort)}
                  className="h-11 w-full rounded-md border border-zinc-800 bg-black/70 px-3 text-sm text-white outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/30"
                >
                  {sortOptions
                    .filter((option) => hasAddedDates || !option.needsDate)
                    .map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                </select>
              </label>
            </div>
            <FilterSelect
              label="Episode"
              value={episode}
              options={episodes}
              onChange={setEpisode}
            />
            <div className="flex flex-wrap items-center gap-2">
              <FilterToggle pressed={hasAudio} onToggle={() => setHasAudio((value) => !value)}>
                <Headphones size={14} aria-hidden="true" />
                Has audio
              </FilterToggle>
              <FilterToggle
                pressed={instrumentalOnly}
                onToggle={() => setInstrumentalOnly((value) => !value)}
              >
                Instrumental
              </FilterToggle>
              <p className="ml-auto text-sm tabular-nums text-zinc-400" aria-live="polite">
                {filtered.length} of {songs.length}
              </p>
            </div>
          </div>

          {filtered.length > 0 ? (
            <ul className="divide-y divide-zinc-900">
              {filtered.map((song) => {
                const isSelected = selected.id === song.id;
                return (
                  <li key={song.id}>
                    <button
                      type="button"
                      onClick={() => selectSong(song)}
                      aria-current={isSelected ? 'true' : undefined}
                      className={`flex w-full items-center gap-3 border-l-2 px-4 py-2.5 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-300 ${
                        isSelected
                          ? 'border-orange-400 bg-orange-500/10'
                          : 'border-transparent hover:bg-zinc-900'
                      }`}
                    >
                      <span
                        className={`min-w-0 flex-1 truncate font-medium ${
                          isSelected ? 'text-orange-100' : 'text-white'
                        }`}
                      >
                        {song.title}
                      </span>
                      <span className="hidden min-w-0 flex-1 truncate text-zinc-500 sm:block">
                        {song.genre}
                      </span>
                      <time
                        dateTime={song.added}
                        className="w-24 shrink-0 text-right text-xs tabular-nums text-zinc-500"
                      >
                        {formatSongDate(song.added)}
                      </time>
                      <span className="flex w-4 shrink-0 justify-center text-orange-300">
                        {song.audioFile && (
                          <Headphones size={14} aria-label="Has audio" role="img" />
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="p-10 text-center text-zinc-400">
              No songs match the current filters.
            </div>
          )}
        </div>

        {unlistedTracks.length > 0 && (
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Unlisted Audio</h2>
              <p className="mt-1 text-sm text-zinc-500">
                MP3 files in songs/ not yet linked to a catalog entry.
              </p>
            </div>
            <div className="grid gap-3">
              {unlistedTracks.map((track) => (
                <article
                  key={track.id}
                  className="rounded-lg border border-zinc-800 bg-zinc-950 p-4"
                >
                  <div className="mb-3 min-w-0">
                    <h3 className="truncate text-base font-semibold text-white">{track.title}</h3>
                    <p className="mt-1 text-xs text-zinc-500">{track.filename}</p>
                  </div>
                  <SongAudioPlayer audioFile={track.filename} title={track.title} />
                </article>
              ))}
            </div>
          </section>
        )}
      </div>

      <div ref={workspaceRef} className="scroll-mt-20 lg:sticky lg:top-20 lg:self-start">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-400">
          <SlidersHorizontal size={17} />
          Song Workspace
        </div>
        <SongDetail song={selected} copiedKey={copiedKey} onCopy={copyToClipboard} />
      </div>
    </section>
  );
}

interface FilterSelectProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

function FilterSelect({ label, value, options, onChange }: FilterSelectProps) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-md border border-zinc-800 bg-black/70 px-3 text-sm text-white outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/30"
      >
        <option value={allValue}>{label}: All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

interface FilterToggleProps {
  pressed: boolean;
  onToggle: () => void;
  children: ReactNode;
}

function FilterToggle({ pressed, onToggle, children }: FilterToggleProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onToggle}
      className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-orange-300 ${
        pressed
          ? 'border-orange-400 bg-orange-500/15 text-orange-100'
          : 'border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
      }`}
    >
      {children}
    </button>
  );
}

function compareSongs(a: Song, b: Song, sort: SongSort) {
  if (sort !== 'title') {
    const byDate = a.added.localeCompare(b.added);
    if (byDate !== 0) return sort === 'added-desc' ? -byDate : byDate;
  }
  return a.title.localeCompare(b.title);
}

function uniqueValues(values: string[]) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}
