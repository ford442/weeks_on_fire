import { describe, expect, it } from 'vitest';

import { whatsNew } from '../data/generated/whats-new';

import { whatsNewKindLabel, whatsNewPath } from './whatsNew';

describe('whatsNewPath', () => {
  it('opens detail routes for catalog records', () => {
    expect(whatsNewPath({ kind: 'song', id: 'big-city', title: 'Big City' })).toBe(
      '/show/songs/big-city',
    );
    expect(whatsNewPath({ kind: 'suggestion', id: 'a b', title: 'x' })).toBe(
      '/show/suggestions/a%20b',
    );
    expect(whatsNewPath({ kind: 'cartoon', id: 'c', title: 'x' })).toBe('/show/cartoons/c');
    expect(whatsNewPath({ kind: 'sequence', id: 's', title: 'x' })).toBe('/show/sequences/s');
  });

  it('searches the archive for stills and clips', () => {
    expect(whatsNewPath({ kind: 'image', id: 'i', title: 'The Two & More' })).toBe(
      '/show/archive?q=The%20Two%20%26%20More',
    );
    expect(whatsNewPath({ kind: 'video', id: 'v', title: 'Clip' })).toBe('/show/archive?q=Clip');
  });
});

describe('generated whatsNew', () => {
  it('is non-empty, newest first, and every kind has a label', () => {
    expect(whatsNew.length).toBeGreaterThan(0);
    const dates = whatsNew.map((entry) => entry.added);
    expect(dates).toEqual([...dates].sort().reverse());
    for (const entry of whatsNew) expect(whatsNewKindLabel[entry.kind]).toBeTruthy();
  });
});
