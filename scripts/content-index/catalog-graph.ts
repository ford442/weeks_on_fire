import { siteViews } from './views';

import type {
  CartoonRecord,
  CutawayRecord,
  FilmSceneRecord,
  SceneBoardRecord,
  SequenceRecord,
} from './schemas';
import type { LoadedProduction, ParsedSong } from './load';

/**
 * The catalog graph: one node per record that has a page (or a filtered list), one edge per typed
 * link between two of them. Built at codegen time from ids `validateCatalogLinks` and
 * `validateScenes` already checked, so every edge resolves.
 *
 * Not the 3D sequence scene graph (`graph-schema.ts`); this one is about records, not meshes.
 */
export const CATALOG_NODE_TYPES = [
  'song',
  'cutaway',
  'scene',
  'still',
  'episode',
  'character',
  'cartoon',
  'sequence',
] as const;
export type CatalogNodeType = (typeof CATALOG_NODE_TYPES)[number];

/**
 * How `from` relates to `to`:
 * - `song` — scored by that song
 * - `character` — has that character on screen
 * - `episode` — belongs to that episode
 * - `promotion` — a cartoon seed promoted to that cutaway
 * - `insert` — cuts that record in (a cutaway's 3D insert; an episode's Timeline scene)
 * - `related` — a sequence that goes with that cutaway
 */
export const CATALOG_RELS = [
  'song',
  'character',
  'episode',
  'promotion',
  'insert',
  'related',
] as const;
export type CatalogRel = (typeof CATALOG_RELS)[number];

export interface CatalogNode {
  /** `${type}:${id}` — ids are only unique within a catalog (`well-fall` is a song and a cutaway). */
  key: string;
  type: CatalogNodeType;
  id: string;
  title: string;
  /** Router path (no basename), including any query string. */
  path: string;
}

export interface CatalogEdge {
  from: string;
  to: string;
  rel: CatalogRel;
}

export interface CatalogGraph {
  nodes: CatalogNode[];
  edges: CatalogEdge[];
}

export interface CatalogGraphSources {
  songs: ReadonlyArray<Pick<ParsedSong, 'id' | 'title' | 'episode' | 'episodeId'>>;
  cutaways: ReadonlyArray<
    Pick<
      CutawayRecord,
      | 'id'
      | 'title'
      | 'songId'
      | 'characterIds'
      | 'episodeId'
      | 'promotedFromCartoonId'
      | 'sequenceInsertIds'
    >
  >;
  sceneBoards: ReadonlyArray<Pick<SceneBoardRecord, 'id' | 'title' | 'songId' | 'characterIds'>>;
  gallery: ReadonlyArray<Pick<FilmSceneRecord, 'id' | 'title' | 'episode'>>;
  episodes: ReadonlyArray<{ id: string; title: string }>;
  characters: ReadonlyArray<{ id: string; name: string }>;
  cartoons: ReadonlyArray<Pick<CartoonRecord, 'id' | 'title' | 'promotedToCutawayId'>>;
  sequences: ReadonlyArray<
    Pick<SequenceRecord, 'id' | 'title' | 'relatedCutawayIds' | 'characterIds'>
  >;
  /** Committed Timeline files; their scenes' catalog refs become episode edges. */
  productions: ReadonlyArray<Pick<LoadedProduction, 'episode' | 'production'>>;
}

export function nodeKey(type: CatalogNodeType, id: string): string {
  return `${type}:${id}`;
}

function viewPath(id: string): string {
  const view = siteViews.find((entry) => entry.id === id);
  if (!view) throw new Error(`catalog-graph: unknown view "${id}"`);
  return view.path;
}

const detail = (view: string) => (id: string) => `${viewPath(view)}/${encodeURIComponent(id)}`;

/** Where each node type opens. Stills have no page of their own: the archive, searched by title. */
export const catalogPaths: Record<CatalogNodeType, (id: string, title: string) => string> = {
  song: detail('songs'),
  cutaway: detail('suggestions'),
  scene: detail('scenes'),
  still: (_id, title) => `${viewPath('gallery')}?${new URLSearchParams({ q: title }).toString()}`,
  episode: detail('episodes'),
  character: detail('characters'),
  cartoon: detail('cartoons'),
  sequence: detail('sequences'),
};

