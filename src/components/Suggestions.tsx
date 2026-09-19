import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Lightbulb, MessageSquare, Sparkles } from 'lucide-react';
import {
  cutawaySuggestions,
  type CutawaySuggestion,
  type SuggestionKind,
} from '../data/suggestions';
import { getDialogVersionsForScene } from '../data/sceneDialogVersions';
import CutawayBoard from './suggestions/CutawayBoard';
import DialogAudition from './suggestions/DialogAudition';
import SuggestionsList from './suggestions/SuggestionsList';
import { allValue } from './suggestions/sightSlots';
import { useSightPreviews } from './suggestions/useSightPreviews';

const kindCounts = cutawaySuggestions.reduce<Record<SuggestionKind, number>>(
  (counts, cutaway) => {
    counts[cutaway.kind] += 1;
    return counts;
  },
  { musical: 0, gag: 0, scene: 0 },
);

/** Suggestions route: owns selection, filters, and clipboard state; the panes live in `./suggestions/`. */
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

  const sights = useSightPreviews(selected, activeSegmentId, setActiveSegmentId);

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
      <SuggestionsList
        suggestions={filtered}
        totalCount={cutawaySuggestions.length}
        kindCounts={kindCounts}
        kind={kind}
        query={query}
        selectedId={selected?.id}
        activeSegmentId={activeSegment?.id}
        previewSightBySegment={sights.previewSightBySegment}
        onKind={setKind}
        onQuery={setQuery}
        onSelectCutaway={selectCutaway}
        onSelectSegment={(cutaway, segmentId) => {
          selectCutaway(cutaway);
          setActiveSegmentId(segmentId);
        }}
      />

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
          <DialogAudition
            dialogSet={dialogVersions}
            expandedExchangeId={expandedExchangeId}
            copiedKey={copiedKey}
            onToggleExchange={(exchangeId) =>
              setExpandedExchangeId((prev) => (prev === exchangeId ? null : exchangeId))
            }
            onCopy={copyToClipboard}
          />
        ) : selected && activeSegment ? (
          <CutawayBoard
            cutaway={selected}
            segment={activeSegment}
            previewSight={sights.previewSightBySegment.get(activeSegment.id)}
            copiedKey={copiedKey}
            sights={sights.filteredSights}
            hasSightBank={sights.sightBank.length > 0}
            sightCategories={sights.sightCategories}
            sightCategory={sights.sightCategory}
            activeSightId={sights.previewBySegment[activeSegment.id]}
            slotLettersBySight={sights.slotLettersBySight}
            onActiveSegmentChange={setActiveSegmentId}
            onCopy={copyToClipboard}
            onClearPreview={() => sights.clearPreview(activeSegment.id)}
            onSightCategory={sights.setSightCategory}
            onSelectSight={sights.assignSight}
          />
        ) : (
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5 text-sm text-zinc-400">
            Select a suggestion to copy prompts.
          </div>
        )}
      </div>
    </section>
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
