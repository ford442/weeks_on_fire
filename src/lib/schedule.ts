import { DAY_MINUTES, broadcastOffset, formatClock, parseClock, toClock } from './clock';

import type {
  CutawaySummary,
  ProductionStatus,
  Schedule,
  ScheduleSponsor,
  SuggestionKind,
} from '../data/types';

/**
 * The EyeWash Station program guide: `content/schedule.json` (ids and times) resolved against the
 * cutaway catalog. Pure — no React, no DOM, no `Date.now()` — so "what is on" is a function of a
 * clock reading and nothing else, and the same function backs the UI and its tests.
 */

/** One timed airing in the broadcast day. */
export interface AiredSlot {
  /** Unique across the day, stable across renders: `<block id>@<HH:MM>`. */
  key: string;
  blockId: string;
  blockTitle: string;
  cutaway: CutawaySummary;
  /** Minutes since midnight. */
  at: number;
  /** `"2:00 AM"`. */
  atLabel: string;
  /** `"02:00"` — for `<time dateTime>`. */
  clock: string;
  rerun: boolean;
  /** Sponsor spot airing in the ad break after this slot. */
  adBreak?: ScheduleSponsor;
  /** Position in the broadcast day, 0-based. */
  index: number;
}

export interface GuideBlock {
  id: string;
  title: string;
  when: string;
  about: string;
  slots: AiredSlot[];
}

export interface Guide {
  station: string;
  channel: string;
  blocks: GuideBlock[];
  /** Every slot in broadcast order (the blocks, flattened). */
  slots: AiredSlot[];
  /** Cutaways with no slot, in catalog order. */
  unscheduled: CutawaySummary[];
}

export function buildGuide(schedule: Schedule, cutaways: readonly CutawaySummary[]): Guide {
  const byId = new Map(cutaways.map((cutaway) => [cutaway.id, cutaway]));
  const sponsors = new Map(schedule.sponsors.map((sponsor) => [sponsor.id, sponsor]));
  const slots: AiredSlot[] = [];

  const blocks = schedule.blocks.map<GuideBlock>((block) => ({
    id: block.id,
    title: block.title,
    when: block.when,
    about: block.about,
    slots: block.slots.flatMap<AiredSlot>((slot) => {
      const cutaway = byId.get(slot.cutawayId);
      const at = parseClock(slot.at);
      // Codegen rejects both; skipping keeps a stale bundle from crashing the page.
      if (!cutaway || at === undefined) return [];
      const aired: AiredSlot = {
        key: `${block.id}@${slot.at}`,
        blockId: block.id,
        blockTitle: block.title,
        cutaway,
        at,
        atLabel: formatClock(at),
        clock: toClock(at),
        rerun: slot.rerun === true,
        adBreak: slot.adBreak ? sponsors.get(slot.adBreak) : undefined,
        index: slots.length,
      };
      slots.push(aired);
      return [aired];
    }),
  }));

  const scheduled = new Set(slots.map((slot) => slot.cutaway.id));
  return {
    station: schedule.station,
    channel: schedule.channel,
    blocks,
    slots,
    unscheduled: cutaways.filter((cutaway) => !scheduled.has(cutaway.id)),
  };
}

/**
 * The slot on air at `minutes` past midnight. The day loops: before the first slot of the
 * broadcast day, the last slot of the previous one is still running. `undefined` only for an
 * empty rundown.
 */
export function slotOnAir(slots: readonly AiredSlot[], minutes: number): AiredSlot | undefined {
  const first = slots[0];
  if (!first) return undefined;
  const now = broadcastOffset(minutes, first.at);
  let onAir = first;
  for (const slot of slots) {
    if (broadcastOffset(slot.at, first.at) <= now) onAir = slot;
    else break;
  }
  return onAir;
}

/** The slot after `slot`, wrapping from the end of the day to the start. */
export function slotAfter(slots: readonly AiredSlot[], slot: AiredSlot): AiredSlot | undefined {
  return slots[(slot.index + 1) % slots.length];
}

/** What the viewer's clock says: a real reading, or a time pinned with `?at=HH:MM`. */
export interface TunedClock {
  minutes: number;
  pinned: boolean;
}

