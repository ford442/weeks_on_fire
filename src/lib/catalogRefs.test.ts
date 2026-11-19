import { describe, expect, it } from 'vitest';

import { cutawayRefs, songRefs } from '../data/generated/catalog-refs';

import {
  CHARACTER_OPTIONS,
  SINGLE_REF_FIELDS,
  sameCatalogRefs,
  sceneRefLinks,
  withCurrentOption,
} from './catalogRefs';

describe('sceneRefLinks', () => {
  it('returns nothing for a scene with no refs, or with only unset ones', () => {
    expect(sceneRefLinks({})).toEqual([]);
    expect(sceneRefLinks({ songId: '', characterIds: [] })).toEqual([]);
  });

  it('links a cutaway to its Suggestions record, labelled with the catalog title', () => {
    expect(sceneRefLinks({ cutawayId: '911-wrong-shade' })).toEqual([
      {
        key: 'cutawayId',
        label: 'Cutaway',
        id: '911-wrong-shade',
        title: '911 for the Wrong Shade of Blue',
        to: '/show/suggestions/911-wrong-shade',
      },
    ]);
  });

  it('routes each catalog to its own detail view', () => {
    const song = songRefs[0];
    if (!song) throw new Error('no songs');
    const [link] = sceneRefLinks({ songId: song.id });
    expect(link?.to).toBe(`/show/songs/${song.id}`);

    const paths = Object.fromEntries(
      SINGLE_REF_FIELDS.map((field) => [field.key, field.pathFor('x')]),
    );
    expect(paths).toEqual({
      songId: '/show/songs/x',
      cutawayId: '/show/suggestions/x',
      sequenceId: '/show/sequences/x',
      cartoonId: '/show/cartoons/x',
    });
  });

  it('opens the character profile by id', () => {
    const [link] = sceneRefLinks({ characterIds: ['lillith'] });
    expect(link).toMatchObject({ key: 'characterIds', label: 'Character', title: 'Lillith Vale' });
    expect(link?.to).toBe('/show/characters/lillith');
  });

  it('keeps an id the catalog no longer has, without a route', () => {
    expect(sceneRefLinks({ songId: 'gone-song', characterIds: ['gone-person'] })).toEqual([
      { key: 'songId', label: 'Song', id: 'gone-song', title: 'gone-song', to: null },
      {
        key: 'characterIds',
        label: 'Character',
        id: 'gone-person',
        title: 'gone-person',
        to: null,
      },
    ]);
  });

  it('lists links in a fixed order regardless of key order', () => {
    const links = sceneRefLinks({ characterIds: ['lillith'], cartoonId: 'x', songId: 'y' });
    expect(links.map((link) => link.key)).toEqual(['songId', 'cartoonId', 'characterIds']);
  });
});

describe('picker options', () => {
  it('sorts every catalog A–Z by title', () => {
    for (const field of SINGLE_REF_FIELDS) {
      const titles = field.options.map((option) => option.title);
      expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b)));
    }
    expect(CHARACTER_OPTIONS.length).toBeGreaterThan(0);
  });

  it('covers every record the generated lists know about', () => {
    const cutaway = SINGLE_REF_FIELDS.find((field) => field.key === 'cutawayId');
    expect(cutaway?.options).toHaveLength(cutawayRefs.length);
  });

  it('withCurrentOption appends an id the catalog lost, and only then', () => {
    const options = [{ id: 'a', title: 'A' }];
    expect(withCurrentOption(options, 'a')).toEqual([{ id: 'a', title: 'A', missing: false }]);
    expect(withCurrentOption(options, undefined)).toHaveLength(1);
    expect(withCurrentOption(options, 'b')).toEqual([
      { id: 'a', title: 'A', missing: false },
      { id: 'b', title: 'b', missing: true },
    ]);
  });
});

describe('sameCatalogRefs', () => {
  it('treats unset, blank and empty as equal, and compares values otherwise', () => {
    expect(sameCatalogRefs({}, { songId: '', characterIds: [] })).toBe(true);
    expect(sameCatalogRefs({ songId: 'a' }, { songId: 'a' })).toBe(true);
    expect(sameCatalogRefs({ songId: 'a' }, { songId: 'b' })).toBe(false);
    expect(sameCatalogRefs({ songId: 'a' }, {})).toBe(false);
    expect(sameCatalogRefs({ characterIds: ['a'] }, { characterIds: ['a', 'b'] })).toBe(false);
  });
});
