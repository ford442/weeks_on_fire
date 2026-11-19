import { describe, expect, it } from 'vitest';

import { searchDocuments } from '../data/generated/search-index';

import { createHubSearch, hubSearch, SEARCH_TYPES, type SearchDocument } from './siteSearch';

function fixture(id: string, title: string, fields: Partial<SearchDocument> = {}): SearchDocument {
  return {
    id: `song:${id}`,
    type: 'song',
    title,
    subtitle: '',
    tags: '',
    characters: '',
    summary: '',
    route: `/show/songs/${id}`,
    ...fields,
  };
}

describe('createHubSearch', () => {
  const search = createHubSearch([
    fixture('porch-light', 'Porch Light', { summary: 'A slow waltz about bicycles.' }),
    fixture('bicycle', 'Bicycle Built for Two', { tags: 'daisy-bell cutaway' }),
    fixture('lattice', 'Lattice Hymn', { summary: 'Chrome bicycle in the rain.' }),
    fixture('mobius', 'Möbius Chrome', { type: 'sequence', id: 'sequence:mobius' }),
    fixture('ribbon', 'The Ribbon', { characters: 'Rubella Vale, Lillith Vale' }),
  ]);
  const titles = (query: string, options?: Parameters<typeof search.search>[1]) =>
    search.search(query, options).map((hit) => hit.title);

  it('returns nothing for a blank query', () => {
    expect(search.search('   ')).toEqual([]);
  });

  it('ranks title hits above summary hits', () => {
    expect(titles('bicycle')[0]).toBe('Bicycle Built for Two');
    expect(titles('bicycle')).toHaveLength(3);
  });

  it('requires every term to match', () => {
    expect(titles('bicycle rain')).toEqual(['Lattice Hymn']);
  });

  it('matches a word by its start and ignores diacritics', () => {
    expect(titles('bicyc')).toHaveLength(3);
    expect(titles('mobius')).toEqual(['Möbius Chrome']);
  });

  it('finds a record by the name of a linked character', () => {
    expect(titles('rubella')).toEqual(['The Ribbon']);
  });

  it('narrows by type and counts every type', () => {
    expect(titles('chrome', { type: 'sequence' })).toEqual(['Möbius Chrome']);
    expect(search.countByType('chrome')).toEqual({ song: 1, sequence: 1 });
  });

  it('respects the limit', () => {
    expect(search.search('bicycle', { limit: 1 })).toHaveLength(1);
  });
});

describe('hub search over the generated corpus', () => {
  it('finds the Well Fall cutaway and song for "well", ahead of anything else', () => {
    const [first, second] = hubSearch().search('well');
    expect(new Set([first?.id, second?.id])).toEqual(
      new Set(['cutaway:well-fall', 'song:well-fall']),
    );
    expect(first?.route).toMatch(/^\/show\/(suggestions|songs)\/well-fall$/);
  });

  it('finds a scene by a keyframe title, under its own page', () => {
    const hit = hubSearch().search('fleet street')[0];
    expect(hit).toMatchObject({ type: 'scene', route: '/show/scenes/daisy-bell' });
  });

  it('indexes cutaway ideas as Suggestions, not as archive stills', () => {
    const hits = hubSearch().search('soft gyre', { limit: 100 });
    expect(hits.some((hit) => hit.type === 'cutaway' && hit.title.includes('Soft Gyre'))).toBe(
      true,
    );
  });

  it('finds what a character is linked to by id', () => {
    const hits = hubSearch().search('Riley', { type: 'cutaway', limit: 100 });
    expect(hits.map((hit) => hit.id)).toContain('cutaway:no-other-human-sounds');
  });

  it('keeps every document routable and every type known', () => {
    const ids = new Set<string>();
    for (const document of searchDocuments) {
      expect(document.route, document.id).toMatch(/^\/show\//);
      expect(SEARCH_TYPES).toContain(document.type);
      expect(ids.has(document.id), document.id).toBe(false);
      ids.add(document.id);
    }
  });

  it('carries no lyrics or prompts (the corpus stays small)', () => {
    const bytes = new TextEncoder().encode(JSON.stringify(searchDocuments)).length;
    expect(bytes).toBeLessThan(200 * 1024);
    for (const document of searchDocuments)
      expect(document.summary.length).toBeLessThanOrEqual(360);
  });
});
