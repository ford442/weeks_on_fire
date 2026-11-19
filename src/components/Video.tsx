import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';

import { useUrlParam } from '../hooks/useUrlState';
import { useVideoItems } from '../hooks/useVideoItems';
import { pluralize } from '../lib/plural';
import { countByStatus, PRODUCTION_STATUSES, statusOptions } from '../lib/status';
import { VIDEO_SOURCES, videoSourceLabel, type VideoSource } from '../lib/videos';
import { crewPath, viewPaths } from '../routes/paths';

import FilterChip from './FilterChip';
import FilterSelect, { allValue } from './FilterSelect';
import VideoCard from './VideoCard';

import type { ProductionStatus } from '../lib/status';

export default function Video() {
  const items = useVideoItems();

  const [source, setSource] = useUrlParam<typeof allValue | VideoSource>('source', allValue, [
    allValue,
    ...VIDEO_SOURCES,
  ]);
  const [status, setStatus] = useUrlParam<typeof allValue | ProductionStatus>('status', allValue, [
    allValue,
    ...PRODUCTION_STATUSES,
  ]);
  const [query, setQuery] = useUrlParam('q', '');

  const sourceCounts = useMemo(() => {
    const counts: Record<VideoSource, number> = { scene: 0, timeline: 0, archive: 0, cutaway: 0 };
    for (const item of items) counts[item.source] += 1;
    return counts;
  }, [items]);
  const statusCounts = useMemo(() => countByStatus(items), [items]);

  const shown = useMemo(() => {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return items.filter((item) => {
      if (source !== allValue && item.source !== source) return false;
      if (status !== allValue && item.status !== status) return false;
      const haystack = `${item.title} ${item.context} ${item.note ?? ''}`.toLowerCase();
      return terms.every((term) => haystack.includes(term));
    });
  }, [items, query, source, status]);

  return (
    <section className="mx-auto max-w-[1600px] space-y-4 px-4 py-5 sm:px-6 lg:px-8">
      <div className="rounded-xl border border-zinc-800/90 bg-zinc-950/70 p-4">
        <p className="text-sm text-zinc-400">
          {shown.length} of {pluralize(items.length, 'video')} with a take — scene slideshows,
          Timeline clips, archive clips and cutaways, finished work first. Ideas that nobody has
          generated yet stay on{' '}
          <Link to={crewPath('/suggestions')} className="text-orange-300 underline">
            Suggestions
          </Link>{' '}
          and the{' '}
          <Link to={viewPaths.timeline} className="text-orange-300 underline">
            Timeline
          </Link>
          .
        </p>

        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filter by source">
          <FilterChip active={source === allValue} onClick={() => setSource(allValue)}>
            All ({items.length})
          </FilterChip>
          {VIDEO_SOURCES.map((value) => (
            <FilterChip key={value} active={source === value} onClick={() => setSource(value)}>
              {videoSourceLabel[value]} ({sourceCounts[value]})
            </FilterChip>
          ))}
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(200px,1fr)_220px]">
          <label className="relative block">
            <span className="sr-only">Search videos</span>
            <Search
              aria-hidden="true"
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search videos…"
              className="h-10 w-full rounded-md border border-zinc-800 bg-black/70 pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-zinc-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/30"
            />
          </label>
          <FilterSelect
            label="Status"
            value={status}
            options={statusOptions(statusCounts)}
            onChange={(value) => setStatus(value as typeof allValue | ProductionStatus)}
            heightClass="h-10"
          />
        </div>
      </div>

      <h2 className="sr-only">Videos</h2>
      {shown.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {shown.map((item) => (
            <li key={item.key} className="flex">
              <VideoCard item={item} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-10 text-center text-zinc-400">
          No video matches the current filters.
        </div>
      )}
    </section>
  );
}
