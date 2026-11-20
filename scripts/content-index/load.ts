import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { z } from 'zod';

import { EpisodeProductionSchema } from '../../src/schemas/production';

import {
  SongFrontmatterSchema,
  CutawaySchema,
  FilmSceneSchema,
  SeriesCharacterSchema,
  SceneBoardSchema,
  CrewMemberSchema,
  EpisodeSchema,
  CartoonSchema,
  SequenceSchema,
  ScheduleSchema,
  TaxonomySchema,
} from './schemas';
import { mergeGeneration } from './generation';
import { SequenceGraphSchema } from './graph-schema';
import { parseFrontmatter } from './parsers/frontmatter';
import { parseSongSections } from './parsers/song-sections';
import { parseSegmentPromptsFile } from './parsers/segment-prompts';

import type { EpisodeProduction } from '../../src/schemas/production';
import type {
  CutawayRecord,
  CutawaySegmentRecord,
  FilmSceneRecord,
  ProductionStatus,
  SeriesCharacterRecord,
  SceneBoardRecord,
  CrewMemberRecord,
  EpisodeRecord,
  CartoonRecord,
  SequenceRecord,
  ScheduleRecord,
  TaxonomyRecord,
} from './schemas';

export interface ParsedSong {
  id: string;
  title: string;
  added: string;
  genre: string;
  subgenre?: string;
  description: string;
  episode: string;
  slot?: string;
  tags: string[];
  instrumental: boolean;
  audioFile: string | null;
  status: ProductionStatus;
  sourceFile: string;
  stylePrompt: string;
  lyrics: string | null;
  notes: string | null;
  /** Episode Bible id, when the frontmatter sets one (see `SongFrontmatterSchema`). */
  episodeId?: string;
}

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8')) as unknown;
}

/** Reads a catalog file that is either a bare array or `{ [key]: [...] }`. */
function readList(path: string, key: string): unknown[] {
  const raw = readJson(path);
  const list = Array.isArray(raw) ? (raw as unknown[]) : (raw as Record<string, unknown>)[key];
  if (!Array.isArray(list)) {
    throw new Error(`${path}: expected an array or an object with a "${key}" array`);
  }
  return list as unknown[];
}

export function loadSongs(repoRoot: string): ParsedSong[] {
  const songsDir = join(repoRoot, 'songs');
  const files = readdirSync(songsDir)
    .filter((file) => file.endsWith('.md'))
    .sort();

  return files.map((file) => {
    const raw = readFileSync(join(songsDir, file), 'utf8');
    const { frontmatter, body } = parseFrontmatter(raw);
    const meta = SongFrontmatterSchema.parse(frontmatter);
    const sections = parseSongSections(body);

    return {
      id: meta.id,
      title: meta.title,
      added: meta.added,
      genre: meta.genre,
      ...(meta.subgenre ? { subgenre: meta.subgenre } : {}),
      description: meta.description,
      episode: meta.episode,
      ...(meta.slot ? { slot: meta.slot } : {}),
      tags: meta.tags,
      instrumental: meta.instrumental ?? sections.lyrics === null,
      audioFile: meta.audioFile ?? null,
      status: meta.status ?? (meta.audioFile ? 'final' : 'generated'),
      sourceFile: file,
      stylePrompt: sections.stylePrompt,
      lyrics: sections.lyrics,
      notes: sections.notes,
      ...(meta.episodeId ? { episodeId: meta.episodeId } : {}),
    };
  });
}

