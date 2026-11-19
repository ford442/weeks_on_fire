import { describe, expect, it } from 'vitest';

import { catalogGraph } from '../data/generated/catalog-graph';

import { catalogLinks, indexCatalogGraph } from './catalogGraph';

import type { CatalogGraph, CatalogNode, CatalogNodeType } from '../data/generated/catalog-graph';

const node = (type: CatalogNodeType, id: string, title = id): CatalogNode => ({
  key: `${type}:${id}`,
  type,
  id,
  title,
  path: `/show/${type}/${id}`,
});

const fixture: CatalogGraph = {
  nodes: [
    node('song', 'torch'),
    node('song', 'hymn'),
    node('cutaway', 'well-fall'),
    node('scene', 'daisy'),
    node('character', 'rubella'),
    node('cartoon', 'hold-music'),
    node('episode', '03'),
  ],
  edges: [
    { from: 'cutaway:well-fall', to: 'song:torch', rel: 'song' },
    { from: 'cutaway:well-fall', to: 'character:rubella', rel: 'character' },
    { from: 'scene:daisy', to: 'song:hymn', rel: 'song' },
    { from: 'scene:daisy', to: 'character:rubella', rel: 'character' },
    { from: 'cartoon:hold-music', to: 'cutaway:well-fall', rel: 'promotion' },
    { from: 'episode:03', to: 'character:rubella', rel: 'character' },
  ],
};

describe('indexCatalogGraph', () => {
  const links = indexCatalogGraph(fixture);
  const summary = (type: CatalogNodeType, id: string, throughSongs = false) =>
    links
      .related(type, id, { throughSongs })
      .map((group) => [
        group.label,
        group.nodes.map((n) => (n.via ? `${n.id}<${n.via.id}` : n.id)),
      ]);

  it('groups a character’s links by type in a fixed order, either edge direction', () => {
    expect(summary('character', 'rubella')).toEqual([
      ['Episodes', ['03']],
      ['Suggestions', ['well-fall']],
      ['Scenes', ['daisy']],
    ]);
  });

  it('adds the songs of linked cutaways and scenes when asked, marked via', () => {
    expect(summary('character', 'rubella', true)).toContainEqual([
      'Songs',
      ['torch<well-fall', 'hymn<daisy'],
    ]);
  });

  it('labels the promotion from each side and puts it first', () => {
    expect(summary('cartoon', 'hold-music')[0]).toEqual(['Promoted to Suggestions', ['well-fall']]);
    expect(summary('cutaway', 'well-fall')[0]).toEqual(['Promoted from cartoon', ['hold-music']]);
  });

  it('returns no groups for an unlinked or unknown record', () => {
    expect(links.related('song', 'nope')).toEqual([]);
    expect(links.node('song', 'torch')?.title).toBe('torch');
  });
});

describe('the generated catalog graph', () => {
  it('has an endpoint node for every edge', () => {
    const keys = new Set(catalogGraph.nodes.map((n) => n.key));
    for (const edge of catalogGraph.edges) {
      expect(keys.has(edge.from), edge.from).toBe(true);
      expect(keys.has(edge.to), edge.to).toBe(true);
    }
  });

  it('lists the seeded cutaways on Riley Smith', () => {
    const suggestions = catalogLinks
      .related('character', 'riley-smith')
      .find((group) => group.key === 'cutaway');
    expect(suggestions?.nodes.map((n) => n.id)).toEqual(
      expect.arrayContaining(['no-other-human-sounds', 'the-long-way-up', 'riley-space-cop']),
    );
  });
});
