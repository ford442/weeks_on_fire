import { Lightbulb, Music2, Search, Sparkles, Timer, MessageSquare } from 'lucide-react';
import {
  type CutawaySegment,
  type CutawaySuggestion,
  type SightCandidate,
  type SuggestionKind,
} from '../../data/suggestions';
import { getDialogVersionsForScene } from '../../data/sceneDialogVersions';
import { allValue, isOpenSlot } from './sightSlots';

const kindLabel: Record<SuggestionKind, string> = {
  musical: 'Musical',
  gag: 'Gags',
  scene: 'Scenes',
};

interface SuggestionsListProps {
  suggestions: CutawaySuggestion[];
  totalCount: number;
  kindCounts: Record<SuggestionKind, number>;
  kind: typeof allValue | SuggestionKind;
  query: string;
  selectedId?: string;
  activeSegmentId?: string;
  previewSightBySegment: Map<string, SightCandidate>;
  onKind: (kind: typeof allValue | SuggestionKind) => void;
  onQuery: (query: string) => void;
  onSelectCutaway: (cutaway: CutawaySuggestion) => void;
  onSelectSegment: (cutaway: CutawaySuggestion, segmentId: string) => void;
}

export default function SuggestionsList({
  suggestions,
  totalCount,
  kindCounts,
  kind,
  query,
  selectedId,
  activeSegmentId,
  previewSightBySegment,
  onKind,
  onQuery,
  onSelectCutaway,
  onSelectSegment,
}: SuggestionsListProps) {
  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-zinc-400">
            {suggestions.length} of {totalCount} suggestions
          </p>
          <div className="flex flex-wrap gap-2">
            <KindChip
              active={kind === allValue}
              label={`All (${totalCount})`}
              onClick={() => onKind(allValue)}
            />
            <KindChip
              active={kind === 'musical'}
              label={`Musical (${kindCounts.musical})`}
              onClick={() => onKind('musical')}
            />
            <KindChip
              active={kind === 'gag'}
              label={`Gags (${kindCounts.gag})`}
              onClick={() => onKind('gag')}
            />
            <KindChip
              active={kind === 'scene'}
              label={`Scenes (${kindCounts.scene})`}
              onClick={() => onKind('scene')}
            />
          </div>
        </div>
        <label className="relative mt-3 block">
          <span className="sr-only">Search suggestions</span>
          <Search
            aria-hidden="true"
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <input
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder="Search titles, songs, tags..."
            className="h-11 w-full rounded-md border border-zinc-800 bg-black/70 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/30"
          />
        </label>
      </div>

      {suggestions.map((cutaway) => {
        const isSelected = selectedId === cutaway.id;

        return (
          <article
            key={cutaway.id}
            className={`overflow-hidden rounded-lg border bg-zinc-950 transition ${
              isSelected
                ? 'border-orange-500/70 ring-1 ring-orange-500/30'
                : 'border-zinc-800 hover:border-orange-500/50'
            }`}
          >
            <button
              type="button"
              onClick={() => onSelectCutaway(cutaway)}
              className="block w-full p-5 text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-300"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-300">
                    {kindLabel[cutaway.kind]} · {cutaway.episode}
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold leading-tight text-white">
                    {cutaway.title}
                  </h2>
                </div>
                <StatusBadge status={cutaway.status} />
              </div>
              <p className="mt-3 text-sm leading-6 text-zinc-300">{cutaway.summary}</p>
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-zinc-400">
                <span className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1">
                  <Timer size={14} /> {cutaway.runtime}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1">
                  <Music2 size={14} /> {cutaway.songTitle}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1">
                  <Sparkles size={14} /> {cutaway.segments.length} segments
                </span>
                {cutaway.sightBank && cutaway.sightBank.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-violet-200">
                    <Lightbulb size={14} /> {cutaway.sightBank.length} sights
                  </span>
                )}
                {getDialogVersionsForScene(cutaway.id) && (
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-orange-200">
                    <MessageSquare size={14} />{' '}
                    {getDialogVersionsForScene(cutaway.id)!.exchanges.length} dialog scenes
                  </span>
                )}
              </div>
              {isSelected && (
                <>
                  <p className="mt-3 text-sm leading-6 text-zinc-500">
                    <span className="font-medium text-zinc-400">Visual arc: </span>
                    {cutaway.visualArc}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {cutaway.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </button>

            {isSelected && (
              <div className="border-t border-zinc-800 p-4">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Timed Segments
                </h3>
                <div className="space-y-2">
                  {cutaway.segments.map((segment) => (
                    <SegmentRow
                      key={segment.id}
                      segment={segment}
                      active={activeSegmentId === segment.id}
                      previewTitle={previewSightBySegment.get(segment.id)?.title}
                      locked={!isOpenSlot(segment) && Boolean(cutaway.sightBank?.length)}
                      onSelect={() => onSelectSegment(cutaway, segment.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </article>
        );
      })}

      {suggestions.length === 0 && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-10 text-center text-zinc-400">
          No suggestions match the current filters.
        </div>
      )}
    </div>
  );
}

function KindChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] transition focus:outline-none focus:ring-2 focus:ring-orange-300 ${
        active
          ? 'border-orange-500/60 bg-orange-500/15 text-orange-100'
          : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
      }`}
    >
      {label}
    </button>
  );
}

function StatusBadge({ status }: { status: CutawaySuggestion['status'] }) {
  const label =
    status === 'ready-to-generate'
      ? 'Ready to generate'
      : status === 'in-production'
        ? 'In production'
        : 'Suggested';

  return (
    <span className="rounded-md border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-200">
      {label}
    </span>
  );
}

interface SegmentRowProps {
  segment: CutawaySegment;
  active: boolean;
  previewTitle?: string;
  locked?: boolean;
  onSelect: () => void;
}

function SegmentRow({ segment, active, previewTitle, locked, onSelect }: SegmentRowProps) {
  const timing =
    segment.durationSec === 0
      ? 'still'
      : `${segment.start} – ${segment.end} · ${segment.durationSec}s`;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-md border px-3 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-orange-300 ${
        active
          ? 'border-orange-500/60 bg-orange-500/10'
          : 'border-zinc-800 bg-black/40 hover:border-zinc-600'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[11px] text-zinc-500">{timing}</p>
          <p className="mt-1 text-sm font-semibold text-white">
            {previewTitle ? `${segment.label} · ${previewTitle}` : segment.label}
          </p>
        </div>
        {segment.stillUrl && (
          <img
            src={segment.stillUrl}
            alt=""
            className="h-12 w-20 shrink-0 rounded border border-zinc-800 object-cover"
          />
        )}
      </div>
      <p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-400">
        {previewTitle
          ? 'Preview in this slot — not locked'
          : locked
            ? `${segment.onScreen} · lip locked`
            : segment.onScreen}
      </p>
    </button>
  );
}
