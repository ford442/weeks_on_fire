import { List, Tv } from 'lucide-react';

import { formatClock, toClock } from '../../lib/clock';
import { cutawayBadges, type AiredSlot, type TunedClock } from '../../lib/schedule';
import StatusBadge from '../StatusBadge';

import { OnAirPill, SlotBadges } from './ScheduleRow';

import type { CutawaySuggestion } from '../../data/types';

export type SuggestionsView = 'schedule' | 'list';

interface StationBarProps {
  station: string;
  channel: string;
  view: SuggestionsView;
  onView: (view: SuggestionsView) => void;
  /** Schedule view only. */
  guide?: {
    onAir?: AiredSlot;
    next?: AiredSlot;
    tuned: TunedClock;
    onTune: (clock: string) => void;
    onLive: () => void;
    /** The on-air row exists in the guide below (filters have not hidden it). */
    canJump: boolean;
    onJump: () => void;
    onOpen: (cutaway: CutawaySuggestion) => void;
    crt: boolean;
    /** CRT cannot be turned on (reduced motion). */
    crtDisabled: boolean;
    onCrt: (on: boolean) => void;
  };
}

const button =
  'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-orange-300';
const quiet = `${button} border-zinc-700 text-zinc-300 hover:border-orange-500/50 hover:text-orange-100`;

/**
 * The station card at the top of Suggestions: what channel this is, what is on now, a way to tune
 * to another time, the CRT switch, and the Schedule / List switch.
 */
export default function StationBar({ station, channel, view, onView, guide }: StationBarProps) {
  return (
    <section
      aria-label={`${station}, Channel ${channel}`}
      className={`rounded-xl border border-zinc-800 bg-[linear-gradient(135deg,#171717_0%,#0b0b0b_60%,#1b1010_100%)] p-4 ${
        guide?.crt ? 'crt-screen' : ''
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-300">
            Channel {channel}
          </p>
          <h2 className="text-2xl font-semibold leading-tight text-white">{station}</h2>
        </div>
        <div
          role="group"
          aria-label="View"
          className="inline-flex rounded-md border border-zinc-700 p-0.5"
        >
          <ViewButton active={view === 'schedule'} onClick={() => onView('schedule')}>
            <Tv size={15} aria-hidden="true" />
            Schedule
          </ViewButton>
          <ViewButton active={view === 'list'} onClick={() => onView('list')}>
            <List size={15} aria-hidden="true" />
            List
          </ViewButton>
        </div>
      </div>

      {guide && <ScheduleControls guide={guide} />}
    </section>
  );
}

function ViewButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-orange-300 ${
        active ? 'bg-orange-600 text-white' : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

function ScheduleControls({ guide }: { guide: NonNullable<StationBarProps['guide']> }) {
  const { onAir, next, tuned } = guide;

  return (
    <>
      {onAir && (
        <section
          aria-label="Now playing"
          className="mt-4 rounded-lg border border-red-500/40 bg-red-950/20 p-4"
        >
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="m-0">
              <OnAirPill />
              <span className="sr-only"> — Now playing</span>
            </h3>
            <span className="text-xs text-zinc-300">
              {tuned.pinned
                ? `Tuned to ${formatClock(tuned.minutes)}`
                : `${formatClock(tuned.minutes)} · your clock`}
            </span>
          </div>
          <p className="mt-2 text-xl font-semibold leading-snug text-white">
            {onAir.cutaway.title}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-zinc-400">
            <span>
              {onAir.blockTitle} · since {onAir.atLabel}
            </span>
            <SlotBadges badges={cutawayBadges(onAir.cutaway, onAir.rerun)} />
            <StatusBadge status={onAir.cutaway.status} size="xs" />
          </div>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-300">
            {onAir.cutaway.summary}
          </p>
          {next && next.key !== onAir.key && (
            <p className="mt-2 text-sm text-zinc-400">
              Up next: <time dateTime={next.clock}>{next.atLabel}</time> — {next.cutaway.title}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => guide.onOpen(onAir.cutaway)}
              className={`${button} border-orange-500/60 bg-orange-500/15 text-orange-100 hover:bg-orange-500/25`}
            >
              Open board
            </button>
            {guide.canJump && (
              <button type="button" onClick={guide.onJump} className={quiet}>
                Show in guide
              </button>
            )}
          </div>
        </section>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <span>Tune to</span>
            <input
              type="time"
              value={toClock(tuned.minutes)}
              onChange={(event) => {
                if (event.target.value) guide.onTune(event.target.value);
              }}
              className="h-9 rounded-md border border-zinc-700 bg-black/60 px-2 font-mono text-sm text-white outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/30"
            />
          </label>
          {tuned.pinned ? (
            <button type="button" onClick={guide.onLive} className={quiet}>
              Back to live
            </button>
          ) : (
            <span className="text-xs text-zinc-400">Following your clock</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-pressed={guide.crt}
            disabled={guide.crtDisabled}
            onClick={() => guide.onCrt(!guide.crt)}
            className={`${button} disabled:opacity-60 ${
              guide.crt
                ? 'border-orange-500/60 bg-orange-500/15 text-orange-100'
                : 'border-zinc-700 text-zinc-300 hover:border-orange-500/50 hover:text-orange-100'
            }`}
          >
            <Tv size={15} aria-hidden="true" />
            CRT {guide.crt ? 'on' : 'off'}
          </button>
          {guide.crtDisabled && (
            <span className="text-xs text-zinc-400">Unavailable: reduced motion is on.</span>
          )}
        </div>
      </div>
    </>
  );
}
