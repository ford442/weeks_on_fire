import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Lightbulb, MessageSquare, Sparkles } from 'lucide-react';

import {
  cutawaySuggestions,
  type CutawaySuggestion,
  type SuggestionKind,
} from '../data/suggestions';
import { schedule } from '../data/schedule';
import { crewPath, suggestionPath } from '../routes/paths';
import { rememberViewLocation } from '../routes/viewSearch';
import { getDialogVersionsForScene } from '../data/sceneDialogVersions';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';
import { useNowMinutes } from '../hooks/useNowMinutes';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { useStoredFlag } from '../hooks/useStoredFlag';
import { useUrlParam } from '../hooks/useUrlState';
import {
  ALL,
  buildGuide,
  filterGuide,
  matchesFilters,
  slotAfter,
  slotOnAir,
  tuneClock,
  type SuggestionFilters,
} from '../lib/schedule';
import { countByStatus, PRODUCTION_STATUSES, type ProductionStatus } from '../lib/status';

import CutawayBoard from './suggestions/CutawayBoard';
import WorkspaceLayout from './WorkspaceLayout';
import DialogAudition from './suggestions/DialogAudition';
import ScheduleGuide from './suggestions/ScheduleGuide';
import StationBar, { type SuggestionsView } from './suggestions/StationBar';
import SuggestionsFilters from './suggestions/SuggestionsFilters';
import SuggestionsList from './suggestions/SuggestionsList';
import { useSightPreviews } from './suggestions/useSightPreviews';

const kindCounts = cutawaySuggestions.reduce<Record<SuggestionKind, number>>(
  (counts, cutaway) => {
    counts[cutaway.kind] += 1;
    return counts;
  },
  { musical: 0, gag: 0, scene: 0 },
);

const statusCounts = countByStatus(cutawaySuggestions);

/** The rundown resolved against the catalog once; filters and the clock only choose from it. */
const guide = buildGuide(schedule, cutawaySuggestions);

/**
 * Suggestions route, presented as the EyeWash Station program guide. Owns selection, filters,
 * the tuned time and clipboard state; the panes live in `./suggestions/`.
 *
 * - **Schedule** (default): timed slots, what is on now, ad breaks, then unscheduled cutaways.
 * - **List**: the flat cards, for working through everything in catalog order.
 * - Kind / status / search filters apply to both and live in the URL (`?kind=`, `?status=`, `?q=`).
 * - `/suggestions/:id` opens that cutaway's board; `?at=HH:MM` pins the guide to a time of day.
 */
