import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Check,
  Copy,
  Lightbulb,
  MessageSquare,
  Music2,
  Search,
  Sparkles,
  Timer,
  X,
} from 'lucide-react';
import {
  cutawaySuggestions,
  type CutawaySegment,
  type CutawaySuggestion,
  type SightCandidate,
  type SuggestionKind,
} from '../data/suggestions';
import {
  formatExchangeAsScreenplay,
  getDialogVersionsForScene,
  type DialogExchange,
} from '../data/sceneDialogVersions';

const allValue = 'All';
const sightToken = '[SIGHT]';
const previewStoragePrefix = 'weeks-on-fire:sight-previews:';

const kindLabel: Record<SuggestionKind, string> = {
  musical: 'Musical',
  gag: 'Gags',
  scene: 'Scenes',
};

function applySightToPrompt(template: string, prompt: string): string {
  return template.replaceAll(sightToken, prompt);
}

function isOpenSlot(segment: CutawaySegment): boolean {
  return segment.grokImaginePrompt.includes(sightToken);
}

function openSlots(segments: CutawaySegment[]): CutawaySegment[] {
  return segments.filter(isOpenSlot);
}

function endingSlot(segments: CutawaySegment[]): CutawaySegment | undefined {
  const open = openSlots(segments);
  return open[open.length - 1];
}

function fallSlots(segments: CutawaySegment[]): CutawaySegment[] {
  const open = openSlots(segments);
  return open.slice(0, Math.max(0, open.length - 1));
}

function slotLane(
  segment: CutawaySegment,
  segments: CutawaySegment[],
): 'locked' | 'fall' | 'ending' {
  if (!isOpenSlot(segment)) {
    return 'locked';
  }
  return endingSlot(segments)?.id === segment.id ? 'ending' : 'fall';
}

function segmentLetter(segment: CutawaySegment): string {
  const letter = segment.label.split('—')[0]?.trim();
  return letter || segment.label;
}

function loadPreviews(cutawayId: string): Record<string, string> {
  try {
    const raw = window.localStorage.getItem(`${previewStoragePrefix}${cutawayId}`);
    if (!raw) {
      return {};
    }
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    const next: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'string') {
        next[key] = value;
      }
    }
    return next;
  } catch {
    return {};
  }
}

function savePreviews(cutawayId: string, map: Record<string, string>) {
  try {
    window.localStorage.setItem(`${previewStoragePrefix}${cutawayId}`, JSON.stringify(map));
  } catch {
    // private mode / quota
  }
}

