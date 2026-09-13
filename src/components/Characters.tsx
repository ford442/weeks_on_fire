import { useMemo, useState } from 'react';
import { Search, UserCircle } from 'lucide-react';
import { seriesCharacters, type SeriesCharacter } from '../data/characters';
import { firstCatalogItem } from '../lib/catalog';

export default function Characters() {
  const [selected, setSelected] = useState<SeriesCharacter>(
    firstCatalogItem(seriesCharacters, 'characters'),
  );
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return seriesCharacters;

    return seriesCharacters.filter((character) =>
      [
        character.name,
        character.nameNote ?? '',
        character.role,
        character.bio,
        character.episodes.join(' '),
        character.traits.join(' '),
        character.props.join(' '),
        character.tags.join(' '),
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [query]);

  return (
    <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_390px] lg:px-8">
      <div className="space-y-5">
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-4">
          <div className="flex items-start gap-3">
            <UserCircle className="mt-0.5 shrink-0 text-orange-300" size={18} aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-zinc-200">Series character bible</p>
              <p className="mt-1 text-sm leading-6 text-zinc-400">
                Recurring cast, lawn-ensemble roles, and running gag figures. Search by name — e.g.{' '}
                <strong className="font-medium text-zinc-300">Qing Rao</strong> for the Chinese
                crystal-skull keeper on the Episode 03 Monster Mash lawn.
              </p>
            </div>
          </div>
        </div>

        <label className="relative block">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            size={16}
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search characters…"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-zinc-500 focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-300/30"
          />
        </label>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((character) => {
            const isActive = selected.id === character.id;

            return (
              <article
                key={character.id}
                className={`overflow-hidden rounded-lg border bg-zinc-950 transition hover:-translate-y-0.5 ${
                  isActive
                    ? 'border-orange-500/70 ring-1 ring-orange-500/40'
                    : 'border-zinc-800 hover:border-orange-500/70'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelected(character)}
                  className="block w-full text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-300"
                >
                  {character.imageUrl ? (
                    <div className="aspect-[4/5] w-full overflow-hidden bg-zinc-900">
                      <img
                        src={character.imageUrl}
                        alt={`${character.name} — ${character.role}`}
                        className="h-full w-full object-cover object-top"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-[4/5] w-full items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-950">
                      <UserCircle className="text-zinc-700" size={48} aria-hidden="true" />
                    </div>
                  )}
                  <div className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-300">
                      {character.episodes[0] ?? character.role}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold leading-tight text-white">
                      {character.name}
                      {character.nameNote ? (
                        <span className="mt-1 block text-base font-normal text-zinc-400">
                          {character.nameNote}
                        </span>
                      ) : null}
                    </h2>
                    <p className="mt-2 text-sm text-zinc-400">{character.role}</p>
                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-zinc-300">
                      {character.bio}
                    </p>
                  </div>
                </button>
              </article>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <p className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-8 text-center text-sm text-zinc-400">
            No characters match “{query}”.
          </p>
        ) : null}
      </div>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-400">
          <UserCircle size={17} aria-hidden="true" />
          Character Profile
        </div>
        <CharacterDetail character={selected} />
      </aside>
    </section>
  );
}

function CharacterDetail({ character }: { character: SeriesCharacter }) {
  return (
    <div className="space-y-5 rounded-lg border border-zinc-800 bg-zinc-950 p-5">
      {character.imageUrl ? (
        <div className="aspect-[3/4] w-full overflow-hidden rounded-md bg-zinc-900">
          <img
            src={character.imageUrl}
            alt={`${character.name} — ${character.role}`}
            className="h-full w-full object-cover object-top"
          />
        </div>
      ) : null}

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-300">
          {character.role}
        </p>
        <h2 className="mt-2 text-3xl font-semibold leading-tight text-white">{character.name}</h2>
        {character.nameNote ? (
          <p className="mt-2 text-sm text-zinc-400">{character.nameNote}</p>
        ) : null}
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Bio</p>
        <p className="mt-2 text-sm leading-7 text-zinc-300">{character.bio}</p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Episodes</p>
        <ul className="mt-2 space-y-2">
          {character.episodes.map((episode) => (
            <li
              key={episode}
              className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300"
            >
              {episode}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Traits</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {character.traits.map((trait) => (
            <span
              key={trait}
              className="rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300"
            >
              {trait}
            </span>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Props</p>
        <ul className="mt-2 space-y-2">
          {character.props.map((prop) => (
            <li
              key={prop}
              className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300"
            >
              {prop}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap gap-2">
        {character.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-md border border-orange-500/20 bg-orange-500/5 px-2 py-1 text-xs text-orange-200"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
