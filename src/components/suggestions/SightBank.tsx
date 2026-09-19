import type { SightCandidate } from '../../data/suggestions';
import { allValue } from './sightSlots';

export default function SightBank({
  sights,
  categories,
  activeCategory,
  activeSightId,
  slotLettersBySight,
  onCategory,
  onSelectSight,
}: {
  sights: SightCandidate[];
  categories: string[];
  activeCategory: string;
  activeSightId?: string;
  slotLettersBySight: Map<string, string[]>;
  onCategory: (category: string) => void;
  onSelectSight: (sight: SightCandidate) => void;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/95 p-4">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Sight bank
          </h3>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Click a fall sight into B–G, or an ending into H. Lip stays locked. Preview is not a
            lock.
          </p>
        </div>
        <p className="text-xs text-zinc-500">{sights.length} shown</p>
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onCategory(allValue)}
          className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-orange-300 ${
            activeCategory === allValue
              ? 'border-violet-400/60 bg-violet-500/15 text-violet-100'
              : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
          }`}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => onCategory(category)}
            className={`rounded-md border px-2.5 py-1 text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-orange-300 ${
              activeCategory === category
                ? 'border-violet-400/60 bg-violet-500/15 text-violet-100'
                : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>
      <div className="grid max-h-[22rem] gap-2 overflow-y-auto pr-1">
        {sights.map((sight) => {
          const assigned = slotLettersBySight.get(sight.id) ?? [];
          const isActive = activeSightId === sight.id;

          return (
            <button
              key={sight.id}
              type="button"
              onClick={() => onSelectSight(sight)}
              className={`rounded-md border p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-orange-300 ${
                isActive
                  ? 'border-violet-400/70 bg-violet-500/15'
                  : 'border-zinc-800 bg-black/40 hover:border-zinc-600'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm font-semibold text-white">{sight.title}</p>
                <div className="flex flex-wrap gap-1">
                  {sight.lane === 'ending' && (
                    <span className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-200">
                      H only
                    </span>
                  )}
                  {assigned.map((letter) => (
                    <span
                      key={`${sight.id}:${letter}`}
                      className="rounded border border-violet-500/30 bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-violet-200"
                    >
                      {letter}
                    </span>
                  ))}
                </div>
              </div>
              <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-zinc-500">
                {sight.category}
              </p>
              <p className="mt-1.5 text-xs leading-5 text-zinc-400">{sight.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
