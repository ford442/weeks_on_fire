import { describe, expect, it } from 'vitest';

import { BLURB_MAX, buildWhatsNew, collectWhatsNew, pickWhatsNew } from './whats-new';

import type { WhatsNewItem, WhatsNewSources } from './whats-new';

const empty: WhatsNewSources = {
  songs: [],
  cutaways: [],
  cartoons: [],
  sequences: [],
  gallery: [],
};

const item = (over: Partial<WhatsNewItem> & Pick<WhatsNewItem, 'id' | 'kind' | 'added'>) =>
  ({ title: over.id, blurb: '', ...over }) satisfies WhatsNewItem;

describe('collectWhatsNew', () => {
  it('skips records without a date and labels gallery media by type', () => {
    const items = collectWhatsNew({
      ...empty,
      cutaways: [
        { id: 'dated', title: 'Dated', added: '2026-11-01', summary: 'A cutaway.' },
        { id: 'undated', title: 'Undated', summary: 'Nobody knows.' },
      ],
      gallery: [
        {
          id: 'still',
          title: 'Still',
          added: '2026-11-02',
          description: 'A still.',
          mediaType: 'image',
          imagePath: 'images/a.jpg',
        },
        {
          id: 'clip',
          title: 'Clip',
          added: '2026-11-03',
          description: 'A clip.',
          mediaType: 'video',
        },
      ],
    });
    expect(items.map((i) => [i.kind, i.id])).toEqual([
      ['suggestion', 'dated'],
      ['image', 'still'],
      ['video', 'clip'],
    ]);
    expect(items.find((i) => i.id === 'still')?.imagePath).toBe('images/a.jpg');
    expect(items.find((i) => i.id === 'clip')).not.toHaveProperty('imagePath');
  });

  it('marks songs that have audio and keeps only the first sentence of a blurb', () => {
    const [withAudio, without] = collectWhatsNew({
      ...empty,
      songs: [
        {
          id: 'a',
          title: 'A',
          added: '2026-11-01',
          description: `${'Word '.repeat(60)}ends here. Second sentence.`,
          audioFile: 'a.mp3',
        },
        { id: 'b', title: 'B', added: '2026-11-01', description: 'Short. Long.', audioFile: null },
      ],
    });
    expect(withAudio?.audio).toBe(true);
    expect(withAudio?.blurb.length).toBeLessThanOrEqual(BLURB_MAX);
    expect(without?.audio).toBeUndefined();
    expect(without?.blurb).toBe('Short.');
  });
});

describe('pickWhatsNew', () => {
  it('sorts newest first, breaking date ties by kind then id', () => {
    const picked = pickWhatsNew([
      item({ id: 'z', kind: 'image', added: '2026-11-05' }),
      item({ id: 'b', kind: 'song', added: '2026-11-05' }),
      item({ id: 'a', kind: 'song', added: '2026-11-06' }),
    ]);
    expect(picked.map((i) => i.id)).toEqual(['a', 'b', 'z']);
  });

  it('caps each kind so a burst of one kind cannot crowd out the rest', () => {
    const songs = ['a', 'b', 'c', 'd'].map((id) => item({ id, kind: 'song', added: '2026-11-10' }));
    const picked = pickWhatsNew([
      ...songs,
      item({ id: 'img', kind: 'image', added: '2026-10-01' }),
    ]);
    expect(picked.map((i) => i.id)).toEqual(['a', 'b', 'img']);
  });

  it('honours the overall limit and does not mutate its input', () => {
    const input = [
      item({ id: 'a', kind: 'song', added: '2026-11-03' }),
      item({ id: 'b', kind: 'cartoon', added: '2026-11-02' }),
      item({ id: 'c', kind: 'image', added: '2026-11-01' }),
    ];
    const copy = [...input];
    expect(pickWhatsNew(input, { limit: 2 }).map((i) => i.id)).toEqual(['a', 'b']);
    expect(input).toEqual(copy);
  });
});

describe('buildWhatsNew', () => {
  it('returns nothing when no record is dated', () => {
    expect(
      buildWhatsNew({ ...empty, sequences: [{ id: 's', title: 'S', premise: 'P.' }] }),
    ).toEqual([]);
  });
});
