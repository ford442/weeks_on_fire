import { Link } from 'react-router-dom';
import { Timer } from 'lucide-react';

import { episodePath } from '../../routes/paths';
import { cutawayBadges, type AiredSlot, type SlotBadge } from '../../lib/schedule';
import StatusBadge from '../StatusBadge';
import { prefetchCutaway } from '../../data/suggestions';

import type { CutawaySummary, ScheduleSponsor, SuggestionKind } from '../../data/types';

const kindLabel: Record<SuggestionKind, string> = {
  musical: 'Musical',
  gag: 'Gag',
  scene: 'Scene',
};

const badgeMeta: Record<SlotBadge, { label: string; accent: string; hint: string }> = {
  ident: {
    label: 'Ident',
    accent: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200',
    hint: 'A station ident or bumper',
  },
  sponsor: {
    label: 'Sponsor',
    accent: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
    hint: 'A sponsor spot',
  },
  rerun: {
    label: 'Rerun',
    accent: 'border-zinc-500/50 bg-zinc-500/10 text-zinc-200',
    hint: 'A repeat of something that already aired today',
  },
};

/** Ident / Sponsor / Rerun pills. */
export function SlotBadges({ badges }: { badges: readonly SlotBadge[] }) {
  return badges.map((badge) => (
    <span
      key={badge}
      title={badgeMeta[badge].hint}
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${badgeMeta[badge].accent}`}
    >
      {badgeMeta[badge].label}
    </span>
  ));
}

export function OnAirPill() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
      <span
        aria-hidden="true"
        className="size-1.5 rounded-full bg-white motion-safe:animate-pulse"
      />
      On air
    </span>
  );
}

function rowTone(selected: boolean, onAir: boolean): string {
  if (selected) return 'border-orange-500/70 bg-zinc-950 ring-1 ring-orange-500/30';
  if (onAir) return 'border-red-500/50 bg-red-950/15 hover:border-red-400/70';
  return 'border-zinc-800 bg-zinc-950 hover:border-orange-500/50';
}

/** `03` → `Ep. 3`; a non-numeric episode id is shown as is. */
function episodeLabel(episodeId: string): string {
  const number = Number.parseInt(episodeId, 10);
  return Number.isNaN(number) ? episodeId : `Ep. ${number}`;
}

const stretched =
  'text-left focus:outline-none after:absolute after:inset-0 after:rounded-lg focus-visible:after:ring-2 focus-visible:after:ring-orange-300';

/**
 * Runtime, status and episode link under a row's title. The strip lets taps fall through to the
 * stretched title button (otherwise its empty part is a dead zone); only the episode link takes
 * them, lifted above the button with `relative z-10`.
 */
function RowMeta({ cutaway }: { cutaway: CutawaySummary }) {
  return (
    <div className="pointer-events-none mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
      <span className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-0.5">
        <Timer size={13} aria-hidden="true" /> {cutaway.runtime}
      </span>
      <StatusBadge status={cutaway.status} size="xs" />
      {cutaway.episodeId && (
        <Link
          to={episodePath(cutaway.episodeId)}
          className="pointer-events-auto relative z-10 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 font-semibold text-zinc-300 transition hover:border-orange-500/50 hover:text-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-300"
        >
          {episodeLabel(cutaway.episodeId)}
        </Link>
      )}
    </div>
  );
}

interface SelectProps {
  selected: boolean;
  onSelect: (cutaway: CutawaySummary) => void;
}

/** One timed slot in the guide. The whole row opens the board; the episode chip is its own link. */
export function ScheduleRow({
  slot,
  selected,
  onAir,
  onSelect,
}: SelectProps & { slot: AiredSlot; onAir: boolean }) {
  const { cutaway } = slot;
  return (
    <li
      id={`slot-${slot.key}`}
      data-on-air={onAir ? 'true' : undefined}
      className={`relative grid grid-cols-[4.75rem_minmax(0,1fr)] gap-x-3 rounded-lg border p-3 transition sm:grid-cols-[6rem_minmax(0,1fr)] sm:gap-x-4 sm:p-4 ${rowTone(selected, onAir)}`}
    >
      <div className="space-y-1.5">
        <time
          dateTime={slot.clock}
          className="block font-mono text-sm font-semibold tabular-nums text-orange-200"
        >
          {slot.atLabel}
        </time>
        {onAir && <OnAirPill />}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-orange-300">
            {kindLabel[cutaway.kind]}
          </span>
          <SlotBadges badges={cutawayBadges(cutaway, slot.rerun)} />
        </div>
        <h3 className="mt-1 text-lg font-semibold leading-snug text-white">
          <button
            type="button"
            aria-current={selected ? 'true' : undefined}
            onClick={() => onSelect(cutaway)}
            onPointerEnter={() => prefetchCutaway(cutaway.id)}
            onFocus={() => prefetchCutaway(cutaway.id)}
            className={stretched}
          >
            {cutaway.title}
          </button>
        </h3>
        <p className="mt-1 line-clamp-2 text-sm leading-6 text-zinc-300">{cutaway.summary}</p>
        <RowMeta cutaway={cutaway} />
      </div>
    </li>
  );
}

/** A fake-sponsor spot between programs. Not a cutaway, so there is nothing to open. */
export function AdBreakRow({ sponsor }: { sponsor: ScheduleSponsor }) {
  return (
    <li
      data-ad-break={sponsor.id}
      className="grid grid-cols-[4.75rem_minmax(0,1fr)] gap-x-3 px-3 py-1 sm:grid-cols-[6rem_minmax(0,1fr)] sm:gap-x-4 sm:px-4"
    >
      <span aria-hidden="true" />
      <div className="min-w-0 border-l-2 border-dashed border-amber-500/40 pl-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-300">
          Ad break · {sponsor.name}
        </p>
        <p className="mt-0.5 text-sm leading-6 text-zinc-300">{sponsor.tagline}</p>
        {sponsor.smallPrint && (
          <p className="text-xs leading-5 text-zinc-400">{sponsor.smallPrint}</p>
        )}
      </div>
    </li>
  );
}

/** A cutaway with no slot yet: same open-the-board behavior, no clock. */
export function UnscheduledRow({
  cutaway,
  selected,
  onSelect,
}: SelectProps & { cutaway: CutawaySummary }) {
  return (
    <li className={`relative rounded-lg border p-3 transition ${rowTone(selected, false)}`}>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-orange-300">
          {kindLabel[cutaway.kind]}
        </span>
        <SlotBadges badges={cutawayBadges(cutaway)} />
      </div>
      <h3 className="mt-1 text-base font-semibold leading-snug text-white">
        <button
          type="button"
          aria-current={selected ? 'true' : undefined}
          onClick={() => onSelect(cutaway)}
          onPointerEnter={() => prefetchCutaway(cutaway.id)}
          onFocus={() => prefetchCutaway(cutaway.id)}
          className={stretched}
        >
          {cutaway.title}
        </button>
      </h3>
      <p className="mt-1 line-clamp-1 text-sm text-zinc-400">{cutaway.summary}</p>
      <RowMeta cutaway={cutaway} />
    </li>
  );
}
