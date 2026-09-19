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

function graphTimes(graph: NonNullable<SequenceRecord['graph']>): number[] {
  const times: number[] = [];
  const camera: Record<string, unknown> = graph.camera;
  for (const value of Object.values(camera)) {
    if (Array.isArray(value) && typeof value[0] === 'object' && value[0] !== null) {
      for (const key of value as { t: number }[]) times.push(key.t);
    }
  }
  for (const clip of graph.clips ?? []) for (const key of clip.keys) times.push(key.t);
  if (graph.loop) times.push(graph.loop.inSec, graph.loop.outSec);
  return times;
}

/**
 * `customRendererIds` are the ids registered in `src/sequences/registry.ts`; when omitted, the
 * factory check is skipped (unit tests without a checkout).
 */
export function validateSequences(
  repoRoot: string,
  sequences: SequenceRecord[],
  customRendererIds?: ReadonlySet<string>,
): void {
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

    if (sequence.graph) {
      if (sequence.renderer === 'custom') {
        errors.push(`Sequence ${sequence.id} has a graph but declares renderer "custom"`);
      }
      const late = graphTimes(sequence.graph).filter((t) => t > sequence.durationSec);
      if (late.length > 0) {
        errors.push(
          `Sequence ${sequence.id} graph has times past durationSec ${sequence.durationSec}: ${[...new Set(late)].join(', ')}`,
        );
      }
      if (customRendererIds?.has(sequence.id)) {
        errors.push(`Sequence ${sequence.id} has a graph and a custom factory; remove one`);
      }
    } else if (sequence.renderer !== 'custom') {
      errors.push(
        `Sequence ${sequence.id} has no graph (${sequence.id}.graph.json) — add one or set renderer "custom" with a factory`,
      );
    } else if (customRendererIds && !customRendererIds.has(sequence.id)) {
      errors.push(
        `Sequence ${sequence.id} is renderer "custom" but has no factory in src/sequences/registry.ts`,
      );
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
