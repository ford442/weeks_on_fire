import { Lightbulb, Music2, Sparkles, Timer, MessageSquare } from 'lucide-react';

import {
  prefetchCutaway,
  type CutawaySegment,
  type CutawaySuggestion,
  type CutawaySummary,
  type SightCandidate,
  type SuggestionKind,
} from '../../data/suggestions';
import { getDialogVersionsForScene } from '../../data/sceneDialogVersions';
import { pluralize } from '../../lib/plural';
import StatusBadge from '../StatusBadge';

import { isOpenSlot } from './sightSlots';

const kindLabel: Record<SuggestionKind, string> = {
  musical: 'Musical',
  gag: 'Gags',
  scene: 'Scenes',
};

interface SuggestionsListProps {
  suggestions: CutawaySummary[];
  selectedId?: string;
  /** Full record of the selected cutaway, once fetched: its card opens out to the segments. */
  selectedRecord?: CutawaySuggestion;
  activeSegmentId?: string;
  previewSightBySegment: Map<string, SightCandidate>;
  onSelectCutaway: (cutaway: CutawaySummary) => void;
  onSelectSegment: (cutaway: CutawaySummary, segmentId: string) => void;
}

/** The flat list: every suggestion as a card, the selected one opened out to its timed segments. */
export default function SuggestionsList({
  suggestions,
  selectedId,
  selectedRecord,
  activeSegmentId,
  previewSightBySegment,
  onSelectCutaway,
  onSelectSegment,
}: SuggestionsListProps) {
  return (
    <div className="space-y-5">
      {suggestions.map((cutaway) => {
        const isSelected = selectedId === cutaway.id;
        const full = isSelected && selectedRecord?.id === cutaway.id ? selectedRecord : undefined;

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
              onPointerEnter={() => prefetchCutaway(cutaway.id)}
              onFocus={() => prefetchCutaway(cutaway.id)}
              className="block w-full p-5 text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-300"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-orange-300">
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
                  <Sparkles size={14} /> {pluralize(cutaway.segmentCount, 'segment')}
                </span>
                {cutaway.sightCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-violet-200">
                    <Lightbulb size={14} /> {pluralize(cutaway.sightCount, 'sight')}
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
                  <p className="mt-3 text-sm leading-6 text-zinc-400">
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

            {full && (
              <div className="border-t border-zinc-800 p-4">
                <h3 className="mb-3 text-sm font-semibold text-zinc-400">Timed segments</h3>
                <div className="space-y-2">
                  {full.segments.map((segment) => (
                    <SegmentRow
                      key={segment.id}
                      segment={segment}
                      active={activeSegmentId === segment.id}
                      previewTitle={previewSightBySegment.get(segment.id)?.title}
                      locked={!isOpenSlot(segment) && cutaway.sightCount > 0}
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
          <p className="font-mono text-xs text-zinc-400">{timing}</p>
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
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-400">
        {previewTitle
          ? 'Preview in this slot — not locked'
          : locked
            ? `${segment.onScreen} · lip locked`
            : segment.onScreen}
      </p>
    </button>
  );
}
