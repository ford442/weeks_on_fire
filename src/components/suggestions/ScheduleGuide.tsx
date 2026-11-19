import { Fragment } from 'react';

import { AdBreakRow, ScheduleRow, UnscheduledRow } from './ScheduleRow';

import type { FilteredGuide } from '../../lib/schedule';
import type { CutawaySuggestion } from '../../data/types';

interface ScheduleGuideProps {
  guide: FilteredGuide;
  /** Key of the slot on air at the tuned time, if it survived the filters. */
  onAirKey?: string;
  selectedId?: string;
  /** Scanlines on. The caller has already ruled out reduced motion. */
  crt: boolean;
  onSelect: (cutaway: CutawaySuggestion) => void;
}

/**
 * The rundown: each programming block in broadcast order, its slots timed, ad breaks between
 * programs, then whatever has no slot yet. Selecting a row opens its prompt board.
 */
export default function ScheduleGuide({
  guide,
  onAirKey,
  selectedId,
  crt,
  onSelect,
}: ScheduleGuideProps) {
  if (guide.cutawayCount === 0) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-10 text-center text-zinc-400">
        No suggestions match the current filters.
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${crt ? 'crt-screen' : ''}`}>
      {guide.blocks.map((block) => (
        <section key={block.id} aria-labelledby={`block-${block.id}`}>
          <header className="mb-3">
            <h2 id={`block-${block.id}`} className="text-xl font-semibold text-white">
              {block.title}
            </h2>
            <p className="mt-0.5 text-sm leading-6 text-zinc-400">
              <span className="font-semibold text-orange-300">{block.when}</span> · {block.about}
            </p>
          </header>
          <ol className="space-y-2">
            {block.slots.map((slot) => (
              <Fragment key={slot.key}>
                <ScheduleRow
                  slot={slot}
                  selected={selectedId === slot.cutaway.id}
                  onAir={onAirKey === slot.key}
                  onSelect={onSelect}
                />
                {slot.adBreak && <AdBreakRow sponsor={slot.adBreak} />}
              </Fragment>
            ))}
          </ol>
        </section>
      ))}

      {guide.unscheduled.length > 0 && (
        <section aria-labelledby="block-unscheduled">
          <header className="mb-3">
            <h2 id="block-unscheduled" className="text-xl font-semibold text-white">
              Unscheduled
            </h2>
            <p className="mt-0.5 text-sm leading-6 text-zinc-400">
              {guide.unscheduled.length} without a time slot yet. Add a slot in{' '}
              <code className="rounded bg-zinc-900 px-1 text-zinc-300">content/schedule.json</code>.
            </p>
          </header>
          <ul className="space-y-2">
            {guide.unscheduled.map((cutaway) => (
              <UnscheduledRow
                key={cutaway.id}
                cutaway={cutaway}
                selected={selectedId === cutaway.id}
                onSelect={onSelect}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