export function loadCutaways(repoRoot: string): CutawayRecord[] {
  const cutawaysDir = join(repoRoot, 'content/cutaways');
  const files = readdirSync(cutawaysDir)
    .filter((file) => file.endsWith('.json'))
    .sort();

  return files.map((file) => {
    const raw = readJson(join(cutawaysDir, file));
    const parsed = CutawaySchema.safeParse(raw);
    if (!parsed.success) {
      // Name the file: with dozens of cutaways, a bare ZodError path does not say whose it is.
      throw new Error(`content/cutaways/${file} is invalid:\n${z.prettifyError(parsed.error)}`);
    }
    const record = parsed.data;

    let segments: CutawaySegmentRecord[] = record.segments ?? [];

    if (record.segmentsSource) {
      const sourcePath = join(repoRoot, record.segmentsSource);
      if (!existsSync(sourcePath)) {
        throw new Error(`Cutaway ${record.id}: segmentsSource not found: ${record.segmentsSource}`);
      }

      const parsed = parseSegmentPromptsFile(repoRoot, record.segmentsSource, record.id);
      if (parsed.length > 0) {
        segments = parsed.map((segment) => {
          const stillImagePath = record.segmentStills?.[segment.id];
          return {
            ...segment,
            stillImagePath,
          };
        });
      } else if (record.segments?.length) {
        segments = record.segments;
      } else {
        throw new Error(
          `Cutaway ${record.id}: failed to parse segments from ${record.segmentsSource}`,
        );
      }
    }

    return {
      ...record,
      segments: segments.map((segment) => withEffectiveGeneration(record, segment)),
    };
  });
}

/** The segment with its merged `generation` (or none): defaults ← the segment's own ← the override map. */
function withEffectiveGeneration(
  record: CutawayRecord,
  { generation, ...segment }: CutawaySegmentRecord,
): CutawaySegmentRecord {
  const effective = mergeGeneration(
    record.generationDefaults,
    generation,
    record.segmentGeneration?.[segment.id],
  );
  return effective ? { ...segment, generation: effective } : segment;
}

export function loadGallery(repoRoot: string): FilmSceneRecord[] {
  return readList(join(repoRoot, 'content/gallery.json'), 'scenes').map((item) =>
    FilmSceneSchema.parse(item),
  );
}

export function loadCharacters(repoRoot: string): SeriesCharacterRecord[] {
  return readList(join(repoRoot, 'content/characters.json'), 'characters').map((item) =>
    SeriesCharacterSchema.parse(item),
  );
}

export function loadSceneBoards(repoRoot: string): SceneBoardRecord[] {
  const scenesDir = join(repoRoot, 'content/scenes');
  if (!existsSync(scenesDir)) {
    throw new Error('Missing content/scenes/. Add one JSON file per scene board.');
  }

  return readdirSync(scenesDir)
    .filter((file) => file.endsWith('.json'))
    .sort()
    .map((file) => {
      const record = SceneBoardSchema.parse(readJson(join(scenesDir, file)));
      const expectedId = file.replace(/\.json$/, '');
      if (record.id !== expectedId) {
        throw new Error(`Scene file ${file} id mismatch: ${record.id}`);
      }
      return record;
    });
}

export function loadTaxonomy(repoRoot: string): TaxonomyRecord {
  return TaxonomySchema.parse(readJson(join(repoRoot, 'content/taxonomy.json')));
}

export function loadSchedule(repoRoot: string): ScheduleRecord {
  return ScheduleSchema.parse(readJson(join(repoRoot, 'content/schedule.json')));
}

export function loadCrew(repoRoot: string): CrewMemberRecord[] {
  return readList(join(repoRoot, 'content/crew.json'), 'crew').map((item) =>
    CrewMemberSchema.parse(item),
  );
}

export function loadEpisodes(repoRoot: string): EpisodeRecord[] {
  return readList(join(repoRoot, 'content/episodes.json'), 'episodes').map((item) =>
    EpisodeSchema.parse(item),
  );
}

export function loadCartoons(repoRoot: string): CartoonRecord[] {
  const cartoonsDir = join(repoRoot, 'content/cartoons');
  if (!existsSync(cartoonsDir)) {
    throw new Error('Missing content/cartoons/. Add one JSON file per short cartoon idea.');
  }

  const files = readdirSync(cartoonsDir)
    .filter((file) => file.endsWith('.json'))
    .sort();

  return files.map((file) => {
    const raw = readJson(join(cartoonsDir, file));
    const record = CartoonSchema.parse(raw);
    const expectedId = file.replace(/\.json$/, '');
    if (record.id !== expectedId) {
      throw new Error(`Cartoon file ${file} id mismatch: ${record.id}`);
    }
    return record;
  });
}

