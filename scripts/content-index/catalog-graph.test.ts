import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { EpisodeProductionSchema } from '../../src/schemas/production';

import { buildCatalogGraph, type CatalogGraphSources } from './catalog-graph';
import {
  loadCartoons,
  loadCharacters,
  loadCutaways,
  loadEpisodes,
  loadGallery,
  loadProductions,
  loadSceneBoards,
  loadSequences,
  loadSongs,
} from './load';

function sources(overrides: Partial<CatalogGraphSources> = {}): CatalogGraphSources {
  return {
    songs: [
      { id: 'well-fall', title: 'Well Fall', episode: 'visual' },
      { id: 'torch', title: 'Torch', episode: '03' },
    ],
    cutaways: [
      {
        id: 'well-fall',
        title: 'Well Fall',
        songId: 'well-fall',
        characterIds: ['rubella'],
        episodeId: '03',
        promotedFromCartoonId: 'hold-music',
        sequenceInsertIds: ['lattice'],
      },
    ],
    sceneBoards: [{ id: 'daisy', title: 'Daisy', songId: 'torch', characterIds: ['rubella'] }],
    gallery: [{ id: 'still-1', title: 'A Still', episode: '03' }],
    episodes: [{ id: '03', title: 'Laser Serpent Skirmish' }],
    characters: [{ id: 'rubella', name: 'Rubella Vale' }],
    cartoons: [{ id: 'hold-music', title: 'Hold Music', promotedToCutawayId: 'well-fall' }],
    sequences: [{ id: 'lattice', title: 'Lattice', relatedCutawayIds: ['well-fall'] }],
    productions: [],
    ...overrides,
  };
}

describe('buildCatalogGraph', () => {
  const graph = buildCatalogGraph(sources());
  const edge = (from: string, to: string) =>
    graph.edges.filter((e) => e.from === from && e.to === to).map((e) => e.rel);

  it('keys nodes by type, so a song and a cutaway can share an id', () => {
    const keys = graph.nodes.map((node) => node.key);
    expect(keys).toContain('song:well-fall');
    expect(keys).toContain('cutaway:well-fall');
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('gives every node the route that opens it', () => {
    const path = (key: string) => graph.nodes.find((node) => node.key === key)?.path;
    expect(path('cutaway:well-fall')).toBe('/show/suggestions/well-fall');
    expect(path('character:rubella')).toBe('/show/characters/rubella');
    expect(path('cartoon:hold-music')).toBe('/show/cartoons/hold-music');
    expect(path('still:still-1')).toBe('/show/archive?q=A+Still');
  });

  it('turns every link field into one typed edge', () => {
    expect(edge('cutaway:well-fall', 'song:well-fall')).toEqual(['song']);
    expect(edge('cutaway:well-fall', 'character:rubella')).toEqual(['character']);
    expect(edge('cutaway:well-fall', 'episode:03')).toEqual(['episode']);
    expect(edge('cutaway:well-fall', 'sequence:lattice')).toEqual(['insert']);
    expect(edge('sequence:lattice', 'cutaway:well-fall')).toEqual(['related']);
    expect(edge('scene:daisy', 'character:rubella')).toEqual(['character']);
    expect(edge('still:still-1', 'episode:03')).toEqual(['episode']);
  });

  it('records a promotion once, cartoon → cutaway, though both records name it', () => {
    expect(graph.edges.filter((e) => e.rel === 'promotion')).toEqual([
      { from: 'cartoon:hold-music', to: 'cutaway:well-fall', rel: 'promotion' },
    ]);
  });

  it('derives a song episode only when the taxonomy id is an Episode Bible id', () => {
    expect(edge('song:torch', 'episode:03')).toEqual(['episode']);
    expect(graph.edges.some((e) => e.from === 'song:well-fall' && e.rel === 'episode')).toBe(false);
  });

  it('links an episode to the records its committed Timeline scenes point at', () => {
    const production = EpisodeProductionSchema.parse({
      episode: '03',
      title: 'Ep 3',
      lastUpdated: '2026-11-01',
      episodeHistory: [],
      scenes: [
        {
          id: 's1',
          order: 1,
          title: 'One',
          timestamp: '0:00',
          description: '',
          status: 'suggested',
          addedAt: '2026-11-01',
          lastEditedAt: '2026-11-01',
          history: [],
          cutawayId: 'well-fall',
          characterIds: ['rubella'],
        },
      ],
    });
    const withTimeline = buildCatalogGraph(
      sources({ productions: [{ episode: '03', production }] }),
    );
    const rels = (to: string) =>
      withTimeline.edges.filter((e) => e.from === 'episode:03' && e.to === to).map((e) => e.rel);
    expect(rels('cutaway:well-fall')).toEqual(['insert']);
    expect(rels('character:rubella')).toEqual(['character']);
  });

  it('throws on a dangling edge rather than emitting it', () => {
    expect(() =>
      buildCatalogGraph(
        sources({ cutaways: [{ id: 'x', title: 'X', songId: 'no-such-song' }], cartoons: [] }),
      ),
    ).toThrow('dangling edge cutaway:x → song:no-such-song');
  });
});

describe('the repository catalog graph', () => {
  const repoRoot = join(import.meta.dirname, '../..');
  const graph = buildCatalogGraph({
    songs: loadSongs(repoRoot),
    cutaways: loadCutaways(repoRoot),
    sceneBoards: loadSceneBoards(repoRoot),
    gallery: loadGallery(repoRoot),
    episodes: loadEpisodes(repoRoot),
    characters: loadCharacters(repoRoot),
    cartoons: loadCartoons(repoRoot),
    sequences: loadSequences(repoRoot),
    productions: loadProductions(repoRoot),
  });

  it('links seeded characters to the cutaways and scene they are in', () => {
    const cast = (character: string) =>
      graph.edges.filter((e) => e.to === `character:${character}`).map((e) => e.from);
    expect(cast('riley-smith')).toEqual(
      expect.arrayContaining(['cutaway:no-other-human-sounds', 'cutaway:the-long-way-up']),
    );
    expect(cast('rubella')).toContain('scene:daisy-bell');
  });

  it('keeps the Timeline ref from Episode 04 to 911 Wrong Shade', () => {
    expect(graph.edges).toContainEqual({
      from: 'episode:04',
      to: 'cutaway:911-wrong-shade',
      rel: 'insert',
    });
  });
});
