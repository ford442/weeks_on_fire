import { describe, expect, it } from 'vitest';

import { cutawaySuggestions } from '../data/suggestions';
import { schedule as committedSchedule } from '../data/generated/schedule';

import { parseClock } from './clock';
import {
  ALL,
  buildGuide,
  cutawayBadges,
  filterGuide,
  hasActiveFilters,
  matchesFilters,
  slotAfter,
  slotMatchesFilters,
  slotOnAir,
  tuneClock,
  type SuggestionFilters,
} from './schedule';

import type { CutawaySuggestion, Schedule } from '../data/types';

function cutaway(id: string, overrides: Partial<CutawaySuggestion> = {}): CutawaySuggestion {
  return {
    id,
    kind: 'scene',
    title: `Title ${id}`,
    status: 'ready-to-generate',
    runtime: '~10s',
    episode: 'EyeWash Station',
    songId: 'song',
    songTitle: 'Song',
    summary: `Summary ${id}`,
    visualArc: 'Arc',
    tags: [],
    segments: [],
    ...overrides,
  };
}

const catalog = [
  cutaway('a', { kind: 'musical', tags: ['ident'] }),
  cutaway('b', { kind: 'gag', status: 'generated' }),
  cutaway('c', { tags: ['sponsor'] }),
  cutaway('orphan', { summary: 'Never scheduled.' }),
];

// A day that starts at 06:00 and crosses midnight, like the real one.
const fixture: Schedule = {
  station: 'EyeWash Station',
  channel: '12½',
  sponsors: [
    { id: 'optics', name: 'Perpetual Optics', tagline: 'Keep looking.', smallPrint: 'Not a drug.' },
  ],
  blocks: [
    {
      id: 'morning',
      title: 'Morning',
      when: 'Dawn',
      about: 'Up first.',
      slots: [
        { at: '06:00', cutawayId: 'a' },
        { at: '10:00', cutawayId: 'b', adBreak: 'optics' },
      ],
    },
    {
      id: 'night',
      title: 'Night',
      when: 'Late',
      about: 'After dark.',
      slots: [
        { at: '23:00', cutawayId: 'c' },
        { at: '02:00', cutawayId: 'a', rerun: true },
      ],
    },
  ],
};

const all: SuggestionFilters = { kind: ALL, status: ALL, query: '' };

describe('buildGuide', () => {
  const guide = buildGuide(fixture, catalog);

  it('resolves slots in broadcast order with display times', () => {
    expect(guide.slots.map((slot) => slot.key)).toEqual([
      'morning@06:00',
      'morning@10:00',
      'night@23:00',
      'night@02:00',
    ]);
    expect(guide.slots.map((slot) => slot.atLabel)).toEqual([
      '6:00 AM',
      '10:00 AM',
      '11:00 PM',
      '2:00 AM',
    ]);
    expect(guide.slots.map((slot) => slot.index)).toEqual([0, 1, 2, 3]);
    expect(guide.blocks.map((block) => block.slots.length)).toEqual([2, 2]);
  });

  it('carries reruns and ad breaks onto their slots', () => {
    expect(guide.slots[3]?.rerun).toBe(true);
    expect(guide.slots[0]?.rerun).toBe(false);
    expect(guide.slots[1]?.adBreak?.name).toBe('Perpetual Optics');
    expect(guide.slots[0]?.adBreak).toBeUndefined();
  });

  it('lists cutaways with no slot as unscheduled, in catalog order', () => {
    expect(guide.unscheduled.map((c) => c.id)).toEqual(['orphan']);
  });

  it('skips a slot whose cutaway is gone instead of throwing', () => {
    const stale = buildGuide(
      fixture,
      catalog.filter((c) => c.id !== 'b'),
    );
    expect(stale.slots.map((slot) => slot.cutaway.id)).toEqual(['a', 'c', 'a']);
    expect(stale.slots.map((slot) => slot.index)).toEqual([0, 1, 2]);
    expect(stale.unscheduled.map((c) => c.id)).toEqual(['orphan']);
  });
});