export function loadSequences(repoRoot: string): SequenceRecord[] {
  const sequencesDir = join(repoRoot, 'content/sequences');
  if (!existsSync(sequencesDir)) {
    throw new Error('Missing content/sequences/. Add one JSON file per 3D sequence.');
  }

  const isGraphFile = (file: string) => file.endsWith('.graph.json');
  const files = readdirSync(sequencesDir).filter((file) => file.endsWith('.json'));
  const recordFiles = files.filter((file) => !isGraphFile(file)).sort();
  const ids = new Set(recordFiles.map((file) => file.replace(/\.json$/, '')));

  for (const file of files.filter(isGraphFile)) {
    if (!ids.has(file.replace(/\.graph\.json$/, ''))) {
      throw new Error(`Graph file ${file} has no matching content/sequences/<id>.json record`);
    }
  }

  return recordFiles
    .map((file) => {
      const raw = readJson(join(sequencesDir, file));
      const record = SequenceSchema.parse(raw);
      const expectedId = file.replace(/\.json$/, '');
      if (record.id !== expectedId) {
        throw new Error(`Sequence file ${file} id mismatch: ${record.id}`);
      }
      const graphFile = `${expectedId}.graph.json`;
      if (files.includes(graphFile)) {
        if (record.graph) {
          throw new Error(`Sequence ${record.id} has both a graph key and ${graphFile}`);
        }
        try {
          record.graph = SequenceGraphSchema.parse(readJson(join(sequencesDir, graphFile)));
        } catch (error) {
          throw new Error(
            `Invalid ${graphFile}: ${error instanceof Error ? error.message : String(error)}`,
            { cause: error },
          );
        }
      }
      return record;
    })
    .sort((a, b) => a.durationSec - b.durationSec || a.id.localeCompare(b.id));
}

/** Ids with a hand-written factory in `src/sequences/registry.ts` (`'id': createFoo,`). */
export function loadCustomRendererIds(repoRoot: string): Set<string> {
  const source = readFileSync(join(repoRoot, 'src/sequences/registry.ts'), 'utf8');
  return new Set([...source.matchAll(/^\s*'([a-z0-9-]+)':\s*create\w+,?\s*$/gm)].map((m) => m[1]!));
}

/**
 * `sceneId` keys of the hand-authored dialog auditions in `src/data/sceneDialogVersions.ts` (the
 * Suggestions "Dialog" tab looks them up by cutaway id). Read as text, like the registry above.
 */
export function loadDialogSceneIds(repoRoot: string): string[] {
  const source = readFileSync(join(repoRoot, 'src/data/sceneDialogVersions.ts'), 'utf8');
  return [...source.matchAll(/^\s*sceneId:\s*'([^']+)',?\s*$/gm)].map((m) => m[1]!);
}

/** A committed Timeline file, validated against the same Zod contract the app uses. */
export interface LoadedProduction {
  /** Episode id from the folder name (`episodes/episode-04/` → `04`). */
  episode: string;
  file: string;
  production: EpisodeProduction;
}

export function loadProductions(repoRoot: string): LoadedProduction[] {
  const episodesDir = join(repoRoot, 'episodes');

  return readdirSync(episodesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^episode-\d+$/.test(entry.name))
    .map((entry) => entry.name)
    .sort()
    .flatMap((folder) => {
      const file = `episodes/${folder}/scenes.json`;
      const path = join(repoRoot, file);
      if (!existsSync(path)) return [];

      const parsed = EpisodeProductionSchema.safeParse(readJson(path));
      if (!parsed.success) {
        throw new Error(
          `${file} does not match the Timeline schema:\n${z.prettifyError(parsed.error)}`,
        );
      }
      return [{ episode: folder.replace(/^episode-/, ''), file, production: parsed.data }];
    });
}

export function listMp3Filenames(repoRoot: string): string[] {
  return readdirSync(join(repoRoot, 'songs')).filter((file) => file.endsWith('.mp3'));
}
