import { Search } from 'lucide-react';

import { ALL } from '../../lib/schedule';
import { statusOptions, type ProductionStatus } from '../../lib/status';
import FilterChip from '../FilterChip';
import FilterSelect from '../FilterSelect';

import type { SuggestionKind } from '../../data/suggestions';

const kinds: ReadonlyArray<{ kind: SuggestionKind; label: string }> = [
  { kind: 'musical', label: 'Musical' },
  { kind: 'gag', label: 'Gags' },
  { kind: 'scene', label: 'Scenes' },
];

interface SuggestionsFiltersProps {
  /** Cutaways left after filtering, and in the whole catalog. */
  shown: number;
  total: number;
  kindCounts: Record<SuggestionKind, number>;
  kind: typeof ALL | SuggestionKind;
  status: typeof ALL | ProductionStatus;
  statusCounts: Partial<Record<ProductionStatus, number>>;
  query: string;
  onKind: (kind: typeof ALL | SuggestionKind) => void;
  onStatus: (status: typeof ALL | ProductionStatus) => void;
  onQuery: (query: string) => void;
}

/**
 * Kind / status / text filters. They live in the URL and apply to both the schedule and the
 * list, so a filtered link (`?kind=gag`, the Archive's `?q=…`) means the same in either view.
 */
export default function SuggestionsFilters({
  shown,
  total,
  kindCounts,
  kind,
  status,
  statusCounts,
  query,
  onKind,
  onStatus,
  onQuery,
}: SuggestionsFiltersProps) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-400">
          {shown} of {total} suggestions
        </p>
        <div className="flex flex-wrap gap-2">
          <FilterChip active={kind === ALL} onClick={() => onKind(ALL)}>
            All ({total})
          </FilterChip>
          {kinds.map((entry) => (
            <FilterChip
              key={entry.kind}
              active={kind === entry.kind}
              onClick={() => onKind(entry.kind)}
            >
              {entry.label} ({kindCounts[entry.kind]})
            </FilterChip>
          ))}
        </div>
      </div>
      <div className="mt-3">
        <FilterSelect
          label="Status"
          value={status}
          options={statusOptions(statusCounts)}
          onChange={(value) => onStatus(value as typeof ALL | ProductionStatus)}
        />
      </div>
      <label className="relative mt-3 block">
        <span className="sr-only">Search suggestions</span>
        <Search
          aria-hidden="true"
          size={18}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
        />
        <input
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="Search titles, songs, tags..."
          className="h-11 w-full rounded-md border border-zinc-800 bg-black/70 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-zinc-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/30"
        />
      </label>
    </div>
  );
}
