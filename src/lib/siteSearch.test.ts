import { describe, expect, it } from 'vitest';

import { buildSearchIndex, searchIndex, type SearchEntry } from './siteSearch';

function fixture(title: string, body: string, to = `/x/${title}`): SearchEntry {
  return {
    section: 'Songs',
    title,
    subtitle: '',
    to,
    titleText: title.toLowerCase(),
    bodyText: body.toLowerCase(),
  };
}

describe('searchIndex', () => {
  const index = [
    fixture('Porch Light', 'a slow waltz about bicycles'),
    fixture('Bicycle Built for Two', 'daisy bell cutaway'),
    fixture('Lattice Hymn', 'chrome bicycle in the rain'),
  ];

  it('returns nothing for a blank query', () => {
    expect(searchIndex(index, '   ')).toEqual([]);
  });

  it('ranks title hits above body hits', () => {
    expect(searchIndex(index, 'bicycle').map((hit) => hit.title)).toEqual([
      'Bicycle Built for Two',
      'Porch Light',
      'Lattice Hymn',
    ]);
  });

  it('requires every term to match', () => {
    expect(searchIndex(index, 'bicycle rain').map((hit) => hit.title)).toEqual(['Lattice Hymn']);
  });

  it('respects the limit', () => {
    expect(searchIndex(index, 'bicycle', 1)).toHaveLength(1);
  });
});

describe('buildSearchIndex', () => {
  it('finds a scene board by title, under its own page', () => {
    const hit = buildSearchIndex().find(
      (entry) => entry.section === 'Scenes' && entry.title === 'Daisy Bell',
    );
    expect(hit?.to).toBe('/show/scenes/daisy-bell');
  });

  it('finds a scene by a keyframe it contains', () => {
    const hits = searchIndex(buildSearchIndex(), 'fleet street', 200);
    expect(hits.some((entry) => entry.section === 'Scenes')).toBe(true);
  });

  it('no longer indexes cutaway ideas under the Visual archive', () => {
    const archive = buildSearchIndex().filter((entry) => entry.section === 'Visual archive');
    expect(archive.some((entry) => entry.title.startsWith('The Soft Gyre'))).toBe(false);
    const suggestions = buildSearchIndex().filter((entry) => entry.section === 'Suggestions');
    expect(suggestions.some((entry) => entry.title.includes('Soft Gyre'))).toBe(true);
  });
});
