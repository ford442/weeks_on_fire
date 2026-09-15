import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { CartoonRecord, CutawayRecord, EpisodeRecord, SequenceRecord } from './schemas';
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

export function validateEpisodes(repoRoot: string, episodes: EpisodeRecord[]): void {
  const errors: string[] = [];

  const idCounts = new Map<string, number>();
  const numberCounts = new Map<number, number>();
  for (const episode of episodes) {
    idCounts.set(episode.id, (idCounts.get(episode.id) ?? 0) + 1);
    numberCounts.set(episode.number, (numberCounts.get(episode.number) ?? 0) + 1);

    for (const [key, path] of Object.entries(episode.files)) {
      if (path && !existsSync(join(repoRoot, path))) {
        errors.push(`Episode ${episode.id} files.${key} not found: ${path}`);
      }
    }
  }

  for (const [id, count] of idCounts) {
    if (count > 1) errors.push(`Duplicate episode id: ${id}`);
  }
  for (const [number, count] of numberCounts) {
    if (count > 1) errors.push(`Duplicate episode number: ${number}`);
  }

  if (errors.length > 0) {
    throw new Error(
      `Episode validation failed:\n${errors.map((error) => `  - ${error}`).join('\n')}`,
    );
  }
}

export function validateCartoons(repoRoot: string, cartoons: CartoonRecord[]): void {
  const errors: string[] = [];
  const idCounts = new Map<string, number>();

  for (const cartoon of cartoons) {
    idCounts.set(cartoon.id, (idCounts.get(cartoon.id) ?? 0) + 1);
    if (cartoon.stillImagePath && !existsSync(join(repoRoot, cartoon.stillImagePath))) {
      errors.push(`Cartoon ${cartoon.id} stillImagePath not found: ${cartoon.stillImagePath}`);
    }
  }

  for (const [id, count] of idCounts) {
    if (count > 1) errors.push(`Duplicate cartoon id: ${id}`);
  }

  if (errors.length > 0) {
    throw new Error(
      `Cartoon validation failed:\n${errors.map((error) => `  - ${error}`).join('\n')}`,
    );
  }
}

export function validateSequences(repoRoot: string, sequences: SequenceRecord[]): void {
  const errors: string[] = [];
  const idCounts = new Map<string, number>();

  for (const sequence of sequences) {
    idCounts.set(sequence.id, (idCounts.get(sequence.id) ?? 0) + 1);
    if (sequence.durationSec < 10 || sequence.durationSec > 120) {
      errors.push(
        `Sequence ${sequence.id} durationSec ${sequence.durationSec} is outside 10–120 seconds`,
      );
    }
    if (sequence.stillImagePath && !existsSync(join(repoRoot, sequence.stillImagePath))) {
      errors.push(`Sequence ${sequence.id} stillImagePath not found: ${sequence.stillImagePath}`);
    }
  }

  for (const [id, count] of idCounts) {
    if (count > 1) errors.push(`Duplicate sequence id: ${id}`);
  }

  if (errors.length > 0) {
    throw new Error(
      `Sequence validation failed:\n${errors.map((error) => `  - ${error}`).join('\n')}`,
    );
  }
}
