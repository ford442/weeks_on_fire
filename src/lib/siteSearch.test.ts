import { describe, expect, it } from 'vitest';

import { searchIndex, type SearchEntry } from './siteSearch';

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
