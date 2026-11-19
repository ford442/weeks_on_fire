import { catalogPaths, nodeKey } from './catalog-graph';
import { clip } from './route-table';
import { siteViews } from './views';

import type { CatalogGraph, CatalogNodeType } from './catalog-graph';
import type {
  CartoonRecord,
  CrewMemberRecord,
  CutawayRecord,
  EpisodeRecord,
  FilmSceneRecord,
  SceneBoardRecord,
  SequenceRecord,
  SeriesCharacterRecord,
  TaxonomyRecord,
} from './schemas';
import type { ParsedSong } from './load';

/**
 * The hub search corpus, chosen at codegen time: titles, tags, summaries and the names of linked
 * characters. Lyrics, style prompts and Grok prompts stay out — they are most of the catalog's
 * weight and the search chunk would carry all of them. `src/lib/siteSearch.ts` indexes these with
 * MiniSearch when the search opens.
 */
export type SearchDocType = CatalogNodeType | 'crew';

export interface SearchDocument {
  /** `${type}:${id}`, the catalog graph key. */
  id: string;
  type: SearchDocType;
  title: string;
  /** One line under the title: episode, genre, role… Also searched. */
  subtitle: string;
  tags: string;
  /** Names of the characters linked by id, so "Rubella" finds what she is in. */
  characters: string;
  summary: string;
  /** Router path (no basename), including any query string. */
  route: string;
}

/** Long enough for a premise plus a line of visual arc; short enough to keep the chunk small. */
export const SUMMARY_MAX = 360;

export interface SearchSources {
  songs: readonly ParsedSong[];
  cutaways: readonly CutawayRecord[];
  sceneBoards: readonly SceneBoardRecord[];
  gallery: readonly FilmSceneRecord[];
  episodes: readonly EpisodeRecord[];
  characters: readonly SeriesCharacterRecord[];
  cartoons: readonly CartoonRecord[];
  sequences: readonly SequenceRecord[];
  crew: readonly CrewMemberRecord[];
  taxonomy: TaxonomyRecord;
  graph: CatalogGraph;
}

const join = (...parts: Array<string | undefined>) =>
  parts.filter((part): part is string => Boolean(part?.trim())).join(' · ');

const text = (...parts: Array<string | undefined>) =>
  clip(parts.filter((part): part is string => Boolean(part?.trim())).join(' '), SUMMARY_MAX);

export function buildSearchDocuments(sources: SearchSources): SearchDocument[] {
  const episodeLabels = new Map(sources.taxonomy.episodes.map((entry) => [entry.id, entry.label]));
  const episodeLabel = (id: string, slot?: string) => join(episodeLabels.get(id) ?? id, slot);
  const toolLabels = new Map(sources.taxonomy.tools.map((entry) => [entry.id, entry.label]));

  const characterNames = new Map(
    sources.characters.map((c) => [nodeKey('character', c.id), c.name]),
  );
  const castOf = new Map<string, string[]>();
  for (const edge of sources.graph.edges) {
    const name = edge.rel === 'character' ? characterNames.get(edge.to) : undefined;
    if (name) castOf.set(edge.from, [...(castOf.get(edge.from) ?? []), name]);
  }

  const doc = (
    type: CatalogNodeType,
    record: { id: string; title: string },
    fields: { subtitle: string; tags: readonly string[]; summary: string },
  ): SearchDocument => {
    const id = nodeKey(type, record.id);
    return {
      id,
      type,
      title: record.title,
      subtitle: fields.subtitle,
      tags: fields.tags.join(' '),
      characters: (castOf.get(id) ?? []).join(', '),
      summary: fields.summary,
      route: catalogPaths[type](record.id, record.title),
    };
  };

  const crewPath = siteViews.find((view) => view.id === 'crew')?.path ?? '/show/crew';

  return [
    ...sources.songs.map((song) =>
      doc('song', song, {
        subtitle: join(episodeLabel(song.episode, song.slot), song.genre),
        tags: [...song.tags, ...(song.subgenre ? [song.subgenre] : [])],
        summary: text(song.description),
      }),
    ),
    ...sources.cutaways.map((cutaway) =>
      doc('cutaway', cutaway, {
        subtitle: join(cutaway.episode, cutaway.songTitle),
        tags: cutaway.tags,
        summary: text(cutaway.summary, cutaway.visualArc),
      }),
    ),
    ...sources.sceneBoards.map((board) =>
      doc('scene', board, {
        subtitle: join(board.format, board.cast) || 'Scene',
        // Keyframe titles name the places in the scene ("Fleet Street").
        tags: board.frames.map((frame) => frame.title),
        summary: text(board.subtitle, board.pitch),
      }),
    ),
    ...sources.gallery.map((still) =>
      doc('still', still, {
        subtitle: join(
          episodeLabel(still.episode, still.slot),
          still.tool && toolLabels.get(still.tool),
        ),
        tags: [...still.tags, still.theme],
        summary: text(still.description),
      }),
    ),
    ...sources.episodes.map((episode) =>
      doc('episode', episode, {
        subtitle: join(
          episode.isCandidate ? `Episode ${episode.number} candidate` : `Episode ${episode.number}`,
          episode.register,
        ),
        tags: [],
        summary: text(episode.logline),
      }),
    ),
    ...sources.characters.map((character) =>
      doc(
        'character',
        { id: character.id, title: character.name },
        {
          subtitle: character.role,
          tags: [
            ...character.tags,
            ...character.traits,
            ...(character.cluster ? [character.cluster] : []),
          ],
          summary: text(character.nameNote, character.bio),
        },
      ),
    ),
    ...sources.cartoons.map((cartoon) =>
      doc('cartoon', cartoon, {
        subtitle: join(cartoon.register ?? 'Short cartoon', cartoon.runtime),
        tags: cartoon.tags,
        summary: text(cartoon.premise, cartoon.characterLean),
      }),
    ),
    ...sources.sequences.map((sequence) =>
      doc('sequence', sequence, {
        subtitle: join(sequence.medium, sequence.runtime),
        tags: sequence.tags,
        summary: text(sequence.premise),
      }),
    ),
    ...sources.crew.map((member) => ({
      id: `crew:${member.id}`,
      type: 'crew' as const,
      title: member.name,
      subtitle: member.role,
      tags: member.specialty,
      characters: '',
      summary: text(member.bio),
      route: crewPath,
    })),
  ];
}
