import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { loadCutaways, loadSchedule } from './load';
import { emitScheduleSection } from './schedule-docs';

import type { ScheduleRecord } from './schemas';

const cutaways = [
  { id: 'a', title: 'Alpha' },
  { id: 'b', title: 'Beta' },
  { id: 'orphan', title: 'Orphan' },
];

const schedule: ScheduleRecord = {
  station: 'EyeWash Station',
  channel: '12½',
  sponsors: [{ id: 'optics', name: 'Perpetual Optics', tagline: 'Keep looking.' }],
  blocks: [
    {
      id: 'morning',
      title: 'Morning',
      when: 'Dawn',
      about: 'Up first.',
      slots: [
        { at: '06:00', cutawayId: 'a', adBreak: 'optics' },
        { at: '10:00', cutawayId: 'b' },
        { at: '23:00', cutawayId: 'a', rerun: true },
      ],
    },
  ],
};

describe('emitScheduleSection', () => {
  const section = emitScheduleSection(schedule, cutaways);

  it('opens with the station, and explains how to read and pin the guide', () => {
    expect(section.startsWith('## EyeWash Station schedule (Channel 12½)\n')).toBe(true);
    expect(section).toContain('`?at=HH:MM` pins a time of day');
    expect(section).toContain('content/schedule.json');
  });

  it('lists each block with its slots, reruns and ad breaks, in order', () => {
    const lines = section.split('\n');
    const at = (needle: string) => lines.findIndex((line) => line.includes(needle));
    expect(at('### Morning — Dawn')).toBeGreaterThan(-1);
    expect(at('- 06:00 — **Alpha** (a)')).toBeLessThan(at('- 10:00 — **Beta** (b)'));
    expect(lines[at('- 06:00 — **Alpha** (a)') + 1]).toBe(
      '  - ad break: Perpetual Optics — Keep looking.',
    );
    expect(section).toContain('- 23:00 — **Alpha** (a) — rerun —');
  });

  it('links every slot to its Suggestions board', () => {
    expect(section).toContain('https://ford442.github.io/weeks_on_fire/show/suggestions/a/');
  });

  it('lists cutaways with no slot as unscheduled', () => {
    const unscheduled = section.slice(section.indexOf('### Unscheduled'));
    expect(unscheduled).toContain('**Orphan** (orphan)');
    expect(unscheduled).not.toContain('**Alpha**');
  });

  it('says so when nothing is left over', () => {
    const everything = emitScheduleSection(
      schedule,
      cutaways.filter((cutaway) => cutaway.id !== 'orphan'),
    );
    expect(everything).toContain('(none — every cutaway has a slot)');
  });

  it('renders the committed rundown without a gap', () => {
    const repoRoot = join(import.meta.dirname, '../..');
    const committed = emitScheduleSection(loadSchedule(repoRoot), loadCutaways(repoRoot));
    expect(committed).toContain('### Test Pattern — Post-sign-off');
    expect(committed).not.toContain('undefined');
  });
});
