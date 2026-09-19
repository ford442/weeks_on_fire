import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  SongFrontmatterSchema,
  CutawaySchema,
  FilmSceneSchema,
  SeriesCharacterSchema,
  DaisyBellSchema,
  StaffMemberSchema,
  EpisodeSchema,
  CartoonSchema,
  SequenceSchema,
} from './schemas';
import { SequenceGraphSchema } from './graph-schema';
import { parseFrontmatter } from './parsers/frontmatter';
import { parseSongSections } from './parsers/song-sections';
import { parseSegmentPromptsFile } from './parsers/segment-prompts';
import type {
  CutawayRecord,
  CutawaySegment,
  FilmSceneRecord,
  SeriesCharacterRecord,
  DaisyBellRecord,
  StaffMemberRecord,
  EpisodeRecord,
  CartoonRecord,
  SequenceRecord,
} from './schemas';

export interface ParsedSong {
  id: string;
  title: string;
  genre: string;
  description: string;
  episode: string;
  tags: string[];
  instrumental: boolean;
  audioFile: string | null;
  sourceFile: string;
  stylePrompt: string;
  lyrics: string | null;
  notes: string | null;
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
      genre: meta.genre,
      description: meta.description,
      episode: meta.episode,
      tags: meta.tags,
      instrumental: meta.instrumental ?? sections.lyrics === null,
      audioFile: meta.audioFile ?? null,
      sourceFile: file,
      stylePrompt: sections.stylePrompt,
      lyrics: sections.lyrics,
      notes: sections.notes,
    };
  });
}

export function loadCutaways(repoRoot: string): CutawayRecord[] {
  const cutawaysDir = join(repoRoot, 'content/cutaways');
  const files = readdirSync(cutawaysDir)
    .filter((file) => file.endsWith('.json'))
    .sort();

  return files.map((file) => {
    const raw = JSON.parse(readFileSync(join(cutawaysDir, file), 'utf8'));
    const record = CutawaySchema.parse(raw);

    let segments: CutawaySegment[] = record.segments ?? [];

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
      segments,
    };
  });
}

export function loadGallery(repoRoot: string): FilmSceneRecord[] {
  const raw = JSON.parse(readFileSync(join(repoRoot, 'content/gallery.json'), 'utf8'));
  return (Array.isArray(raw) ? raw : raw.scenes).map((item: unknown) =>
    FilmSceneSchema.parse(item),
  );
}

export function loadCharacters(repoRoot: string): SeriesCharacterRecord[] {
  const raw = JSON.parse(readFileSync(join(repoRoot, 'content/characters.json'), 'utf8'));
  return (Array.isArray(raw) ? raw : raw.characters).map((item: unknown) =>
    SeriesCharacterSchema.parse(item),
  );
}

export function loadDaisyBell(repoRoot: string): DaisyBellRecord {
  const raw = JSON.parse(readFileSync(join(repoRoot, 'content/daisy-bell.json'), 'utf8'));
  return DaisyBellSchema.parse(raw);
}

export function loadStaff(repoRoot: string): StaffMemberRecord[] {
  const raw = JSON.parse(readFileSync(join(repoRoot, 'content/staff.json'), 'utf8'));
  return (Array.isArray(raw) ? raw : raw.staff).map((item: unknown) =>
    StaffMemberSchema.parse(item),
  );
}

export function loadEpisodes(repoRoot: string): EpisodeRecord[] {
  const raw = JSON.parse(readFileSync(join(repoRoot, 'content/episodes.json'), 'utf8'));
  return (Array.isArray(raw) ? raw : raw.episodes).map((item: unknown) =>
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
    const raw = JSON.parse(readFileSync(join(cartoonsDir, file), 'utf8'));
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
      const raw = JSON.parse(readFileSync(join(sequencesDir, file), 'utf8'));
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
          record.graph = SequenceGraphSchema.parse(
            JSON.parse(readFileSync(join(sequencesDir, graphFile), 'utf8')),
          );
        } catch (error) {
          throw new Error(
            `Invalid ${graphFile}: ${error instanceof Error ? error.message : error}`,
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

export function listMp3Filenames(repoRoot: string): string[] {
  return readdirSync(join(repoRoot, 'songs')).filter((file) => file.endsWith('.mp3'));
}
