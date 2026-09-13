import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  SongFrontmatterSchema,
  CutawaySchema,
  FilmSceneSchema,
  SeriesCharacterSchema,
  DaisyBellSchema,
  StaffMemberSchema,
} from './schemas';
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

export function listMp3Filenames(repoRoot: string): string[] {
  return readdirSync(join(repoRoot, 'songs')).filter((file) => file.endsWith('.mp3'));
}