/** A valid `?at=` pins the guide to that time; anything else follows the real clock. */
export function tuneClock(at: string | null | undefined, nowMinutes: number): TunedClock {
  const pinned = parseClock(at);
  return pinned === undefined
    ? { minutes: ((nowMinutes % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES, pinned: false }
    : { minutes: pinned, pinned: true };
}

// --- Badges --------------------------------------------------------------------------------

export type SlotBadge = 'ident' | 'sponsor' | 'rerun';

/** Station idents are tagged `ident` in the cutaway (`ideas/eyewash-idents.md`). */
export function isIdent(cutaway: Pick<CutawaySummary, 'tags'>): boolean {
  return cutaway.tags.includes('ident');
}

/** Sponsor cutaways (the ice-water spot) are tagged `sponsor`. */
export function isSponsorSpot(cutaway: Pick<CutawaySummary, 'tags'>): boolean {
  return cutaway.tags.includes('sponsor');
}

export function cutawayBadges(cutaway: Pick<CutawaySummary, 'tags'>, rerun = false): SlotBadge[] {
  const badges: SlotBadge[] = [];
  if (isIdent(cutaway)) badges.push('ident');
  if (isSponsorSpot(cutaway)) badges.push('sponsor');
  if (rerun) badges.push('rerun');
  return badges;
}

// --- Filters -------------------------------------------------------------------------------

/** The "no filter" value the Suggestions URL params and dropdowns already use. */
export const ALL = 'All';

export interface SuggestionFilters {
  kind: typeof ALL | SuggestionKind;
  status: typeof ALL | ProductionStatus;
  query: string;
}

export function hasActiveFilters(filters: SuggestionFilters): boolean {
  return filters.kind !== ALL || filters.status !== ALL || filters.query.trim().length > 0;
}

function searchText(cutaway: CutawaySummary): string {
  return [
    cutaway.title,
    cutaway.summary,
    cutaway.episode,
    cutaway.songTitle,
    cutaway.visualArc,
    cutaway.tags.join(' '),
  ]
    .join(' ')
    .toLowerCase();
}

function sponsorText(sponsor: ScheduleSponsor | undefined): string {
  return sponsor ? [sponsor.name, sponsor.tagline, sponsor.smallPrint ?? ''].join(' ') : '';
}

/** The kind / status / text filters of the Suggestions list, for one cutaway. */
export function matchesFilters(cutaway: CutawaySummary, filters: SuggestionFilters): boolean {
  if (filters.kind !== ALL && cutaway.kind !== filters.kind) return false;
  if (filters.status !== ALL && cutaway.status !== filters.status) return false;
  const query = filters.query.trim().toLowerCase();
  return query.length === 0 || searchText(cutaway).includes(query);
}

/**
 * Same filters on a slot. A sponsor spot rides with the slot it follows, so searching a sponsor's
 * name finds the slot that carries its ad break.
 */
export function slotMatchesFilters(slot: AiredSlot, filters: SuggestionFilters): boolean {
  if (matchesFilters(slot.cutaway, filters)) return true;
  const query = filters.query.trim().toLowerCase();
  if (query.length === 0 || !slot.adBreak) return false;
  const sameKindAndStatus = matchesFilters(slot.cutaway, { ...filters, query: '' });
  return sameKindAndStatus && sponsorText(slot.adBreak).toLowerCase().includes(query);
}

export interface FilteredGuide {
  /** Blocks that still have a visible slot, with only those slots. */
  blocks: GuideBlock[];
  unscheduled: CutawaySummary[];
  /** Distinct cutaways left after filtering (a rerun is the same cutaway, not another one). */
  cutawayCount: number;
}

export function filterGuide(guide: Guide, filters: SuggestionFilters): FilteredGuide {
  const blocks = hasActiveFilters(filters)
    ? guide.blocks
        .map((block) => ({
          ...block,
          slots: block.slots.filter((slot) => slotMatchesFilters(slot, filters)),
        }))
        .filter((block) => block.slots.length > 0)
    : guide.blocks;
  const unscheduled = hasActiveFilters(filters)
    ? guide.unscheduled.filter((cutaway) => matchesFilters(cutaway, filters))
    : guide.unscheduled;

  const ids = new Set(blocks.flatMap((block) => block.slots.map((slot) => slot.cutaway.id)));
  for (const cutaway of unscheduled) ids.add(cutaway.id);
  return { blocks, unscheduled, cutawayCount: ids.size };
}