export default function Suggestions() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { search } = useLocation();
  const [kind, setKind] = useUrlParam<typeof ALL | SuggestionKind>('kind', ALL, [
    ALL,
    'musical',
    'gag',
    'scene',
  ]);
  const [query, setQuery] = useUrlParam('q', '');
  const [status, setStatus] = useUrlParam<typeof ALL | ProductionStatus>('status', ALL, [
    ALL,
    ...PRODUCTION_STATUSES,
  ]);
  const [view, setView] = useUrlParam<SuggestionsView>('view', 'schedule', ['schedule', 'list']);
  const [at, setAt] = useUrlParam('at', '');

  const nowMinutes = useNowMinutes();
  const tuned = tuneClock(at, nowMinutes);
  const onAir = slotOnAir(guide.slots, tuned.minutes);
  const next = onAir ? slotAfter(guide.slots, onAir) : undefined;

  const reducedMotion = usePrefersReducedMotion();
  const [crtPreference, setCrtPreference] = useStoredFlag('wof:suggestions-crt');
  const crt = crtPreference && !reducedMotion;

  // A deep link opens its own board; otherwise the schedule opens on what is on air.
  const [initial] = useState(
    () =>
      cutawaySuggestions.find((cutaway) => cutaway.id === id) ??
      (view === 'schedule' ? onAir?.cutaway : undefined) ??
      cutawaySuggestions[0],
  );
  const [sheetOpen, setSheetOpen] = useState(() =>
    cutawaySuggestions.some((cutaway) => cutaway.id === id),
  );
  const [selectedId, setSelectedId] = useState(initial?.id ?? '');
  const [activeSegmentId, setActiveSegmentId] = useState(initial?.segments[0]?.id ?? '');
  const { copiedKey, copy: copyToClipboard } = useCopyToClipboard();
  const [workspaceTab, setWorkspaceTab] = useState<'prompts' | 'dialog'>('prompts');
  const [expandedExchangeId, setExpandedExchangeId] = useState<string | null>(null);

  const filters = useMemo<SuggestionFilters>(
    () => ({ kind, status, query }),
    [kind, status, query],
  );

  const filtered = useMemo(
    () => cutawaySuggestions.filter((cutaway) => matchesFilters(cutaway, filters)),
    [filters],
  );
  const filteredGuide = useMemo(() => filterGuide(guide, filters), [filters]);
  const shown = view === 'schedule' ? filteredGuide.cutawayCount : filtered.length;
  const onAirVisible = useMemo(
    () =>
      onAir !== undefined &&
      filteredGuide.blocks.some((block) => block.slots.some((slot) => slot.key === onAir.key)),
    [filteredGuide, onAir],
  );

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
      void navigate(crewPath('/suggestions'), { replace: true });
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

  const selectCutaway = (cutaway: CutawaySuggestion) => {
    setSelectedId(cutaway.id);
    setActiveSegmentId(cutaway.segments[0]?.id ?? '');
    setWorkspaceTab('prompts');
    setExpandedExchangeId(null);
    setSheetOpen(true);
    if (id !== cutaway.id) {
      void navigate({ pathname: suggestionPath(cutaway.id), search });
    }
  };

  const closeSheet = () => {
    setSheetOpen(false);
    // Closing the board means "done with it": the Suggestions tab should reopen the guide, not
    // pop the same board back up over it on a phone.
    rememberViewLocation('suggestions', crewPath('/suggestions'), search);
  };

  const jumpToOnAir = useCallback(() => {
    if (!onAir) return;
    const row = document.getElementById(`slot-${onAir.key}`);
    if (!row) return;
    row.scrollIntoView({ block: 'center', behavior: reducedMotion ? 'auto' : 'smooth' });
    row.querySelector('button')?.focus({ preventScroll: true });
  }, [onAir, reducedMotion]);

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
    <WorkspaceLayout
      storageKey="wof:suggestions-panel-width"
      sheetOpen={sheetOpen}
      onSheetClose={closeSheet}
      label={
        <>
          {workspaceTab === 'dialog' ? <MessageSquare size={17} /> : <Lightbulb size={17} />}
          {workspaceTab === 'dialog' ? 'Dialog versions' : 'Prompt workspace'}
        </>
      }
      list={
        <div className="space-y-5">
          <StationBar
            station={guide.station}
            channel={guide.channel}
            view={view}
            onView={setView}
            guide={
              view === 'schedule'
                ? {
                    onAir,
                    next,
                    tuned,
                    onTune: setAt,
                    onLive: () => setAt(''),
                    canJump: onAirVisible,
                    onJump: jumpToOnAir,
                    onOpen: selectCutaway,
                    crt,
                    crtDisabled: reducedMotion,
                    onCrt: setCrtPreference,
                  }
                : undefined
            }
          />
          <SuggestionsFilters
            shown={shown}
            total={cutawaySuggestions.length}
            kindCounts={kindCounts}
            kind={kind}
            status={status}
            statusCounts={statusCounts}
            query={query}
            onKind={setKind}
            onStatus={setStatus}
            onQuery={setQuery}
          />
          {view === 'schedule' ? (
            <ScheduleGuide
              guide={filteredGuide}
              onAirKey={onAir?.key}
              selectedId={selected?.id}
              crt={crt}
              onSelect={selectCutaway}
            />
          ) : (
            <SuggestionsList
              suggestions={filtered}
              selectedId={selected?.id}
              activeSegmentId={activeSegment?.id}
              previewSightBySegment={sights.previewSightBySegment}
              onSelectCutaway={selectCutaway}
              onSelectSegment={(cutaway, segmentId) => {
                selectCutaway(cutaway);
                setActiveSegmentId(segmentId);
              }}
            />
          )}
        </div>
      }
      panel={
        <div>
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
      }
    />
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
      className={`inline-flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-orange-300 ${
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
