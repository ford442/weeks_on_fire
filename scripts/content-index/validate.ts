import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { broadcastOffset, formatClock, parseClock } from '../../src/lib/clock';

import { countEditTimelineRows } from './parsers/segment-prompts';

import type {
  CartoonRecord,
  CutawayRecord,
  EpisodeRecord,
  FilmSceneRecord,
  SceneBoardRecord,
  TaxonomyRecord,
  ScheduleRecord,
  SequenceRecord,
  SeriesCharacterRecord,
} from './schemas';
import type { LoadedProduction, ParsedSong } from './load';

/**
 * Explicit opt-out for long-form prompt docs that intentionally have no cutaway
 * (see content/README.md). Each entry needs a path and a non-empty reason.
 */
function loadStandalonePrompts(repoRoot: string, errors: string[]): Set<string> {
  const file = join(repoRoot, 'content/standalone-prompts.json');
  const result = new Set<string>();
  if (!existsSync(file)) return result;
  const entries = JSON.parse(readFileSync(file, 'utf8')) as Array<{
    path?: string;
    reason?: string;
  }>;
  for (const entry of entries) {
    if (!entry.path || !/^prompts\/[^/]+-segments\.md$/.test(entry.path) || !entry.reason?.trim()) {
      errors.push(
        `content/standalone-prompts.json entries need a prompts/*-segments.md path and a reason: ${JSON.stringify(entry)}`,
      );
      continue;
    }
    result.add(entry.path);
  }
  return result;
}

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
    const standalone = loadStandalonePrompts(repoRoot, errors);
    for (const file of promptFiles) {
      const path = `prompts/${file}`;
      const stemId = file.replace(/-segments\.md$/, '');
      if (standalone.has(path)) {
        if (usedSources.has(path) || cutawayIds.has(stemId)) {
          errors.push(
            `${path} is listed in content/standalone-prompts.json but has a cutaway; remove the allowlist entry`,
          );
        }
        continue;
      }
      if (!usedSources.has(path) && !cutawayIds.has(stemId)) {
        errors.push(`Orphan prompts file with no cutaway segmentsSource: ${path}`);
      }
    }
    for (const path of standalone) {
      if (!promptFiles.includes(path.replace(/^prompts\//, ''))) {
        errors.push(`content/standalone-prompts.json lists missing prompts file: ${path}`);
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

export function validateCharacters(repoRoot: string, characters: SeriesCharacterRecord[]): void {
  const errors: string[] = [];
  const idCounts = new Map<string, number>();

  for (const character of characters) {
    idCounts.set(character.id, (idCounts.get(character.id) ?? 0) + 1);
    if (character.imagePath && !existsSync(join(repoRoot, character.imagePath))) {
      errors.push(`Character ${character.id} imagePath not found: ${character.imagePath}`);
    }
    if (character.bibleSheet && !existsSync(join(repoRoot, character.bibleSheet))) {
      errors.push(`Character ${character.id} bibleSheet not found: ${character.bibleSheet}`);
    }
  }

  for (const [id, count] of idCounts) {
    if (count > 1) errors.push(`Duplicate character id: ${id}`);
  }

  if (errors.length > 0) {
    throw new Error(
      `Character validation failed:\n${errors.map((error) => `  - ${error}`).join('\n')}`,
    );
  }
}

/**
 * Scene boards (`content/scenes/<id>.json`): every id a board points at must exist, so the page
 * can render any board without a null check. Treatment ids are the board's own vocabulary.
 */
export function validateSceneBoards(
  repoRoot: string,
  boards: SceneBoardRecord[],
  songIds: ReadonlySet<string>,
): void {
  const errors: string[] = [];
  const idCounts = new Map<string, number>();

  for (const board of boards) {
    idCounts.set(board.id, (idCounts.get(board.id) ?? 0) + 1);
    const at = `Scene ${board.id}`;

    if (board.songId && !songIds.has(board.songId)) {
      errors.push(`${at} references unknown songId: ${board.songId}`);
    }
    if (board.conceptFile && !existsSync(join(repoRoot, board.conceptFile))) {
      errors.push(`${at} conceptFile not found: ${board.conceptFile}`);
    }

    const treatmentIds = new Set(board.treatments.map((treatment) => treatment.id));
    const unique = (label: string, ids: string[]) => {
      const seen = new Set<string>();
      for (const id of ids) {
        if (seen.has(id)) errors.push(`${at} has duplicate ${label} id: ${id}`);
        seen.add(id);
      }
    };
    unique(
      'treatment',
      board.treatments.map((treatment) => treatment.id),
    );
    unique(
      'lock',
      board.locks.map((lock) => lock.id),
    );
    unique(
      'beat',
      board.beats.map((beat) => beat.id),
    );
    unique(
      'frame',
      board.frames.map((frame) => frame.id),
    );
    unique(
      'extra',
      (board.extras?.items ?? []).map((item) => item.id),
    );
    unique(
      'video',
      board.videos.map((video) => video.id),
    );

    for (const beat of board.beats) {
      if (beat.treatment && !treatmentIds.has(beat.treatment)) {
        errors.push(`${at} beat ${beat.id} uses unknown treatment: ${beat.treatment}`);
      }
    }
    for (const frame of board.frames) {
      if (frame.treatment && !treatmentIds.has(frame.treatment)) {
        errors.push(`${at} frame ${frame.id} uses unknown treatment: ${frame.treatment}`);
      }
      if (frame.imagePath && !existsSync(join(repoRoot, frame.imagePath))) {
        errors.push(`${at} frame ${frame.id} imagePath not found: ${frame.imagePath}`);
      }
    }
  }

  for (const [id, count] of idCounts) {
    if (count > 1) errors.push(`Duplicate scene id: ${id}`);
  }

  if (errors.length > 0) {
    throw new Error(
      `Scene validation failed:\n${errors.map((error) => `  - ${error}`).join('\n')}`,
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

/**
 * `content/taxonomy.json` is the only source of episode ids, genres, themes and tools. Songs and
 * gallery scenes must use its entries verbatim, so filter dropdowns never show near-duplicates.
 */
export function validateTaxonomy(
  taxonomy: TaxonomyRecord,
  episodes: EpisodeRecord[],
  songs: Array<Pick<ParsedSong, 'id' | 'genre' | 'episode'>>,
  gallery: Array<Pick<FilmSceneRecord, 'id' | 'episode' | 'theme' | 'tool'>>,
): void {
  const errors: string[] = [];

  const duplicates = (label: string, values: string[]) => {
    const seen = new Set<string>();
    const folded = new Map<string, string>();
    for (const value of values) {
      if (seen.has(value)) errors.push(`Taxonomy: duplicate ${label} "${value}"`);
      seen.add(value);
      const key = value.trim().toLowerCase();
      const clash = folded.get(key);
      if (clash !== undefined && clash !== value) {
        errors.push(`Taxonomy: ${label} "${value}" differs from "${clash}" only by case/spacing`);
      }
      folded.set(key, value);
    }
  };
  duplicates(
    'episode id',
    taxonomy.episodes.map((entry) => entry.id),
  );
  duplicates(
    'episode label',
    taxonomy.episodes.map((entry) => entry.label),
  );
  duplicates('genre', taxonomy.genres);
  duplicates('theme', taxonomy.themes);
  duplicates(
    'tool id',
    taxonomy.tools.map((entry) => entry.id),
  );
  duplicates(
    'tool label',
    taxonomy.tools.map((entry) => entry.label),
  );

  const episodeIds = new Set(taxonomy.episodes.map((entry) => entry.id));
  for (const episode of episodes) {
    if (!episodeIds.has(episode.id)) {
      errors.push(
        `Taxonomy is missing an entry for episode "${episode.id}" (content/episodes.json)`,
      );
    }
  }

  const genres = new Set(taxonomy.genres);
  for (const song of songs) {
    if (!episodeIds.has(song.episode)) {
      errors.push(
        `Song ${song.id}: unknown episode "${song.episode}" (not in content/taxonomy.json)`,
      );
    }
    if (!genres.has(song.genre)) {
      errors.push(`Song ${song.id}: unknown genre "${song.genre}" (not in content/taxonomy.json)`);
    }
  }

  const themes = new Set(taxonomy.themes);
  const tools = new Set(taxonomy.tools.map((entry) => entry.id));
  for (const scene of gallery) {
    if (!episodeIds.has(scene.episode)) {
      errors.push(`Gallery ${scene.id}: unknown episode "${scene.episode}"`);
    }
    if (!themes.has(scene.theme)) {
      errors.push(`Gallery ${scene.id}: unknown theme "${scene.theme}"`);
    }
    if (scene.tool !== undefined && !tools.has(scene.tool)) {
      errors.push(`Gallery ${scene.id}: unknown tool "${scene.tool}"`);
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Taxonomy validation failed:\n${errors.map((error) => `  - ${error}`).join('\n')}`,
    );
  }
}

/** The ids a Timeline scene may point at, one set per catalog. */
export interface CatalogIds {
  songs: ReadonlySet<string>;
  cutaways: ReadonlySet<string>;
  sequences: ReadonlySet<string>;
  cartoons: ReadonlySet<string>;
  characters: ReadonlySet<string>;
}

/**
 * Checks the optional catalog refs on committed `episodes/episode-NN/scenes.json` scenes — the same
 * class of check as `cutaway.songId`. Scenes without refs are always fine. The lines of the
 * hand-edited dialog auditions (`src/data/sceneDialogVersions.ts`) are prose and not covered; their
 * `sceneId` keys are, in `validateCatalogLinks`.
 */
export function validateScenes(productions: LoadedProduction[], catalog: CatalogIds): void {
  const errors: string[] = [];

  for (const { episode, production } of productions) {
    for (const scene of production.scenes) {
      const where = `episode ${episode} ${scene.id}`;
      const single = [
        ['songId', scene.songId, catalog.songs, 'song'],
        ['cutawayId', scene.cutawayId, catalog.cutaways, 'cutaway'],
        ['sequenceId', scene.sequenceId, catalog.sequences, 'sequence'],
        ['cartoonId', scene.cartoonId, catalog.cartoons, 'cartoon'],
      ] as const;

      for (const [key, id, known, noun] of single) {
        if (id !== undefined && !known.has(id)) {
          errors.push(`${where} ${key} "${id}" is not a ${noun} id`);
        }
      }
      for (const id of scene.characterIds ?? []) {
        if (!catalog.characters.has(id)) {
          errors.push(`${where} characterIds "${id}" is not a character id`);
        }
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Scene validation failed:\n${errors.map((error) => `  - ${error}`).join('\n')}`,
    );
  }
}

/** The link-bearing fields of every catalog, as `validateCatalogLinks` reads them. */
export interface CatalogLinkSources {
  songs: ReadonlyArray<Pick<ParsedSong, 'id' | 'episode' | 'episodeId'>>;
  cutaways: ReadonlyArray<
    Pick<
      CutawayRecord,
      'id' | 'characterIds' | 'episodeId' | 'promotedFromCartoonId' | 'sequenceInsertIds'
    >
  >;
  cartoons: ReadonlyArray<Pick<CartoonRecord, 'id' | 'status' | 'promotedToCutawayId'>>;
  sequences: ReadonlyArray<Pick<SequenceRecord, 'id' | 'relatedCutawayIds' | 'characterIds'>>;
  sceneBoards: ReadonlyArray<Pick<SceneBoardRecord, 'id' | 'characterIds'>>;
  characters: ReadonlyArray<{ id: string }>;
  /** Episode Bible entries (`content/episodes.json`). */
  episodes: ReadonlyArray<{ id: string }>;
  /** `sceneId` keys of `src/data/sceneDialogVersions.ts`; each must be a cutaway id. */
  dialogSceneIds?: readonly string[];
}

/**
 * The typed links between catalogs (characters, episodes, promotion, sequence inserts). Every id
 * must resolve, lists may not repeat an id, and a cartoon → cutaway promotion must be recorded on
 * both records so the two pages link to each other. Feeds `catalog-graph.ts`, which can then trust
 * every edge.
 */
export function validateCatalogLinks(sources: CatalogLinkSources): void {
  const errors: string[] = [];
  const ids = (records: ReadonlyArray<{ id: string }>) => new Set(records.map((r) => r.id));
  const known = {
    character: ids(sources.characters),
    cutaway: ids(sources.cutaways),
    cartoon: ids(sources.cartoons),
    sequence: ids(sources.sequences),
    episode: ids(sources.episodes),
  };

  const one = (where: string, key: string, id: string | undefined, noun: keyof typeof known) => {
    if (id !== undefined && !known[noun].has(id)) {
      errors.push(
        `${where} ${key} "${id}" is not ${/^[aeiou]/.test(noun) ? 'an' : 'a'} ${noun} id`,
      );
    }
  };
  const many = (
    where: string,
    key: string,
    list: readonly string[] | undefined,
    noun: keyof typeof known,
  ) => {
    const seen = new Set<string>();
    for (const id of list ?? []) {
      if (seen.has(id)) errors.push(`${where} ${key} lists "${id}" twice`);
      seen.add(id);
      one(where, key, id, noun);
    }
  };

  for (const song of sources.songs) {
    const where = `Song ${song.id}`;
    one(where, 'episodeId', song.episodeId, 'episode');
    if (song.episodeId && known.episode.has(song.episode) && song.episodeId !== song.episode) {
      errors.push(
        `${where} episodeId "${song.episodeId}" disagrees with episode "${song.episode}"`,
      );
    }
  }

  const cartoonsById = new Map(sources.cartoons.map((cartoon) => [cartoon.id, cartoon]));
  const cutawaysById = new Map(sources.cutaways.map((cutaway) => [cutaway.id, cutaway]));

  for (const cutaway of sources.cutaways) {
    const where = `Cutaway ${cutaway.id}`;
    many(where, 'characterIds', cutaway.characterIds, 'character');
    one(where, 'episodeId', cutaway.episodeId, 'episode');
    many(where, 'sequenceInsertIds', cutaway.sequenceInsertIds, 'sequence');
    one(where, 'promotedFromCartoonId', cutaway.promotedFromCartoonId, 'cartoon');

    const source = cutaway.promotedFromCartoonId
      ? cartoonsById.get(cutaway.promotedFromCartoonId)
      : undefined;
    if (source && source.promotedToCutawayId !== cutaway.id) {
      errors.push(
        `${where} promotedFromCartoonId "${source.id}", but that cartoon's promotedToCutawayId is ${
          source.promotedToCutawayId ? `"${source.promotedToCutawayId}"` : 'unset'
        }`,
      );
    }
  }

  for (const cartoon of sources.cartoons) {
    const where = `Cartoon ${cartoon.id}`;
    one(where, 'promotedToCutawayId', cartoon.promotedToCutawayId, 'cutaway');
    if (cartoon.status === 'promoted' && !cartoon.promotedToCutawayId) {
      errors.push(`${where} is status "promoted" but has no promotedToCutawayId`);
    }
    if (cartoon.promotedToCutawayId && cartoon.status !== 'promoted') {
      errors.push(
        `${where} has promotedToCutawayId "${cartoon.promotedToCutawayId}" but status "${cartoon.status}" (use "promoted")`,
      );
    }

    const target = cartoon.promotedToCutawayId
      ? cutawaysById.get(cartoon.promotedToCutawayId)
      : undefined;
    if (target && target.promotedFromCartoonId !== cartoon.id) {
      errors.push(
        `${where} promotedToCutawayId "${target.id}", but that cutaway's promotedFromCartoonId is ${
          target.promotedFromCartoonId ? `"${target.promotedFromCartoonId}"` : 'unset'
        }`,
      );
    }
  }

  for (const sequence of sources.sequences) {
    const where = `Sequence ${sequence.id}`;
    many(where, 'relatedCutawayIds', sequence.relatedCutawayIds, 'cutaway');
    many(where, 'characterIds', sequence.characterIds, 'character');
  }

  for (const board of sources.sceneBoards) {
    many(`Scene ${board.id}`, 'characterIds', board.characterIds, 'character');
  }

  const dialogKeys = new Set<string>();
  for (const id of sources.dialogSceneIds ?? []) {
    const where = 'src/data/sceneDialogVersions.ts';
    if (dialogKeys.has(id)) errors.push(`${where} has two dialog sets for sceneId "${id}"`);
    dialogKeys.add(id);
    if (!known.cutaway.has(id)) errors.push(`${where} sceneId "${id}" is not a cutaway id`);
  }

  if (errors.length > 0) {
    throw new Error(
      `Catalog link validation failed:\n${errors.map((error) => `  - ${error}`).join('\n')}`,
    );
  }
}

/**
 * Checks the EyeWash rundown (`content/schedule.json`) against the cutaway catalog.
 *
 * - every slot names a real cutaway, every ad break a real sponsor, ids are unique;
 * - slots run in broadcast order: times strictly increase from the first slot's time, wrapping
 *   midnight at most once, so the file reads top to bottom as one day;
 * - the first airing of a cutaway is the original; every later airing says `rerun: true`;
 * - a sponsor nothing uses is dead data.
 *
 * A cutaway with no slot is fine: it shows as unscheduled.
 */
export function validateSchedule(schedule: ScheduleRecord, cutawayIds: ReadonlySet<string>): void {
  const errors: string[] = [];

  const seen = <T extends { id: string }>(items: readonly T[], label: string) => {
    const ids = new Set<string>();
    for (const item of items) {
      if (ids.has(item.id)) errors.push(`Duplicate ${label} id: ${item.id}`);
      ids.add(item.id);
    }
    return ids;
  };
  const sponsorIds = seen(schedule.sponsors, 'schedule sponsor');
  seen(schedule.blocks, 'schedule block');

  const slots = schedule.blocks.flatMap((block) =>
    block.slots.map((slot) => ({ block: block.id, slot })),
  );
  const first = slots[0];
  const dayStart = first ? (parseClock(first.slot.at) ?? 0) : 0;

  const airings = new Map<string, number>();
  const usedSponsors = new Set<string>();
  let previous: { at: string; offset: number } | undefined;

  for (const { block, slot } of slots) {
    const where = `Schedule block ${block}, ${slot.at} ${slot.cutawayId}`;

    if (!cutawayIds.has(slot.cutawayId)) {
      errors.push(`${where}: unknown cutaway id "${slot.cutawayId}"`);
    }

    if (slot.adBreak !== undefined) {
      usedSponsors.add(slot.adBreak);
      if (!sponsorIds.has(slot.adBreak)) {
        errors.push(`${where}: unknown sponsor id "${slot.adBreak}" in adBreak`);
      }
    }

    const minutes = parseClock(slot.at);
    if (minutes !== undefined) {
      const offset = broadcastOffset(minutes, dayStart);
      if (previous && offset <= previous.offset) {
        errors.push(
          `${where}: starts at ${formatClock(minutes)}, not after the slot before it (${formatClock(parseClock(previous.at) ?? 0)}). ` +
            `Slots run in broadcast order from the first slot (${first?.slot.at}), wrapping past midnight once.`,
        );
      }
      previous = { at: slot.at, offset };
    }

    const count = airings.get(slot.cutawayId) ?? 0;
    if (count === 0 && slot.rerun) {
      errors.push(`${where}: marked rerun, but this is its first airing of the day`);
    }
    if (count > 0 && !slot.rerun) {
      errors.push(`${where}: airs more than once; mark every airing after the first "rerun": true`);
    }
    airings.set(slot.cutawayId, count + 1);
  }

  for (const sponsor of schedule.sponsors) {
    if (!usedSponsors.has(sponsor.id)) {
      errors.push(`Schedule sponsor ${sponsor.id} is never used; remove it or give it an adBreak`);
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Schedule validation failed:\n${errors.map((error) => `  - ${error}`).join('\n')}`,
    );
  }
}
