import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';

import { useUrlParam } from '../hooks/useUrlState';
import { pluralize } from '../lib/plural';
import { SEARCH_TYPES, SEARCH_TYPE_LABELS, hubSearch, type SearchDocType } from '../lib/siteSearch';
import { searchPath } from '../routes/paths';

import FilterChip from './FilterChip';

const allValue = 'all';
const RESULT_LIMIT = 200;
const EXAMPLES = ['well', 'marble', 'Rubella', 'laundromat', 'HOA'] as const;

/**
 * `/show/search?q=…&type=…`: the header search as a page, so a query can be linked, reloaded and
 * narrowed by type. Lazy route; it is the only page that loads MiniSearch and the search corpus.
 */
export default function SearchPage() {
  const [query, setQuery] = useUrlParam('q', '');
  const [type, setType] = useUrlParam<typeof allValue | SearchDocType>('type', allValue, [
    allValue,
    ...SEARCH_TYPES,
  ]);

  const counts = useMemo(() => hubSearch().countByType(query), [query]);
  const results = useMemo(
    () =>
      hubSearch().search(query, {
        limit: RESULT_LIMIT,
        ...(type === allValue ? {} : { type }),
      }),
    [query, type],
  );
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const hasQuery = query.trim().length > 0;

  return (
    <section className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <label className="relative block">
        <span className="sr-only">Search the hub</span>
        <Search
          aria-hidden="true"
          size={18}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search songs, cutaways, stills, characters…"
          // The page exists to type into; landing here from a link should not need a click.
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          className="h-12 w-full rounded-lg border border-zinc-800 bg-zinc-950 pl-10 pr-4 text-base text-white placeholder:text-zinc-400 focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-300/30"
        />
      </label>

      {hasQuery ? (
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Result type">
          <FilterChip active={type === allValue} onClick={() => setType(allValue)}>
            All ({total})
          </FilterChip>
          {SEARCH_TYPES.filter((key) => (counts[key] ?? 0) > 0 || key === type).map((key) => (
            <FilterChip key={key} active={type === key} onClick={() => setType(key)}>
              {SEARCH_TYPE_LABELS[key]} ({counts[key] ?? 0})
            </FilterChip>
          ))}
        </div>
      ) : null}

      {hasQuery ? (
        <p className="text-sm text-zinc-400" aria-live="polite">
          {results.length === 0
            ? `Nothing matches “${query.trim()}”${type === allValue ? '' : ` in ${SEARCH_TYPE_LABELS[type]}`}.`
            : `${pluralize(results.length, 'result')} for “${query.trim()}”${
                type === allValue ? '' : ` in ${SEARCH_TYPE_LABELS[type]}`
              }`}
        </p>
      ) : (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-5 text-sm leading-6 text-zinc-400">
          <p>
            Searches titles, tags, summaries, loglines and cast across every catalog — not lyrics or
            Grok prompts. Every term has to match; a partial word matches the start of one. Try:
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {EXAMPLES.map((example) => (
              <li key={example}>
                <Link
                  to={searchPath(example)}
                  className="inline-block rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1 font-semibold text-zinc-300 transition hover:border-orange-400 hover:text-orange-200"
                >
                  {example}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {results.length > 0 ? (
        <ol aria-label="Search results" className="space-y-2">
          {results.map((hit) => (
            <li key={hit.id}>
              <Link
                to={hit.route}
                className="block rounded-lg border border-zinc-800 bg-zinc-950 p-4 transition hover:border-orange-500/60 focus:outline-none focus:ring-2 focus:ring-orange-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold leading-tight text-white">{hit.title}</h2>
                    {hit.subtitle ? (
                      <p className="mt-1 truncate text-sm text-zinc-400">{hit.subtitle}</p>
                    ) : null}
                  </div>
                  <span className="shrink-0 rounded border border-zinc-700 px-2 py-0.5 text-xs text-zinc-300">
                    {SEARCH_TYPE_LABELS[hit.type]}
                  </span>
                </div>
                {hit.summary ? (
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-300">{hit.summary}</p>
                ) : null}
                {hit.characters ? (
                  <p className="mt-2 text-xs text-orange-200/80">With {hit.characters}</p>
                ) : null}
              </Link>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