export function buildCatalogGraph(sources: CatalogGraphSources): CatalogGraph {
  const nodes: CatalogNode[] = [];
  const add = (type: CatalogNodeType, id: string, title: string) =>
    nodes.push({ key: nodeKey(type, id), type, id, title, path: catalogPaths[type](id, title) });

  for (const song of sources.songs) add('song', song.id, song.title);
  for (const cutaway of sources.cutaways) add('cutaway', cutaway.id, cutaway.title);
  for (const board of sources.sceneBoards) add('scene', board.id, board.title);
  for (const still of sources.gallery) add('still', still.id, still.title);
  for (const episode of sources.episodes) add('episode', episode.id, episode.title);
  for (const character of sources.characters) add('character', character.id, character.name);
  for (const cartoon of sources.cartoons) add('cartoon', cartoon.id, cartoon.title);
  for (const sequence of sources.sequences) add('sequence', sequence.id, sequence.title);

  const keys = new Set(nodes.map((node) => node.key));
  const edges = new Map<string, CatalogEdge>();
  const link = (
    from: [CatalogNodeType, string],
    to: [CatalogNodeType, string] | undefined,
    rel: CatalogRel,
  ) => {
    if (!to) return;
    const edge = { from: nodeKey(...from), to: nodeKey(...to), rel };
    // Validation has already failed the build on an unknown id; this only guards stray callers.
    if (!keys.has(edge.from) || !keys.has(edge.to)) {
      throw new Error(`catalog-graph: dangling edge ${edge.from} → ${edge.to} (${rel})`);
    }
    edges.set(`${edge.from}|${edge.to}|${rel}`, edge);
  };
  const episodeIds = new Set(sources.episodes.map((episode) => episode.id));
  const asEpisode = (id: string | undefined): [CatalogNodeType, string] | undefined =>
    id !== undefined && episodeIds.has(id) ? ['episode', id] : undefined;

  for (const song of sources.songs) {
    link(['song', song.id], asEpisode(song.episodeId ?? song.episode), 'episode');
  }

  for (const cutaway of sources.cutaways) {
    const self: [CatalogNodeType, string] = ['cutaway', cutaway.id];
    link(self, ['song', cutaway.songId], 'song');
    for (const id of cutaway.characterIds ?? []) link(self, ['character', id], 'character');
    link(self, asEpisode(cutaway.episodeId), 'episode');
    for (const id of cutaway.sequenceInsertIds ?? []) link(self, ['sequence', id], 'insert');
  }

  for (const board of sources.sceneBoards) {
    const self: [CatalogNodeType, string] = ['scene', board.id];
    if (board.songId) link(self, ['song', board.songId], 'song');
    for (const id of board.characterIds ?? []) link(self, ['character', id], 'character');
  }

  for (const still of sources.gallery)
    link(['still', still.id], asEpisode(still.episode), 'episode');

  // Promotion is stored on both records and validated to agree; one edge, cartoon → cutaway.
  for (const cartoon of sources.cartoons) {
    if (cartoon.promotedToCutawayId) {
      link(['cartoon', cartoon.id], ['cutaway', cartoon.promotedToCutawayId], 'promotion');
    }
  }

  for (const sequence of sources.sequences) {
    const self: [CatalogNodeType, string] = ['sequence', sequence.id];
    for (const id of sequence.relatedCutawayIds ?? []) link(self, ['cutaway', id], 'related');
    for (const id of sequence.characterIds ?? []) link(self, ['character', id], 'character');
  }

  for (const { episode, production } of sources.productions) {
    const self = asEpisode(episode);
    if (!self) continue;
    for (const scene of production.scenes) {
      if (scene.songId) link(self, ['song', scene.songId], 'song');
      if (scene.cutawayId) link(self, ['cutaway', scene.cutawayId], 'insert');
      if (scene.sequenceId) link(self, ['sequence', scene.sequenceId], 'insert');
      if (scene.cartoonId) link(self, ['cartoon', scene.cartoonId], 'insert');
      for (const id of scene.characterIds ?? []) link(self, ['character', id], 'character');
    }
  }

  const order = (edge: CatalogEdge) => `${edge.from}|${edge.rel}|${edge.to}`;
  return {
    nodes,
    edges: [...edges.values()].sort((a, b) => order(a).localeCompare(order(b))),
  };
}