export default function Suggestions() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [kind, setKind] = useState<typeof allValue | SuggestionKind>(allValue);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(
    id && cutawaySuggestions.some((cutaway) => cutaway.id === id)
      ? id
      : (cutawaySuggestions[0]?.id ?? ''),
  );
  const [activeSegmentId, setActiveSegmentId] = useState(
    cutawaySuggestions.find((cutaway) => cutaway.id === id)?.segments[0]?.id ??
      cutawaySuggestions[0]?.segments[0]?.id ??
      '',
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [workspaceTab, setWorkspaceTab] = useState<'prompts' | 'dialog'>('prompts');
  const [expandedExchangeId, setExpandedExchangeId] = useState<string | null>(null);
  const [previewBySegment, setPreviewBySegment] = useState<Record<string, string>>({});
  const [sightCategory, setSightCategory] = useState(allValue);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return cutawaySuggestions.filter((cutaway) => {
      const matchesKind = kind === allValue || cutaway.kind === kind;
      const matchesSearch =
        normalizedQuery.length === 0 ||
        [
          cutaway.title,
          cutaway.summary,
          cutaway.episode,
          cutaway.songTitle,
          cutaway.visualArc,
          cutaway.tags.join(' '),
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesKind && matchesSearch;
    });
  }, [kind, query]);

  const selected = useMemo(() => {
    const fromCatalog = cutawaySuggestions.find((cutaway) => cutaway.id === selectedId);
    return filtered.find((cutaway) => cutaway.id === selectedId) ?? fromCatalog ?? filtered[0];
  }, [filtered, selectedId]);

  const activeSegment = useMemo(
    () =>
      selected?.segments.find((segment) => segment.id === activeSegmentId) ?? selected?.segments[0],
    [activeSegmentId, selected],
  );

  useEffect(() => {
    if (id) {
      const match = cutawaySuggestions.find((cutaway) => cutaway.id === id);
      if (match) {
        setSelectedId(match.id);
        return;
      }
      navigate('/suggestions', { replace: true });
      return;
    }

    if (cutawaySuggestions[0] && !selectedId) {
      setSelectedId(cutawaySuggestions[0].id);
    }
  }, [id, navigate, selectedId]);

  useEffect(() => {
    if (!selected) {
      return;
    }
    if (selected.id !== selectedId) {
      setSelectedId(selected.id);
    }
    const segmentIds = new Set(selected.segments.map((segment) => segment.id));
    if (!segmentIds.has(activeSegmentId)) {
      setActiveSegmentId(selected.segments[0]?.id ?? '');
    }
  }, [activeSegmentId, selected, selectedId]);

  useEffect(() => {
    if (!selected?.id) {
      setPreviewBySegment({});
      return;
    }
    setPreviewBySegment(loadPreviews(selected.id));
    setSightCategory(allValue);
  }, [selected?.id]);

  const sightBank = useMemo(() => selected?.sightBank ?? [], [selected]);

  const sightCategories = useMemo(() => {
    const seen: string[] = [];
    for (const sight of sightBank) {
      if (!seen.includes(sight.category)) {
        seen.push(sight.category);
      }
    }
    return seen;
  }, [sightBank]);

  const filteredSights = useMemo(() => {
    if (sightCategory === allValue) {
      return sightBank;
    }
    return sightBank.filter((sight) => sight.category === sightCategory);
  }, [sightBank, sightCategory]);

  const previewSightBySegment = useMemo(() => {
    const map = new Map<string, SightCandidate>();
    if (!selected?.sightBank) {
      return map;
    }
    for (const [segmentId, sightId] of Object.entries(previewBySegment)) {
      const sight = selected.sightBank.find((candidate) => candidate.id === sightId);
      if (sight) {
        map.set(segmentId, sight);
      }
    }
    return map;
  }, [previewBySegment, selected]);

  const slotLettersBySight = useMemo(() => {
    const map = new Map<string, string[]>();
    if (!selected) {
      return map;
    }
    for (const [segmentId, sightId] of Object.entries(previewBySegment)) {
      const segment = selected.segments.find((entry) => entry.id === segmentId);
      if (!segment) {
        continue;
      }
      const letters = map.get(sightId) ?? [];
      letters.push(segmentLetter(segment));
      map.set(sightId, letters);
    }
    return map;
  }, [previewBySegment, selected]);

  const persistPreviews = (cutawayId: string, next: Record<string, string>) => {
    setPreviewBySegment(next);
    savePreviews(cutawayId, next);
  };

  const assignSight = (sight: SightCandidate) => {
    if (!selected) {
      return;
    }
    const active = selected.segments.find((segment) => segment.id === activeSegmentId);
    const activeKind = active ? slotLane(active, selected.segments) : 'locked';
    let targetId = activeSegmentId;

    if (sight.lane === 'ending') {
      targetId = endingSlot(selected.segments)?.id ?? targetId;
    } else if (activeKind !== 'fall') {
      targetId = fallSlots(selected.segments)[0]?.id ?? targetId;
    }

    const target = selected.segments.find((segment) => segment.id === targetId);
    if (!target || !isOpenSlot(target)) {
      return;
    }
    if (slotLane(target, selected.segments) !== sight.lane) {
      return;
    }

    setActiveSegmentId(target.id);
    const next = { ...previewBySegment };
    if (next[target.id] === sight.id) {
      delete next[target.id];
    } else {
      next[target.id] = sight.id;
    }
    persistPreviews(selected.id, next);
  };

  const clearPreview = (segmentId: string) => {
    if (!selected) {
      return;
    }
    const next = { ...previewBySegment };
    delete next[segmentId];
    persistPreviews(selected.id, next);
  };

  const counts = useMemo(() => {
    const next = { musical: 0, gag: 0, scene: 0 };
    for (const cutaway of cutawaySuggestions) {
      next[cutaway.kind] += 1;
    }
    return next;
  }, []);

  const copyToClipboard = async (text: string, label: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 1600);
    } catch {
      window.prompt(`Copy ${label}`, text);
    }
  };

  const selectCutaway = (cutaway: CutawaySuggestion) => {
    setSelectedId(cutaway.id);
    setActiveSegmentId(cutaway.segments[0]?.id ?? '');
    setWorkspaceTab('prompts');
    setExpandedExchangeId(null);
    if (id !== cutaway.id) {
      navigate(`/suggestions/${cutaway.id}`);
    }
  };

  const dialogVersions = useMemo(
    () => (selected?.kind === 'scene' ? getDialogVersionsForScene(selected.id) : undefined),
    [selected],
  );

  useEffect(() => {
    if (!dialogVersions && workspaceTab === 'dialog') {
      setWorkspaceTab('prompts');
    }
  }, [dialogVersions, workspaceTab]);

  return (
    <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8">
      <div className="space-y-5">
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-zinc-400">
              {filtered.length} of {cutawaySuggestions.length} suggestions
            </p>
            <div className="flex flex-wrap gap-2">
              <KindChip
                active={kind === allValue}
                label={`All (${cutawaySuggestions.length})`}
                onClick={() => setKind(allValue)}
              />
              <KindChip
                active={kind === 'musical'}
                label={`Musical (${counts.musical})`}
                onClick={() => setKind('musical')}
              />
              <KindChip
                active={kind === 'gag'}
                label={`Gags (${counts.gag})`}
                onClick={() => setKind('gag')}
              />
              <KindChip
                active={kind === 'scene'}
                label={`Scenes (${counts.scene})`}
                onClick={() => setKind('scene')}
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
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search titles, songs, tags..."
              className="h-11 w-full rounded-md border border-zinc-800 bg-black/70 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/30"
            />
          </label>
        </div>

        {filtered.map((cutaway) => {
          const isSelected = selected?.id === cutaway.id;

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
                onClick={() => selectCutaway(cutaway)}
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
                        active={activeSegment?.id === segment.id}
                        previewTitle={previewSightBySegment.get(segment.id)?.title}
                        locked={!isOpenSlot(segment) && Boolean(cutaway.sightBank?.length)}
                        onSelect={() => {
                          selectCutaway(cutaway);
                          setActiveSegmentId(segment.id);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </article>
          );
        })}

        {filtered.length === 0 && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-10 text-center text-zinc-400">
            No suggestions match the current filters.
          </div>
        )}
      </div>

      <div className="lg:sticky lg:top-20 lg:self-start">
        {dialogVersions && (
          <div className="mb-3 flex gap-2">
            <WorkspaceTabButton
              active={workspaceTab === 'prompts'}
              label="Prompts"
              icon={<Sparkles size={15} />}
              onClick={() => setWorkspaceTab('prompts')}
            />
            <WorkspaceTabButton
              active={workspaceTab === 'dialog'}
              label={`Dialog (${dialogVersions.exchanges.length})`}
              icon={<MessageSquare size={15} />}
              onClick={() => setWorkspaceTab('dialog')}
            />
          </div>
        )}
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-400">
          {workspaceTab === 'dialog' ? <MessageSquare size={17} /> : <Lightbulb size={17} />}
          {workspaceTab === 'dialog' ? 'Dialog Versions' : 'Prompt Workspace'}
        </div>
        {selected && workspaceTab === 'dialog' && dialogVersions ? (
          <DialogVersionsPanel
            dialogSet={dialogVersions}
            expandedExchangeId={expandedExchangeId}
            copiedKey={copiedKey}
            onToggleExchange={(id) => setExpandedExchangeId((prev) => (prev === id ? null : id))}
            onCopy={copyToClipboard}
          />
        ) : selected && activeSegment ? (
          <div className="space-y-5">
            <SegmentDetail
              cutaway={selected}
              segment={activeSegment}
              previewSight={previewSightBySegment.get(activeSegment.id)}
              copiedKey={copiedKey}
              onCopy={copyToClipboard}
              onClearPreview={() => clearPreview(activeSegment.id)}
            />
            {sightBank.length > 0 && (
              <SightBankPanel
                sights={filteredSights}
                categories={sightCategories}
                activeCategory={sightCategory}
                activeSightId={previewBySegment[activeSegment.id]}
                slotLettersBySight={slotLettersBySight}
                onCategory={setSightCategory}
                onSelectSight={assignSight}
              />
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5 text-sm text-zinc-400">
            Select a suggestion to copy prompts.
          </div>
        )}
      </div>
    </section>
  );
}

function SightBankPanel({
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

interface SegmentDetailProps {
  cutaway: CutawaySuggestion;
  segment: CutawaySegment;
  previewSight?: SightCandidate;
  copiedKey: string | null;
  onCopy: (text: string, label: string, key: string) => void;
  onClearPreview?: () => void;
}

function SegmentDetail({
  cutaway,
  segment,
  previewSight,
  copiedKey,
  onCopy,
  onClearPreview,
}: SegmentDetailProps) {
  const grokPrompt = previewSight
    ? applySightToPrompt(segment.grokImaginePrompt, previewSight.prompt)
    : segment.grokImaginePrompt;
  const geminiPrompt = previewSight
    ? applySightToPrompt(segment.geminiOmniPrompt, previewSight.prompt)
    : segment.geminiOmniPrompt;
  const variations = previewSight
    ? segment.promptVariations.map((variation) =>
        applySightToPrompt(variation, previewSight.prompt),
      )
    : segment.promptVariations;

  return (
    <aside className="flex min-h-0 flex-col gap-5 rounded-lg border border-zinc-800 bg-zinc-950/95 p-5 shadow-2xl shadow-black/30">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-300">
          {cutaway.title}
        </p>
        <h2 className="mt-2 text-xl font-semibold leading-tight text-white">
          {previewSight ? `${segment.label} · ${previewSight.title}` : segment.label}
        </h2>
        <p className="mt-2 font-mono text-xs text-zinc-500">
          {segment.durationSec === 0
            ? 'Still'
            : `${segment.start} → ${segment.end} (${segment.durationSec}s)`}
        </p>
        <p className="mt-3 text-sm leading-6 text-zinc-300">
          {previewSight ? previewSight.description : segment.onScreen}
        </p>
      </div>

      {previewSight && (
        <div className="flex items-start justify-between gap-3 rounded-md border border-violet-500/30 bg-violet-500/10 px-3 py-2">
          <p className="text-sm leading-6 text-violet-100">
            Preview: {previewSight.title}
            {previewSight.lane === 'ending' ? ' · H only' : ''}
          </p>
          {onClearPreview && (
            <button
              type="button"
              onClick={onClearPreview}
              className="inline-flex shrink-0 items-center gap-1 rounded-md border border-violet-500/40 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-violet-100 transition hover:border-violet-300 focus:outline-none focus:ring-2 focus:ring-orange-300"
            >
              <X size={12} />
              Clear
            </button>
          )}
        </div>
      )}

      {segment.stillUrl && (
        <img
          src={segment.stillUrl}
          alt={segment.label}
          className="w-full rounded-md border border-zinc-800 object-cover"
        />
      )}

      {segment.lyrics ? (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
            Lyrics / Cue
          </h3>
          <pre className="max-h-36 overflow-auto rounded-md border border-zinc-800 bg-black/80 p-3 text-sm leading-6 text-zinc-200 whitespace-pre-wrap">
            {segment.lyrics}
          </pre>
          <p className="mt-2 text-xs leading-5 text-zinc-500">{segment.musicCue}</p>
        </section>
      ) : (
        <p className="text-xs leading-5 text-zinc-500">{segment.musicCue}</p>
      )}

      <PromptBlock
        title="Grok Imagine Prompt"
        text={grokPrompt}
        copied={copiedKey === `${segment.id}:grok`}
        onCopy={() => onCopy(grokPrompt, 'Grok Imagine prompt', `${segment.id}:grok`)}
      />

      <PromptBlock
        title="Gemini Omni Prompt"
        text={geminiPrompt}
        copied={copiedKey === `${segment.id}:gemini`}
        onCopy={() => onCopy(geminiPrompt, 'Gemini Omni prompt', `${segment.id}:gemini`)}
      />

      {variations.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
            Variations
          </h3>
          <div className="space-y-3">
            {variations.map((variation, index) => (
              <div
                key={`${segment.id}:variation:${index}`}
                className="rounded-md border border-zinc-800 bg-zinc-900/70 p-3"
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-zinc-500">Variation {index + 1}</span>
                  <CopyButton
                    copied={copiedKey === `${segment.id}:variation:${index}`}
                    label="Copy"
                    onClick={() =>
                      onCopy(
                        variation,
                        `Variation ${index + 1}`,
                        `${segment.id}:variation:${index}`,
                      )
                    }
                  />
                </div>
                <p className="text-sm leading-6 text-zinc-300">{variation}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </aside>
  );
}

interface PromptBlockProps {
  title: string;
  text: string;
  copied: boolean;
  onCopy: () => void;
}

function PromptBlock({ title, text, copied, onCopy }: PromptBlockProps) {
  return (
    <section className="min-h-0">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">{title}</h3>
        <CopyButton copied={copied} label="Copy" onClick={onCopy} />
      </div>
      <pre className="max-h-44 overflow-auto rounded-md border border-zinc-800 bg-black/80 p-4 text-sm leading-6 text-zinc-200 whitespace-pre-wrap">
        {text}
      </pre>
    </section>
  );
}

interface CopyButtonProps {
  copied: boolean;
  label: string;
  onClick: () => void;
}

function CopyButton({ copied, label, onClick }: CopyButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-zinc-700 px-2.5 py-1.5 text-xs font-semibold text-zinc-200 transition hover:border-orange-400 hover:text-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-300"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? 'Copied' : label}
    </button>
  );
}

function WorkspaceTabButton({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition focus:outline-none focus:ring-2 focus:ring-orange-300 ${
        active
          ? 'border-orange-500/60 bg-orange-500/15 text-orange-100'
          : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

interface DialogVersionsPanelProps {
  dialogSet: NonNullable<ReturnType<typeof getDialogVersionsForScene>>;
  expandedExchangeId: string | null;
  copiedKey: string | null;
  onToggleExchange: (id: string) => void;
  onCopy: (text: string, label: string, key: string) => void;
}

function DialogVersionsPanel({
  dialogSet,
  expandedExchangeId,
  copiedKey,
  onToggleExchange,
  onCopy,
}: DialogVersionsPanelProps) {
  return (
    <aside className="flex max-h-[calc(100vh-10rem)] min-h-0 flex-col gap-4 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950/95 p-5 shadow-2xl shadow-black/30">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-300">
          Rosencrantz register
        </p>
        <p className="mt-2 text-sm leading-6 text-zinc-300">{dialogSet.description}</p>
        <p className="mt-2 font-mono text-[11px] text-zinc-500">{dialogSet.sourceFile}</p>
      </div>

      <div className="-mx-1 flex-1 space-y-2 overflow-y-auto px-1">
        {dialogSet.exchanges.map((exchange) => (
          <DialogExchangeCard
            key={exchange.id}
            exchange={exchange}
            expanded={expandedExchangeId === exchange.id}
            copiedKey={copiedKey}
            onToggle={() => onToggleExchange(exchange.id)}
            onCopy={onCopy}
          />
        ))}
      </div>
    </aside>
  );
}

interface DialogExchangeCardProps {
  exchange: DialogExchange;
  expanded: boolean;
  copiedKey: string | null;
  onToggle: () => void;
  onCopy: (text: string, label: string, key: string) => void;
}

function DialogExchangeCard({
  exchange,
  expanded,
  copiedKey,
  onToggle,
  onCopy,
}: DialogExchangeCardProps) {
  const screenplay = formatExchangeAsScreenplay(exchange);
  const copyKey = `dialog:${exchange.id}`;

  return (
    <div className="rounded-md border border-zinc-800 bg-black/40">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-3 px-3 py-3 text-left transition hover:bg-zinc-900/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-300"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-orange-300">
              {exchange.id}
            </span>
            <DialogStatusBadge status={exchange.status} />
          </div>
          <p className="mt-1 text-sm font-semibold text-white">{exchange.title}</p>
          <p className="mt-1 text-xs text-zinc-500">{exchange.beat}</p>
          <p className="mt-1 text-xs text-zinc-400">{exchange.register}</p>
          <p className="mt-2 text-[11px] text-zinc-500">
            {exchange.characters.join(' · ')} · {exchange.lines.length} lines
          </p>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-zinc-800 px-3 py-3">
          <div className="mb-2 flex justify-end">
            <CopyButton
              copied={copiedKey === copyKey}
              label="Copy scene"
              onClick={() => onCopy(screenplay, exchange.title, copyKey)}
            />
          </div>
          <pre className="max-h-80 overflow-auto rounded-md border border-zinc-800 bg-zinc-950 p-3 text-sm leading-6 text-zinc-200 whitespace-pre-wrap">
            {exchange.lines.map((line) => (
              <span
                key={`${line.speaker}:${line.text.slice(0, 24)}`}
                className="block mb-3 last:mb-0"
              >
                <span className="font-semibold text-orange-200">{line.speaker}</span>
                {'\n'}
                {line.text}
              </span>
            ))}
          </pre>
        </div>
      )}
    </div>
  );
}

function DialogStatusBadge({ status }: { status: DialogExchange['status'] }) {
  const styles: Record<DialogExchange['status'], string> = {
    draft: 'border-zinc-700 bg-zinc-900 text-zinc-400',
    alt: 'border-blue-500/30 bg-blue-500/10 text-blue-200',
    active: 'border-green-500/30 bg-green-500/10 text-green-200',
    fragment: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
  };

  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${styles[status]}`}
    >
      {status}
    </span>
  );
}
