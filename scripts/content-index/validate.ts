import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { CutawayRecord } from './schemas';
import type { ParsedSong } from './load';
import { countEditTimelineRows } from './parsers/segment-prompts';

export function validateContent(
  repoRoot: string,
  songs: ParsedSong[],
  cutaways: CutawayRecord[],
  checkOrphans: boolean,
): void {
  const errors: string[] = [];
  const songIds = new Set(songs.map((song) => song.id));

  const songIdCounts = new Map<string, number>();
  for (const song of songs) {
    songIdCounts.set(song.id, (songIdCounts.get(song.id) ?? 0) + 1);
  }
  for (const [id, count] of songIdCounts) {
    if (count > 1) errors.push(`Duplicate song id: ${id}`);
  }

  const cutawayIds = new Map<string, number>();
  for (const cutaway of cutaways) {
    cutawayIds.set(cutaway.id, (cutawayIds.get(cutaway.id) ?? 0) + 1);
    if (!songIds.has(cutaway.songId)) {
      errors.push(`Cutaway ${cutaway.id} references unknown songId: ${cutaway.songId}`);
    }

    if (cutaway.segmentsSource) {
      const sourcePath = join(repoRoot, cutaway.segmentsSource);
      if (!existsSync(sourcePath)) {
        errors.push(`Cutaway ${cutaway.id} segmentsSource missing: ${cutaway.segmentsSource}`);
      }

      const timelineCount = countEditTimelineRows(repoRoot, cutaway.segmentsSource);
      const segmentCount = cutaway.segments?.length ?? 0;
      if (timelineCount !== null && timelineCount !== segmentCount) {
        errors.push(
          `Cutaway ${cutaway.id}: segment count ${segmentCount} != edit timeline rows ${timelineCount} in ${cutaway.segmentsSource}`,
        );
      }
    }

    for (const segment of cutaway.segments ?? []) {
      const stillPath = segment.stillImagePath;
      if (stillPath && !existsSync(join(repoRoot, stillPath))) {
        errors.push(
          `Cutaway ${cutaway.id} segment ${segment.id} stillImagePath not found: ${stillPath}`,
        );
      }
    }
  }

  for (const [id, count] of cutawayIds) {
    if (count > 1) errors.push(`Duplicate cutaway id: ${id}`);
  }

  if (checkOrphans) {
    const usedSources = new Set(
      cutaways
        .map((cutaway) => cutaway.segmentsSource)
        .filter((value): value is string => Boolean(value)),
    );
    const cutawayIds = new Set(cutaways.map((cutaway) => cutaway.id));
    const promptFiles = readdirSync(join(repoRoot, 'prompts')).filter((file) =>
      file.endsWith('-segments.md'),
    );
    for (const file of promptFiles) {
      const path = `prompts/${file}`;
      const stemId = file.replace(/-segments\.md$/, '');
      if (!usedSources.has(path) && !cutawayIds.has(stemId)) {
        errors.push(`Orphan prompts file with no cutaway segmentsSource: ${path}`);
      }
    }
  }

  const gallery = JSON.parse(
    readFileSync(join(repoRoot, 'content/gallery.json'), 'utf8'),
  ) as Array<{ imagePath?: string }>;
  for (const scene of gallery) {
    if (scene.imagePath && !existsSync(join(repoRoot, scene.imagePath))) {
      errors.push(`Gallery imagePath not found: ${scene.imagePath}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Content validation failed:\n${errors.map((error) => `  - ${error}`).join('\n')}`,
    );
  }
}
