import { routeUrl } from './route-table';
import { SITE_BASE } from './views';

import type { CutawayRecord, ScheduleRecord } from './schemas';

/**
 * The EyeWash Station rundown as plain markdown for `llms-full.txt`, so a crawler that does not
 * run the SPA can still read the program guide. Pure: pass it the loaded records.
 */
export function emitScheduleSection(
  schedule: ScheduleRecord,
  cutaways: ReadonlyArray<Pick<CutawayRecord, 'id' | 'title'>>,
): string {
  const byId = new Map(cutaways.map((cutaway) => [cutaway.id, cutaway]));
  const sponsors = new Map(schedule.sponsors.map((sponsor) => [sponsor.id, sponsor]));
  const link = (id: string) => routeUrl(`/show/suggestions/${id}`);
  const title = (id: string) => byId.get(id)?.title ?? id;

  const blocks = schedule.blocks.map((block) => {
    const slots = block.slots.flatMap((slot) => {
      const lines = [
        `- ${slot.at} — **${title(slot.cutawayId)}** (${slot.cutawayId})${slot.rerun ? ' — rerun' : ''} — ${link(slot.cutawayId)}`,
      ];
      const sponsor = slot.adBreak ? sponsors.get(slot.adBreak) : undefined;
      if (sponsor) lines.push(`  - ad break: ${sponsor.name} — ${sponsor.tagline}`);
      return lines;
    });
    return `### ${block.title} — ${block.when}\n\n${block.about}\n\n${slots.join('\n')}`;
  });

  const scheduled = new Set(
    schedule.blocks.flatMap((block) => block.slots.map((slot) => slot.cutawayId)),
  );
  const unscheduled = cutaways
    .filter((cutaway) => !scheduled.has(cutaway.id))
    .map((cutaway) => `- **${cutaway.title}** (${cutaway.id}) — ${link(cutaway.id)}`);

  return `## ${schedule.station} schedule (Channel ${schedule.channel})

The cutaways above, arranged as one looping broadcast day. Live guide: ${SITE_BASE}/show/suggestions/ — what is on now follows the viewer's clock, and \`?at=HH:MM\` pins a time of day. Author it in \`content/schedule.json\`. Times are 24-hour; a slot runs until the next one starts, and the last slot of the day runs until the first begins again. A cutaway can air more than once (a rerun). Cutaways with no slot are listed as unscheduled.

${blocks.join('\n\n')}

### Unscheduled

${unscheduled.length > 0 ? unscheduled.join('\n') : '- (none — every cutaway has a slot)'}
`;
}