describe('slotOnAir', () => {
  const { slots } = buildGuide(fixture, catalog);
  const onAirAt = (clock: string) => slotOnAir(slots, parseClock(clock)!)?.key;

  it('starts a slot on its minute and holds it until the next one', () => {
    expect(onAirAt('06:00')).toBe('morning@06:00');
    expect(onAirAt('09:59')).toBe('morning@06:00');
    expect(onAirAt('10:00')).toBe('morning@10:00');
    expect(onAirAt('22:59')).toBe('morning@10:00');
    expect(onAirAt('23:00')).toBe('night@23:00');
  });

  it('keeps going across midnight', () => {
    expect(onAirAt('23:59')).toBe('night@23:00');
    expect(onAirAt('00:00')).toBe('night@23:00');
    expect(onAirAt('01:59')).toBe('night@23:00');
    expect(onAirAt('02:00')).toBe('night@02:00');
  });

  it('runs the last slot of the day until the day starts again', () => {
    expect(onAirAt('05:59')).toBe('night@02:00');
  });

  it('has nothing on air for an empty rundown', () => {
    expect(slotOnAir([], 100)).toBeUndefined();
  });
});

describe('slotAfter', () => {
  const { slots } = buildGuide(fixture, catalog);

  it('is the next slot, wrapping from the end of the day to the start', () => {
    expect(slotAfter(slots, slots[0]!)?.key).toBe('morning@10:00');
    expect(slotAfter(slots, slots[3]!)?.key).toBe('morning@06:00');
  });
});

describe('tuneClock', () => {
  it('follows the real clock unless ?at= is a valid time', () => {
    expect(tuneClock(null, 224)).toEqual({ minutes: 224, pinned: false });
    expect(tuneClock('', 224)).toEqual({ minutes: 224, pinned: false });
    expect(tuneClock('25:00', 224)).toEqual({ minutes: 224, pinned: false });
    expect(tuneClock('2:00', 224)).toEqual({ minutes: 224, pinned: false });
  });

  it('pins to a valid HH:MM', () => {
    expect(tuneClock('02:00', 900)).toEqual({ minutes: 120, pinned: true });
    expect(tuneClock('00:00', 900)).toEqual({ minutes: 0, pinned: true });
  });
});

describe('cutawayBadges', () => {
  it('derives ident and sponsor from the cutaway tags, and rerun from the slot', () => {
    expect(cutawayBadges({ tags: ['eyewash-station', 'ident'] })).toEqual(['ident']);
    expect(cutawayBadges({ tags: ['sponsor', 'eyewash-station'] })).toEqual(['sponsor']);
    expect(cutawayBadges({ tags: [] }, true)).toEqual(['rerun']);
    expect(cutawayBadges({ tags: ['ident'] }, true)).toEqual(['ident', 'rerun']);
    expect(cutawayBadges({ tags: ['gag'] })).toEqual([]);
  });
});

describe('filters', () => {
  const guide = buildGuide(fixture, catalog);
  const [a, b, c, a2] = guide.slots;

  it('knows when nothing is filtered', () => {
    expect(hasActiveFilters(all)).toBe(false);
    expect(hasActiveFilters({ ...all, query: '   ' })).toBe(false);
    expect(hasActiveFilters({ ...all, kind: 'gag' })).toBe(true);
    expect(hasActiveFilters({ ...all, status: 'final' })).toBe(true);
    expect(hasActiveFilters({ ...all, query: 'x' })).toBe(true);
  });

  it('matches kind, status and text the way the list always did', () => {
    expect(matchesFilters(catalog[1]!, { ...all, kind: 'gag' })).toBe(true);
    expect(matchesFilters(catalog[0]!, { ...all, kind: 'gag' })).toBe(false);
    expect(matchesFilters(catalog[1]!, { ...all, status: 'generated' })).toBe(true);
    expect(matchesFilters(catalog[0]!, { ...all, status: 'generated' })).toBe(false);
    expect(matchesFilters(catalog[0]!, { ...all, query: 'TITLE A' })).toBe(true);
    expect(matchesFilters(catalog[0]!, { ...all, query: 'ident' })).toBe(true); // tags
    expect(matchesFilters(catalog[0]!, { ...all, query: 'zzz' })).toBe(false);
  });

  it('finds a slot by the sponsor that follows it, but still honors kind and status', () => {
    expect(slotMatchesFilters(b!, { ...all, query: 'perpetual optics' })).toBe(true);
    expect(slotMatchesFilters(a!, { ...all, query: 'perpetual optics' })).toBe(false);
    expect(slotMatchesFilters(b!, { ...all, kind: 'musical', query: 'perpetual optics' })).toBe(
      false,
    );
  });

  it('is a no-op with no filters', () => {
    const result = filterGuide(guide, all);
    expect(result.blocks).toBe(guide.blocks);
    // a, b, c scheduled (a twice) + the orphan: four cutaways, not five airings
    expect(result.cutawayCount).toBe(4);
  });

  it('drops empty blocks and filters the unscheduled bin too', () => {
    const gags = filterGuide(guide, { ...all, kind: 'gag' });
    expect(gags.blocks.map((block) => block.id)).toEqual(['morning']);
    expect(gags.blocks[0]?.slots.map((slot) => slot.key)).toEqual(['morning@10:00']);
    expect(gags.unscheduled).toEqual([]);
    expect(gags.cutawayCount).toBe(1);

    const orphan = filterGuide(guide, { ...all, query: 'never scheduled' });
    expect(orphan.blocks).toEqual([]);
    expect(orphan.unscheduled.map((cut) => cut.id)).toEqual(['orphan']);
    expect(orphan.cutawayCount).toBe(1);
  });

  it('keeps a rerun and its original as separate hits', () => {
    const result = filterGuide(guide, { ...all, kind: 'musical' });
    expect(result.blocks.flatMap((block) => block.slots.map((slot) => slot.key))).toEqual([
      a?.key,
      a2?.key,
    ]);
    expect(result.cutawayCount).toBe(1);
    expect(c?.key).toBe('night@23:00');
  });
});

describe('the committed rundown', () => {
  const guide = buildGuide(committedSchedule, cutawaySuggestions);

  it('resolves every slot to a real cutaway', () => {
    const slotCount = committedSchedule.blocks.reduce((sum, block) => sum + block.slots.length, 0);
    expect(guide.slots).toHaveLength(slotCount);
  });

  it('puts every cutaway in the guide exactly once: scheduled or unscheduled', () => {
    const scheduled = new Set(guide.slots.map((slot) => slot.cutaway.id));
    const unscheduled = new Set(guide.unscheduled.map((cut) => cut.id));
    expect(scheduled.size + unscheduled.size).toBe(cutawaySuggestions.length);
    for (const id of scheduled) expect(unscheduled.has(id)).toBe(false);
  });

  it('has something on air at every minute of the day', () => {
    for (let minute = 0; minute < 1440; minute += 1) {
      expect(slotOnAir(guide.slots, minute), `minute ${minute}`).toBeDefined();
    }
  });

  it('puts the 2 AM laundromat on air at 2:00 and the sign-off theme at 3:44', () => {
    expect(slotOnAir(guide.slots, parseClock('02:00')!)?.cutaway.id).toBe('laundromat-slow-dance');
    expect(slotOnAir(guide.slots, parseClock('03:44')!)?.cutaway.id).toBe('mv-rinse-cycle');
  });

  it('marks the idents as idents', () => {
    const idents = guide.slots.filter((slot) => cutawayBadges(slot.cutaway).includes('ident'));
    expect(idents.length).toBeGreaterThan(0);
  });
});
